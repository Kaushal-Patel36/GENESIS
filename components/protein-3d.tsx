'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

function ProteinStructure() {
  const groupRef = useRef(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x += 0.002;
      groupRef.current.rotation.y += 0.003;
    }
  });

  // Generate random protein structure
  const atoms = [];
  const bonds = [];

  for (let i = 0; i < 25; i++) {
    atoms.push({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8,
      z: (Math.random() - 0.5) * 8,
      type: Math.random() > 0.5 ? 'carbon' : 'nitrogen',
    });
  }

  for (let i = 0; i < atoms.length - 1; i++) {
    const dist = Math.hypot(
      atoms[i].x - atoms[i + 1].x,
      atoms[i].y - atoms[i + 1].y,
      atoms[i].z - atoms[i + 1].z
    );
    if (dist < 3) {
      bonds.push([
        new THREE.Vector3(atoms[i].x, atoms[i].y, atoms[i].z),
        new THREE.Vector3(atoms[i + 1].x, atoms[i + 1].y, atoms[i + 1].z),
      ]);
    }
  }

  return (
    <group ref={groupRef}>
      {atoms.map((atom, idx) => (
        <Sphere
          key={idx}
          args={[0.3, 16, 16]}
          position={[atom.x, atom.y, atom.z]}
        >
          <meshStandardMaterial
            color={atom.type === 'carbon' ? '#06B6D4' : '#8B5CF6'}
            emissive={atom.type === 'carbon' ? '#06B6D4' : '#8B5CF6'}
            emissiveIntensity={0.3}
          />
        </Sphere>
      ))}
      {bonds.map((bond, idx) => (
        <Line
          key={idx}
          points={bond}
          color="#FCD34D"
          lineWidth={2}
          dashed={false}
        />
      ))}
    </group>
  );
}

function Protein3D() {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <Canvas camera={{ position: [0, 0, 12] }}>
        <ProteinStructure />
        <OrbitControls autoRotate autoRotateSpeed={3} />
        <Environment preset="night" />
        <ambientLight intensity={0.6} />
        <pointLight position={[15, 15, 15]} intensity={1.2} />
        <pointLight position={[-15, -15, -15]} intensity={0.6} color="#8B5CF6" />
      </Canvas>
    </div>
  );
}

export default Protein3D;
