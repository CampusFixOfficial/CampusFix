import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CinematicAtmosphere, BrandMark } from './CinematicAtmosphere';
import BlurText from '../../components/react-bits/BlurText';
import GradientText from '../../components/react-bits/GradientText';
import ParticleText from '../../components/react-bits/ParticleText';
import SpecularButton from '../../components/react-bits/SpecularButton';
import ScrollReveal from '../../components/react-bits/ScrollReveal';
import GradualBlur from '../../components/react-bits/GradualBlur';
import FlexCarousel from '../../components/react-bits/FlexCarousel';
import CampusFixJourney from './CampusFixJourney';
import PlatformFeedback from './PlatformFeedback';
import './Landing.css';

const palette = ['#FF8FB3', '#C084FC', '#F5D0FE', '#A78BFA', '#FF8FB3'];
const campusTeams = [
  {
    src: '/assets/campus-departments/hygiene.jpeg',
    alt: 'Housekeeping staff cleaning a campus facility',
    title: 'Clean campus spaces',
    subtitle: 'Housekeeping & Hygiene',
    description: 'Washrooms, sanitation, waste, cleanliness and pest concerns.',
    placeholderColor: '#563466',
    illustration: 'washroom',
    aspect: 4 / 3
  },
  {
    src: '/assets/campus-departments/technical.jpeg',
    alt: 'Campus technical maintenance team at work',
    title: 'Repairs that keep things running',
    subtitle: 'Technical & Maintenance',
    description: 'Electrical, plumbing, lifts, fixtures and equipment repairs.',
    placeholderColor: '#4A3768',
    illustration: 'light',
    aspect: 4 / 3
  },
  {
    src: '/assets/campus-departments/mess.jpeg',
    alt: 'Campus dining and food service area',
    title: 'Better dining services',
    subtitle: 'Mess / Food Services',
    description: 'Food quality, menus, dining hygiene and drinking-water concerns.',
    placeholderColor: '#593052',
    illustration: 'mess',
    aspect: 4 / 3
  },
  {
    src: '/assets/campus-departments/discipline.jpeg',
    alt: 'Campus common area supporting student wellbeing',
    title: 'A safe, supportive campus',
    subtitle: 'Discipline, Safety & Wellbeing',
    description: 'Safety, harassment, ragging, conduct and student wellbeing concerns.',
    placeholderColor: '#5A315C',
    illustration: 'safety',
    aspect: 4 / 3
  },
  {
    src: '/assets/campus-departments/hostel.jpeg',
    alt: 'Campus hostel and residential facilities',
    title: 'Hostel support',
    subtitle: 'Hostel Administration',
    description: 'Room allocation, hostel facilities, wardens and hostel policies.',
    placeholderColor: '#42345E',
    illustration: 'hostel',
    aspect: 4 / 3
  },
  {
    src: '/assets/campus-departments/campus-maintenance.jpeg',
    alt: 'Campus grounds and outdoor facilities',
    title: 'Shared campus facilities',
    subtitle: 'Campus Maintenance',
    description: 'Grounds, roads, sports areas and common campus infrastructure.',
    placeholderColor: '#3E355E',
    illustration: 'grounds',
    aspect: 4 / 3
  }
];

