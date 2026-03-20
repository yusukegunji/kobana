"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

// === カラー定数（カジノ/ビリヤードホール） ===
const FELT_GREEN = "#1a6b3c";
const FELT_GREEN_DARK = "#0f4a28";
const WOOD_DARK = "#3d2414";
const WOOD_MID = "#5c3a1e";
const WOOD_LIGHT = "#7a4f2b";
const LEATHER_BROWN = "#4a2c17";
const LEATHER_DARK = "#2e1a0e";
const BRASS = "#b8860b";
const BRASS_LIGHT = "#d4a843";
const WARM_LIGHT = "#ffcf87";

// --- ビリヤードテーブル天面（フェルト） ---
function BilliardTable() {
  return (
    <group position={[0, -1.8, -2]}>
      {/* フェルト面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial
          color={FELT_GREEN}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* テーブルの木枠 - 上下左右 */}
      {/* 上枠 */}
      <mesh position={[0, -0.1, -2.7]}>
        <boxGeometry args={[8.8, 0.4, 0.6]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.4} metalness={0.1} />
      </mesh>
      {/* 下枠 */}
      <mesh position={[0, -0.1, 2.7]}>
        <boxGeometry args={[8.8, 0.4, 0.6]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.4} metalness={0.1} />
      </mesh>
      {/* 左枠 */}
      <mesh position={[-4.4, -0.1, 0]}>
        <boxGeometry args={[0.6, 0.4, 6]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.4} metalness={0.1} />
      </mesh>
      {/* 右枠 */}
      <mesh position={[4.4, -0.1, 0]}>
        <boxGeometry args={[0.6, 0.4, 6]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* 四隅のポケット */}
      {[
        [-3.8, -2.3],
        [3.8, -2.3],
        [-3.8, 2.3],
        [3.8, 2.3],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.35, 16]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
      ))}

      {/* サイドポケット */}
      {[
        [0, -2.3],
        [0, 2.3],
      ].map(([x, z], i) => (
        <mesh key={`side-${i}`} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 16]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
      ))}

      {/* クッション（レール）- 内側の緑 */}
      {/* 上クッション */}
      <mesh position={[0, 0.05, -2.35]}>
        <boxGeometry args={[7.4, 0.15, 0.15]} />
        <meshStandardMaterial color={FELT_GREEN_DARK} roughness={0.8} />
      </mesh>
      {/* 下クッション */}
      <mesh position={[0, 0.05, 2.35]}>
        <boxGeometry args={[7.4, 0.15, 0.15]} />
        <meshStandardMaterial color={FELT_GREEN_DARK} roughness={0.8} />
      </mesh>
      {/* 左クッション */}
      <mesh position={[-4.05, 0.05, 0]}>
        <boxGeometry args={[0.15, 0.15, 4.4]} />
        <meshStandardMaterial color={FELT_GREEN_DARK} roughness={0.8} />
      </mesh>
      {/* 右クッション */}
      <mesh position={[4.05, 0.05, 0]}>
        <boxGeometry args={[0.15, 0.15, 4.4]} />
        <meshStandardMaterial color={FELT_GREEN_DARK} roughness={0.8} />
      </mesh>

      {/* テーブル脚 */}
      {[
        [-3.8, -2.2],
        [3.8, -2.2],
        [-3.8, 2.2],
        [3.8, 2.2],
      ].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, -1.2, z]}>
          <cylinderGeometry args={[0.15, 0.18, 2.2, 8]} />
          <meshStandardMaterial color={WOOD_MID} roughness={0.3} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

// --- 椅子（バースツール風） ---
function Chair({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 座面（革） */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.38, 0.12, 16]} />
        <meshStandardMaterial color={LEATHER_BROWN} roughness={0.6} metalness={0.05} />
      </mesh>
      {/* 座面クッション上面 */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.02, 16]} />
        <meshStandardMaterial color={LEATHER_DARK} roughness={0.7} />
      </mesh>
      {/* 背もたれ */}
      <mesh position={[0, 0.55, -0.3]}>
        <boxGeometry args={[0.6, 0.8, 0.08]} />
        <meshStandardMaterial color={LEATHER_BROWN} roughness={0.6} metalness={0.05} />
      </mesh>
      {/* 背もたれフレーム上部 */}
      <mesh position={[0, 1, -0.3]}>
        <boxGeometry args={[0.65, 0.08, 0.12]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.3} />
      </mesh>
      {/* 脚（4本） */}
      {[
        [0.2, 0.2],
        [-0.2, 0.2],
        [0.2, -0.2],
        [-0.2, -0.2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.8, z]}>
          <cylinderGeometry args={[0.04, 0.05, 1.5, 6]} />
          <meshStandardMaterial color={WOOD_MID} roughness={0.35} metalness={0.05} />
        </mesh>
      ))}
      {/* 足置きリング */}
      <mesh position={[0, -0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.02, 8, 16]} />
        <meshStandardMaterial color={BRASS} roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}

