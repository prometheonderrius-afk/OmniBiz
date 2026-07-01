import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

export default function CelestialBody({ 
  position, 
  radius, 
  textureUrl, 
  color = 'white', 
  emissive = 'black',
  emissiveIntensity = 1,
  castShadow = true,
  receiveShadow = true
}) {
  const meshRef = useRef();

  // Load texture if provided
  const texture = textureUrl ? useLoader(THREE.TextureLoader, textureUrl) : null;

  useFrame(() => {
    if (meshRef.current) {
      // Optional: add slight rotation
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={position}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial 
        color={texture ? 'white' : color}
        map={texture}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  );
}
