import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

// Simple pseudo-Perlin noise function for organic randomness
function pseudoPerlinNoise(t, seed) {
    const a = Math.sin(t * 1.3 + seed) * 1.7;
    const b = Math.sin(t * 0.8 + seed * 1.2) * 1.2;
    const c = Math.sin(t * 2.1 + seed * 0.7) * 0.9;
    return (a + b + c) / 3; // Average for smooth but varied output
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
    bottomCone.position.y = 0.5;
    topCone.position.y = 1.8056;
    topCone.rotation.x = Math.PI;
    playerGroup.add(bottomCone);
    playerGroup.add(topCone);

    let bottomSpinSpeed = (Math.random() - 0.5) * 1.0;
    let bottomSpinAngle = Math.PI * (Math.random() * 0.5 + 0.25);
    let topSpinSpeed = (Math.random() - 0.5) * 1.2;
    let topSpinAngle = Math.PI * (Math.random() * 0.7 + 0.3);
    const noiseSeed = Math.random() * 100; // Unique seed for noise

    playerGroup.update = function(deltaTime, animationTime) {
        // Random spinning for each cone
        bottomCone.rotation.y += deltaTime * bottomSpinSpeed;
        if (bottomCone.rotation.y > bottomSpinAngle || bottomCone.rotation.y < -bottomSpinAngle) {
            bottomSpinSpeed *= -1;
        }

        // Breathing-like floating effect using pseudo-Perlin noise
        const noiseValue = pseudoPerlinNoise(animationTime, noiseSeed);
        const floatOffset = noiseValue * 0.2222; // Same range (±0.2222) for consistency
        topCone.position.y = 1.8056 + floatOffset;
        topCone.rotation.x = Math.PI + (noiseValue * 0.1); // Slight tilt tied to noise
        topCone.rotation.z = noiseValue * 0.05; // Additional subtle tilt for organic feel
    };

    playerGroup.getConeTips = function() {
        const bottomTipY = 0.5;
        const topTipY = topCone.position.y;
        return { bottomTipY, topTipY };
    };

    playerGroup.position.y = 0;
    return playerGroup;
}