"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- 定数 ---
const FILLER_LABELS = ["?", "★", "♪", "◆", "▲", "♠", "♥", "☆"];

const FACE_COLORS = [
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f97316", // orange
  "#14b8a6", // teal
  "#ec4899", // pink
];

function padToOcta(names: string[]): string[] {
  if (names.length >= 8) return names.slice(0, 8);
  const padded = [...names];
  let fi = 0;
  while (padded.length < 8) {
    padded.push(FILLER_LABELS[fi % FILLER_LABELS.length]);
    fi++;
  }
  return padded;
}

// --- 各面にテキストを描画したテクスチャを生成 ---
function createFaceTexture(
  text: string,
  bgColor: string,
  isFiller: boolean
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // 背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // 光沢グラデーション
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "rgba(255,255,255,0.35)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.05)");
  grad.addColorStop(1, "rgba(0,0,0,0.15)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // 縁線
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, size - 16, size - 16);

  // テキスト（縦書き）
  ctx.fillStyle = isFiller ? "rgba(100,100,100,0.4)" : "rgba(50,40,30,0.9)";
  if (!isFiller && text.length >= 2) {
    // 名前は縦書き表示
    const chars = text.split("");
    const fontSize = Math.min(48, 180 / chars.length);
    ctx.font = `900 ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const totalHeight = chars.length * fontSize * 1.1;
    const startY = (size - totalHeight) / 2 + fontSize / 2;
    chars.forEach((char, ci) => {
      ctx.fillText(char, size / 2, startY + ci * fontSize * 1.1);
    });
  } else {
    // フィラーや1文字は従来通り中央表示
    const fontSize = Math.min(72, 200 / Math.max(text.length, 1));
    ctx.font = `900 ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// --- 正八面体の各面にテクスチャを貼るためのUVマッピング ---
// OctahedronGeometry の face 順序に基づいて個別テクスチャを適用
function OctahedronWithTextures({
  textures,
  rolling,
  resultIndex,
}: {
  textures: THREE.CanvasTexture[];
  rolling: boolean;
  resultIndex: number | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(new THREE.Euler(-0.3, 0.4, 0));
  const currentVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const rollingPhase = useRef<"idle" | "spinning" | "settling">("idle");
  const settleStart = useRef(0);

  // 正八面体の各面の法線方向（結果表示用）
  const faceNormals = useMemo(() => {
    const geo = new THREE.OctahedronGeometry(1);
    const normals: THREE.Vector3[] = [];
    const posAttr = geo.attributes.position;
    for (let fi = 0; fi < 8; fi++) {
      const i = fi * 3;
      const a = new THREE.Vector3(
        posAttr.getX(i),
        posAttr.getY(i),
        posAttr.getZ(i)
      );
      const b = new THREE.Vector3(
        posAttr.getX(i + 1),
        posAttr.getY(i + 1),
        posAttr.getZ(i + 1)
      );
      const c = new THREE.Vector3(
        posAttr.getX(i + 2),
        posAttr.getY(i + 2),
        posAttr.getZ(i + 2)
      );
      const normal = new THREE.Vector3()
        .crossVectors(b.clone().sub(a), c.clone().sub(a))
        .normalize();
      normals.push(normal);
    }
    geo.dispose();
    return normals;
  }, []);

  // 指定面をカメラ方向に向ける回転を計算
  const getTargetQuaternion = useCallback(
    (faceIdx: number) => {
      const normal = faceNormals[faceIdx];
      const q = new THREE.Quaternion();
      // 法線を+Z方向に向ける回転
      q.setFromUnitVectors(normal, new THREE.Vector3(0, 0, 1));
      return new THREE.Euler().setFromQuaternion(q);
    },
    [faceNormals]
  );

  useEffect(() => {
    if (rolling) {
      rollingPhase.current = "spinning";
      // ランダムな回転速度
      currentVelocity.current.set(
        (Math.random() - 0.5) * 12 + 6,
        (Math.random() - 0.5) * 12 + 6,
        (Math.random() - 0.5) * 4
      );
    }
  }, [rolling]);

  useEffect(() => {
    if (!rolling && resultIndex !== null && rollingPhase.current === "spinning") {
      rollingPhase.current = "settling";
      settleStart.current = 0;
      targetRotation.current = getTargetQuaternion(resultIndex);
    }
  }, [rolling, resultIndex, getTargetQuaternion]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    if (rollingPhase.current === "spinning") {
      // 高速回転
      groupRef.current.rotation.x += currentVelocity.current.x * dt;
      groupRef.current.rotation.y += currentVelocity.current.y * dt;
      groupRef.current.rotation.z += currentVelocity.current.z * dt;
      // 少しずつ減速
      currentVelocity.current.multiplyScalar(0.995);
    } else if (rollingPhase.current === "settling") {
      settleStart.current += dt;
      // 最初の0.5秒は減速しながら回転を続け、その後ターゲットに収束
      if (settleStart.current < 0.5) {
        const decay = Math.max(0, 1 - settleStart.current * 2);
        groupRef.current.rotation.x +=
          currentVelocity.current.x * dt * decay;
        groupRef.current.rotation.y +=
          currentVelocity.current.y * dt * decay;
        groupRef.current.rotation.z +=
          currentVelocity.current.z * dt * decay;
      } else {
        // ターゲットに向けてスムーズに収束
        const t = Math.min((settleStart.current - 0.5) / 1.2, 1);
        const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          targetRotation.current.x,
          ease * 0.08
        );
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotation.current.y,
          ease * 0.08
        );
        groupRef.current.rotation.z = THREE.MathUtils.lerp(
          groupRef.current.rotation.z,
          targetRotation.current.z,
          ease * 0.08
        );
        if (t >= 1) {
          rollingPhase.current = "idle";
        }
      }
    } else {
      // アイドル: 軽くホバー
      groupRef.current.rotation.y += dt * 0.15;
    }
  });

  // 8面分のメッシュを生成（各面に個別マテリアル）
  const faceMeshes = useMemo(() => {
    const geo = new THREE.OctahedronGeometry(1);
    const posAttr = geo.attributes.position;
    const meshes: {
      positions: Float32Array;
      uvs: Float32Array;
    }[] = [];

    for (let fi = 0; fi < 8; fi++) {
      const i = fi * 3;
      const positions = new Float32Array(9);
      for (let v = 0; v < 3; v++) {
        positions[v * 3] = posAttr.getX(i + v);
        positions[v * 3 + 1] = posAttr.getY(i + v);
        positions[v * 3 + 2] = posAttr.getZ(i + v);
      }
      // UV: 三角形を正方形テクスチャの中央に配置
      const uvs = new Float32Array([0.5, 1, 0, 0, 1, 0]);
      meshes.push({ positions, uvs });
    }

    geo.dispose();
    return meshes;
  }, []);

  return (
    <group ref={groupRef} scale={1.3}>
      {faceMeshes.map((face, i) => (
        <mesh key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[face.positions, 3]}
            />
            <bufferAttribute
              attach="attributes-uv"
              args={[face.uvs, 2]}
            />
          </bufferGeometry>
          <meshStandardMaterial
            map={textures[i]}
            roughness={0.3}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* エッジライン */}
      <lineSegments>
        <edgesGeometry
          args={[new THREE.OctahedronGeometry(1)]}
        />
        <lineBasicMaterial color="#ffffff" opacity={0.15} transparent />
      </lineSegments>
    </group>
  );
}

