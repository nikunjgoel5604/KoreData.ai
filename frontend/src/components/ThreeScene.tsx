"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Stars } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Globe() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.18;
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh ref={ref}>
        <sphereGeometry args={[1.65, 64, 64]} />
        <meshStandardMaterial color="#2563EB" wireframe emissive="#06B6D4" emissiveIntensity={0.28} />
      </mesh>
      {[...Array(16)].map((_, i) => (
        <mesh key={i} position={[
          Math.sin(i) * 2.6,
          Math.cos(i * 1.7) * 1.6,
          Math.sin(i * 2.1) * 2.3
        ]}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshStandardMaterial color={i % 2 ? "#7C3AED" : "#06B6D4"} />
        </mesh>
      ))}
    </Float>
  );
}

export default function ThreeScene() {
  return (
    <div className="absolute inset-0 opacity-80">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={2} color="#06B6D4" />
        <Stars radius={80} depth={40} count={1800} factor={3} fade speed={0.5} />
        <Globe />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
      </Canvas>
    </div>
  );
}
