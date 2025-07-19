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

    // Player (cone)
    const coneGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const coneMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(coneGeometry, coneMaterial);
    player.position.set(0, 0.5, 0);
    scene.add(player);

    // Ground
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x555555, 
        side: THREE.DoubleSide,
        wireframe: true
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Initial camera position
    camera.position.set(0, 5, -10);
    camera.lookAt(player.position);

    // Calculate initial theta and phi
    const initialOffset = new THREE.Vector3().subVectors(camera.position, player.position);
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
        const moveDistance = playerSpeed * deltaTime;

        // Update player position only if menu is closed
        if (!isMenuOpen) {
            let direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            direction.y = 0; // Ignore vertical movement
            direction.normalize();

            if (moveState.forward) {
                player.position.x += moveDistance * direction.x;
                player.position.z += moveDistance * direction.z;
            }
            if (moveState.backward) {
                player.position.x -= moveDistance * direction.x;
                player.position.z -= moveDistance * direction.z;
            }
            if (moveState.left) {
                const leftVector = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
                player.position.x += moveDistance * leftVector.x;
                player.position.z += moveDistance * leftVector.z;
            }
            if (moveState.right) {
                const rightVector = new THREE.Vector3().crossVectors(direction, camera.up).normalize();
                player.position.x += moveDistance * rightVector.x;
                player.position.z += moveDistance * rightVector.z;
            }

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
            camera.position.x = player.position.x + horizontalDistance * Math.sin(theta);
            camera.position.z = player.position.z + horizontalDistance * Math.cos(theta);
            camera.position.y = player.position.y + r * Math.sin(phi);
            camera.lookAt(player.position);
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