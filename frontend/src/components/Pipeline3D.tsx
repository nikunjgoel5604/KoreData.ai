"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Float, Line, OrbitControls, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type PipelineNodeProps = {
  position: [number, number, number];
  color: string;
  isActive: boolean;
  label: string;
  shape: "cube" | "sphere" | "torus" | "cylinder" | "cone";
};

function PipelineNode({ position, color, isActive, shape }: PipelineNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotate active nodes faster
      const speed = isActive ? 1.8 : 0.4;
      meshRef.current.rotation.x += delta * speed * 0.5;
      meshRef.current.rotation.y += delta * speed;
      
      // Pulse scale if active
      if (isActive) {
        const scaleVal = 1 + Math.sin(state.clock.getElapsedTime() * 8) * 0.12;
        meshRef.current.scale.set(scaleVal, scaleVal, scaleVal);
      } else {
        meshRef.current.scale.set(0.8, 0.8, 0.8);
      }
    }
  });

  return (
    <Float speed={isActive ? 3 : 1} rotationIntensity={isActive ? 0.8 : 0.2} floatIntensity={isActive ? 0.6 : 0.1}>
      <mesh ref={meshRef} position={position}>
        {shape === "cube" && <boxGeometry args={[0.7, 0.7, 0.7]} />}
        {shape === "sphere" && <sphereGeometry args={[0.45, 32, 32]} />}
        {shape === "torus" && <torusGeometry args={[0.35, 0.12, 16, 100]} />}
        {shape === "cylinder" && <cylinderGeometry args={[0.35, 0.35, 0.7, 32]} />}
        {shape === "cone" && <coneGeometry args={[0.4, 0.7, 32]} />}

        <meshStandardMaterial
          color={color}
          emissive={isActive ? color : "#000"}
          emissiveIntensity={isActive ? 1.5 : 0}
          metalness={0.7}
          roughness={0.2}
          wireframe={isActive}
        />
      </mesh>
    </Float>
  );
}

// Renders glowing particles that travel along spline paths between nodes
function DataPackets({ start, end, active }: { start: [number, number, number]; end: [number, number, number]; active: boolean }) {
  const particleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (particleRef.current) {
      if (active) {
        // Speed up animation if this path segment is active
        const t = (state.clock.getElapsedTime() * 0.8) % 1;
        particleRef.current.position.x = start[0] + (end[0] - start[0]) * t;
        particleRef.current.position.y = start[1] + (end[1] - start[1]) * t;
        particleRef.current.position.z = start[2] + (end[2] - start[2]) * t;
        particleRef.current.visible = true;
      } else {
        particleRef.current.visible = false;
      }
    }
  });

  return (
    <mesh ref={particleRef}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshBasicMaterial color="#00ff88" toneMapped={false} />
    </mesh>
  );
}

export default function Pipeline3D({ activeStage }: { activeStage: string | null }) {
  // Map 16 frontend stages to 5 major 3D pipeline nodes
  const nodeMap = useMemo(() => {
    const map: Record<string, number> = {
      upload: 0, validate: 0, parse: 0,                // Node 0: Data Ingestion
      cleaning: 1, missing_detect: 1, duplicate_detect: 1, type_detect: 1, // Node 1: ETL / Cleaning
      feature_eng: 2, eda: 2, stats: 2, correlation: 2, // Node 2: Math Engine / EDA
      ml_prep: 3, model_proc: 3,                         // Node 3: ML Studio Processing
      insight_gen: 4, report_gen: 4, export_results: 4,  // Node 4: Intelligence Output
    };
    return map;
  }, []);

  const activeNodeIndex = activeStage ? nodeMap[activeStage] ?? -1 : -1;

  const nodes = useMemo(() => [
    { position: [-3, 1, 0] as [number, number, number], color: "#00d4ff", label: "Ingestion", shape: "cube" as const },
    { position: [-1.5, -1, 0] as [number, number, number], color: "#a855f7", label: "Cleansing", shape: "torus" as const },
    { position: [0, 1, 0] as [number, number, number], color: "#eab308", label: "EDA Stats", shape: "cylinder" as const },
    { position: [1.5, -1, 0] as [number, number, number], color: "#3b82f6", label: "ML Engine", shape: "sphere" as const },
    { position: [3, 1, 0] as [number, number, number], color: "#00ff88", label: "Intelligence", shape: "cone" as const },
  ], []);

  return (
    <div style={{ width: "100%", height: "260px", background: "radial-gradient(circle at center, #020b18 0%, #00040a 100%)", borderRadius: 12, border: "1px solid rgba(0, 212, 255, 0.15)", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 12, left: 14, zIndex: 2, pointerEvents: "none" }}>
        <span style={{ fontSize: 10, color: "#658ba0", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5 }}>3D Pipeline Graph</span>
        <h4 style={{ margin: "2px 0 0 0", fontSize: 13, color: "#fff", fontWeight: "bold" }}>ETL / AI Node Stream</h4>
      </div>

      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#00d4ff" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#7c3aed" />
        <Stars radius={60} depth={20} count={600} factor={2.5} speed={0.4} fade />
        
        <Center>
          {/* Node objects */}
          {nodes.map((node, i) => (
            <PipelineNode
              key={i}
              position={node.position}
              color={node.color}
              isActive={activeNodeIndex === i}
              label={node.label}
              shape={node.shape}
            />
          ))}

          {/* Connection spline lines */}
          <Line points={[nodes[0].position, nodes[1].position]} color="#7c3aed" lineWidth={1.5} opacity={0.3} transparent />
          <Line points={[nodes[1].position, nodes[2].position]} color="#eab308" lineWidth={1.5} opacity={0.3} transparent />
          <Line points={[nodes[2].position, nodes[3].position]} color="#3b82f6" lineWidth={1.5} opacity={0.3} transparent />
          <Line points={[nodes[3].position, nodes[4].position]} color="#00ff88" lineWidth={1.5} opacity={0.3} transparent />

          {/* Glowing particle data packets */}
          <DataPackets start={nodes[0].position} end={nodes[1].position} active={activeNodeIndex === 0} />
          <DataPackets start={nodes[1].position} end={nodes[2].position} active={activeNodeIndex === 1} />
          <DataPackets start={nodes[2].position} end={nodes[3].position} active={activeNodeIndex === 2} />
          <DataPackets start={nodes[3].position} end={nodes[4].position} active={activeNodeIndex === 3} />
        </Center>

        <OrbitControls enableZoom={true} maxDistance={7} minDistance={3} enablePan={false} />
      </Canvas>
    </div>
  );
}
