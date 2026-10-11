'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FocusState } from '../types';

interface UseFocusMonitorOptions {
  onViolation?: (violationCount: number, reason: string) => void;
  penaltySeconds?: number;
  enabled?: boolean;
}

export function useFocusMonitor(options: UseFocusMonitorOptions = {}) {
  const { onViolation, enabled = true } = options;

  const [focusState, setFocusState] = useState<FocusState>({
    isActive: true,
    violationCount: 0,
    lastViolationTimestamp: null,
    statusMessage: 'Active (Focus Locked)'
  });

  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const handleViolation = useCallback((reason: string) => {
    if (!enabled) return;

    setFocusState((prev) => {
      const newCount = prev.violationCount + 1;
      const now = Date.now();
      
      // Trigger callback to notify parent or penalty logic
      if (onViolationRef.current) {
        onViolationRef.current(newCount, reason);
      }

      return {
        isActive: false,
        violationCount: newCount,
        lastViolationTimestamp: now,
        statusMessage: `Tab Switched - Warning Logged (${reason})`
      };
    });
  }, [enabled]);

  const handleFocusRestored = useCallback(() => {
    if (!enabled) return;
    setFocusState((prev) => ({
      ...prev,
      isActive: true,
      statusMessage: prev.violationCount > 0 
        ? `Active (${prev.violationCount} Violations Logged)`
        : 'Active (Focus Locked)'
    }));
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Tab Hidden / Switched');
      } else {
        handleFocusRestored();
      }
    };

    const onWindowBlur = () => {
      // Small timeout to avoid false positive when clicking dialogs inside the window
      setTimeout(() => {
        if (!document.hasFocus()) {
          handleViolation('Window Lost Focus');
        }
      }, 100);
    };

    const onWindowFocus = () => {
      handleFocusRestored();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [enabled, handleViolation, handleFocusRestored]);

  const resetViolations = useCallback(() => {
    setFocusState({
      isActive: true,
      violationCount: 0,
      lastViolationTimestamp: null,
      statusMessage: 'Active (Focus Locked)'
    });
  }, []);

  return {
    ...focusState,
    resetViolations
  };
}
