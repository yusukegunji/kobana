"use client";

import { useEffect, useState, useCallback } from "react";

const CONFETTI_COLORS = [
  "#fbbf24", // amber
  "#f59e0b", // amber darker
  "#34d399", // emerald
  "#10b981", // emerald darker
  "#f472b6", // pink
  "#a78bfa", // purple
  "#60a5fa", // blue
  "#fb923c", // orange
  "#facc15", // yellow
  "#ef4444", // red
];

const SHAPES = ["square", "circle", "triangle"] as const;

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
  shape: (typeof SHAPES)[number];
  size: number;
  delay: number;
  duration: number;
  rotation: number;
}

function generateParticles(
  count: number,
  originX: number,
  originY: number
): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 80 + Math.random() * 200;
    return {
      id: i,
      x: originX,
      y: originY,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance - 60,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: 6 + Math.random() * 10,
      delay: Math.random() * 0.15,
      duration: 0.6 + Math.random() * 0.6,
      rotation: Math.random() * 720,
    };
  });
}

function ParticleElement({ particle }: { particle: Particle }) {
  const shapeStyle: React.CSSProperties = {
    position: "absolute",
    left: particle.x,
    top: particle.y,
    width: particle.size,
    height: particle.size,
    backgroundColor:
      particle.shape !== "triangle" ? particle.color : "transparent",
    borderRadius: particle.shape === "circle" ? "50%" : "2px",
    borderLeft:
      particle.shape === "triangle"
        ? `${particle.size / 2}px solid transparent`
        : undefined,
    borderRight:
      particle.shape === "triangle"
        ? `${particle.size / 2}px solid transparent`
        : undefined,
    borderBottom:
      particle.shape === "triangle"
        ? `${particle.size}px solid ${particle.color}`
        : undefined,
    ["--tx" as string]: `${particle.tx}px`,
    ["--ty" as string]: `${particle.ty}px`,
    animation: `confetti-spread ${particle.duration}s ${particle.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
    pointerEvents: "none" as const,
    zIndex: 50,
  };

  return <div style={shapeStyle} />;
}

export function ConfettiBurst({
  trigger,
  originX = 0.5,
  originY = 0.5,
  particleCount = 40,
}: {
  trigger: boolean;
  originX?: number;
  originY?: number;
  particleCount?: number;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    const x =
      typeof window !== "undefined" ? window.innerWidth * originX : 400;
    const y =
      typeof window !== "undefined" ? window.innerHeight * originY : 300;
    setParticles(generateParticles(particleCount, x, y));
    setShow(true);

    const timer = setTimeout(() => {
      setShow(false);
      setParticles([]);
    }, 2000);

    return () => clearTimeout(timer);
  }, [trigger, originX, originY, particleCount]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <ParticleElement key={p.id} particle={p} />
      ))}
    </div>
  );
}
