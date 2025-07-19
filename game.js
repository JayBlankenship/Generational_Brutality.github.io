import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const startButton = document.getElementById('startButton');
  
  startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    canvas.style.display = 'block';
    initGame();
  });
});

function initGame() {
  const canvas = document.getElementById('gameCanvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Player (cone)
  const coneGeometry = new THREE.ConeGeometry(0.5, 1, 8);
  const coneMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const player = new THREE.Mesh(coneGeometry, coneMaterial);
  player.position.set(0, 0.5, 0);
  scene.add(player);

  // Add axes helper to visualize directions
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // Ground
  const planeGeometry = new THREE.PlaneGeometry(20, 20);
  const planeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x555555, 
    side: THREE.DoubleSide,
    wireframe: true // Make it wireframe for better visibility
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // Camera setup - SIMPLIFIED approach
  camera.position.set(0, 5, -10); // Start position
  camera.lookAt(0, 0, 0); // Look at origin initially

  // Movement controls
  const moveState = { forward: false, backward: false, left: false, right: false };
  
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') moveState.forward = true;
    if (key === 's') moveState.backward = true;
    if (key === 'a') moveState.left = true;
    if (key === 'd') moveState.right = true;
  });
  
  document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') moveState.forward = false;
    if (key === 's') moveState.backward = false;
    if (key === 'a') moveState.left = false;
    if (key === 'd') moveState.right = false;
  });

  const playerSpeed = 5.0;
  let lastTime = performance.now();

  function animate(currentTime) {
    requestAnimationFrame(animate);
    
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    const moveDistance = playerSpeed * deltaTime;

    // Update player position
    if (moveState.forward) player.position.z -= moveDistance; // Note: Negative Z is "forward" in Three.js
    if (moveState.backward) player.position.z += moveDistance;
    if (moveState.left) player.position.x -= moveDistance;
    if (moveState.right) player.position.x += moveDistance;

    // SIMPLE camera follow - no lerping for now
    camera.position.x = player.position.x;
    camera.position.z = player.position.z - 10; // Keep 10 units behind player
    camera.position.y = 5; // Keep 5 units above player
    camera.lookAt(player.position);

    renderer.render(scene, camera);
  }

  animate(performance.now());

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}