"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

const BRAND = "#00D4C8";
const TEAL = "#14B8A6";
const NX = 5;
const NZ = 5;
const SPACING = 1.22;
const LAYERS = [-0.9, 0.9] as const;

function latticeCoord(i: number, n: number) {
  return (i - (n - 1) / 2) * SPACING;
}

function buildLattice() {
  const nodes: [number, number, number][] = [];
  const segments: number[] = [];

  const pushLine = (
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number
  ) => {
    segments.push(ax, ay, az, bx, by, bz);
  };

  for (const y of LAYERS) {
    for (let i = 0; i < NX; i++) {
      for (let k = 0; k < NZ; k++) {
        nodes.push([latticeCoord(i, NX), y, latticeCoord(k, NZ)]);
      }
    }
    for (let i = 0; i < NX; i++) {
      const x = latticeCoord(i, NX);
      pushLine(
        x,
        y,
        latticeCoord(0, NZ),
        x,
        y,
        latticeCoord(NZ - 1, NZ)
      );
    }
    for (let k = 0; k < NZ; k++) {
      const z = latticeCoord(k, NZ);
      pushLine(
        latticeCoord(0, NX),
        y,
        z,
        latticeCoord(NX - 1, NX),
        y,
        z
      );
    }
  }

  for (let i = 0; i < NX; i++) {
    for (let k = 0; k < NZ; k++) {
      if ((i + k) % 2 !== 0) continue;
      const x = latticeCoord(i, NX);
      const z = latticeCoord(k, NZ);
      pushLine(x, LAYERS[0], z, x, LAYERS[1], z);
    }
  }

  const canisters: { position: [number, number, number]; scale: number; spin: number }[] =
    [
      { position: [0, LAYERS[1], 0], scale: 0.52, spin: 0.12 },
      {
        position: [latticeCoord(1, NX), LAYERS[1], latticeCoord(1, NZ)],
        scale: 0.32,
        spin: 0.09,
      },
      {
        position: [latticeCoord(1, NX), LAYERS[1], latticeCoord(3, NZ)],
        scale: 0.3,
        spin: 0.11,
      },
      {
        position: [latticeCoord(3, NX), LAYERS[1], latticeCoord(1, NZ)],
        scale: 0.3,
        spin: 0.1,
      },
      {
        position: [latticeCoord(3, NX), LAYERS[1], latticeCoord(3, NZ)],
        scale: 0.32,
        spin: 0.08,
      },
    ];

  const paths: { a: [number, number, number]; b: [number, number, number]; speed: number; offset: number }[] =
    [
      {
        a: [latticeCoord(0, NX), LAYERS[1], latticeCoord(2, NZ)],
        b: [latticeCoord(4, NX), LAYERS[1], latticeCoord(2, NZ)],
        speed: 0.07,
        offset: 0,
      },
      {
        a: [latticeCoord(2, NX), LAYERS[1], latticeCoord(0, NZ)],
        b: [latticeCoord(2, NX), LAYERS[1], latticeCoord(4, NZ)],
        speed: 0.065,
        offset: 0.35,
      },
      {
        a: [latticeCoord(0, NX), LAYERS[0], latticeCoord(0, NZ)],
        b: [latticeCoord(4, NX), LAYERS[0], latticeCoord(0, NZ)],
        speed: 0.055,
        offset: 0.18,
      },
      {
        a: [latticeCoord(4, NX), LAYERS[0], latticeCoord(4, NZ)],
        b: [latticeCoord(0, NX), LAYERS[0], latticeCoord(4, NZ)],
        speed: 0.06,
        offset: 0.62,
      },
      {
        a: [latticeCoord(2, NX), LAYERS[0], latticeCoord(2, NZ)],
        b: [latticeCoord(2, NX), LAYERS[1], latticeCoord(2, NZ)],
        speed: 0.08,
        offset: 0.1,
      },
      {
        a: [latticeCoord(0, NX), LAYERS[0], latticeCoord(2, NZ)],
        b: [latticeCoord(0, NX), LAYERS[1], latticeCoord(2, NZ)],
        speed: 0.07,
        offset: 0.48,
      },
      {
        a: [latticeCoord(4, NX), LAYERS[1], latticeCoord(0, NZ)],
        b: [latticeCoord(4, NX), LAYERS[0], latticeCoord(0, NZ)],
        speed: 0.075,
        offset: 0.72,
      },
      {
        a: [latticeCoord(1, NX), LAYERS[1], latticeCoord(0, NZ)],
        b: [latticeCoord(1, NX), LAYERS[1], latticeCoord(4, NZ)],
        speed: 0.05,
        offset: 0.22,
      },
    ];

  return { nodes, segments, canisters, paths };
}

