import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

const startButton = document.getElementById('startButton');
const canvas = document.getElementById('gameCanvas');

document.addEventListener('DOMContentLoaded', () => {
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        canvas.style.display = 'block';
        initGame();
    });
});

function initGame() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const playerGeometry = new THREE.ConeGeometry(0.5, 1, 8);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0.5, 0);
    scene.add(player);

    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    camera.position.set(0, 5, 10);
    camera.lookAt(player.position);

    function animate() {
        requestAnimationFrame(animate);
        const offset = new THREE.Vector3(0, 5, -10);
        const idealCameraPosition = player.position.clone().add(offset);
        camera.position.lerp(idealCameraPosition, 0.1);
        camera.lookAt(player.position);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('keydown', (event) => {
        const speed = 0.1;
        switch (event.key.toLowerCase()) {
            case 'w': player.position.z -= speed; break;
            case 's': player.position.z += speed; break;
            case 'a': player.position.x -= speed; break;
            case 'd': player.position.x += speed; break;
        }
    });
}