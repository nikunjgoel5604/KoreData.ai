"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/*
  MANUAL CONTROLS

  Opacity values:
  0.00 = invisible
  0.05 = very transparent
  0.15 = soft visible
  0.30 = clearly visible
  1.00 = fully visible

  Rotation:
  negative value = clockwise
  positive value = anti-clockwise
*/

const GLOBE_SIZE = 1.62;
const GLOBE_OPACITY = 0.08;
const WIREFRAME_OPACITY = 0.10;
const DOT_OPACITY = 0.35;
const GREEN_RING_OPACITY = 0.22;
const PURPLE_RING_OPACITY = 0.18;
const CUBE_OPACITY = 0.48;

const GLOBE_ROTATION_SPEED = -0.18;
const WIREFRAME_ROTATION_SPEED = -0.26;
const GREEN_RING_SPEED = -0.16;
const PURPLE_RING_SPEED = -0.1;

function EarthGlobe() {
  const globe = useRef<THREE.Mesh>(null);
  const globeGrid = useRef<THREE.Mesh>(null);
  const greenRing = useRef<THREE.Mesh>(null);
  const purpleRing = useRef<THREE.Mesh>(null);

  const dots = useMemo(() => {
    return Array.from({ length: 90 }, (_, i) => {
      const phi = Math.acos(-1 + (2 * i) / 90);
      const theta = Math.sqrt(90 * Math.PI) * phi;

      return [
        1.72 * Math.cos(theta) * Math.sin(phi),
        1.72 * Math.sin(theta) * Math.sin(phi),
        1.72 * Math.cos(phi)
      ] as [number, number, number];
    });
  }, []);

  useFrame((_, delta) => {
    if (globe.current) globe.current.rotation.y += delta * GLOBE_ROTATION_SPEED;
    if (globeGrid.current) globeGrid.current.rotation.y += delta * WIREFRAME_ROTATION_SPEED;
    if (greenRing.current) greenRing.current.rotation.z += delta * GREEN_RING_SPEED;
    if (purpleRing.current) purpleRing.current.rotation.z += delta * PURPLE_RING_SPEED;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.16} floatIntensity={0.5}>
      <mesh ref={globe}>
        <sphereGeometry args={[GLOBE_SIZE, 96, 96]} />
        <meshStandardMaterial
          color="#062a4f"
          transparent
          opacity={GLOBE_OPACITY}
          emissive="#00d4ff"
          emissiveIntensity={0.08}
          roughness={0.55}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={globeGrid}>
        <sphereGeometry args={[GLOBE_SIZE + 0.04, 96, 96]} />
        <meshStandardMaterial
          color="#00d4ff"
          wireframe
          transparent
          opacity={WIREFRAME_OPACITY}
          emissive="#00d4ff"
          emissiveIntensity={0.14}
          depthWrite={false}
        />
      </mesh>

      {dots.map((position, i) => (
        <mesh key={i} position={position}>
          <sphereGeometry args={[0.014, 8, 8]} />
          <meshBasicMaterial
            color={i % 4 === 0 ? "#00ff88" : "#00d4ff"}
            transparent
            opacity={DOT_OPACITY}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh ref={greenRing} rotation={[1.22, 0.25, 0]}>
        <torusGeometry args={[2.18, 0.006, 16, 160]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={GREEN_RING_OPACITY}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={purpleRing} rotation={[1.55, -0.35, 0.55]}>
        <torusGeometry args={[2.42, 0.005, 16, 160]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent
          opacity={PURPLE_RING_OPACITY}
          depthWrite={false}
        />
      </mesh>

      {[...Array(22)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 1.6) * 3,
            Math.cos(i * 2.2) * 1.9,
            Math.sin(i * 0.85) * 2.4
          ]}
        >
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#00ff88" : i % 2 === 0 ? "#7c3aed" : "#00d4ff"}
            transparent
            opacity={CUBE_OPACITY}
            emissive="#00d4ff"
            emissiveIntensity={0.12}
            depthWrite={false}
          />
        </mesh>
      ))}
    </Float>
  );
}

export default function HeroScene() {
  return (
    <div className="scene" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6.2], fov: 44 }}>
        <ambientLight intensity={0.55} />
        <pointLight position={[3, 3, 4]} intensity={1.5} color="#00d4ff" />
        <pointLight position={[-4, -2, 3]} intensity={1} color="#7c3aed" />

        <Stars
          radius={90}
          depth={50}
          count={2200}
          factor={3.5}
          fade
          speed={0.6}
        />

        <EarthGlobe />
      </Canvas>
    </div>
  );
}
