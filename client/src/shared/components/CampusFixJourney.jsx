import { useEffect, useRef, useState } from 'react';
import './CampusFixJourney.css';

const STAGES = [
  { number: '01', title: 'Report an Issue', label: 'REPORT AN ISSUE', accent: '#f4a9d3', progress: 2, desktopAnchor: 20 },
  { number: '02', title: 'Understand the Problem', label: 'UNDERSTAND THE PROBLEM', accent: '#dab5ff', progress: 21, desktopAnchor: 9 },
  { number: '03', title: 'Find the Right Team', label: 'FIND THE RIGHT TEAM', accent: '#caa2f8', progress: 40, desktopAnchor: 19 },
  { number: '04', title: 'Set Priority', label: 'SET PRIORITY', accent: '#ffc1cf', progress: 61, desktopAnchor: 78 },
  { number: '05', title: 'Resolve the Issue', label: 'RESOLVE THE ISSUE', accent: '#e3b8f7', progress: 80, desktopAnchor: 89 },
  { number: '06', title: 'Track the Resolution', label: 'TRACK THE RESOLUTION', accent: '#f1add2', progress: 100, desktopAnchor: 78 },
];

const DESKTOP_NODES = [
  { x: 13, y: 20 }, { x: 48.5, y: 9 }, { x: 84, y: 19 },
  { x: 84, y: 78 }, { x: 48.5, y: 89 }, { x: 13, y: 78 },
];
const MOBILE_NODES = [
  { x: 25, y: 8 }, { x: 75, y: 23 }, { x: 25, y: 39 },
  { x: 75, y: 55 }, { x: 25, y: 71 }, { x: 75, y: 87 },
];
const DESKTOP_PATH = 'M 130 152 C 235 89 360 65 485 68 C 615 72 756 103 840 145 C 905 203 905 510 840 592 C 744 644 617 685 485 680 C 352 675 222 640 130 593';
const MOBILE_PATH = 'M 250 61 C 415 62 593 151 750 175 C 817 199 399 264 250 296 C 357 332 631 395 750 418 C 818 447 401 517 250 540 C 363 582 598 647 750 661';
const REPORT_EXAMPLE = "The washrooms of Block 5 Men's Hostel, 6th Floor, B Wing are dirty.";

function StageIllustration({ index }) {
  if (index === 0) {
    return <>
      <blockquote className="cf-journey__quote">“{REPORT_EXAMPLE}”</blockquote>
      <div className="cf-journey__chips" aria-label="A report can include"><span>Natural language</span><span>Optional photo</span><span>Problem location</span></div>
    </>;
  }

  if (index === 1) {
    return <div className="cf-journey__understanding">
      <div><span>PROBLEM</span><strong>Washrooms are dirty</strong></div>
      <div className="cf-journey__understanding-rule" aria-hidden="true" />
      <div><span>LOCATION</span><strong>Block 5 · Men's Hostel<br />6th Floor · B Wing</strong></div>
    </div>;
  }

  if (index === 2) {
    return <div className="cf-journey__team">
      <span className="cf-journey__team-mark" aria-hidden="true"><i /><i /><i /></span>
      <div><span>THE TEAM TO HELP</span><strong>Housekeeping &amp; Hygiene</strong></div>
    </div>;
  }

  if (index === 3) {
    return <div className="cf-journey__priority">
      <span className="cf-journey__priority-orbit" aria-hidden="true"><i /></span>
      <div><span>PRIORITY</span><strong>High</strong></div>
      <span className="cf-journey__priority-word">Needs attention</span>
    </div>;
  }

  if (index === 4) {
    return <div className="cf-journey__working">
      <div className="cf-journey__working-head"><span>Housekeeping &amp; Hygiene</span><span className="cf-journey__working-live"><i /> IN PROGRESS</span></div>
      <div className="cf-journey__working-line" aria-hidden="true"><i /></div>
      <strong>Working on the issue</strong>
    </div>;
  }

  return <ol className="cf-journey__timeline" aria-label="Example report progress">
    <li className="is-complete"><span className="cf-journey__timeline-dot" /> <strong>Received</strong><small>Your report is recorded</small></li>
    <li className="is-complete"><span className="cf-journey__timeline-dot" /> <strong>Assigned</strong><small>The right team is notified</small></li>
    <li className="is-current"><span className="cf-journey__timeline-dot" /> <strong>In Progress</strong><small>The team is working on it</small></li>
    <li><span className="cf-journey__timeline-dot" /> <strong>Resolved</strong><small>The issue is fixed</small></li>
  </ol>;
}

