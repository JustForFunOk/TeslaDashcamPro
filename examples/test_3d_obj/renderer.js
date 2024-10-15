// src/js/main.js

import * as THREE from './libs/three/three.module.js';
import { OBJLoader } from './libs/three/OBJLoader.js';
import { GLTFLoader } from './libs/three/GLTFLoader.js';
import { OrbitControls } from './libs/three/OrbitControls.js';

// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 环境光，不受视角影响，若不添加则光源背面为黑色
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // 白色环境光，强度为0.5
scene.add(ambientLight);

// 平行光，若不添加显示不了模型的细节只能看见轮廓
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 平行光
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// const objLoader = new OBJLoader();
// objLoader.load('assets/cybertruck.obj', (object) => {
//     scene.add(object);
// });

const loader = new GLTFLoader();
loader.load('assets/cybertruck.glb', (gltf) => {
    // 设置材质，让模型显得有金属感
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.5 });
    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.material = material; // 为每个网格设置基础材质
        }
    });

    scene.add(gltf.scene);
    // 设置模型的缩放和位置
    gltf.scene.scale.set(1, 1, 1); // 根据需要调整
    gltf.scene.position.set(0, 0, 0); // 根据需要调整
}, undefined, (error) => {
    console.error(error);
});

camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();