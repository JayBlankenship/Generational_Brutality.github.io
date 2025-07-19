import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

console.log('Script loaded'); // Debug: Confirm script runs

const canvas = document.getElementById('gameCanvas');
const startButton = document.getElementById('startButton');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });

let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded'); // Debug: Confirm DOM is ready
  if (!startButton) {
    console.error('Start button not found');
    return;
  }
  startButton.addEventListener('click', () => {
    console.log('Start button clicked'); // Debug: Confirm click
    startButton.style.display = 'none';
    canvas.style.display = 'block';
    initGame();
  });
});

function initGame() {
  console.log('initGame called'); // Debug: Confirm function runs
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Player (cone)
  const coneGeometry = new THREE.ConeGeometry(0.5, 1, 8);
  const coneMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green cone
  const player = new THREE.Mesh(coneGeometry, coneMaterial);
  player.position.set(0, 0.5, 0);
  scene.add(player);

  // Ground (raid world)
  const planeGeometry = new THREE.PlaneGeometry(20, 20);
  const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // Camera
  camera.position.set(0, 5, 10);
  camera.lookAt(player.position);

  // Movement controls (WASD)
  document.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
      case 'w': moveForward = true; break;
      case 's': moveBackward = true; break;
      case 'a': moveLeft = true; break;
      case 'd': moveRight = true; break;
    }
  });
  document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
      case 'w': moveForward = false; break;
      case 's': moveBackward = false; break;
      case 'a': moveLeft = false; break;
      case 'd': moveRight = false; break;
    }
  });

  function updatePlayer() {
    const speed = 0.1;
    if (moveForward) player.position.z -= speed;
    if (moveBackward) player.position.z += speed;
    if (moveLeft) player.position.x -= speed;
    if (moveRight) player.position.x += speed;
    camera.lookAt(player.position); // Update camera to follow player
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    updatePlayer();
    renderer.render(scene, camera);
  }
  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}