const LATTICE = buildLattice();

function GridLines() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(LATTICE.segments, 3)
    );
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        color={BRAND}
        transparent
        opacity={0.28}
        depthWrite={false}
      />
    </lineSegments>
  );
}

function Nodes() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    for (const target of [mesh.current, glow.current]) {
      if (!target) continue;
      LATTICE.nodes.forEach((p, i) => {
        dummy.position.set(p[0], p[1], p[2]);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        target.setMatrixAt(i, dummy.matrix);
      });
      target.instanceMatrix.needsUpdate = true;
    }
  }, [dummy]);

  return (
    <group>
      <instancedMesh
        ref={glow}
        args={[undefined, undefined, LATTICE.nodes.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshBasicMaterial
          color={BRAND}
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, LATTICE.nodes.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.038, 10, 10]} />
        <meshBasicMaterial color={BRAND} />
      </instancedMesh>
    </group>
  );
}

function Canister({
  position,
  scale,
  spin,
  phase,
  box,
  edges,
  plane,
}: {
  position: [number, number, number];
  scale: number;
  spin: number;
  phase: number;
  box: THREE.BoxGeometry;
  edges: THREE.EdgesGeometry;
  plane: THREE.PlaneGeometry;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += dt * spin;
    g.position.y =
      position[1] + Math.sin(clock.elapsedTime * 0.45 + phase) * 0.035;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh geometry={box} frustumCulled={false}>
        <meshPhysicalMaterial
          color="#0c3d38"
          emissive={BRAND}
          emissiveIntensity={0.1}
          transparent
          opacity={0.18}
          roughness={0.16}
          metalness={0.08}
          transmission={0.42}
          thickness={0.4}
          ior={1.42}
          depthWrite={false}
        />
      </mesh>
      <mesh
        geometry={plane}
        position={[0.501, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        frustumCulled={false}
      >
        <meshPhysicalMaterial
          color="#083833"
          emissive={TEAL}
          emissiveIntensity={0.2}
          transparent
          opacity={0.25}
          roughness={0.06}
          metalness={0.06}
          transmission={0.68}
          thickness={0.38}
          ior={1.45}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        geometry={plane}
        position={[0, 0, 0.501]}
        frustumCulled={false}
      >
        <meshPhysicalMaterial
          color="#0a4540"
          emissive={TEAL}
          emissiveIntensity={0.16}
          transparent
          opacity={0.25}
          roughness={0.08}
          metalness={0.05}
          transmission={0.62}
          thickness={0.36}
          ior={1.45}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        geometry={box}
        scale={[1.001, 1.001, 1.001]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          color={TEAL}
          transparent
          opacity={0.08}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      <lineSegments geometry={edges} frustumCulled={false}>
        <lineBasicMaterial color={TEAL} transparent opacity={0.92} />
      </lineSegments>
    </group>
  );
}

function Canisters({ reduced }: { reduced: boolean }) {
  const { box, edges, plane } = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const edges = new THREE.EdgesGeometry(box);
    const plane = new THREE.PlaneGeometry(1, 1);
    return { box, edges, plane };
  }, []);

  useEffect(
    () => () => {
      box.dispose();
      edges.dispose();
      plane.dispose();
    },
    [box, edges, plane]
  );

  return (
    <>
      {LATTICE.canisters.map((c, i) => (
        <Canister
          key={i}
          position={c.position}
          scale={c.scale}
          spin={reduced ? 0 : c.spin}
          phase={i * 0.9}
          box={box}
          edges={edges}
          plane={plane}
        />
      ))}
    </>
  );
}

const TRAIL = 6;
const TRAIL_STEP = 0.006;

function Packets() {
  const head = useRef<THREE.InstancedMesh>(null);
  const trail = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const trailCount = LATTICE.paths.length * TRAIL;

  useFrame(({ clock }) => {
    const headMesh = head.current;
    const trailMesh = trail.current;
    const glowMesh = glow.current;
    if (!headMesh || !trailMesh || !glowMesh) return;
    const t = clock.elapsedTime;

    LATTICE.paths.forEach((path, i) => {
      const u = (t * path.speed + path.offset) % 1;
      a.set(path.a[0], path.a[1], path.a[2]);
      b.set(path.b[0], path.b[1], path.b[2]);
      dir.subVectors(b, a);
      if (dir.lengthSq() < 1e-8) dir.set(0, 1, 0);
      else dir.normalize();

      dummy.position.lerpVectors(a, b, u);
      dummy.quaternion.identity();
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      headMesh.setMatrixAt(i, dummy.matrix);

      dummy.scale.setScalar(1.7);
      dummy.updateMatrix();
      glowMesh.setMatrixAt(i, dummy.matrix);

      for (let s = 0; s < TRAIL; s++) {
        const fade = 1 - s / TRAIL;
        const tu = (u - s * TRAIL_STEP + 1) % 1;
        dummy.position.lerpVectors(a, b, tu);
        look.copy(dummy.position).add(dir);
        dummy.lookAt(look);
        dummy.scale.set(
          0.07 + fade * 0.14,
          0.07 + fade * 0.14,
          0.35 + fade * 0.55
        );
        dummy.updateMatrix();
        trailMesh.setMatrixAt(i * TRAIL + s, dummy.matrix);
      }
    });

    headMesh.instanceMatrix.needsUpdate = true;
    glowMesh.instanceMatrix.needsUpdate = true;
    trailMesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={trail}
        args={[undefined, undefined, trailCount]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.028, 6, 6]} />
        <meshBasicMaterial
          color={BRAND}
          transparent
          opacity={0.14}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={glow}
        args={[undefined, undefined, LATTICE.paths.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshBasicMaterial
          color={BRAND}
          transparent
          opacity={0.1}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={head}
        args={[undefined, undefined, LATTICE.paths.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshBasicMaterial color={BRAND} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function Scene({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0.12, 0);
  }, [camera]);

  useFrame((_, dt) => {
    if (reduced || !group.current) return;
    group.current.rotation.y += dt * 0.026;
  });

  return (
    <group ref={group} rotation={[0.18, 0.62, 0]}>
      <ambientLight intensity={0.45} color="#c8fff8" />
      <directionalLight
        position={[4.5, 7, 3.5]}
        intensity={1.05}
        color="#e7fffb"
      />
      <GridLines />
      <Nodes />
      <Canisters reduced={reduced} />
      <Packets />
    </group>
  );
}

export function HeroNetworkAnimation({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [desktop, setDesktop] = useState(false);
  const [play, setPlay] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncDesktop = () => setDesktop(mq.matches);
    const syncMotion = () => setReduced(motion.matches);
    syncDesktop();
    syncMotion();
    mq.addEventListener("change", syncDesktop);
    motion.addEventListener("change", syncMotion);
    return () => {
      mq.removeEventListener("change", syncDesktop);
      motion.removeEventListener("change", syncMotion);
    };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !desktop) {
      setPlay(false);
      return;
    }

    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio > 0.08;
        setPlay(inView && !reduced && document.visibilityState === "visible");
      },
      { threshold: [0, 0.08, 0.2] }
    );
    io.observe(wrap);

    const onVisibility = () => {
      setPlay(
        inView && !reduced && document.visibilityState === "visible"
      );
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [desktop, reduced]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={cn(
        "relative h-full w-full min-h-[24rem] [mask-image:radial-gradient(ellipse_78%_74%_at_50%_48%,#000_42%,transparent_84%)]",
        className
      )}
    >
      {desktop ? (
        <Canvas
          frameloop={play ? "always" : "demand"}
          dpr={[1, 1.6]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl, invalidate }) => {
            gl.setClearColor(0x000000, 0);
            invalidate();
          }}
          style={{ pointerEvents: "none", background: "transparent" }}
        >
          <PerspectiveCamera
            makeDefault
            position={[7.1, 5.6, 7.1]}
            fov={28}
            near={0.1}
            far={80}
          />
          <Scene reduced={reduced} />
        </Canvas>
      ) : null}
    </div>
  );
}
