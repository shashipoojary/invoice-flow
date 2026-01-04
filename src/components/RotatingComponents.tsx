'use client';

import React, { useState, useEffect } from 'react';

// Constants for animation timing
const ANIMATION_DURATION = 400; // ms
const ROTATION_INTERVAL = 2000; // ms

// Check if user prefers reduced motion
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

// Type definitions
export type RotationState = { currentIndex: number; isAnimating: boolean };

// Shared rotation hook for synchronized rotation between badges and breakdowns
export function useSynchronizedRotation(itemCount: number, enabled: boolean = true): RotationState {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Don't animate if only one item, disabled, or user prefers reduced motion
    if (itemCount <= 1 || !enabled || prefersReducedMotion) {
      // Clear any existing intervals/timeouts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Clear any existing intervals/timeouts before setting new ones
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      
      setIsAnimating(true);
      
      // After animation completes, update index and reset animation state
      timeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        setCurrentIndex((prev) => (prev + 1) % itemCount);
        setIsAnimating(false);
      }, ANIMATION_DURATION);
    }, ROTATION_INTERVAL);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [itemCount, enabled]);

  return { currentIndex, isAnimating };
}

// Memoized function to find widest badge for placeholder
const findWidestBadge = (badges: React.ReactNode[]): React.ReactNode => {
  return badges.find(b => {
    try {
      const badgeText = (b as any)?.props?.children?.find?.((c: any) => typeof c === 'string') || '';
      return badgeText.includes('Partial Payment') || badgeText.includes('Failed');
    } catch {
      return false;
    }
  }) || badges[0];
};

// Rotating Badge Component - Production-grade smooth slide animation
export const RotatingBadges = React.memo(({ badges, rotationState }: { badges: React.ReactNode[]; rotationState: RotationState }) => {
  const { currentIndex, isAnimating } = rotationState;
  const nextBadgeRef = React.useRef<HTMLDivElement>(null);
  const rafIdRef = React.useRef<number | null>(null);

  // Animate next badge sliding up from below
  React.useEffect(() => {
    if (!isAnimating || !nextBadgeRef.current) return;

    // Cleanup any pending animation frames
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Force the next badge to start from below, then animate up
    rafIdRef.current = requestAnimationFrame(() => {
      if (nextBadgeRef.current) {
        nextBadgeRef.current.style.transform = 'translateY(100%)';
        rafIdRef.current = requestAnimationFrame(() => {
          if (nextBadgeRef.current) {
            nextBadgeRef.current.style.transform = 'translateY(0)';
          }
        });
      }
    });

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isAnimating]);

  // Memoize computed values
  const nextIndex = React.useMemo(() => (currentIndex + 1) % badges.length, [currentIndex, badges.length]);
  const widestBadge = React.useMemo(() => findWidestBadge(badges), [badges]);

  // Early returns
  if (badges.length === 0) return null;
  if (badges.length === 1) return <>{badges[0]}</>;

  const transitionStyle = isAnimating 
    ? `transform ${ANIMATION_DURATION}ms ease-in-out` 
    : 'none';

  return (
    <div 
      className="relative inline-flex items-center overflow-hidden" 
      style={{ height: '28px', position: 'relative' }}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Current badge - always rendered, transforms based on animation state */}
      <div
        key={`badge-${currentIndex}`}
        style={{ 
          position: 'absolute',
          whiteSpace: 'nowrap',
          transform: isAnimating ? 'translateY(100%)' : 'translateY(0)',
          transition: transitionStyle,
          willChange: isAnimating ? 'transform' : 'auto',
        }}
      >
        {badges[currentIndex]}
      </div>
      {/* Next badge - only rendered when animating, slides up from below */}
      {isAnimating && (
        <div
          ref={nextBadgeRef}
          key={`badge-in-${nextIndex}`}
          style={{ 
            position: 'absolute',
            whiteSpace: 'nowrap',
            transform: 'translateY(100%)',
            transition: `transform ${ANIMATION_DURATION}ms ease-in-out`,
            willChange: 'transform',
          }}
        >
          {badges[nextIndex]}
        </div>
      )}
      {/* Invisible placeholder to maintain size and prevent layout shift */}
      <div 
        className="invisible" 
        style={{ 
          whiteSpace: 'nowrap', 
          display: 'inline-block', 
          height: 0, 
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {widestBadge}
      </div>
    </div>
  );
});

RotatingBadges.displayName = 'RotatingBadges';

// Rotating Amount Breakdown Component - Instant swap, no transitions
export const RotatingAmountBreakdown = React.memo(({ breakdowns, rotationState }: { breakdowns: React.ReactNode[]; rotationState: RotationState }) => {
  const { currentIndex, isAnimating } = rotationState;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [displayIndex, setDisplayIndex] = React.useState(currentIndex);

  // Instant swap - no animation, just immediate change
  React.useEffect(() => {
    if (!isAnimating) {
      // When not animating, immediately update to current index
      setDisplayIndex(currentIndex);
      return;
    }

    // When animation starts, immediately swap to next index (instant, no transition)
    const nextIndex = (currentIndex + 1) % breakdowns.length;
    setDisplayIndex(nextIndex);
  }, [currentIndex, isAnimating, breakdowns.length]);

  // Memoize computed values
  const currentBreakdown = React.useMemo(() => breakdowns[displayIndex], [breakdowns, displayIndex]);

  // Early returns
  if (breakdowns.length === 0) return null;
  if (breakdowns.length === 1) return <>{breakdowns[0]}</>;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden" 
      style={{ height: '16px' }}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Current breakdown - always rendered, instant swap with no transitions */}
      <div
        key={`breakdown-${displayIndex}`}
        style={{ 
          position: 'absolute',
          width: '100%',
          transform: 'translateY(0)',
          transition: 'none', // No transition for instant swap
          willChange: 'auto',
        }}
      >
        {currentBreakdown}
      </div>
      {/* Invisible placeholder to maintain size and prevent layout shift */}
      <div 
        className="invisible" 
        style={{ 
          width: '100%', 
          height: 0, 
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {currentBreakdown}
      </div>
    </div>
  );
});

RotatingAmountBreakdown.displayName = 'RotatingAmountBreakdown';

