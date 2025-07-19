import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

function pseudoPerlinNoise(t, seed) {
    const a = Math.sin(t * 1.3 + seed) * 1.7;
    const b = Math.sin(t * 0.8 + seed * 1.2) * 1.2;
    const c = Math.sin(t * 2.1 + seed * 0.7) * 0.9;
    return (a + b + c) / 3;
}

export function createPlayerPawn() {
    const coneGeometry = new THREE.ConeGeometry(0.5, 1, 16, 16);
    const coneMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00FFFF,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });

    const playerGroup = new THREE.Group();
    const bottomCone = new THREE.Mesh(coneGeometry, coneMaterial);
    const topCone = new THREE.Mesh(coneGeometry, coneMaterial);
    
    // Base positions
    const originalBottomY = 0.5;
    const originalTopY = 1.8056;
    const originalDistance = originalTopY - originalBottomY;
    
    bottomCone.position.y = originalBottomY;
    topCone.position.y = originalTopY;
    topCone.rotation.x = Math.PI;
    playerGroup.add(bottomCone);
    playerGroup.add(topCone);

    // Organic motion variables
    let bottomSpinSpeed = (Math.random() - 0.5) * 1.0;
    let bottomSpinAngle = Math.PI * (Math.random() * 0.5 + 0.25);
    let topSpinSpeed = (Math.random() - 0.5) * 1.2;
    const noiseSeed = Math.random() * 100;

    // Spacebar effect variables
    let isSpacePressed = false;
    let surgeProgress = 0; // 0-1 value for smooth transitions
    let surgeVelocity = 0;
    let currentPulsePhase = 0;
    const minDistance = originalDistance * 0.9;
    const maxDistance = originalDistance * 2; // 2 times original distance

    // Support for both keyboard and AI control
    playerGroup.__spacePressed = false;

    // Spacebar event handlers (for human player only)
    if (!playerGroup.isAI) {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !isSpacePressed) {
                isSpacePressed = true;
                surgeVelocity = 0.015;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                isSpacePressed = false;
            }
        });
    }

    playerGroup.update = function(deltaTime, animationTime) {
        // Use either keyboard state or AI control
        const spaceActive = isSpacePressed || this.__spacePressed;
        
        // Smoothly transition surge effect with dynamic easing
        const targetSurge = spaceActive ? 1 : 0;
        const surgeAcceleration = spaceActive ? 0.6 : 1.8; // Faster release
        surgeVelocity += (targetSurge - surgeProgress) * deltaTime * surgeAcceleration;
        surgeProgress = THREE.MathUtils.clamp(surgeProgress + surgeVelocity * deltaTime * 2, 0, 1);

        // Enhanced pulsing effect with subtle intensity
        if (spaceActive) {
            currentPulsePhase += deltaTime * (1.5 + Math.sin(animationTime * 0.8) * 0.2);
        } else {
            currentPulsePhase *= 0.97; // Very gentle decay when not active
        }

        // Calculate distance with smooth easing
        const pulseFactor = (Math.sin(currentPulsePhase) * 0.5 + 0.5);
        const targetDistance = minDistance + (maxDistance - minDistance) * 
            easeInOutSine(pulseFactor);
        
        // Blend between normal and surged distances
        const currentDistance = THREE.MathUtils.lerp(
            originalDistance,
            targetDistance,
            easeOutQuad(surgeProgress)
        );

        // Apply motion to cones with momentum
        const noiseValue = pseudoPerlinNoise(animationTime * (1 + surgeProgress * 0.3), noiseSeed);
        
        // Bottom cone moves down slightly during surges
        bottomCone.position.y = originalBottomY - 
            (currentDistance - originalDistance) * 0.1; // More subtle movement
        
        // Top cone gets the main movement
        const floatOffset = noiseValue * 0.2222 * (1 - surgeProgress * 0.1); // Keep more organic motion
        topCone.position.y = originalTopY + 
            (currentDistance - originalDistance) + 
            floatOffset;
        
        // Moderate spin acceleration during surges
        bottomCone.rotation.y += deltaTime * bottomSpinSpeed * 
            (1 + surgeProgress * 0.8); // 1.8x speed at max surge
        topCone.rotation.y += deltaTime * topSpinSpeed * 
            (1 + surgeProgress * 0.5); // 1.5x speed at max surge
        
        // Enhanced rotations with subtle tilting
        const surgeRotationFactor = easeInOutSine(surgeProgress);
        topCone.rotation.x = Math.PI + noiseValue * 0.15 * (1 + surgeRotationFactor * 0.7);
        topCone.rotation.z = noiseValue * 0.07 * (1 + surgeRotationFactor);

        // Reverse spin direction at limits
        if (bottomCone.rotation.y > bottomSpinAngle || bottomCone.rotation.y < -bottomSpinAngle) {
            bottomSpinSpeed *= -1 * (0.85 + Math.random() * 0.3); // Subtle variation
        }
    };

    // Smooth easing functions
    function easeOutQuad(x) {
        return 1 - (1 - x) * (1 - x);
    }
    
    function easeInOutSine(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    playerGroup.getConeTips = function() {
        return { 
            bottomTipY: bottomCone.position.y, 
            topTipY: topCone.position.y 
        };
    };

    return playerGroup;
}