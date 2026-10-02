"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { useOffscreenPlay } from "./use-offscreen-play";

export type FeatureIcon3DType =
  | "orchestration"
  | "risk"
  | "settlement"
  | "intelligence";

const BRAND = "#00D4C8";
const TEAL = "#14B8A6";

function GlassBody() {
  return (
    <meshPhysicalMaterial
      color="#0c3d38"
      emissive={BRAND}
      emissiveIntensity={0.1}
      transparent
      opacity={0.25}
      roughness={0.14}
      metalness={0.08}
      transmission={0.55}
      thickness={0.4}
      ior={1.42}
      depthWrite={false}
    />
  );
}

function NeonEdges({ geometry }: { geometry: THREE.BufferGeometry }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);
  useEffect(() => () => edges.dispose(), [edges]);

  return (
    <lineSegments geometry={edges} frustumCulled={false}>
      <lineBasicMaterial color={TEAL} transparent opacity={0.9} />
    </lineSegments>
  );
}

function OrchestrationMark() {
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useEffect(() => () => box.dispose(), [box]);

  return (
    <group>
      <mesh geometry={box} frustumCulled={false}>
        <GlassBody />
      </mesh>
      <NeonEdges geometry={box} />
      <group rotation={[0.52, 0.64, 0.18]} scale={0.52}>
        <mesh geometry={box} frustumCulled={false}>
          <GlassBody />
        </mesh>
        <NeonEdges geometry={box} />
      </group>
    </group>
  );
}

function RiskMark() {
  const geo = useMemo(() => new THREE.OctahedronGeometry(0.78, 0), []);
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group scale={[0.92, 1.12, 0.92]}>
      <mesh geometry={geo} frustumCulled={false}>
        <GlassBody />
      </mesh>
      <NeonEdges geometry={geo} />
    </group>
  );
}

function IntelligenceMark() {
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.72, 0), []);
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group>
      <mesh geometry={geo} frustumCulled={false}>
        <GlassBody />
      </mesh>
      <NeonEdges geometry={geo} />
    </group>
  );
}

function SettlementMark() {
  const geo = useMemo(
    () => new THREE.CylinderGeometry(0.28, 0.58, 0.88, 4, 1),
    []
  );
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <group rotation={[0, Math.PI / 4, 0]}>
      <mesh geometry={geo} frustumCulled={false}>
        <GlassBody />
      </mesh>
      <NeonEdges geometry={geo} />
    </group>
  );
}

function FeatureMark({ type }: { type: FeatureIcon3DType }) {
  if (type === "risk") return <RiskMark />;
  if (type === "settlement") return <SettlementMark />;
  if (type === "intelligence") return <IntelligenceMark />;
  return <OrchestrationMark />;
}

function Scene({
  type,
  reduced,
}: {
  type: FeatureIcon3DType;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (reduced || !group.current) return;
    group.current.rotation.y += dt * 0.22;
    group.current.rotation.x = 0.32 + Math.sin(group.current.rotation.y) * 0.04;
  });

  return (
    <>
      <ambientLight intensity={0.5} color="#c8fff8" />
      <directionalLight position={[3.2, 4.2, 2.4]} intensity={0.95} color="#e7fffb" />
      <group ref={group} rotation={[0.32, 0.55, 0]}>
        <FeatureMark type={type} />
      </group>
    </>
  );
}

export function FeatureIcon3D({
  type,
  className,
}: {
  type: FeatureIcon3DType;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { play, reduced } = useOffscreenPlay(wrapRef);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={cn("relative size-10 shrink-0", className)}
    >
      <Canvas
        frameloop={play ? "always" : "demand"}
        dpr={[1, 1.5]}
        camera={{ position: [1.72, 1.28, 1.72], fov: 34, near: 0.1, far: 20 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        }}
        onCreated={({ gl, camera, invalidate }) => {
          gl.setClearColor(0x000000, 0);
          camera.lookAt(0, 0, 0);
          invalidate();
        }}
        style={{ pointerEvents: "none", background: "transparent" }}
      >
        <Scene type={type} reduced={reduced} />
      </Canvas>
    </div>
  );
}
