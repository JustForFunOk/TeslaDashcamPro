// src/js/main.js

import * as THREE from './libs/three.module.js';
import { OBJLoader } from './libs/OBJLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';

// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const objLoader = new OBJLoader();
objLoader.load('assets/car.obj', (object) => {
    scene.add(object);
});

camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();