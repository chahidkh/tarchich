import { Environment, Html, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type SceneTheme = "gold" | "parchment";
type Destination = "/store" | "/gazette" | "/majlis" | "/diwan";

type Props = {
  theme: SceneTheme;
  onFirstFrame: () => void;
  onFailure: () => void;
};

const DESTINATIONS: Array<{
  label: string;
  to: Destination;
  position: [number, number, number];
}> = [
  { label: "المتجر", to: "/store", position: [-6.15, 2.75, -5.2] },
  { label: "الجريدة", to: "/gazette", position: [6.15, 2.75, -5.2] },
  { label: "المجلس الثقافي", to: "/majlis", position: [-3.1, 2.2, -8.65] },
  { label: "الديوان", to: "/diwan", position: [3.1, 2.2, -8.65] },
];

const BOOK_COLORS = ["#713b2c", "#23473f", "#87632c", "#39314b", "#6e5128"];

function createStoneTexture(theme: SceneTheme) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = theme === "gold" ? "#34271d" : "#bca982";
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) {
    ctx.strokeStyle = theme === "gold" ? "rgba(218,171,83,.08)" : "rgba(68,46,27,.10)";
    ctx.beginPath();
    ctx.moveTo(0, y + ((y / 16) % 2) * 2);
    ctx.lineTo(128, y);
    ctx.stroke();
  }
  for (let i = 0; i < 90; i += 1) {
    const shade = (i * 37) % 255;
    ctx.fillStyle = `rgba(${shade},${Math.floor(shade * 0.75)},${Math.floor(shade * 0.4)},.035)`;
    ctx.fillRect((i * 47) % 128, (i * 71) % 128, 1 + (i % 3), 1 + ((i + 1) % 3));
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function BookInstances({ theme }: { theme: SceneTheme }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    let index = 0;
    for (const side of [-1, 1]) {
      for (let shelf = 0; shelf < 4; shelf += 1) {
        for (let book = 0; book < 15; book += 1) {
          const width = 0.13 + ((book * 7 + shelf) % 4) * 0.025;
          const height = 0.62 + ((book * 3 + shelf) % 5) * 0.055;
          dummy.position.set(side * (5.35 + (book % 2) * 0.015), 1.2 + shelf * 1.18 + height / 2, -7.75 + book * 0.39);
          dummy.scale.set(side * width, height, 0.27);
          dummy.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          dummy.updateMatrix();
          mesh.setMatrixAt(index, dummy.matrix);
          mesh.setColorAt(index, new THREE.Color(BOOK_COLORS[(book + shelf * 2) % BOOK_COLORS.length]));
          index += 1;
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [theme]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 120]} castShadow={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors roughness={0.72} metalness={0.05} />
    </instancedMesh>
  );
}

function Shelves({ theme }: { theme: SceneTheme }) {
  const wood = theme === "gold" ? "#4a2f1d" : "#765239";
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 5.5, 0, -4.95]}>
          <mesh position={[0, 3.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 5.8, 6.9]} />
            <meshStandardMaterial color={wood} roughness={0.8} />
          </mesh>
          {[0.95, 2.15, 3.35, 4.55, 5.65].map((y) => (
            <mesh key={y} position={[side * -0.25, y, 0]} castShadow>
              <boxGeometry args={[0.78, 0.13, 7]} />
              <meshStandardMaterial color={wood} roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
      <BookInstances theme={theme} />
    </>
  );
}

function Archway({ x, theme }: { x: number; theme: SceneTheme }) {
  const stone = theme === "gold" ? "#5b4934" : "#b7a37b";
  return (
    <group position={[x, 0, -9.2]}>
      <mesh position={[-1.15, 2.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 4.5, 0.7]} />
        <meshStandardMaterial color={stone} roughness={0.92} />
      </mesh>
      <mesh position={[1.15, 2.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 4.5, 0.7]} />
        <meshStandardMaterial color={stone} roughness={0.92} />
      </mesh>
      <mesh position={[0, 4.45, 0]} rotation-z={Math.PI / 2} castShadow>
        <torusGeometry args={[1.17, 0.3, 8, 24, Math.PI]} />
        <meshStandardMaterial color={stone} roughness={0.92} />
      </mesh>
    </group>
  );
}

function Candle({ position }: { position: [number, number, number] }) {
  const flame = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const wave = Math.sin(clock.elapsedTime * 4.3 + position[0]) * 0.04;
    if (flame.current) flame.current.scale.y += ((1 + wave) - flame.current.scale.y) * Math.min(1, dt * 8);
    if (light.current) light.current.intensity = 11 + wave * 14;
  });
  return (
    <group position={position}>
      <mesh position-y={0.18}>
        <cylinderGeometry args={[0.07, 0.09, 0.36, 10]} />
        <meshStandardMaterial color="#dfcda8" roughness={0.9} />
      </mesh>
      <mesh ref={flame} position-y={0.48}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshBasicMaterial color="#ffd27a" />
      </mesh>
      <pointLight ref={light} color="#ffad55" intensity={11} distance={5.5} decay={2} position-y={0.5} />
    </group>
  );
}

