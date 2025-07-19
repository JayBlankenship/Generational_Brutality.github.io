import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';
import { createPlayerPawn } from './playerPawn.js';

export function createAIPlayer() {
    const aiPawn = createPlayerPawn();
    aiPawn.position.set(
        (Math.random() - 0.5) * 40, // Random x position (-20 to 20)
        0,
        (Math.random() - 0.5) * 40  // Random z position (-20 to 20)
    );

    // AI behavior variables
    let currentDirection = new THREE.Vector3();
    let decisionTimer = 0;
    let changeDirectionInterval = 2 + Math.random() * 3; // 2-5 seconds
    let isSurgeActive = false;
    let surgeCooldown = 0;

    // Random movement direction
    function chooseNewDirection() {
        // Sometimes stand still (20% chance)
        if (Math.random() < 0.2) {
            currentDirection.set(0, 0, 0);
        } else {
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            currentDirection.set(Math.sin(angle), 0, Math.cos(angle));
        }
        decisionTimer = 0;
        changeDirectionInterval = 2 + Math.random() * 3; // New interval
    }

    // Random surge activation
    function updateSurgeState(deltaTime) {
        surgeCooldown -= deltaTime;
        if (surgeCooldown <= 0) {
            // 30% chance to activate surge each second when cooldown is up
            if (Math.random() < deltaTime * 0.3) {
                isSurgeActive = true;
                surgeCooldown = 1 + Math.random() * 2; // 1-3 second cooldown
            }
        } else {
            isSurgeActive = false;
        }
    }

    aiPawn.updateAI = function(deltaTime, animationTime) {
        // Update decision timer
        decisionTimer += deltaTime;
        if (decisionTimer > changeDirectionInterval) {
            chooseNewDirection();
        }

        // Update surge state
        updateSurgeState(deltaTime);

        // Simulate spacebar press for the AI
        aiPawn.__spacePressed = isSurgeActive;

        // Move the AI pawn
        const speed = 3.5; // Slightly slower than player
        aiPawn.position.x += currentDirection.x * speed * deltaTime;
        aiPawn.position.z += currentDirection.z * speed * deltaTime;

        // Call the original update for animations
        aiPawn.update(deltaTime, animationTime);
    };

    return aiPawn;
}