function JourneyPath({ path, variant, visible, progress }) {
  return <svg className={`cf-journey__svg cf-journey__svg--${variant}`} viewBox="0 0 1000 760" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path className="cf-journey__path-base" pathLength="100" d={path} style={{ strokeDashoffset: visible ? 0 : 100 }} />
    <path className="cf-journey__path-energy" d={path} />
    <path className="cf-journey__path-active" pathLength="100" d={path} style={{ strokeDashoffset: visible ? 100 - progress : 100 }} />
  </svg>;
}

export default function CampusFixJourney() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const revealRef = useRef(null);
  const activeStage = STAGES[activeIndex];

  useEffect(() => {
    const element = revealRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={revealRef} className={`cf-journey${isVisible ? ' is-visible' : ''}${hasInteracted ? ' has-interacted' : ''}`}>
    <div className="cf-journey__composition">
      <div className="cf-journey__visual">
        <div className="cf-journey__visual-label"><span className="cf-journey__label-orbit" aria-hidden="true" /> THE CAMPUSFIX JOURNEY</div>
        <div className="cf-journey__diagram" role="group" aria-label="Select a stage to follow the report">
          <JourneyPath path={DESKTOP_PATH} variant="desktop" visible={isVisible} progress={activeStage.progress} />
          <JourneyPath path={MOBILE_PATH} variant="mobile" visible={isVisible} progress={activeStage.progress} />
          {STAGES.map((stage, index) => {
            const desktop = DESKTOP_NODES[index];
            const mobile = MOBILE_NODES[index];
            return <button
              type="button"
              key={stage.number}
              className={`cf-journey__stage${index === activeIndex ? ' is-active' : ''}`}
              style={{
                '--node-x': `${desktop.x}%`,
                '--node-y': `${desktop.y}%`,
                '--node-mobile-x': `${mobile.x}%`,
                '--node-mobile-y': `${mobile.y}%`,
                '--node-index': index,
                '--stage-accent': stage.accent,
              }}
              aria-pressed={index === activeIndex}
              onClick={() => { setActiveIndex(index); setHasInteracted(true); }}
            >
              <span className="cf-journey__stage-number">{stage.number}</span>
              <span className="cf-journey__stage-label">{stage.label}</span>
            </button>;
          })}
        </div>
        <p className="cf-journey__instruction">Choose any moment to see how the same report moves forward.</p>
      </div>

      <aside className="cf-journey__story" style={{ '--story-anchor': `${activeStage.desktopAnchor}%`, '--stage-accent': activeStage.accent }} aria-label="Selected journey stage">
        <div key={activeStage.number} className="cf-journey__story-content" aria-live="polite" aria-atomic="true">
          <div className="cf-journey__story-kicker"><span>{activeStage.number}</span><i /> ONE REPORT · SIX MOMENTS</div>
          <h3>{activeStage.title}</h3>
          <p className="cf-journey__story-copy">{[
            'Tell CampusFix what happened in your own words.',
            'CampusFix understands what the student is describing and identifies where the problem is.',
            'The complaint is sent to the team responsible for solving that kind of problem.',
            'Important issues can be identified and brought to attention quickly.',
            'The concerned team takes action and updates the complaint as work progresses.',
            'Students can see what is happening to their complaint instead of wondering what happened after submitting it.',
          ][activeIndex]}</p>
          <StageIllustration index={activeIndex} />
          <div className="cf-journey__story-footer"><span>THE SAME REPORT, EVERY STEP</span><span>{activeStage.number} / 06</span></div>
        </div>
      </aside>
    </div>
  </div>;
}
