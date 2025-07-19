import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';
import { createPlayerPawn } from './playerPawn.js';
import { createStar } from './star.js';

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

    // Create player pawn and star
    const playerPawn = createPlayerPawn();
    const star = createStar();
    playerPawn.add(star);
    scene.add(playerPawn);

    // Procedural ground system
    const planeSize = 20;
    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize, 1, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00FF00, // Neon green
        side: THREE.DoubleSide,
        wireframe: true
    });

    // Track planes using a grid system (x, z coordinates)
    const planes = new Map(); // Map<gridKey, { mesh, position }>
    const gridSize = planeSize; // Each plane occupies a grid cell

    // Convert world position to grid coordinates
    function getGridKey(x, z) {
        const gridX = Math.floor(x / gridSize);
        const gridZ = Math.floor(z / gridSize);
        return `${gridX},${gridZ}`;
    }

    // Create a plane at a given grid position
    function createPlane(gridX, gridZ) {
        const position = new THREE.Vector3(gridX * gridSize, 0, gridZ * gridSize);
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.copy(position);
        // Slight random rotation for variety
        //plane.rotation.y = (Math.random() - 0.5) * 0.1; // ±0.05 radians
        scene.add(plane);

        const gridKey = getGridKey(position.x, position.z);
        planes.set(gridKey, { mesh: plane, position });
    }

    // Generate neighboring planes when player is near an edge
    function generateNeighboringPlanes(playerPosition) {
        const gridKey = getGridKey(playerPosition.x, playerPosition.z);
        const [gridX, gridZ] = gridKey.split(',').map(Number);

        // Check if player is near an edge (within 2 units of plane boundary)
        const localX = playerPosition.x - gridX * gridSize;
        const localZ = playerPosition.z - gridZ * gridSize;
        const edgeThreshold = 170;

        const neighbors = [
            { dx: 1, dz: 0 }, // Right
            { dx: -1, dz: 0 }, // Left
            { dx: 0, dz: 1 }, // Forward
            { dx: 0, dz: -1 } // Backward
        ];

        neighbors.forEach(({ dx, dz }) => {
            // Only generate if player is near the corresponding edge
            if (
                (dx === 1 && localX > gridSize / 2 - edgeThreshold) ||
                (dx === -1 && localX < -gridSize / 2 + edgeThreshold) ||
                (dz === 1 && localZ > gridSize / 2 - edgeThreshold) ||
                (dz === -1 && localZ < -gridSize / 2 + edgeThreshold)
            ) {
                const newGridX = gridX + dx;
                const newGridZ = gridZ + dz;
                const newGridKey = `${newGridX},${newGridZ}`;
                if (!planes.has(newGridKey)) {
                    createPlane(newGridX, newGridZ);
                }
            }
        });
    }

    // Create initial plane
    createPlane(0, 0);

    // Initial camera position
    camera.position.set(0, 5, -10);
    camera.lookAt(playerPawn.position);

    // Calculate initial theta and phi
    const initialOffset = new THREE.Vector3().subVectors(camera.position, playerPawn.position);
    const r = initialOffset.length();
    let theta = Math.atan2(initialOffset.x, initialOffset.z);
    let phi = Math.atan2(initialOffset.y, Math.sqrt(initialOffset.x ** 2 + initialOffset.z ** 2));

    // Mouse controls with Pointer Lock
    let isPointerLocked = false;
    let mouseX = 0;
    let mouseY = 0;
    let thetaSensitivity = parseFloat(thetaSensitivityInput.value);
    let phiSensitivity = parseFloat(phiSensitivityInput.value);

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
    let animationTime = 0;

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
        animationTime += deltaTime;

        // Update player position only if menu is closed
        if (!isMenuOpen) {
            let direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            direction.y = 0;
            direction.normalize();

            if (moveState.forward) {
                playerPawn.position.x += playerSpeed * deltaTime * direction.x;
                playerPawn.position.z += playerSpeed * deltaTime * direction.z;
            }
            if (moveState.backward) {
                playerPawn.position.x -= playerSpeed * deltaTime * direction.x;
                playerPawn.position.z -= playerSpeed * deltaTime * direction.z;
            }
            if (moveState.left) {
                const leftVector = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
                playerPawn.position.x += playerSpeed * deltaTime * leftVector.x;
                playerPawn.position.z += playerSpeed * deltaTime * leftVector.z;
            }
            if (moveState.right) {
                const rightVector = new THREE.Vector3().crossVectors(direction, camera.up).normalize();
                playerPawn.position.x += playerSpeed * deltaTime * rightVector.x;
                playerPawn.position.z += playerSpeed * deltaTime * rightVector.z;
            }

            // Update player pawn and star animations
            playerPawn.update(deltaTime, animationTime);
            star.update(deltaTime, animationTime, playerPawn.getConeTips());

            // Generate new planes if player is near an edge
            generateNeighboringPlanes(playerPawn.position);

            // Remove distant planes
            const maxDistance = gridSize * 3;
            planes.forEach((planeData, gridKey) => {
                if (playerPawn.position.distanceTo(planeData.position) > maxDistance) {
                    scene.remove(planeData.mesh);
                    planes.delete(gridKey);
                }
            });

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
            camera.position.x = playerPawn.position.x + horizontalDistance * Math.sin(theta);
            camera.position.z = playerPawn.position.z + horizontalDistance * Math.cos(theta);
            camera.position.y = playerPawn.position.y + r * Math.sin(phi);
            camera.lookAt(playerPawn.position);
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