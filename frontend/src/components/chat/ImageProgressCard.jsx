import React, { useState, useEffect } from 'react';
import { Sparkles, Palette, Wand2, Image as ImageIcon } from 'lucide-react';

export function ImageProgressCard({ isEnhancing = false }) {
  const [percent, setPercent] = useState(8);
  const [stageIndex, setStageIndex] = useState(0);

  const editStages = [
    '✨ Analyzing photo & composition...',
    '🎨 Enhancing colors, vibrance & dynamic range...',
    '🖌️ Processing high-definition details & textures...',
    '🌟 Polishing resolution and final color grading...',
  ];

  const generateStages = [
    '✨ Interpreting prompt & visual concept...',
    '🎨 Composing layout, atmosphere & studio lighting...',
    '🖌️ Rendering high-definition textures & details...',
    '🌟 Finalizing 1024×1024 resolution output...',
  ];

  const stages = isEnhancing ? editStages : generateStages;

  useEffect(() => {
    // Smooth percentage progression timer simulating realistic AI generation
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 96) return 96; // Hold at 96% until response completes
        const increment = Math.max(1, Math.floor(Math.random() * 8) + 2);
        const next = Math.min(prev + increment, 96);

        // Update stage based on progress
        if (next < 25) setStageIndex(0);
        else if (next < 55) setStageIndex(1);
        else if (next < 80) setStageIndex(2);
        else setStageIndex(3);

        return next;
      });
    }, 450);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="animate-fade-in"
      style={{
        margin: '16px 0',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
        boxShadow: 'var(--shadow-sm), 0 0 20px rgba(99, 102, 241, 0.1)',
        overflow: 'hidden',
        maxWidth: '520px',
        position: 'relative',
      }}
    >
      {/* Aspect Ratio Canvas Shimmer Placeholder */}
      <div
        style={{
          height: '240px',
          width: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Pulsating Aurora Glow Circles in background */}
        <div
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%)',
            animation: 'pulseGlow 2.5s infinite ease-in-out',
          }}
        />

        {/* Shimmer sweep effect */}
        <div className="nc-shimmer-sweep" />

        {/* Center Wand / Sparkle Icon */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'grid',
            placeItems: 'center',
            color: '#ffffff',
            boxShadow: '0 0 24px rgba(99, 102, 241, 0.6)',
            marginBottom: '16px',
            zIndex: 2,
            animation: 'bounceSlow 2s infinite ease-in-out',
          }}
        >
          {isEnhancing ? <Wand2 size={24} /> : <Sparkles size={24} />}
        </div>

        {/* Live Percentage Display */}
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: '#ffffff',
            letterSpacing: '1px',
            zIndex: 2,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          {percent}%
        </div>

        {/* Current Stage Label */}
        <div
          style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.85)',
            marginTop: '6px',
            zIndex: 2,
            fontWeight: 500,
            textAlign: 'center',
            padding: '0 16px',
            transition: 'all 0.3s ease',
          }}
        >
          {stages[stageIndex]}
        </div>
      </div>

      {/* Bottom Animated Progress Bar */}
      <div
        style={{
          height: '6px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
            transition: 'width 0.4s cubic-bezier(0.2, 0, 0, 1)',
            boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)',
          }}
        />
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(0.9); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .nc-shimmer-sweep {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: sweep 2s infinite linear;
        }
        @keyframes sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

