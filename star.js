import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';

export function createStar() {
    const radius = 0.3;
    const vertices = new Float32Array([
        0, 0, 0,
        radius * Math.cos(0), radius * Math.sin(0), 0,
        radius * Math.cos(Math.PI * 2 / 5), radius * Math.sin(Math.PI * 2 / 5), 0,
        radius * Math.cos(Math.PI * 4 / 5), radius * Math.sin(Math.PI * 4 / 5), 0,
        radius * Math.cos(Math.PI * 6 / 5), radius * Math.sin(Math.PI * 6 / 5), 0,
        radius * Math.cos(Math.PI * 8 / 5), radius * Math.sin(Math.PI * 8 / 5), 0
    ]);
    const indices = new Uint16Array([
        0, 1, 0, 2, 0, 3, 0, 4, 0, 5,
        1, 3, 2, 4, 3, 5, 4, 1, 5, 2
    ]);
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    starGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
    const starMaterial = new THREE.LineBasicMaterial({
        color: 0x00FFFF,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const star = new THREE.LineSegments(starGeometry, starMaterial);
    star.position.set(0, 1.1528, 0);

    star.update = function(deltaTime, animationTime, { bottomTipY, topTipY }) {
        const distance = (topTipY - bottomTipY) + 0.35;
        star.position.y = (bottomTipY + topTipY) / 2;
        const maxDistance = 1.8778;
        const minDistance = 1.4333;
        const scaleFactor = Math.max(0, Math.min(0.9, (distance - minDistance) / (maxDistance - minDistance)));
        star.scale.set(scaleFactor, scaleFactor, scaleFactor);
    };

    return star;
}