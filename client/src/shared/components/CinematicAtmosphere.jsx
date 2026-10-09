import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SoftAurora from '../../components/react-bits/SoftAurora';
import Strands from '../../components/react-bits/Strands';
import SplashCursor from '../../components/react-bits/SplashCursor';
import Dock from '../../components/react-bits/Dock';
import { FileTextIcon, ListIcon, PlusCircleIcon } from '../../student-portal/components/Icons';
import './CinematicAtmosphere.css';

export function CinematicAtmosphere({ children, showDock = false, showCursor = false, mouseInteraction = true, ambientEffects = true, variant = 'violet', className = '' }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync(); query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);
  const items = [
    { label: 'Home', icon: <FileTextIcon size={20} />, onClick: () => { window.location.href = '/'; } },
    { label: 'Report Issue', icon: <PlusCircleIcon size={20} />, onClick: () => { window.location.href = '/complaints/new'; } },
    { label: 'My Complaints', icon: <ListIcon size={20} />, onClick: () => { window.location.href = '/complaints'; } },
    { label: 'Profile', icon: <FileTextIcon size={20} />, onClick: () => { window.location.href = '/dashboard'; } },
  ];
  return <div className={`cinematic-shell cinematic-shell--${variant} ${className}`}>
    <div className="cinematic-stage" aria-hidden="true">
      {!reduced && ambientEffects && <SoftAurora speed={0.32} scale={1.6} brightness={0.75} color1="#F5D0FE" color2="#C084FC" noiseFrequency={2.2} noiseAmplitude={0.9} bandHeight={0.48} bandSpread={1.15} octaveDecay={0.12} layerOffset={1.2} colorSpeed={0.35} enableMouseInteraction={mouseInteraction} mouseInfluence={0.16} />}
      {!reduced && ambientEffects && <Strands colors={['#FF6FAE', '#C084FC', '#8B5CF6', '#F5D0FE']} count={4} speed={0.28} amplitude={1.15} waviness={1.15} thickness={0.65} glow={2.2} taper={2.5} spread={1.15} intensity={0.55} saturation={1.15} opacity={0.8} scale={1.35} glass={false} />}
      <div className="cinematic-vignette" />
      {showCursor && !reduced && <SplashCursor SIM_RESOLUTION={64} DYE_RESOLUTION={720} TRANSPARENT RAINBOW_MODE={true} COLOR="#C084FC" SPLAT_FORCE={1800} SPLAT_RADIUS={0.12} />}
    </div>
    <div className="cinematic-content">{children}</div>
    {showDock && <div className="portal-dock"><Dock items={items} magnification={62} distance={160} panelHeight={62} dockHeight={180} baseItemSize={46} /></div>}
  </div>;
}

export function FlowLine({ className = '' }) { return <span className={`flow-line ${className}`} aria-hidden="true"><i /><i /><i /></span>; }

export function BrandMark() { return <Link to="/" className="cinematic-brand"><span className="cinematic-brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false"><defs><linearGradient id="campusFixMarkGradient" x1="6" y1="5" x2="26" y2="27" gradientUnits="userSpaceOnUse"><stop stopColor="#ffd0e6" /><stop offset="0.48" stopColor="#d8b4ff" /><stop offset="1" stopColor="#a78bfa" /></linearGradient></defs><path className="cinematic-brand-c" d="M24.2 10.1A9.8 9.8 0 1 0 24.2 21.9" /><path className="cinematic-brand-check" d="m9.2 16.5 4.1 4.1 9.7-10.2" /></svg></span><span>Campus<span>Fix</span></span></Link>; }
