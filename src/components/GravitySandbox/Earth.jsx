import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

export default function Earth({ position, radius, scale = 1, rotationSpeed = 1, selected, onClick }) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const groupRef = useRef();
  
  const [colorMap, bumpMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    'https://unpkg.com/three-globe/example/img/earth-topology.png',
    'https://unpkg.com/three-globe/example/img/earth-water.png',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
  ]);

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0005 * rotationSpeed; 
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0007 * rotationSpeed; 
    }
    if (groupRef.current) {
      // Smooth scaling
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <group 
      position={position} 
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'default'}
    >
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.015}
          specularMap={specularMap}
          specular={new THREE.Color('grey')}
          shininess={35}
        />
      </mesh>
      
      <mesh ref={cloudsRef} receiveShadow>
        <sphereGeometry args={[radius * 1.01, 64, 64]} /> 
        <meshPhongMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh>
        <sphereGeometry args={[radius * 1.12, 64, 64]} />
        <meshBasicMaterial 
          color="#0066ff" 
          transparent={true} 
          opacity={0.15} 
          blending={THREE.AdditiveBlending} 
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Selection Highlight */}
      {selected && (
        <mesh>
          <sphereGeometry args={[radius * 1.2, 32, 32]} />
          <meshBasicMaterial color="#00ff00" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
