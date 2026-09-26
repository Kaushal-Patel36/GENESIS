'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

function DNAHelix() {
  const groupRef = useRef(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.005;
    }
  });

  const points = [];
  const spirals = 2;
  const segments = 100;

  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * spirals;
    const x = Math.cos(t) * 2;
    const z = Math.sin(t) * 2;
    const y = (i / segments) * 8 - 4;
    points.push(new THREE.Vector3(x, y, z));
  }

  const points2 = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * spirals + Math.PI;
    const x = Math.cos(t) * 2;
    const z = Math.sin(t) * 2;
    const y = (i / segments) * 8 - 4;
    points2.push(new THREE.Vector3(x, y, z));
  }

  // Base pairs
  const basePairs = [];
  for (let i = 0; i < segments; i += 10) {
    const t = (i / segments) * Math.PI * spirals;
    const t2 = t + Math.PI;
    const y = (i / segments) * 8 - 4;

    const x1 = Math.cos(t) * 2;
    const z1 = Math.sin(t) * 2;
    const x2 = Math.cos(t2) * 2;
    const z2 = Math.sin(t2) * 2;

    basePairs.push([
      new THREE.Vector3(x1, y, z1),
      new THREE.Vector3(x2, y, z2),
    ]);
  }

  return (
    <group ref={groupRef}>
      <Line points={points} color="#8B5CF6" lineWidth={3} />
      <Line points={points2} color="#06B6D4" lineWidth={3} />
      {basePairs.map((pair, idx) => (
        <Line
          key={idx}
          points={pair}
          color="#FCD34D"
          lineWidth={1.5}
          dashed={false}
        />
      ))}
    </group>
  );
}

function DNAHelix3D() {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <DNAHelix />
        <OrbitControls autoRotate autoRotateSpeed={2} />
        <Environment preset="night" />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8B5CF6" />
      </Canvas>
    </div>
  );
}

export default DNAHelix3D;