// --- 吊り下げペンダントライト ---
function PendantLight({
  position,
  color = WARM_LIGHT,
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      {/* コード */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 3, 4]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>
      {/* シェード（逆円錐） */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.6, 0.4, 16, 1, true]} />
        <meshStandardMaterial
          color={BRASS}
          roughness={0.25}
          metalness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* シェード内側（光が当たる） */}
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.55, 0.35, 16, 1, true]} />
        <meshStandardMaterial
          color={BRASS_LIGHT}
          emissive={WARM_LIGHT}
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.6}
          side={THREE.BackSide}
        />
      </mesh>
      {/* 電球 */}
      <mesh position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          emissive={color}
          emissiveIntensity={2}
          color={color}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* ポイントライト */}
      <pointLight
        position={[0, -0.3, 0]}
        color={color}
        intensity={15}
        distance={12}
        decay={2}
        castShadow={false}
      />
    </group>
  );
}

// --- 壁面 ---
function Walls() {
  return (
    <group>
      {/* 奥の壁 */}
      <mesh position={[0, 2, -8]}>
        <planeGeometry args={[24, 10]} />
        <meshStandardMaterial color="#2e2018" roughness={0.9} />
      </mesh>
      {/* 壁面の木製パネル腰壁 */}
      <mesh position={[0, -0.5, -7.9]}>
        <planeGeometry args={[24, 5]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* 左の壁 */}
      <mesh position={[-10, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#2e2018" roughness={0.9} />
      </mesh>
      {/* 右の壁 */}
      <mesh position={[10, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#2e2018" roughness={0.9} />
      </mesh>
      {/* 床 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.3, 0]}>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial color="#2a1c10" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* 天井 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.5, 0]}>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial color="#1a1208" roughness={0.95} />
      </mesh>
    </group>
  );
}


// --- メインシーン ---
function Scene() {
  return (
    <>
      {/* 環境光 */}
      <ambientLight intensity={0.25} color="#ffecd2" />

      {/* ペンダントライト（テーブル上を照らす） */}
      <PendantLight position={[-1.5, 3.5, -2]} />
      <PendantLight position={[1.5, 3.5, -2]} />

      {/* 壁面の間接照明 */}
      <pointLight position={[-8, 3, -5]} color="#ff9b50" intensity={6} distance={18} />
      <pointLight position={[8, 3, -5]} color="#ff9b50" intensity={6} distance={18} />
      <pointLight position={[0, 4, -7]} color="#ffcf87" intensity={4} distance={14} />
      {/* 手前からの補助光 */}
      <pointLight position={[0, 3, 5]} color="#ffecd2" intensity={3} distance={15} />

      {/* 壁面 */}
      <Walls />

      {/* ビリヤードテーブル */}
      <BilliardTable />

      {/* 椅子（テーブル周り） */}
      {/* 手前側 */}
      <Chair position={[-2.5, -1.5, 2]} rotation={Math.PI} />
      <Chair position={[0, -1.5, 2.5]} rotation={Math.PI} />
      <Chair position={[2.5, -1.5, 2]} rotation={Math.PI} />
      {/* 奥側 */}
      <Chair position={[-2.5, -1.5, -5.5]} rotation={0} />
      <Chair position={[2.5, -1.5, -5.5]} rotation={0} />
      {/* 左側 */}
      <Chair position={[-6, -1.5, -1]} rotation={Math.PI / 2} />
      <Chair position={[-6, -1.5, -3]} rotation={Math.PI / 2} />
      {/* 右側 */}
      <Chair position={[6, -1.5, -1]} rotation={-Math.PI / 2} />
      <Chair position={[6, -1.5, -3]} rotation={-Math.PI / 2} />

    </>
  );
}

export function StageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 3.5, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "#1a1208" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
