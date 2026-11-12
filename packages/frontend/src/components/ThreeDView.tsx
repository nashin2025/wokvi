'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useProjectStore } from '../store';
import { cn } from '../utils/cn';

export function ThreeDView() {
  const { currentProject } = useProjectStore();
  const mountRef = useRef<HTMLDivElement>(null);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 20;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f4,
      roughness: 0.8,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 40, 0xd6d3d1, 0xe7e5e4);
    scene.add(gridHelper);

    // Create board
    const board = createBoard();
    scene.add(board);

    // Create components
    if (currentProject) {
      currentProject.components.forEach((comp, i) => {
        const componentMesh = createComponent(comp);
        componentMesh.position.set(
          (i % 4) * 3 - 4.5,
          0.5,
          Math.floor(i / 4) * 3 - 3
        );
        scene.add(componentMesh);
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    setSceneReady(true);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [currentProject]);

  const createBoard = () => {
    const group = new THREE.Group();

    // PCB base
    const pcbGeometry = new THREE.BoxGeometry(8, 0.2, 6);
    const pcbMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.3,
      metalness: 0.1,
    });
    const pcb = new THREE.Mesh(pcbGeometry, pcbMaterial);
    pcb.receiveShadow = true;
    pcb.castShadow = true;
    group.add(pcb);

    // USB connector
    const usbGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.4);
    const usbMaterial = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.5, metalness: 0.5 });
    const usb = new THREE.Mesh(usbGeometry, usbMaterial);
    usb.position.set(0, 0.15, -3.1);
    usb.castShadow = true;
    group.add(usb);

    // Mounting holes
    const holeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 16);
    const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.5, metalness: 0.5 });
    const positions = [
      [-3.7, 0.15, -2.7],
      [3.7, 0.15, -2.7],
      [-3.7, 0.15, 2.7],
      [3.7, 0.15, 2.7],
    ];
    positions.forEach((pos) => {
      const hole = new THREE.Mesh(holeGeometry, holeMaterial);
      hole.position.set(...pos);
      hole.castShadow = true;
      group.add(hole);
    });

    return group;
  };

  const createComponent = (comp: any) => {
    const group = new THREE.Group();

    // Component body (generic IC)
    const bodyGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.2,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Notch
    const notchGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16, 1, true, 0, Math.PI);
    const notchMaterial = new THREE.MeshStandardMaterial({ color: 0x44403c });
    const notch = new THREE.Mesh(notchGeometry, notchMaterial);
    notch.rotation.x = Math.PI / 2;
    notch.position.set(0, 0.2, 0);
    group.add(notch);

    // Pins
    const pinGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    const pinMaterial = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.3, metalness: 0.7 });
    for (let i = 0; i < 8; i++) {
      const py = -0.55 + i * 0.15;
      // Left pins
      const pinL = new THREE.Mesh(pinGeometry, pinMaterial);
      pinL.position.set(-0.65, py, 0);
      pinL.castShadow = true;
      group.add(pinL);
      // Right pins
      const pinR = new THREE.Mesh(pinGeometry, pinMaterial);
      pinR.position.set(0.65, py, 0);
      pinR.castShadow = true;
      group.add(pinR);
    }

    // Label
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fafaf9';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(comp.componentId.slice(0, 12), 128, 40);
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const label = new THREE.Sprite(labelMaterial);
    label.scale.set(1.5, 0.4, 1);
    label.position.set(0, 0.5, 0);
    group.add(label);

    return group;
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      
      {!sceneReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-50 dark:bg-surface-950">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-surface-600 dark:text-surface-400">Loading 3D view...</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 card p-3 text-xs text-surface-600 dark:text-surface-400">
        <div>3D View</div>
        <div className="mt-1">Drag to orbit | Scroll to zoom | Shift+drag to pan</div>
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button className="btn-secondary p-2" title="Reset View">
          🏠
        </button>
        <button className="btn-secondary p-2" title="Top View">
          🔝
        </button>
        <button className="btn-secondary p-2" title="Side View">
          👁
        </button>
      </div>
    </div>
  );
}