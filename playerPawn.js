import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

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

    playerGroup.update = function(deltaTime, animationTime) {
        // Random spinning for each cone
        bottomCone.rotation.y += deltaTime * bottomSpinSpeed;
        if (bottomCone.rotation.y > bottomSpinAngle || bottomCone.rotation.y < -bottomSpinAngle) {
            bottomSpinSpeed *= -1;
        }

        const floatOffset = Math.sin(animationTime * 2) * 0.2222;
        topCone.position.y = 1.8056 + floatOffset;
        topCone.rotation.x = Math.PI + floatOffset * 0.1;
    };

    playerGroup.getConeTips = function() {
        const bottomTipY = 0.5;
        const topTipY = topCone.position.y;
        return { bottomTipY, topTipY };
    };

    playerGroup.position.y = 0;
    return playerGroup;
}