import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

export default function Moon({ position, radius, scale = 1, rotationSpeed = 1, selected, onClick }) {
  const moonRef = useRef();
  const groupRef = useRef();

  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg' 
  ]);

  useFrame(() => {
    if (moonRef.current) {
      moonRef.current.rotation.y += 0.001 * rotationSpeed; 
    }
    if (groupRef.current) {
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
      <mesh ref={moonRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial 
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.02}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {selected && (
        <mesh>
          <sphereGeometry args={[radius * 1.2, 32, 32]} />
          <meshBasicMaterial color="#00ff00" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