export default function Landing() {
  const { isAuthenticated, isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const dashboard = isAdmin ? '/admin' : isStaff ? '/authority' : '/dashboard';
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const navButton = (label, onClick, strong = false) => <SpecularButton className={`nav-specular ${strong ? 'nav-specular--strong' : ''}`} size="sm" radius={12} tint="#ffffff" tintOpacity={strong ? 0.06 : 0.025} blur={6} textColor="#e9e1f4" lineColor={strong ? '#F5D0FE' : '#C084FC'} baseColor={strong ? '#8B5CF6' : '#392650'} intensity={strong ? 0.9 : 0.45} shineSize={strong ? 10 : 7} shineFade={strong ? 40 : 32} thickness={1} speed={0.3} followMouse proximity={strong ? 220 : 150} autoAnimate={false} onClick={onClick}>{label}</SpecularButton>;

  return <CinematicAtmosphere showCursor className="landing-atmosphere">
    <header className="portal-topbar">
      <BrandMark />
      <nav className="portal-nav" aria-label="Primary navigation">
        {navButton('Home', () => window.scrollTo({ top: 0, behavior: 'smooth' }))}
        {navButton('How it works', () => scrollTo('how-it-works'))}
        {navButton('Authority', () => navigate('/authority/login'))}
        {navButton('Admin login', () => navigate('/admin/login'))}
        {navButton('Log in', () => navigate('/login'))}
        {navButton('Feedback', () => setFeedbackOpen(true))}
        {navButton(isAuthenticated ? 'My space' : 'Create account', () => navigate(isAuthenticated ? dashboard : '/register'), true)}
      </nav>
    </header>

    <main className="portal-page landing-page">
      <section className="landing-hero-only" id="home">
        <div className="portal-hero-copy">
          <div className="portal-kicker"><BlurText text="A smarter way to get campus issues fixed" delay={45} className="hero-eyebrow-text" /></div>
          <h1 className="portal-title landing-headline"><GradientText colors={palette} animationSpeed={6} direction="horizontal" yoyo><span>Campus</span></GradientText><span className="hero-particle-holder"><ParticleText text="Fix" className="hero-particle-word" particleSize={1.8} density={4} color="#F5D0FE" highlightColor="#FF8FB3" scatter={145} gatherDuration={1700} stagger={260} pointerRepel={24} repelRadius={95} idleDrift={0} trigger="mount" fontSize="clamp(3rem, 10vw, 8rem)" fontWeight={800} fontFamily="Manrope, sans-serif" /></span></h1>
          <p className="portal-subtitle">Describe it once. CampusFix finds the right people, keeps the work moving, and lets you see what happens next.</p>
          <div className="portal-actions"><SpecularButton size="lg" radius={18} tint="#fff" tintOpacity={0.04} blur={8} textColor="#fff" lineColor="#F5D0FE" baseColor="#8B5CF6" intensity={1} shineSize={10} shineFade={40} thickness={1} speed={0.3} followMouse proximity={280} autoAnimate={false} onClick={() => navigate(isAuthenticated ? '/complaints/new' : '/register')}>Report an issue ↗</SpecularButton><button className="portal-button portal-button--quiet" onClick={() => scrollTo('system')}>Follow the journey ↓</button></div>
        </div>
      </section>

      <section className="landing-problems" aria-labelledby="landing-problems-title">
        <div className="landing-problems__header">
          <div className="portal-kicker">Everyday campus issues</div>
          <h2 id="landing-problems-title">Real problems. <em>One place to report them.</em></h2>
          <p>From broken facilities to cleanliness and hostel concerns, describe what happened and let CampusFix take it from there.</p>
        </div>
        <div className="landing-problems__carousel">
          <FlexCarousel
            items={campusTeams}
            className="flex-carousel--campus"
            followCursor={false}
            intro="rise"
            cardHeight={0.54}
            gap={18}
            radius={24}
            fit="landscape"
            focusOnClick={false}
            autoplay={false}
            captureWheel={false}
          />
        </div>
        <p className="landing-problems__note">Choose the team that best fits the place or issue you are reporting. CampusFix will help route it from there.</p>
      </section>

      <section className="system-sequence campus-story" id="system" aria-label="One connected six-stage CampusFix journey">
        <div className="sequence-intro" id="how-it-works"><div className="portal-kicker">One report. A clear way forward.</div><ScrollReveal textClassName="portal-title campusfix-scroll-text" baseOpacity={0.05} enableBlur baseRotation={2} blurStrength={7} rotationEnd="bottom 70%" wordAnimationEnd="bottom 65%">From a problem to a resolution.</ScrollReveal><p className="portal-subtitle">CampusFix takes a student’s description and moves it through the right path.</p></div>
        <CampusFixJourney />
      </section>

      <section className="portal-content-grid landing-followup"><div><div className="portal-kicker">The journey</div><h2 className="followup-title">Less chasing.<br /><em>More fixing.</em></h2></div><p className="portal-muted">One report. Every step understood.</p></section>
      <section className="portal-panel portal-card landing-promise"><div id="about" className="portal-kicker">The CampusFix promise</div><p className="portal-muted">A student portal designed around the moment after you submit: the quiet confidence that your issue is moving.</p></section>
      <GradualBlur preset="subtle" position="bottom" target="page" />
    </main>
    <PlatformFeedback open={feedbackOpen} onClose={() => setFeedbackOpen(false)} source="landing-page" />
  </CinematicAtmosphere>;
}
