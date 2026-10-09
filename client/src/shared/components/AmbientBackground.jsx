// =============================================================
// CampusFix - Ambient Living Background Component
// =============================================================
// Multi-layered environmental background with deep aurora fields,
// soft radial illumination, organic noise grain, and gentle parallax.
// Zero runtime dependencies.
// =============================================================

import { useEffect, useRef } from 'react';
import './AmbientBackground.css';

export default function AmbientBackground() {
  const rootRef = useRef(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let rafId = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e) => {
      // Normalize mouse coordinates (-1 to 1) from window center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      targetX = (e.clientX - centerX) / centerX;
      targetY = (e.clientY - centerY) / centerY;
    };

    const updateParallax = () => {
      // Smooth interpolation for calm, fluid lag
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;

      if (rootRef.current) {
        rootRef.current.style.setProperty('--mouse-x', currentX.toFixed(4));
        rootRef.current.style.setProperty('--mouse-y', currentY.toFixed(4));
      }

      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="cf-ambient-root" ref={rootRef} aria-hidden="true">
      {/* Top soft radial spotlight */}
      <div className="cf-ambient-spotlight" />

      {/* Layer of deep, slow aurora gradient fields */}
      <div className="cf-ambient-mesh">
        <div className="cf-aurora-orb cf-aurora-1" />
        <div className="cf-aurora-orb cf-aurora-2" />
        <div className="cf-aurora-orb cf-aurora-3" />
      </div>

      {/* Sparse ambient particles */}
      <div className="cf-particles-field">
        <span className="cf-mote" />
        <span className="cf-mote" />
        <span className="cf-mote" />
        <span className="cf-mote" />
        <span className="cf-mote" />
        <span className="cf-mote" />
        <span className="cf-mote" />
        <span className="cf-mote" />
      </div>

      {/* Fine tactile noise texture */}
      <div className="cf-ambient-noise" />
    </div>
  );
}