// --- メインシーン ---
function DiceScene({
  names,
  rolling,
  resultIndex,
}: {
  names: string[];
  rolling: boolean;
  resultIndex: number | null;
}) {
  const faces = padToOcta(names);

  const textures = useMemo(() => {
    return faces.map((label, i) => {
      const isFiller = i >= names.length;
      const color = isFiller ? "#9ca3af" : FACE_COLORS[i % FACE_COLORS.length];
      return createFaceTexture(label, color, isFiller);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names.join(",")]);

  // テクスチャのクリーンアップ
  useEffect(() => {
    return () => {
      textures.forEach((t) => t.dispose());
    };
  }, [textures]);

  return (
    <>
      <ambientLight intensity={0.6} color="#ffecd2" />
      <directionalLight position={[3, 5, 4]} intensity={1.2} color="#fff5e6" />
      <directionalLight
        position={[-2, 3, -3]}
        intensity={0.4}
        color="#b8860b"
      />
      <pointLight position={[0, 0, 3]} intensity={0.8} color="#ffcf87" />
      <OctahedronWithTextures
        textures={textures}
        rolling={rolling}
        resultIndex={resultIndex}
      />
    </>
  );
}

// --- エクスポート ---
export function Dice3D({
  names,
  rolling,
  resultIndex,
  size = 160,
}: {
  names: string[];
  rolling: boolean;
  resultIndex: number | null;
  size?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: size, height: size }} />;

  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <DiceScene names={names} rolling={rolling} resultIndex={resultIndex} />
      </Canvas>
    </div>
  );
}
