"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, Html, Line, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/layout/page-header";
import { StatList, StatRow } from "@/components/metrics/stat-row";
import { useOffscreenPlay } from "@/components/three/use-offscreen-play";
import type { CanisterInfo, CanisterRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import {
  formatCycles,
  formatMs,
  formatRatio,
  truncatePrincipal,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const BRAND = "#00D4C8";
const TEAL = "#14B8A6";
const CHARCOAL = "#0c3d38";
const FLOOR_Y = -1.42;
const NODE_Y = 0.7;
const SPAN = 2.1;
const TRAIL = 10;
const TRAIL_STEP = 0.011;
const PACKETS_PER_PATH = 2;

type InfraRole = Exclude<CanisterRole, "agent">;

const TOPOLOGY_ROLES: InfraRole[] = [
  "market-data",
  "orchestrator",
  "risk",
  "settlement",
  "treasury",
];

const NODE_INDEX: Record<InfraRole, string> = {
  "market-data": "01",
  orchestrator: "02",
  risk: "03",
  settlement: "04",
  treasury: "05",
};

const LAYOUT: Record<InfraRole, [number, number, number]> = {
  "market-data": [-SPAN, NODE_Y, -SPAN],
  orchestrator: [0, NODE_Y, 0],
  risk: [SPAN, NODE_Y, -SPAN],
  settlement: [SPAN, NODE_Y, SPAN],
  treasury: [-SPAN, NODE_Y, SPAN],
};

const CUBE_GEO = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const CUBE_EDGES = new THREE.EdgesGeometry(CUBE_GEO);

const EDGES: Array<[InfraRole, InfraRole]> = [
  ["market-data", "orchestrator"],
  ["market-data", "risk"],
  ["orchestrator", "risk"],
  ["risk", "settlement"],
  ["orchestrator", "settlement"],
  ["orchestrator", "treasury"],
  ["treasury", "settlement"],
];

const FLAT: Record<InfraRole, { x: string; y: string }> = {
  "market-data": { x: "22%", y: "20%" },
  orchestrator: { x: "50%", y: "50%" },
  risk: { x: "78%", y: "20%" },
  settlement: { x: "78%", y: "80%" },
  treasury: { x: "22%", y: "80%" },
};

/** Outer nodes label outward so the HUD does not cover the cube. */
const HUD_OFFSET: Record<InfraRole, [number, number, number]> = {
  "market-data": [0.12, 0.92, 0],
  orchestrator: [0.12, 0.92, 0],
  risk: [0.12, 0.92, 0],
  settlement: [0.12, 0.92, 0],
  treasury: [0.12, 0.92, 0],
};

function topologyCanisters(canisters: CanisterInfo[]): CanisterInfo[] {
  const byRole = new Map(canisters.map((c) => [c.role, c]));
  return TOPOLOGY_ROLES.map((role) => byRole.get(role)).filter(
    (c): c is CanisterInfo => Boolean(c)
  );
}

function executionStatus(canister: CanisterInfo): {
  label: string;
  tone: "brand" | "gold" | "negative";
} {
  if (canister.runwayDays < 10) {
    return { label: "Cycle pressure", tone: "negative" };
  }
  if (canister.runwayDays < 20) {
    return { label: "Runway watch", tone: "gold" };
  }
  if (canister.latencyMs > 160) {
    return { label: "Latency elevated", tone: "gold" };
  }
  return { label: "Executing", tone: "brand" };
}

function noRaycast() {
  return null;
}

function GlassFaces({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <group>
      <mesh geometry={geometry} scale={0.93} frustumCulled={false}>
        <meshPhysicalMaterial
          color="#0d4540"
          emissive={BRAND}
          emissiveIntensity={0.09}
          transparent
          opacity={0.48}
          roughness={0.2}
          metalness={0.1}
          transmission={0.12}
          thickness={0.42}
          ior={1.4}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={geometry} frustumCulled={false}>
        <meshPhysicalMaterial
          color={CHARCOAL}
          emissive={BRAND}
          emissiveIntensity={0.1}
          transparent
          opacity={0.15}
          roughness={0.08}
          metalness={0.04}
          transmission={0.58}
          thickness={0.5}
          ior={1.45}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function PulseCore({
  selected,
  reduced,
}: {
  selected: boolean;
  reduced: boolean;
}) {
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const pulse = reduced
      ? 1
      : 0.88 + Math.sin(clock.elapsedTime * 2.15) * 0.16;
    core.current?.scale.setScalar(pulse);
    halo.current?.scale.setScalar(pulse * 1.85);
  });

  return (
    <group>
      <mesh ref={halo} frustumCulled={false} raycast={noRaycast}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial
          color={BRAND}
          transparent
          opacity={selected ? 0.16 : 0.1}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={core} frustumCulled={false} raycast={noRaycast}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial
          color={BRAND}
          transparent
          opacity={selected ? 0.95 : 0.72}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function NodeMark({ selected }: { selected: boolean }) {
  return (
    <group rotation={[0.22, Math.PI / 4, 0]}>
      <GlassFaces geometry={CUBE_GEO} />
      <lineSegments geometry={CUBE_EDGES} frustumCulled={false} raycast={noRaycast}>
        <lineBasicMaterial
          color={BRAND}
          transparent
          opacity={selected ? 0.98 : 0.82}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

function NodeHud({
  canister,
  selected,
  onSelect,
}: {
  canister: CanisterInfo;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const role = canister.role as InfraRole;
  const status = executionStatus(canister);
  const slot = TOPOLOGY_ROLES.indexOf(role);
  const zBase = 20 + slot * 8;

  return (
    <Html
      key={canister.id}
      position={HUD_OFFSET[role]}
      sprite
      center
      occlude={false}
      zIndexRange={selected ? [96, 80] : [zBase + 6, zBase]}
      pointerEvents="auto"
    >
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(canister.id);
        }}
        className={cn(
          "block w-[8.5rem] rounded-md px-2 py-1.5 text-left font-mono text-[10px] leading-snug backdrop-blur-sm transition-[border-color,background-color] duration-200",
          selected
            ? "border border-teal-400/80 bg-slate-950/90 shadow-[0_0_0_1px_rgba(45,212,191,0.28)]"
            : "border border-teal-500/30 bg-slate-950/80 hover:border-teal-400/55"
        )}
      >
        <span className="block tracking-wide text-teal-400">
          {NODE_INDEX[role]} • {canister.name}
        </span>
        <span className="mt-0.5 block text-slate-400">
          {truncatePrincipal(canister.id)}
        </span>
        <span className="metric mt-0.5 block text-teal-400">
          {formatCycles(canister.cycleBalance, false)}
        </span>
        <span
          className={cn(
            "mt-0.5 block",
            status.tone === "gold"
              ? "text-gold"
              : status.tone === "negative"
                ? "text-negative"
                : "text-teal-400"
          )}
        >
          {status.label}
        </span>
      </button>
    </Html>
  );
}

function NodePad({
  position,
  selected,
}: {
  position: [number, number, number];
  selected: boolean;
}) {
  const ring = useMemo(() => new THREE.RingGeometry(0.26, 0.32, 48), []);
  const disc = useMemo(() => new THREE.CircleGeometry(0.26, 48), []);
  useEffect(
    () => () => {
      ring.dispose();
      disc.dispose();
    },
    [ring, disc]
  );

  return (
    <group position={[position[0], FLOOR_Y + 0.035, position[2]]}>
      <mesh
        geometry={disc}
        rotation={[-Math.PI / 2, 0, 0]}
        frustumCulled={false}
        raycast={noRaycast}
      >
        <meshPhysicalMaterial
          color="#071614"
          emissive={BRAND}
          emissiveIntensity={selected ? 0.22 : 0.08}
          transparent
          opacity={0.42}
          roughness={0.18}
          metalness={0.12}
          transmission={0.35}
          thickness={0.2}
          depthWrite={false}
        />
      </mesh>
      <mesh
        geometry={ring}
        rotation={[-Math.PI / 2, 0, 0]}
        frustumCulled={false}
        raycast={noRaycast}
      >
        <meshBasicMaterial
          color={BRAND}
          transparent
          opacity={selected ? 0.7 : 0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Risers({ nodes }: { nodes: CanisterInfo[] }) {
  const items = useMemo(
    () =>
      nodes
        .filter((n): n is CanisterInfo & { role: InfraRole } => n.role !== "agent")
        .map((n) => {
          const p = LAYOUT[n.role];
          return {
            id: n.id,
            points: [
              [p[0], FLOOR_Y + 0.04, p[2]] as [number, number, number],
              [p[0], p[1] - 0.28, p[2]] as [number, number, number],
            ],
          };
        }),
    [nodes]
  );

  return (
    <>
      {items.map((item) => (
        <Line
          key={item.id}
          points={item.points}
          color={BRAND}
          lineWidth={0.6}
          transparent
          opacity={0.16}
          dashed
          dashSize={0.08}
          gapSize={0.06}
          raycast={noRaycast}
        />
      ))}
    </>
  );
}

function Pipelines({ nodes }: { nodes: CanisterInfo[] }) {
  const segments = useMemo(() => {
    const byRole = new Map(nodes.map((n) => [n.role, n]));
    return EDGES.filter(([from, to]) => byRole.has(from) && byRole.has(to)).map(
      ([from, to]) => ({
        key: `${from}-${to}`,
        points: [LAYOUT[from], LAYOUT[to]] as [
          [number, number, number],
          [number, number, number],
        ],
      })
    );
  }, [nodes]);

  return (
    <group>
      {segments.map((seg) => (
        <group key={seg.key}>
          <Line
            points={seg.points}
            color={BRAND}
            lineWidth={4.2}
            transparent
            opacity={0.1}
            raycast={noRaycast}
          />
          <Line
            points={seg.points}
            color={BRAND}
            lineWidth={1.2}
            transparent
            opacity={0.62}
            raycast={noRaycast}
          />
        </group>
      ))}
    </group>
  );
}

function Packets({
  nodes,
  reduced,
}: {
  nodes: CanisterInfo[];
  reduced: boolean;
}) {
  const head = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.InstancedMesh>(null);
  const trail = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const va = useMemo(() => new THREE.Vector3(), []);
  const vb = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  const paths = useMemo(() => {
    const byRole = new Map(nodes.map((n) => [n.role, n]));
    return EDGES.filter(([from, to]) => byRole.has(from) && byRole.has(to)).map(
      ([from, to], i) => ({
        a: LAYOUT[from],
        b: LAYOUT[to],
        speed: 0.078 + (i % 3) * 0.01,
        offset: i * 0.11,
      })
    );
  }, [nodes]);

  const packetCount = paths.length * PACKETS_PER_PATH;

  useFrame(({ clock }) => {
    const headMesh = head.current;
    const glowMesh = glow.current;
    const trailMesh = trail.current;
    if (!headMesh || !glowMesh || !trailMesh) return;
    const t = reduced ? 0.42 : clock.elapsedTime;

    paths.forEach((path, i) => {
      va.set(...path.a);
      vb.set(...path.b);
      dir.subVectors(vb, va);
      if (dir.lengthSq() < 1e-8) dir.set(0, 1, 0);
      else dir.normalize();

      for (let p = 0; p < PACKETS_PER_PATH; p++) {
        const slot = i * PACKETS_PER_PATH + p;
        const u = reduced
          ? (0.28 + path.offset + p * 0.42) % 1
          : (t * path.speed + path.offset + p * 0.47) % 1;

        dummy.position.lerpVectors(va, vb, u);
        dummy.quaternion.identity();
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        headMesh.setMatrixAt(slot, dummy.matrix);

        dummy.scale.setScalar(1.85);
        dummy.updateMatrix();
        glowMesh.setMatrixAt(slot, dummy.matrix);

        for (let s = 0; s < TRAIL; s++) {
          const fade = 1 - s / TRAIL;
          const tu = (u - s * TRAIL_STEP + 1) % 1;
          dummy.position.lerpVectors(va, vb, tu);
          look.copy(dummy.position).add(dir);
          dummy.lookAt(look);
          dummy.scale.set(
            0.08 + fade * 0.12,
            0.08 + fade * 0.12,
            0.42 + fade * 0.85
          );
          dummy.updateMatrix();
          trailMesh.setMatrixAt(slot * TRAIL + s, dummy.matrix);
        }
      }
    });

    headMesh.instanceMatrix.needsUpdate = true;
    glowMesh.instanceMatrix.needsUpdate = true;
    trailMesh.instanceMatrix.needsUpdate = true;
  });

  if (paths.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={trail}
        args={[undefined, undefined, packetCount * TRAIL]}
        frustumCulled={false}
        raycast={noRaycast}
      >
        <sphereGeometry args={[0.034, 8, 8]} />
        <meshBasicMaterial
          color={BRAND}
          transparent
          opacity={0.2}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={glow}
        args={[undefined, undefined, packetCount]}
        frustumCulled={false}
        raycast={noRaycast}
      >
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshBasicMaterial
          color={BRAND}
          transparent
          opacity={0.16}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={head}
        args={[undefined, undefined, packetCount]}
        frustumCulled={false}
        raycast={noRaycast}
      >
        <sphereGeometry args={[0.038, 10, 10]} />
        <meshBasicMaterial color={BRAND} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function TechPodium({ onClear }: { onClear: () => void }) {
  const plate = useMemo(() => new THREE.BoxGeometry(7.4, 0.055, 7.4), []);
  const inset = useMemo(() => new THREE.BoxGeometry(6.55, 0.02, 6.55), []);
  const plateEdges = useMemo(() => new THREE.EdgesGeometry(plate), [plate]);
  const insetEdges = useMemo(() => new THREE.EdgesGeometry(inset), [inset]);

  useEffect(
    () => () => {
      plate.dispose();
      inset.dispose();
      plateEdges.dispose();
      insetEdges.dispose();
    },
    [plate, inset, plateEdges, insetEdges]
  );

  return (
    <group position={[0, FLOOR_Y, 0]}>
      <mesh
        geometry={plate}
        position={[0, -0.01, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
      >
        <meshPhysicalMaterial
          color="#071210"
          emissive={TEAL}
          emissiveIntensity={0.06}
          transparent
          opacity={0.55}
          roughness={0.22}
          metalness={0.18}
          transmission={0.22}
          thickness={0.35}
          ior={1.4}
        />
      </mesh>
      <lineSegments geometry={plateEdges} raycast={noRaycast}>
        <lineBasicMaterial
          color={BRAND}
          transparent
          opacity={0.28}
          toneMapped={false}
        />
      </lineSegments>
      <mesh geometry={inset} position={[0, 0.032, 0]} raycast={noRaycast}>
        <meshPhysicalMaterial
          color="#0a1f1c"
          emissive={BRAND}
          emissiveIntensity={0.04}
          transparent
          opacity={0.35}
          roughness={0.12}
          metalness={0.08}
          transmission={0.4}
          thickness={0.18}
          depthWrite={false}
        />
      </mesh>
      <lineSegments geometry={insetEdges} position={[0, 0.032, 0]} raycast={noRaycast}>
        <lineBasicMaterial
          color={TEAL}
          transparent
          opacity={0.18}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

function TechFloor({ onClear }: { onClear: () => void }) {
  return (
    <group>
      <Grid
        position={[0, FLOOR_Y - 0.002, 0]}
        args={[16, 16]}
        cellSize={0.4}
        cellThickness={0.55}
        cellColor="#0d3a36"
        sectionSize={2}
        sectionThickness={1.05}
        sectionColor="#00D4C8"
        fadeDistance={16}
        fadeStrength={1.35}
        infiniteGrid
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
      />
      <TechPodium onClear={onClear} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y + 0.01, 0]}
        raycast={noRaycast}
      >
        <circleGeometry args={[3.15, 64]} />
        <meshBasicMaterial
          color={BRAND}
          transparent
          opacity={0.045}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CanisterNode({
  canister,
  selected,
  reduced,
  onSelect,
}: {
  canister: CanisterInfo;
  selected: boolean;
  reduced: boolean;
  onSelect: (id: string) => void;
}) {
  const role = canister.role as InfraRole;
  const base = LAYOUT[role];

  return (
    <group>
      <NodePad position={base} selected={selected} />
      <group position={base}>
        <mesh
          visible={false}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(canister.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <sphereGeometry args={[0.58, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        <NodeMark selected={selected} />
        <PulseCore selected={selected} reduced={reduced} />
        <NodeHud
          canister={canister}
          selected={selected}
          onSelect={onSelect}
        />
      </group>
    </group>
  );
}

function FocusRig({
  target,
}: {
  target: [number, number, number] | null;
}) {
  const { camera, controls } = useThree();
  const rest = useMemo(() => new THREE.Vector3(0, 0.12, 0), []);
  const goal = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const c = controls as unknown as { target?: THREE.Vector3 } | undefined;
    if (!c?.target) return;
    if (target) goal.set(target[0], target[1] * 0.55, target[2]);
    else goal.copy(rest);
    c.target.lerp(goal, 1 - Math.exp(-dt * 3.2));
    camera.lookAt(c.target);
  });

  return null;
}

function Atmosphere() {
  return (
    <>
      <hemisphereLight args={["#d7fff8", "#061412", 0.42]} />
      <ambientLight intensity={0.22} color="#8fe8de" />
      <directionalLight
        position={[5.2, 7.4, 3.6]}
        intensity={0.92}
        color="#f4fffc"
      />
      <pointLight
        position={[0, FLOOR_Y + 0.42, 0]}
        intensity={0.72}
        distance={8}
        decay={2}
        color={BRAND}
      />
      <pointLight
        position={[2.4, 2.2, 2.4]}
        intensity={0.32}
        distance={8}
        decay={2}
        color={TEAL}
      />
      <spotLight
        position={[0, 6.2, 0]}
        angle={0.58}
        penumbra={0.85}
        intensity={0.32}
        color="#c8fff8"
      />
    </>
  );
}

function Scene({
  nodes,
  selectedId,
  reduced,
  onSelect,
}: {
  nodes: CanisterInfo[];
  selectedId: string | null;
  reduced: boolean;
  onSelect: (id: string | null) => void;
}) {
  const selected = nodes.find((n) => n.id === selectedId);
  const focus =
    selected && selected.role !== "agent" ? LAYOUT[selected.role] : null;

  return (
    <>
      <Atmosphere />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5.6}
        maxDistance={13.5}
        minPolarAngle={Math.PI * 0.26}
        maxPolarAngle={Math.PI * 0.46}
        autoRotate={!selectedId && !reduced}
        autoRotateSpeed={0.28}
      />
      <FocusRig target={focus} />
      <Html position={[0, -8, 0]} pointerEvents="none" style={{ display: "none" }} />
      <TechFloor onClear={() => onSelect(null)} />
      <Risers nodes={nodes} />
      <Pipelines nodes={nodes} />
      <Packets nodes={nodes} reduced={reduced} />
      {nodes.map((node) => (
        <CanisterNode
          key={node.id}
          canister={node}
          selected={node.id === selectedId}
          reduced={reduced}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function InspectPanel({ canister }: { canister: CanisterInfo | null }) {
  if (!canister) {
    return (
      <div className="glass-panel flex h-full min-h-[12rem] flex-col justify-center rounded-xl px-5 py-6">
        <p className="label-micro">Inspect</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Select a canister in the subnet map to read its principal, wasm hash
          and cycle posture.
        </p>
      </div>
    );
  }

  const status = executionStatus(canister);

  return (
    <div className="glass-panel rounded-xl px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-micro">Inspect</p>
          <p className="mt-2 text-base font-medium tracking-[-0.01em] text-foreground">
            <span className="metric mr-2 text-[11px] text-brand">
              {NODE_INDEX[canister.role as InfraRole]}
            </span>
            {canister.name}
          </p>
          <p className="metric mt-1 text-[11px] text-muted-foreground">
            {ROLE_LABELS[canister.role]}
          </p>
        </div>
        <span
          className={cn(
            "mt-1 inline-flex size-2 shrink-0 rounded-full",
            status.tone === "gold"
              ? "bg-gold"
              : status.tone === "negative"
                ? "bg-negative"
                : "bg-brand"
          )}
          aria-hidden
        />
      </div>
      <StatList className="mt-4">
        <StatRow
          label="Canister ID"
          value={
            <span title={canister.id}>{truncatePrincipal(canister.id)}</span>
          }
        />
        <StatRow label="Module hash" value={canister.moduleHash} />
        <StatRow
          label="Cycle balance"
          value={formatCycles(canister.cycleBalance, false)}
          tone="brand"
        />
        <StatRow
          label="Execution"
          value={
            <span
              className={
                status.tone === "gold"
                  ? "text-gold"
                  : status.tone === "negative"
                    ? "text-negative"
                    : "text-brand"
              }
            >
              {status.label}
            </span>
          }
        />
        <StatRow
          label="Runway"
          value={`${formatRatio(canister.runwayDays, 1)}d`}
          tone={canister.runwayDays < 20 ? "negative" : "muted"}
        />
        <StatRow
          label="Latency"
          hint="median"
          value={formatMs(canister.latencyMs)}
          tone="muted"
        />
      </StatList>
      <p className="metric mt-4 break-all text-[11px] leading-relaxed text-muted-foreground">
        {canister.id}
        <span className="mt-1 block">subnet {canister.subnet}</span>
      </p>
    </div>
  );
}

function FlatMap({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: CanisterInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const byRole = new Map(nodes.map((n) => [n.role, n]));

  return (
    <div className="relative aspect-[5/4] w-full min-h-[16rem] overflow-hidden rounded-lg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 212, 200, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 200, 0.08) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        {EDGES.map(([from, to]) => {
          if (!byRole.has(from) || !byRole.has(to)) return null;
          const a = FLAT[from];
          const b = FLAT[to];
          return (
            <g key={`${from}-${to}`}>
              <line
                x1={parseFloat(a.x)}
                y1={parseFloat(a.y)}
                x2={parseFloat(b.x)}
                y2={parseFloat(b.y)}
                stroke={BRAND}
                strokeOpacity={0.12}
                strokeWidth={1.4}
              />
              <line
                x1={parseFloat(a.x)}
                y1={parseFloat(a.y)}
                x2={parseFloat(b.x)}
                y2={parseFloat(b.y)}
                stroke={BRAND}
                strokeOpacity={0.42}
                strokeWidth={0.45}
              />
            </g>
          );
        })}
      </svg>
      {nodes.map((node) => {
        const pos = FLAT[node.role as InfraRole];
        const active = node.id === selectedId;
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelect(node.id)}
            style={{ left: pos.x, top: pos.y }}
            className={cn(
              "absolute min-h-11 -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-left backdrop-blur-md transition-colors",
              active
                ? "border-brand/40 bg-brand/10"
                : "border-edge/80 bg-surface/70 hover:border-edge-strong"
            )}
          >
            <span className="metric block text-[10px] text-brand">
              {NODE_INDEX[node.role as InfraRole]}
            </span>
            <span className="mt-0.5 block text-[12px] text-foreground">{node.name}</span>
            <span className="metric mt-0.5 block text-[10px] text-muted-foreground">
              {truncatePrincipal(node.id)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SubnetCanisterNetworkMap({
  canisters,
}: {
  canisters: CanisterInfo[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodes = useMemo(() => topologyCanisters(canisters), [canisters]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [desktop, setDesktop] = useState(false);
  const { play, reduced } = useOffscreenPlay(wrapRef, 0.1);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <Card className="min-w-0 overflow-hidden p-4 sm:p-6 lg:p-7">
      <SectionHeading
        eyebrow="Subnet topology"
        title="Canister network"
        description="Orchestrator, market data, risk, settlement and treasury on the application subnet. Packets follow live evaluation paths. Click a node to inspect the running module."
      />

      <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_18.5rem] lg:items-stretch">
        <div
          ref={wrapRef}
          className="relative min-h-[18rem] overflow-hidden rounded-xl border border-edge/80 bg-[#0a0b0f]/70 sm:min-h-[22rem] lg:min-h-[30rem]"
        >
          {desktop ? (
            <Canvas
              frameloop={play ? "always" : "demand"}
              dpr={[1, 1.6]}
              camera={{
                position: [6.9, 5.15, 7.35],
                fov: 30,
                near: 0.1,
                far: 80,
              }}
              gl={{
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
              }}
              onCreated={({ gl, camera, invalidate }) => {
                gl.setClearColor(0x000000, 0);
                camera.lookAt(0, 0.12, 0);
                invalidate();
              }}
              onPointerMissed={() => setSelectedId(null)}
              className="cursor-grab active:cursor-grabbing"
            >
              <Scene
                nodes={nodes}
                selectedId={selectedId}
                reduced={reduced}
                onSelect={setSelectedId}
              />
            </Canvas>
          ) : (
            <div className="p-4 sm:p-5">
              <FlatMap
                nodes={nodes}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          )}
        </div>

        <InspectPanel canister={selected} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {nodes.map((node) => {
          const active = node.id === selectedId;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelectedId(node.id)}
              className={cn(
                "min-h-9 rounded-md border px-2.5 text-[12px] transition-colors",
                active
                  ? "border-brand/40 bg-brand/10 text-foreground"
                  : "border-edge text-muted-foreground hover:border-edge-strong hover:text-foreground"
              )}
            >
              <span className="metric mr-1.5 text-[10px] text-brand">
                {NODE_INDEX[node.role as InfraRole]}
              </span>
              {node.name}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
