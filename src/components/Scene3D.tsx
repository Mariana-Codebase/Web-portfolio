import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Scene3DProps {
  isDarkMode: boolean;
}

export const Scene3D: React.FC<Scene3DProps> = ({ isDarkMode }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    const geometry = new THREE.BufferGeometry();
    const count = 1500; 
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count); 
    
    for(let i=0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 100 - 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      velocities[i] = 0.02 + Math.random() * 0.04; 
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({ 
      size: 0.2, 
      color: isDarkMode ? 0x60a5fa : 0x475569,
      transparent: true, 
      opacity: isDarkMode ? 0.6 : 0.5,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending 
    });
    
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    camera.position.z = 50;

    const mouseTarget = new THREE.Vector2(0, 0);
    const mouseCurrent = new THREE.Vector2(0, 0);
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseTarget.set(x, y);
    };
    
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const posArray = geometry.attributes.position.array as Float32Array;
      for(let i=0; i < count; i++) {
        posArray[i * 3 + 1] -= velocities[i];
        if (posArray[i * 3 + 1] < -55) {
          posArray[i * 3 + 1] = 55;
          posArray[i * 3] = (Math.random() - 0.5) * 120;
        }
      }
      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.03;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.03;
      points.rotation.y = mouseCurrent.x * 0.18;
      points.rotation.x = mouseCurrent.y * 0.12;
      camera.position.x = mouseCurrent.x * 2.5;
      camera.position.y = mouseCurrent.y * 1.5;
      camera.lookAt(0, 0, 0);
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    
    animate();
    
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [isDarkMode]);
  
  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000" />;
};
