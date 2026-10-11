'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TimerProps {
  initialSeconds: number;
  complexityDepth?: 'beginner' | 'intermediate' | 'advanced';
  isPaused?: boolean;
  violationCount: number;
  penaltySecondsPerViolation?: number;
  onTimeChange?: (secondsElapsed: number, secondsRemaining: number) => void;
  onTimeExpired?: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  initialSeconds = 420,
  complexityDepth = 'intermediate',
  isPaused = false,
  violationCount = 0,
  penaltySecondsPerViolation = 30,
  onTimeChange,
  onTimeExpired
}) => {
  // Dynamic duration calculation factoring in complexity
  const computedTotalSeconds = Math.max(
    180,
    initialSeconds + (complexityDepth === 'advanced' ? 180 : complexityDepth === 'beginner' ? -120 : 0)
  );

  const [secondsRemaining, setSecondsRemaining] = useState<number>(computedTotalSeconds);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const prevViolationCount = useRef(violationCount);

  // Apply penalty when violationCount increases
  useEffect(() => {
    if (violationCount > prevViolationCount.current) {
      const diff = violationCount - prevViolationCount.current;
      const penalty = diff * penaltySecondsPerViolation;
      setSecondsRemaining((prev) => Math.max(0, prev - penalty));
      prevViolationCount.current = violationCount;
    }
  }, [violationCount, penaltySecondsPerViolation]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onTimeExpired) onTimeExpired();
          return 0;
        }
        return prev - 1;
      });

      setSecondsElapsed((prev) => {
        const next = prev + 1;
        if (onTimeChange) {
          onTimeChange(next, secondsRemaining);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeChange, onTimeExpired, secondsRemaining]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / computedTotalSeconds) * 100));

  // Determine pacing status color
  const isCritical = secondsRemaining <= 60;
  const isWarning = secondsRemaining <= 180;

  return (
    <div className="flex items-center gap-3 bg-white/90 backdrop-blur border border-slate-200/80 rounded-xl px-4 py-2 shadow-sm text-sm">
      <div className="flex items-center gap-2">
        {isCritical ? (
          <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
        ) : (
          <Clock className="w-4 h-4 text-emerald-700" />
        )}
        <div className="flex flex-col">
          <span className="text-[10px] font-medium tracking-wider uppercase text-slate-500">
            Target Pacing ({complexityDepth})
          </span>
          <span
            className={`font-mono text-base font-bold tabular-nums ${
              isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-800'
            }`}
          >
            {formatTime(secondsRemaining)}
          </span>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div
          className={`h-full transition-all duration-500 ${
            isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {violationCount > 0 && (
        <span className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-medium">
          -{violationCount * penaltySecondsPerViolation}s penalty
        </span>
      )}
    </div>
  );
};
