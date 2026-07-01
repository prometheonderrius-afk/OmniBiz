import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import Earth from './Earth';
import Moon from './Moon';
import OrbitPath from './OrbitPath';
import ControlsOverlay from './ControlsOverlay';
import CollisionEffect from './CollisionEffect';
import { 
  updatePhysics, 
  EARTH_MASS, 
  EARTH_RADIUS, 
  MOON_MASS, 
  MOON_RADIUS, 
  EARTH_MOON_DISTANCE,
  MOON_VELOCITY,
  RENDER_SCALE 
} from './PhysicsEngine';

function PhysicsScene({ 
  isPaused, 
  timeScale, 
  bodyConfigs,
  resetTrigger,
  onSelectBody,
  selectedBodyId,
  onCollision
}) {
  const earthRef = useRef();
  const moonRef = useRef();

  const bodies = useMemo(() => {
    return [
      {
        id: 'earth',
        mass: EARTH_MASS * bodyConfigs.earth.massMult,
        radius: EARTH_RADIUS * Math.cbrt(bodyConfigs.earth.massMult),
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        fixed: true
      },
      {
        id: 'moon',
        mass: MOON_MASS * bodyConfigs.moon.massMult,
        radius: MOON_RADIUS * Math.cbrt(bodyConfigs.moon.massMult),
        position: [EARTH_MOON_DISTANCE, 0, 0],
        velocity: [0, 0, -MOON_VELOCITY * bodyConfigs.moon.velMult],
        fixed: false
      }
    ];
  }, [resetTrigger]);

  useEffect(() => {
    bodies[0].mass = EARTH_MASS * bodyConfigs.earth.massMult;
    bodies[0].radius = EARTH_RADIUS * Math.cbrt(bodyConfigs.earth.massMult);
    bodies[1].mass = MOON_MASS * bodyConfigs.moon.massMult;
    bodies[1].radius = MOON_RADIUS * Math.cbrt(bodyConfigs.moon.massMult);
  }, [bodyConfigs, bodies]);

  const prevMoonVelMult = useRef(bodyConfigs.moon.velMult);
  useEffect(() => {
    if (prevMoonVelMult.current !== bodyConfigs.moon.velMult) {
      const v = bodies[1].velocity;
      const currentSpeed = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
      if (currentSpeed > 0) {
        const dir = [v[0]/currentSpeed, v[1]/currentSpeed, v[2]/currentSpeed];
        const newSpeed = MOON_VELOCITY * bodyConfigs.moon.velMult;
        bodies[1].velocity = [dir[0]*newSpeed, dir[1]*newSpeed, dir[2]*newSpeed];
      } else {
        bodies[1].velocity = [0, 0, -MOON_VELOCITY * bodyConfigs.moon.velMult];
      }
      prevMoonVelMult.current = bodyConfigs.moon.velMult;
    }
  }, [bodyConfigs.moon.velMult, bodies]);

  const [moonPosRender, setMoonPosRender] = useState([EARTH_MOON_DISTANCE * RENDER_SCALE, 0, 0]);
  const frameCount = useRef(0);
  const hasCollided = useRef(false);

  useFrame((state, delta) => {
    if (!isPaused && !hasCollided.current) {
      const totalDt = delta * timeScale * 86400; 
      const steps = 100;
      const subDt = totalDt / steps;
      
      let collisions = [];
      for (let i = 0; i < steps; i++) {
        const newCollisions = updatePhysics(bodies, subDt);
        if (newCollisions.length > 0) {
          collisions = collisions.concat(newCollisions);
          break; // Stop integrating if we collide
        }
      }

      if (collisions.length > 0) {
        hasCollided.current = true;
        onCollision(collisions[0]);
      }
    }

    if (earthRef.current && moonRef.current) {
      earthRef.current.position.set(
        bodies[0].position[0] * RENDER_SCALE,
        bodies[0].position[1] * RENDER_SCALE,
        bodies[0].position[2] * RENDER_SCALE
      );

      const mPos = [
        bodies[1].position[0] * RENDER_SCALE,
        bodies[1].position[1] * RENDER_SCALE,
        bodies[1].position[2] * RENDER_SCALE
      ];
      moonRef.current.position.set(mPos[0], mPos[1], mPos[2]);

      frameCount.current++;
      if (frameCount.current % 5 === 0 && !isPaused && !hasCollided.current) {
        setMoonPosRender([...mPos]);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.05} />
      <directionalLight position={[1000, 200, 500]} intensity={3} castShadow />

      <group ref={earthRef}>
        <Earth 
          radius={EARTH_RADIUS * RENDER_SCALE * 2} 
          scale={Math.cbrt(bodyConfigs.earth.massMult)}
          rotationSpeed={bodyConfigs.earth.rotMult}
          selected={selectedBodyId === 'earth'}
          onClick={() => onSelectBody('earth')}
        />
      </group>

      <group ref={moonRef}>
        <Moon 
          radius={MOON_RADIUS * RENDER_SCALE * 4} 
          scale={Math.cbrt(bodyConfigs.moon.massMult)}
          rotationSpeed={bodyConfigs.moon.rotMult}
          selected={selectedBodyId === 'moon'}
          onClick={() => onSelectBody('moon')}
        />
      </group>

      <OrbitPath position={moonPosRender} color="#66aaff" maxPoints={1000} />
      
      <Stars radius={500} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
}

export default function Sandbox() {
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [selectedBodyId, setSelectedBodyId] = useState(null);
  const [collisions, setCollisions] = useState([]);

  const [bodyConfigs, setBodyConfigs] = useState({
    earth: { massMult: 1, rotMult: 1, velMult: 1 },
    moon: { massMult: 1, rotMult: 1, velMult: 1 }
  });

  const handleUpdateBody = (id, prop, value) => {
    setBodyConfigs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [prop]: value
      }
    }));
  };

  const handleReset = () => {
    setTimeScale(1);
    setBodyConfigs({
      earth: { massMult: 1, rotMult: 1, velMult: 1 },
      moon: { massMult: 1, rotMult: 1, velMult: 1 }
    });
    setCollisions([]);
    setIsPaused(false);
    setResetTrigger(prev => prev + 1);
  };

  const handleCollision = (collisionData) => {
    setCollisions(prev => [...prev, collisionData]);
    setIsPaused(true); // Auto-pause on collision
  };

  return (
    <div 
      style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}
      onPointerDown={() => setSelectedBodyId(null)} // Click on background to deselect
    >
      <ControlsOverlay 
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        timeScale={timeScale}
        setTimeScale={setTimeScale}
        resetSimulation={handleReset}
        selectedBody={selectedBodyId ? { id: selectedBodyId, ...bodyConfigs[selectedBodyId] } : null}
        onUpdateBody={handleUpdateBody}
        onDeselect={() => setSelectedBodyId(null)}
      />
      
      <Canvas 
        camera={{ position: [0, 200, 600], fov: 45 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <React.Suspense fallback={null}>
          <PhysicsScene 
            isPaused={isPaused} 
            timeScale={timeScale} 
            bodyConfigs={bodyConfigs}
            resetTrigger={resetTrigger}
            onSelectBody={setSelectedBodyId}
            selectedBodyId={selectedBodyId}
            onCollision={handleCollision}
          />

          {collisions.map((c, i) => (
            <CollisionEffect 
              key={i} 
              position={[c.position[0] * RENDER_SCALE, c.position[1] * RENDER_SCALE, c.position[2] * RENDER_SCALE]} 
            />
          ))}
        </React.Suspense>
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
