import React, { useState, useEffect } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

export default function OrbitPath({ position, maxPoints = 500, color = 'rgba(255, 255, 255, 0.5)' }) {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    setPoints((prev) => {
      // Only add point if it moved significantly to avoid huge arrays
      const current = new THREE.Vector3(...position);
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.distanceTo(current) < 0.1) {
          return prev;
        }
      }

      const newPoints = [...prev, current];
      if (newPoints.length > maxPoints) {
        newPoints.shift();
      }
      return newPoints;
    });
  }, [position, maxPoints]);

  if (points.length < 2) return null;

  return (
    <Line
      points={points.map(p => [p.x, p.y, p.z])}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={0.5}
    />
  );
}
