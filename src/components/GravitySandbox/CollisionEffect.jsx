import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function CollisionEffect({ position, onComplete }) {
  const meshRef = useRef();
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);

  useFrame((state, delta) => {
    // Expand quickly, fade out
    if (scale < 30) {
      setScale(prev => prev + delta * 80);
      setOpacity(prev => Math.max(0, prev - delta * 2));
    } else {
      if (onComplete) onComplete();
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={[scale, scale, scale]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial 
        color="#ff8800" 
        transparent={true} 
        opacity={opacity} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false}
      />
    </mesh>
  );
}