function GoldenDust({ count = 85 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      values[i * 3] = ((i * 47) % 101) / 101 * 13 - 6.5;
      values[i * 3 + 1] = 0.5 + (((i * 61) % 97) / 97) * 6;
      values[i * 3 + 2] = -10 + (((i * 29) % 89) / 89) * 11;
    }
    return values;
  }, [count]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    if (points.current) points.current.rotation.y += dt * 0.018;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e6ba62" size={0.035} transparent opacity={0.52} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Hotspot({ label, to, position }: (typeof DESTINATIONS)[number]) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const group = useRef<THREE.Group>(null);
  const scaleTarget = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.1 + position[0]) * 0.045;
    const target = (hovered ? 1.18 : 1) * pulse;
    scaleTarget.setScalar(target);
    if (group.current) group.current.scale.lerp(scaleTarget, 1 - Math.exp(-8 * dt));
  });

  const go = () => void navigate({ to });
  return (
    <group ref={group} position={position}>
      <mesh
        onClick={(event) => { event.stopPropagation(); go(); }}
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <cylinderGeometry args={[0.42, 0.55, 0.18, 20]} />
        <meshStandardMaterial color="#8d682d" emissive="#e5ad43" emissiveIntensity={hovered ? 2.4 : 1.15} roughness={0.42} />
      </mesh>
      <pointLight color="#ffc96d" intensity={hovered ? 16 : 8} distance={3.6} decay={2} position-y={0.25} />
      <Html position={[0, 0.64, 0]} center distanceFactor={8} zIndexRange={[15, 5]}>
        <button
          type="button"
          onClick={go}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          className="whitespace-nowrap rounded-full border border-gold/45 bg-background/85 px-3 py-1 font-kufi text-[11px] text-gold shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
        >
          {label}
        </button>
      </Html>
    </group>
  );
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const sent = useRef(false);
  useFrame(() => {
    if (sent.current) return;
    sent.current = true;
    onReady();
  });
  return null;
}

function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    const narrow = size.width / Math.max(size.height, 1) < 0.72;
    perspective.position.set(0, narrow ? 3.5 : 3.3, narrow ? 15.2 : 10.8);
    perspective.fov = narrow ? 52 : 47;
    perspective.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function LibraryWorld({ theme, onReady }: { theme: SceneTheme; onReady: () => void }) {
  const stoneTexture = useMemo(() => createStoneTexture(theme), [theme]);
  useEffect(() => () => stoneTexture?.dispose(), [stoneTexture]);
  const background = theme === "gold" ? "#17100c" : "#756548";
  const floor = theme === "gold" ? "#2a2017" : "#9f8b66";

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 10, 25]} />
      <ambientLight intensity={theme === "gold" ? 1.25 : 1.55} color={theme === "gold" ? "#cf9d72" : "#f0dec2"} />
      <directionalLight position={[1, 9, 4]} intensity={2.6} color="#efc77c" />
      <Environment resolution={64}>
        <Lightformer intensity={3.4} color="#d8a552" position={[0, 6, 3]} scale={[7, 2, 1]} />
        <Lightformer intensity={1.35} color="#8ea59a" position={[-6, 2, -2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>

      <mesh rotation-x={-Math.PI / 2} position-y={0} receiveShadow>
        <planeGeometry args={[20, 25]} />
        <meshStandardMaterial map={stoneTexture} color={floor} roughness={0.95} />
      </mesh>
      <mesh position={[0, 4, -10]} receiveShadow>
        <boxGeometry args={[16, 8, 0.45]} />
        <meshStandardMaterial map={stoneTexture} color={floor} roughness={0.98} />
      </mesh>

      {[-6.7, 6.7].map((x) => (
        <group key={x} position={[x, 0, -2]}>
          <mesh position-y={3.1} castShadow>
            <cylinderGeometry args={[0.48, 0.62, 6.2, 12]} />
            <meshStandardMaterial map={stoneTexture} color={floor} roughness={0.94} />
          </mesh>
          <mesh position-y={6.22} castShadow>
            <cylinderGeometry args={[0.72, 0.72, 0.24, 12]} />
            <meshStandardMaterial color="#85642f" roughness={0.7} />
          </mesh>
        </group>
      ))}
      <Archway x={-3.1} theme={theme} />
      <Archway x={3.1} theme={theme} />
      <Shelves theme={theme} />
      <Candle position={[-4.1, 0.2, -1.3]} />
      <Candle position={[4.1, 0.2, -1.3]} />
      <Candle position={[0, 0.2, -6.7]} />
      <GoldenDust />
      {DESTINATIONS.map((destination) => <Hotspot key={destination.to} {...destination} />)}
      <ResponsiveCamera />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.075}
        target={[0, 2.65, -5.6]}
        minAzimuthAngle={-0.32}
        maxAzimuthAngle={0.32}
        minPolarAngle={1.17}
        maxPolarAngle={1.48}
        rotateSpeed={0.36}
      />
      <FirstFrame onReady={onReady} />
    </>
  );
}

export default function HomeLibraryScene({ theme, onFirstFrame, onFailure }: Props) {
  const [active, setActive] = useState(true);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), { threshold: 0.02 });
    observer.observe(element);
    const onVisibility = () => setActive(document.visibilityState === "visible" && element.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      document.body.style.cursor = "default";
    };
  }, []);

  return (
    <div ref={wrapper} className="absolute inset-0 touch-pan-y" aria-label="مشهد تفاعلي لمكتبة تراثية">
      <Canvas
        dpr={[1, 1.35]}
        frameloop={active ? "always" : "never"}
        camera={{ position: [0, 3.3, 10.8], fov: 47, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: true }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          canvas.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            onFailure();
          }, { once: true });
        }}
        fallback={null}
      >
        <LibraryWorld theme={theme} onReady={onFirstFrame} />
      </Canvas>
    </div>
  );
}