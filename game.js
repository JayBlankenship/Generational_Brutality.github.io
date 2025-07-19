import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

const canvas = document.getElementById('gameCanvas');
const startButton = document.getElementById('startButton');
const menu = document.getElementById('menu');
const closeMenuButton = document.getElementById('closeMenu');
const thetaSensitivityInput = document.getElementById('thetaSensitivity');
const phiSensitivityInput = document.getElementById('phiSensitivity');

document.addEventListener('DOMContentLoaded', () => {
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        canvas.style.display = 'block';
        initGame();
    });
});

// Load saved settings on page load
function loadSettings() {
    const savedTheta = localStorage.getItem('thetaSensitivity');
    const savedPhi = localStorage.getItem('phiSensitivity');
    if (savedTheta) thetaSensitivityInput.value = savedTheta;
    if (savedPhi) phiSensitivityInput.value = savedPhi;
}

function initGame() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Player (group of two cones)
    const coneGeometry = new THREE.ConeGeometry(0.5, 1, 16, 16); // Increased segments for more vertices
    const coneMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00FFFF, // Neon cyan
        wireframe: true,
        transparent: true,
        opacity: 0.8 // Slight transparency for Tron effect
    });

    const playerGroup = new THREE.Group();
    const bottomCone = new THREE.Mesh(coneGeometry, coneMaterial);
    const topCone = new THREE.Mesh(coneGeometry, coneMaterial);
    bottomCone.position.y = 0.5; // Base height (tip of bottom cone)
    topCone.position.y = 1.8056; // Adjusted initial offset for a small gap
    topCone.rotation.x = Math.PI; // Flip upside down (180 degrees around x-axis)
    playerGroup.add(bottomCone);
    playerGroup.add(topCone);
    
    // Create 5-pointed star geometry
    const starGeometry = new THREE.BufferGeometry();
    const radius = 0.3; // Length of star arms
    const vertices = new Float32Array([
        0, 0, 0,                      // Center (0)
        radius * Math.cos(0), radius * Math.sin(0), 0, // Point 1 (0°)
        radius * Math.cos(Math.PI * 2 / 5), radius * Math.sin(Math.PI * 2 / 5), 0, // Point 2 (72°)
        radius * Math.cos(Math.PI * 4 / 5), radius * Math.sin(Math.PI * 4 / 5), 0, // Point 3 (144°)
        radius * Math.cos(Math.PI * 6 / 5), radius * Math.sin(Math.PI * 6 / 5), 0, // Point 4 (216°)
        radius * Math.cos(Math.PI * 8 / 5), radius * Math.sin(Math.PI * 8 / 5), 0  // Point 5 (288°)
    ]);
    const indices = new Uint16Array([
        0, 1,  // Center to Point 1
        0, 2,  // Center to Point 2
        0, 3,  // Center to Point 3
        0, 4,  // Center to Point 4
        0, 5,  // Center to Point 5
        1, 3,  // Point 1 to Point 3
        2, 4,  // Point 2 to Point 4
        3, 5,  // Point 3 to Point 5
        4, 1,  // Point 4 to Point 1
        5, 2   // Point 5 to Point 2
    ]);
    starGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    starGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
    const starMaterial = new THREE.LineBasicMaterial({
        color: 0x00FFFF, // Neon cyan
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending // Bright, glowing effect
    });
    const star = new THREE.LineSegments(starGeometry, starMaterial);
    star.position.set(0, 1.1528, 0); // Initial midpoint (average of 0.5 and 1.8056)
    playerGroup.add(star);

    playerGroup.position.y = 0;   // Group base at origin
    scene.add(playerGroup);

    // Ground with Tron-like wireframe
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00FF00, // Neon green
        side: THREE.DoubleSide,
        wireframe: true
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Initial camera position
    camera.position.set(0, 5, -10);
    camera.lookAt(playerGroup.position);

    // Calculate initial theta and phi
    const initialOffset = new THREE.Vector3().subVectors(camera.position, playerGroup.position);
    const r = initialOffset.length();
    let theta = Math.atan2(initialOffset.x, initialOffset.z);
    let phi = Math.atan2(initialOffset.y, Math.sqrt(initialOffset.x ** 2 + initialOffset.z ** 2));

    // Mouse controls with Pointer Lock
    let isPointerLocked = false;
    let mouseX = 0;
    let mouseY = 0;
    let thetaSensitivity = parseFloat(thetaSensitivityInput.value); // Uses HTML default 0.02
    let phiSensitivity = parseFloat(phiSensitivityInput.value);    // Uses HTML default 0.002

    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

    canvas.addEventListener('click', () => {
        if (!isPointerLocked && !menu.style.display) {
            canvas.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === canvas;
        console.log('Pointer Lock State:', isPointerLocked);
    });

    document.addEventListener('mousemove', (e) => {
        if (isPointerLocked) {
            mouseX = e.movementX || e.mozMovementX || 0;
            mouseY = e.movementY || e.mozMovementY || 0;
        }
    });

    // Update and save sensitivity from sliders
    thetaSensitivityInput.addEventListener('input', (e) => {
        thetaSensitivity = parseFloat(e.target.value);
        localStorage.setItem('thetaSensitivity', thetaSensitivity);
    });
    phiSensitivityInput.addEventListener('input', (e) => {
        phiSensitivity = parseFloat(e.target.value);
        localStorage.setItem('phiSensitivity', phiSensitivity);
    });

    // Load settings when the page loads
    loadSettings();

    // Movement controls
    const moveState = { forward: false, backward: false, left: false, right: false };
    const playerSpeed = 5.0;
    let lastTime = performance.now();
    let isMenuOpen = false;
    let animationTime = 0; // For floating and star pulsing

    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'escape') {
            isMenuOpen = !isMenuOpen;
            menu.style.display = isMenuOpen ? 'block' : 'none';
            if (isMenuOpen && isPointerLocked) {
                document.exitPointerLock();
            }
        }
        if (!isMenuOpen) {
            if (key === 'w') moveState.forward = true;
            if (key === 's') moveState.backward = true;
            if (key === 'a') moveState.left = true;
            if (key === 'd') moveState.right = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w') moveState.forward = false;
        if (key === 's') moveState.backward = false;
        if (key === 'a') moveState.left = false;
        if (key === 'd') moveState.right = false;
    });

    closeMenuButton.addEventListener('click', () => {
        isMenuOpen = false;
        menu.style.display = 'none';
        if (!isPointerLocked) {
            canvas.requestPointerLock();
            setTimeout(() => {
                if (!isPointerLocked) {
                    console.log('Pointer Lock failed, retrying with click simulation');
                    canvas.dispatchEvent(new Event('click'));
                }
            }, 100);
        }
    });

    // Animation loop
    function animate(currentTime) {
        requestAnimationFrame(animate);
        
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        animationTime += deltaTime; // Increment time for floating and pulsing
        const moveDistance = playerSpeed * deltaTime;

        // Update player position only if menu is closed
        if (!isMenuOpen) {
            let direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            direction.y = 0; // Ignore vertical movement
            direction.normalize();

            if (moveState.forward) {
                playerGroup.position.x += moveDistance * direction.x;
                playerGroup.position.z += moveDistance * direction.z;
            }
            if (moveState.backward) {
                playerGroup.position.x -= moveDistance * direction.x;
                playerGroup.position.z -= moveDistance * direction.z;
            }
            if (moveState.left) {
                const leftVector = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
                playerGroup.position.x += moveDistance * leftVector.x;
                playerGroup.position.z += moveDistance * leftVector.z;
            }
            if (moveState.right) {
                const rightVector = new THREE.Vector3().crossVectors(direction, camera.up).normalize();
                playerGroup.position.x += moveDistance * rightVector.x;
                playerGroup.position.z += moveDistance * rightVector.z;
            }

            // Random spinning for each cone
            const bottomSpinSpeed = (Math.random() - 0.5) * 1.0; // Random speed between -0.5 and 0.5
            const bottomSpinAngle = Math.PI * (Math.random() * 0.5 + 0.25); // Random angle between PI/4 and 3PI/5
            bottomCone.rotation.y += deltaTime * bottomSpinSpeed;
            if (bottomCone.rotation.y > bottomSpinAngle || bottomCone.rotation.y < -bottomSpinAngle) {
                bottomSpinSpeed *= -1; // Reverse direction at angle limits
            }

            const topSpinSpeed = (Math.random() - 0.5) * 1.2; // Different random speed
            const topSpinAngle = Math.PI * (Math.random() * 0.7 + 0.3); // Different random angle
            topCone.rotation.y += deltaTime * topSpinSpeed;
            if (topCone.rotation.y > topSpinAngle || topCone.rotation.y < -topSpinAngle) {
                topSpinSpeed *= -1; // Reverse direction at angle limits
            }

            // Floating effect for top cone (continuous oscillation, no overlap)
            const floatOffset = Math.sin(animationTime * 2) * 0.2222; // ±0.2222 for 1/3 range
            topCone.position.y = 1.8056 + floatOffset; // Adjusted base offset + oscillation
            topCone.rotation.x = Math.PI + floatOffset * 0.1; // Slight tilt with float

            // Calculate distance between cone tips
            const bottomTipY = 0.5; // Fixed tip of bottom cone
            const topTipY = 1.8056 + floatOffset; // Current tip of top cone
            const distance = (topTipY - bottomTipY) + 0.35; // Adjusted to range 1.4333 to 1.8778

            // Update star position to center between cones' tips
            star.position.y = (bottomTipY + topTipY) / 2; // Exact midpoint

            // Animate star scale based on distance (disappear at 1.4333, max at 1.8778, capped at 0.9)
            const maxDistance = 1.8778; // Furthest apart
            const minDistance = 1.4333; // Minimum distance to prevent overlap
            const scaleFactor = Math.max(0, Math.min(0.9, (distance - minDistance) / (maxDistance - minDistance))); // 0 at 1.4333, 0.9 at 1.8778, clamped
            star.scale.set(scaleFactor, scaleFactor, scaleFactor); // Scales from 0 to 0.9, no inversion

            // Update camera based on mouse movement
            if (isPointerLocked && (mouseX !== 0 || mouseY !== 0)) {
                theta -= mouseX * thetaSensitivity;
                phi -= mouseY * phiSensitivity;
                phi = Math.max(0.1, Math.min(1.2, phi));
                theta = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                mouseX = 0;
                mouseY = 0;
            }

            // Update camera position
            const horizontalDistance = r * Math.cos(phi);
            camera.position.x = playerGroup.position.x + horizontalDistance * Math.sin(theta);
            camera.position.z = playerGroup.position.z + horizontalDistance * Math.cos(theta);
            camera.position.y = playerGroup.position.y + r * Math.sin(phi);
            camera.lookAt(playerGroup.position);
        }

        renderer.render(scene, camera);
    }
    animate(performance.now());

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}