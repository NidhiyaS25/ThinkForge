'use client';

import React, { useEffect, useState } from 'react';

interface SparkParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  distance: number;
}

interface SparkEffectProps {
  x: number;
  y: number;
  active: boolean;
  onComplete?: () => void;
  count?: number;
}

const SPARK_COLORS = ['#64D8B8', '#2DD4BF', '#FBBF24', '#38BDF8', '#FFFFFF', '#34D399'];

export const SparkEffect: React.FC<SparkEffectProps> = ({
  x,
  y,
  active,
  onComplete,
  count = 10
}) => {
  const [particles, setParticles] = useState<SparkParticle[]>([]);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      setAnimating(false);
      return;
    }

    const generated: SparkParticle[] = Array.from({ length: count }, (_, i) => {
      const angle = (i * (360 / count) + Math.random() * 20) * (Math.PI / 180);
      const distance = 24 + Math.random() * 28;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: SPARK_COLORS[i % SPARK_COLORS.length],
        size: 3 + Math.random() * 3.5,
        angle,
        distance
      };
    });

    setParticles(generated);
    setAnimating(true);

    const timer = setTimeout(() => {
      setAnimating(false);
      if (onComplete) onComplete();
    }, 850);

    return () => clearTimeout(timer);
  }, [active, count, onComplete]);

  if (!animating || particles.length === 0) return null;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="pointer-events-none select-none"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Central Flash Burst */}
      <circle
        r="12"
        fill="#64D8B8"
        opacity="0.8"
        className="animate-ping"
      />

      {/* Orbiting Star Particles */}
      {particles.map((p) => (
        <g
          key={p.id}
          style={{
            transform: `translate(${p.x}px, ${p.y}px)`,
            transition: 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1), opacity 750ms ease-out',
            opacity: animating ? 1 : 0
          }}
        >
          {/* Star Polygon Shape */}
          <polygon
            points="0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2"
            fill={p.color}
            transform={`scale(${p.size / 3})`}
            filter="drop-shadow(0px 0px 2px rgba(255,255,255,0.8))"
          />
        </g>
      ))}
    </g>
  );
};
