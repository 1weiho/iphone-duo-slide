import {
  MorphElement,
  Step,
  Steps,
  useIsActivePage,
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
} from '@open-slide/core';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';

// ─── Assets (Apple Newsroom / apple.com product pages, 2026-09-09) ───────────
import duoLineupStarWhite from './assets/duo-lineup-star-white.jpg';
import duoLineupNightSky from './assets/duo-lineup-night-sky.jpg';
import duoOpenHands from './assets/duo-open-hands.jpg';
import duoDisplaySizes from './assets/duo-display-sizes.jpg';
import duoThinProfile from './assets/duo-thin-profile.jpg';
import duoPoseClosed from './assets/duo-pose-closed.jpg';
import duoPoseOpen from './assets/duo-pose-open.jpg';
import duoPoseLaptop from './assets/duo-pose-laptop.jpg';
import duoPoseTent from './assets/duo-pose-tent.jpg';
import duoSplitView from './assets/duo-split-view.jpg';
import duoCameraBack from './assets/duo-camera-back.jpg';
import duoPhotoUltrawide from './assets/duo-photo-ultrawide.jpg';
import duoPhotoTele from './assets/duo-photo-tele.jpg';
import duoPhotoLowlight from './assets/duo-photo-lowlight.jpg';
import proHero from './assets/pro-hero.jpg';
import proColorBlack from './assets/pro-color-black.jpg';
import proColorSilver from './assets/pro-color-silver.jpg';
import proColorGlacier from './assets/pro-color-glacier.jpg';
import proColorBurgundy from './assets/pro-color-burgundy.jpg';
import proApertureLens from './assets/pro-aperture-lens.jpg';
import proPhotoF148 from './assets/pro-photo-f148.jpg';
import proPhotoF18 from './assets/pro-photo-f18.jpg';
import proPhotoF4 from './assets/pro-photo-f4.jpg';
import proA20Xray from './assets/pro-a20-xray.jpg';
import proControls from './assets/pro-controls.jpg';
import proReferenceImage from './assets/pro-reference-image.jpg';
import proZoom8x from './assets/pro-zoom-8x.jpg';
import pro2up from './assets/pro-2up.jpg';

// ─── Panel-tweakable design tokens ───────────────────────────────────────────
// The deck is a two-act keynote: iPhone Duo plays on a white stage (Apple's own
// Duo marketing is light), iPhone 18 Pro on black. The tokens below own the
// black stage; the light stage is a locked local palette (see LIGHT).
export const design: DesignSystem = {
  palette: {
    bg: '#000000',
    text: '#f5f5f7',
    accent: '#2997ff',
  },
  fonts: {
    display:
      '-apple-system, "SF Pro Display", "SF Pro TC", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif',
    body: '-apple-system, "SF Pro Text", "SF Pro TC", "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif',
  },
  typeScale: {
    hero: 176,
    body: 36,
  },
  radius: 28,
};

// ─── Stage palettes ──────────────────────────────────────────────────────────
type Tone = 'light' | 'dark';
type Palette = {
  bg: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
  accent: string;
  tile: string;
  tileLine: string;
};

const LIGHT: Palette = {
  bg: '#ffffff',
  text: '#1d1d1f',
  muted: '#6e6e73',
  faint: '#86868b',
  line: 'rgba(0,0,0,0.10)',
  accent: '#0066cc',
  tile: 'rgba(0,0,0,0.035)',
  tileLine: 'rgba(0,0,0,0.06)',
};

const DARK: Palette = {
  bg: 'var(--osd-bg)',
  text: 'var(--osd-text)',
  muted: '#86868b',
  faint: '#6e6e73',
  line: 'rgba(255,255,255,0.14)',
  accent: 'var(--osd-accent)',
  tile: 'rgba(255,255,255,0.06)',
  tileLine: 'rgba(255,255,255,0.10)',
};

const ToneContext = createContext<Tone>('dark');
const usePalette = () => (useContext(ToneContext) === 'light' ? LIGHT : DARK);

// Product finish swatches (approximate, for the color chips only).
const SWATCH = {
  starWhite: '#e6e3dc',
  nightSky: '#1b2233',
  black: '#2c2c2e',
  silver: '#d9d9de',
  glacier: '#bdd0e6',
  burgundy: '#5a1f2c',
};

// ─── Motion (injected once, keyed to this slide) ─────────────────────────────
const STYLE_ID = 'osd-style-apple-event-2026-09';
const STYLES = `
@keyframes ae-rise { from { opacity: 0; transform: translate3d(0, 28px, 0); } to { opacity: 1; transform: none; } }
@keyframes ae-zoom { from { opacity: 0; transform: scale(1.035); } to { opacity: 1; transform: none; } }
@keyframes ae-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ae-shine { from { background-position: 100% 50%; } to { background-position: 0% 50%; } }
@keyframes ae-drift-a { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(70px, -50px, 0); } }
@keyframes ae-drift-b { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(-60px, 60px, 0); } }
@keyframes ae-drift-c { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(40px, 70px, 0); } }
.ae-rise { animation: ae-rise 900ms cubic-bezier(0.16, 1, 0.3, 1) both; }
.ae-zoom { animation: ae-zoom 1200ms cubic-bezier(0.16, 1, 0.3, 1) both; }
.ae-fade { animation: ae-fade 800ms cubic-bezier(0, 0, 0.2, 1) both; }
.ae-shine {
  /* A 5x-wide strip with one soft colour band in the middle. Sliding the
     strip from 100% to 0% moves the band left→right across the text at
     constant speed; at both ends of the loop the band is fully off-text, so
     the cycle restarts on plain white with no visible jump. */
  background-image: linear-gradient(100deg, #f5f5f7 0%, #f5f5f7 42%, #ffd60a 46%, #ff6482 50%, #bf5af2 54%, #f5f5f7 58%, #f5f5f7 100%);
  background-size: 500% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ae-shine 7s linear 1200ms infinite;
}
.ae-drift-a { animation: ae-drift-a 28s ease-in-out infinite; }
.ae-drift-b { animation: ae-drift-b 34s ease-in-out infinite; }
.ae-drift-c { animation: ae-drift-c 31s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .ae-rise, .ae-zoom, .ae-fade { animation-duration: 1ms !important; animation-delay: 0ms !important; }
  .ae-drift-a, .ae-drift-b, .ae-drift-c { animation: none !important; }
  .ae-shine { animation: none !important; background-image: none !important; color: inherit !important; }
}
`;
// Idempotent and HMR-safe: one <style> per slide id, refreshed in place when
// the module re-evaluates so edited keyframes take effect without a reload.
if (typeof document !== 'undefined') {
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  if (el.textContent !== STYLES) el.textContent = STYLES;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Page transitions — one DNA, three members ───────────────────────────────
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const MORPH_MS = 868;
const MORPH_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

// RISE — house quiet, module default.
export const transition: SlideTransition = {
  duration: 200,
  exit: {
    duration: 140,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-4px)' },
    ],
  },
  enter: {
    duration: 200,
    delay: 80,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

// SETTLE — cover grade.
const settle: SlideTransition = {
  duration: 280,
  exit: {
    duration: 160,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-6px)' },
    ],
  },
  enter: {
    duration: 280,
    delay: 100,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ],
  },
};

// BREATH (opacity-only so it composes with a backward morph) — section dividers.
const dividerBreath: SlideTransition = {
  duration: 460,
  exit: { duration: 180, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: { duration: 240, delay: 300, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: MORPH_EASE },
};

// MORPH — the page after a divider: the product title glides into the corner.
const morphIn: SlideTransition = {
  duration: 280,
  exit: { duration: 224, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: { duration: 308, delay: 112, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: MORPH_EASE },
};

// LIGHT-STAGE variants. The framework paints the transition wrapper with the
// black `--osd-bg`, so on white pages the outgoing layer must stay fully opaque
// while the incoming page fades in on top — otherwise every cut dips through
// black. Same DNA (durations, easing pair), only the exit is a hold.
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

const liteRise: SlideTransition = {
  duration: 260,
  exit: { duration: 260, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 260,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const liteBreath: SlideTransition = {
  duration: 460,
  exit: { duration: 460, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 280, delay: 180, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: MORPH_EASE },
};

const liteMorph: SlideTransition = {
  duration: 320,
  exit: { duration: 320, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 320, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: MORPH_EASE },
};

// ─── Hooks ───────────────────────────────────────────────────────────────────
/** True once this element sits on the audience-facing page and, if it lives
 *  inside a <Step>, that step has been revealed. */
function useRevealed(ref: RefObject<HTMLElement | null>) {
  const active = useIsActivePage();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!active) {
      setRevealed(false);
      return;
    }
    const host = ref.current?.closest<HTMLElement>('[data-osd-step]');
    if (!host) {
      setRevealed(true);
      return;
    }
    const sync = () => setRevealed(host.getAttribute('data-osd-step') === 'revealed');
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(host, { attributes: true, attributeFilter: ['data-osd-step'] });
    return () => mo.disconnect();
  }, [active, ref]);
  return revealed;
}

/** Counts 0 → target with an expo-out curve once `go` flips true. Renders the
 *  final value everywhere else (thumbnails, overview, print). */
function useCountUp(target: number, go: boolean, duration = 1400, delay = 0) {
  const [v, setV] = useState(target);
  useEffect(() => {
    if (!go || prefersReducedMotion()) {
      setV(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now() + delay;
    setV(0);
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / duration));
      const e = 1 - Math.pow(1 - t, 4);
      setV(target * e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, go, duration, delay]);
  return v;
}

/** Cycles 0..n-1 every `interval` ms while the page is live; parks on `rest` otherwise. */
function useCycle(n: number, interval: number, rest: number) {
  const active = useIsActivePage();
  const [i, setI] = useState(rest);
  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setI(rest);
      return;
    }
    setI(rest);
    const id = window.setInterval(() => setI((v) => (v + 1) % n), interval);
    return () => window.clearInterval(id);
  }, [active, n, interval, rest]);
  return i;
}

// ─── Primitives ──────────────────────────────────────────────────────────────
const DISPLAY = 'var(--osd-font-display)';

const Stage = ({
  tone = 'dark',
  children,
  style,
}: {
  tone?: Tone;
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const p = tone === 'light' ? LIGHT : DARK;
  return (
    <ToneContext.Provider value={tone}>
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: p.bg,
          color: p.text,
          fontFamily: 'var(--osd-font-body)',
          WebkitFontSmoothing: 'antialiased',
          ...style,
        }}
      >
        {children}
      </div>
    </ToneContext.Provider>
  );
};

/** Entrance motion, gated to the live page so every other instance (thumbnail,
 *  overview, print, morph snapshot) renders the settled state. */
const Rise = ({
  delay = 0,
  kind = 'rise',
  children,
  style,
}: {
  delay?: number;
  kind?: 'rise' | 'zoom' | 'fade';
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const active = useIsActivePage();
  return (
    <div className={active ? `ae-${kind}` : undefined} style={{ animationDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
};

const headline = (size: number, extra?: CSSProperties): CSSProperties => ({
  fontFamily: DISPLAY,
  fontSize: size,
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: size >= 120 ? '-0.04em' : '-0.022em',
  margin: 0,
  ...extra,
});

const digits: CSSProperties = {
  fontFamily: DISPLAY,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.05em',
  lineHeight: 1,
};

/** Animated number. Counts up when its page (and enclosing <Step>) goes live. */
const Num = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1400,
  delay = 0,
  style,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  style?: CSSProperties;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const go = useRevealed(ref);
  const v = useCountUp(value, go, duration, delay);
  const text = v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span ref={ref} style={{ ...digits, ...style }}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
};

/** Small product name in the top-left corner of every product page. On the
 *  page right after a divider it doubles as the morph landing spot. */
const ProductTag = ({ children, morphId }: { children: ReactNode; morphId?: string }) => {
  const p = usePalette();
  const h = (
    <h2
      style={{
        position: 'absolute',
        left: 120,
        top: 96,
        margin: 0,
        fontFamily: DISPLAY,
        fontSize: 40,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        color: p.text,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </h2>
  );
  return morphId ? <MorphElement id={morphId}>{h}</MorphElement> : h;
};

const Eyebrow = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => {
  const p = usePalette();
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontSize: 26,
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: p.accent,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Sub = ({ children, size = 32, style }: { children: ReactNode; size?: number; style?: CSSProperties }) => {
  const p = usePalette();
  return (
    <p style={{ margin: 0, fontSize: size, lineHeight: 1.4, color: p.muted, letterSpacing: '-0.005em', ...style }}>
      {children}
    </p>
  );
};

const Photo = ({
  src,
  width,
  height,
  radius = 0,
  fit = 'cover',
  position = 'center',
  lift = false,
  style,
}: {
  src: string;
  width: number | string;
  height: number | string;
  radius?: number;
  fit?: 'cover' | 'contain';
  position?: string;
  /** Newsroom stills sit on #fafafc; nudge them to pure white so they melt into the stage. */
  lift?: boolean;
  style?: CSSProperties;
}) => (
  <img
    src={src}
    alt=""
    draggable={false}
    style={{
      display: 'block',
      width,
      height,
      objectFit: fit,
      objectPosition: position,
      borderRadius: radius,
      filter: lift ? 'brightness(1.02)' : undefined,
      ...style,
    }}
  />
);

/** Round finish chip with its Chinese name; `on` marks the finish currently shown. */
const ColorChip = ({ name, color, on }: { name: string; color: string; on: boolean }) => {
  const p = usePalette();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 18px 10px 12px',
        borderRadius: 999,
        background: on ? p.tile : 'transparent',
        border: `1px solid ${on ? p.tileLine : 'transparent'}`,
        transition: 'background 500ms ease, border-color 500ms ease, opacity 500ms ease',
        opacity: on ? 1 : 0.55,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: color,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12), inset 0 -6px 10px rgba(0,0,0,0.18), inset 0 6px 10px rgba(255,255,255,0.35)',
        }}
      />
      <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{name}</span>
    </div>
  );
};

/** One layer of a crossfading image stack. */
const Layer = ({ src, on, lift }: { src: string; on: boolean; lift?: boolean }) => (
  <img
    src={src}
    alt=""
    draggable={false}
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: on ? 1 : 0,
      transition: 'opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)',
      filter: lift ? 'brightness(1.02)' : undefined,
    }}
  />
);

/** Big stat: number on top, label beneath. */
const Stat = ({
  value,
  decimals,
  prefix,
  suffix,
  label,
  size = 200,
  suffixSize,
  delay = 0,
  align = 'left',
  width,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: ReactNode;
  size?: number;
  suffixSize?: number;
  delay?: number;
  align?: 'left' | 'center';
  width?: number;
}) => {
  const p = usePalette();
  return (
    <div style={{ width, textAlign: align }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
        <Num value={value} decimals={decimals} prefix={prefix} delay={delay} style={{ fontSize: size }} />
        {suffix ? (
          <span style={{ ...digits, fontSize: suffixSize ?? Math.round(size * 0.36), letterSpacing: '-0.02em', color: p.text }}>
            {suffix}
          </span>
        ) : null}
      </div>
      <div style={{ marginTop: 16, fontSize: 30, lineHeight: 1.4, color: p.muted }}>{label}</div>
    </div>
  );
};

/** Translucent stat tile (Apple "material" — blur + hairline + light top edge). */
const Tile = ({
  value,
  decimals,
  prefix,
  suffix,
  label,
  width,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  width: number;
}) => {
  const p = usePalette();
  return (
    <div
      style={{
        width,
        padding: '28px 32px',
        borderRadius: 'var(--osd-radius)',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <Num value={value} decimals={decimals} prefix={prefix} style={{ fontSize: 88 }} />
        {suffix ? <span style={{ ...digits, fontSize: 40, letterSpacing: '-0.02em' }}>{suffix}</span> : null}
      </div>
      <div style={{ marginTop: 10, fontSize: 28, color: p.muted, letterSpacing: '0.01em' }}>{label}</div>
    </div>
  );
};

/** Captioned photo for sample rows. */
const Sample = ({
  src,
  title,
  caption,
  width = 520,
  height = 390,
  lift,
}: {
  src: string;
  title: string;
  caption?: string;
  width?: number;
  height?: number;
  lift?: boolean;
}) => {
  const p = usePalette();
  return (
    <div style={{ width }}>
      <Photo src={src} width={width} height={height} radius={24} lift={lift} />
      <div style={{ marginTop: 18, fontSize: 32, fontWeight: 600, letterSpacing: '-0.015em' }}>{title}</div>
      {caption ? <div style={{ marginTop: 4, fontSize: 26, color: p.muted }}>{caption}</div> : null}
    </div>
  );
};

/** Animated six-blade iris. r = R·cos(γ); the readout tracks the real f-number
 *  range of the iPhone 18 Pro Fusion Main camera (ƒ/1.48 open → ƒ/4.0 closed). */
const IRIS_R = 150;
const GAMMA_OPEN = 12;
const GAMMA_CLOSED = 68.8;
const F_OPEN = 1.48;

const Iris = ({ size = 400 }: { size?: number }) => {
  const active = useIsActivePage();
  const [s, setS] = useState(0); // 0 = wide open, 1 = stopped down
  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setS(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 5600;
      setS(0.5 - 0.5 * Math.cos(t * Math.PI * 2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const gamma = GAMMA_OPEN + (GAMMA_CLOSED - GAMMA_OPEN) * s;
  const f = (F_OPEN * Math.cos((GAMMA_OPEN * Math.PI) / 180)) / Math.cos((gamma * Math.PI) / 180);

  const blade = (i: number) => {
    const phi = i * 60;
    const px = 200 + IRIS_R * Math.cos((phi * Math.PI) / 180);
    const py = 200 + IRIS_R * Math.sin((phi * Math.PI) / 180);
    return (
      <g transform={`translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${(phi + 90 + gamma).toFixed(3)})`}>
        <path d="M -700 0 H 700 V -700 H -700 Z" fill="url(#ae-blade)" />
        <path d="M -700 0 H 700" stroke="rgba(255,255,255,0.42)" strokeWidth={1.4} />
      </g>
    );
  };

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 400 400" width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <radialGradient id="ae-glass" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#3a2a7a" />
            <stop offset="45%" stopColor="#170f3a" />
            <stop offset="100%" stopColor="#05030c" />
          </radialGradient>
          <linearGradient id="ae-blade" x1="0" y1="0" x2="0" y2="-1">
            <stop offset="0%" stopColor="#3a3a3c" />
            <stop offset="30%" stopColor="#232325" />
            <stop offset="100%" stopColor="#151517" />
          </linearGradient>
          <clipPath id="ae-barrel">
            <circle cx="200" cy="200" r="168" />
          </clipPath>
        </defs>
        <circle cx="200" cy="200" r="196" fill="#0b0b0c" stroke="#2c2c2e" strokeWidth="2" />
        <circle cx="200" cy="200" r="184" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <g clipPath="url(#ae-barrel)">
          <circle cx="200" cy="200" r="168" fill="url(#ae-glass)" />
          <ellipse cx="160" cy="140" rx="70" ry="38" fill="rgba(255,255,255,0.10)" transform="rotate(-25 160 140)" />
          {blade(0)}
          {blade(1)}
          {blade(2)}
          {blade(3)}
          {blade(4)}
          {blade(5)}
        </g>
        <circle cx="200" cy="200" r="168" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            ...digits,
            fontSize: size * 0.13,
            letterSpacing: '-0.03em',
            color: '#f5f5f7',
            textShadow: '0 2px 24px rgba(0,0,0,0.8)',
          }}
        >
          ƒ/{f.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

// ─── Pages ───────────────────────────────────────────────────────────────────

// 01 · Cover
const Blob = ({ color, left, top, size, drift }: { color: string; left: number; top: number; size: number; drift: string }) => (
  <div
    className={drift}
    style={{
      position: 'absolute',
      left,
      top,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(60px)',
      opacity: 0.55,
      willChange: 'transform',
    }}
  />
);

const Cover: Page = () => (
  <Stage>
    <Blob color="#5e5ce6" left={-200} top={-260} size={1100} drift="ae-drift-a" />
    <Blob color="#ff9f0a" left={1180} top={520} size={900} drift="ae-drift-b" />
    <Blob color="#0a84ff" left={700} top={700} size={800} drift="ae-drift-c" />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 160px',
      }}
    >
      <Rise delay={0}>
        <Eyebrow style={{ color: '#f5f5f7', opacity: 0.7, letterSpacing: '0.18em' }}>
          APPLE EVENT · 2026.09.09 · SURPRISE AND SHINE
        </Eyebrow>
      </Rise>
      <Rise delay={140} style={{ marginTop: 40 }}>
        <h1 className="ae-shine" style={headline(176, { lineHeight: 1.06, letterSpacing: '-0.035em' })}>
          Apple 秋季發表會
        </h1>
      </Rise>
      <Rise delay={320} style={{ marginTop: 36 }}>
        <Sub size={44} style={{ color: '#a1a1a6' }}>
          iPhone Duo 與 iPhone 18 Pro，重點整理。
        </Sub>
      </Rise>
    </div>
    <Rise delay={700} kind="fade" style={{ position: 'absolute', left: 0, right: 0, bottom: 72, textAlign: 'center' }}>
      <div style={{ fontSize: 24, color: '#6e6e73', letterSpacing: '0.02em' }}>資料來源：Apple Newsroom・apple.com/tw</div>
    </Rise>
  </Stage>
);
Cover.transition = settle;

// 02 · Lineup
const LineupRow = ({ name, desc }: { name: string; desc: string }) => (
  <div>
    <div style={headline(140, { letterSpacing: '-0.045em' })}>{name}</div>
    <Sub size={36} style={{ marginTop: 14 }}>
      {desc}
    </Sub>
  </div>
);

const Lineup: Page = () => (
  <Stage>
    <div style={{ position: 'absolute', left: 120, top: 120, right: 120 }}>
      <Rise>
        <Eyebrow>今天的主角</Eyebrow>
      </Rise>
      <Steps>
        <Step>
          <div style={{ marginTop: 56 }}>
            <LineupRow name="iPhone Duo" desc="Apple 首款摺疊 iPhone・7.6 吋內螢幕・NT$74,900 起" />
          </div>
        </Step>
        <Step>
          <div style={{ marginTop: 56 }}>
            <LineupRow name="iPhone 18 Pro" desc="iPhone 首度可變光圈・A20 Pro・NT$44,900 起" />
          </div>
        </Step>
        <Step>
          <div style={{ marginTop: 64, paddingTop: 40, borderTop: `1px solid ${DARK.line}` }}>
            <Sub size={28}>同場發表：Apple Watch Series 12・Apple Watch Ultra 4・AirPods 5・iOS 27（9 月 14 日推出）</Sub>
          </div>
        </Step>
      </Steps>
    </div>
  </Stage>
);

// 03 · Section — iPhone Duo (light stage begins)
const DuoIntro: Page = () => (
  <Stage tone="light">
    <MorphElement id="duo-title">
      <h1
        style={{
          position: 'absolute',
          left: 120,
          top: 150,
          margin: 0,
          fontFamily: DISPLAY,
          fontSize: 200,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.045em',
          color: LIGHT.text,
          whiteSpace: 'nowrap',
        }}
      >
        iPhone Duo
      </h1>
    </MorphElement>
    <Rise delay={150} style={{ position: 'absolute', left: 124, top: 392 }}>
      <Sub size={48} style={{ color: LIGHT.muted }}>
        Apple 首款摺疊 iPhone。
      </Sub>
    </Rise>
    <Rise delay={260} style={{ position: 'absolute', left: 124, top: 476 }}>
      <Sub size={28} style={{ color: LIGHT.faint }}>
        7.6 吋內螢幕・展開時史上最薄・A20 Pro
      </Sub>
    </Rise>
    <Rise delay={200} kind="zoom" style={{ position: 'absolute', left: 680, top: 383 }}>
      <Photo src={duoOpenHands} width={1240} height={697} />
    </Rise>
  </Stage>
);
DuoIntro.transition = liteBreath;

// 04 · Duo — design & finishes (title morphs in from the divider)
const DuoDesign: Page = () => {
  const i = useCycle(2, 3400, 0);
  return (
    <Stage tone="light">
      <ProductTag morphId="duo-title">iPhone Duo</ProductTag>
      <Rise delay={MORPH_MS - 200} style={{ position: 'absolute', left: 120, top: 172 }}>
        <h2 style={headline(72)}>5 級鈦金屬。摺起來，如同一本護照。</h2>
      </Rise>
      <Rise delay={MORPH_MS} style={{ position: 'absolute', right: 120, top: 92, display: 'flex', gap: 12 }}>
        <ColorChip name="星光白色" color={SWATCH.starWhite} on={i === 0} />
        <ColorChip name="夜空色" color={SWATCH.nightSky} on={i === 1} />
      </Rise>
      <Rise delay={MORPH_MS - 100} kind="zoom" style={{ position: 'absolute', left: 260, top: 290, width: 1400, height: 763 }}>
        <div style={{ position: 'relative', width: 1400, height: 763 }}>
          <Layer src={duoLineupStarWhite} on={i === 0} />
          <Layer src={duoLineupNightSky} on={i === 1} />
        </div>
      </Rise>
    </Stage>
  );
};
DuoDesign.transition = liteMorph;

// 05 · Duo — thinnest iPhone
const DuoThin: Page = () => (
  <Stage tone="light">
    <ProductTag>iPhone Duo</ProductTag>
    <div style={{ position: 'absolute', left: 120, top: 176 }}>
      <Rise>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <Num value={5.2} decimals={1} duration={1600} style={{ fontSize: 280 }} />
          <span style={{ ...digits, fontSize: 96, letterSpacing: '-0.02em' }}>mm</span>
        </div>
      </Rise>
      <Rise delay={200} style={{ marginTop: 24 }}>
        <h2 style={headline(48, { fontWeight: 600 })}>展開時，是史上最薄的 iPhone。</h2>
      </Rise>
    </div>
    <Rise delay={300} kind="zoom" style={{ position: 'absolute', left: 120, top: 580 }}>
      <Photo src={duoThinProfile} width={1680} height={360} />
    </Rise>
    <Rise delay={500} style={{ position: 'absolute', left: 120, top: 972, display: 'flex', gap: 64 }}>
      <Sub size={28}>摺疊時 11.3 mm</Sub>
      <Sub size={28}>重量 254 g</Sub>
      <Sub size={28}>IP68 防水防塵</Sub>
      <Sub size={28}>超過 100 個零件的精密鉸鏈</Sub>
    </Rise>
  </Stage>
);
DuoThin.transition = liteRise;

// 06 · Duo — displays
const DuoDisplay: Page = () => (
  <Stage tone="light">
    <ProductTag>iPhone Duo</ProductTag>
    <Rise style={{ position: 'absolute', left: 120, top: 172 }}>
      <h2 style={headline(72)}>iPhone 史上最大的顯示器。</h2>
    </Rise>
    <div style={{ position: 'absolute', left: 120, top: 330, display: 'flex', flexDirection: 'column', gap: 48 }}>
      <Rise delay={150}>
        <Stat value={7.6} decimals={1} suffix="吋" size={160} suffixSize={56} label="內螢幕・超 Retina XDR・奈米紋理" />
      </Rise>
      <Rise delay={300}>
        <Stat value={5.4} decimals={1} suffix="吋" size={160} suffixSize={56} label="外螢幕・iPhone 18 Pro 90% 的螢幕面積" delay={300} />
      </Rise>
    </div>
    <Rise delay={250} kind="zoom" style={{ position: 'absolute', left: 720, top: 300 }}>
      <Photo src={duoDisplaySizes} width={1100} height={619} lift />
    </Rise>
    <Rise delay={550} style={{ position: 'absolute', left: 120, top: 960, display: 'flex', gap: 64 }}>
      <Sub size={28}>ProMotion 120Hz</Sub>
      <Sub size={28}>3000 尼特峰值亮度</Sub>
      <Sub size={28}>全天候顯示</Sub>
      <Sub size={28}>兩個螢幕，同一比例</Sub>
    </Rise>
  </Stage>
);
DuoDisplay.transition = liteRise;

// 07 · Duo — four postures
const Pose = ({ src, title, desc }: { src: string; title: string; desc: string }) => {
  const p = usePalette();
  return (
    <div style={{ width: 554 }}>
      <Photo src={src} width={554} height={292} radius={20} />
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.015em' }}>{title}</span>
        <span style={{ fontSize: 24, color: p.muted }}>{desc}</span>
      </div>
    </div>
  );
};

const DuoPoses: Page = () => (
  <Stage tone="light">
    <ProductTag>iPhone Duo</ProductTag>
    <div style={{ position: 'absolute', left: 120, top: 200, width: 480 }}>
      <Rise>
        <h2 style={headline(72)}>一台，<br />四種姿態。</h2>
      </Rise>
      <Rise delay={150} style={{ marginTop: 32 }}>
        <Sub size={30}>摺疊、展開、筆電、帳篷。內容會隨著你翻轉、開闔而自動適應。</Sub>
      </Rise>
    </div>
    <div style={{ position: 'absolute', left: 660, top: 200 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '554px 554px', gap: '32px 32px' }}>
        <Steps>
          <Step>
            <Pose src={duoPoseClosed} title="摺疊" desc="5.4 吋外螢幕" />
          </Step>
          <Step>
            <Pose src={duoPoseOpen} title="展開" desc="7.6 吋內螢幕" />
          </Step>
          <Step>
            <Pose src={duoPoseLaptop} title="筆電模式" desc="免手持 FaceTime 與影片" />
          </Step>
          <Step>
            <Pose src={duoPoseTent} title="帳篷模式" desc="待機模式・時鐘・行事曆" />
          </Step>
        </Steps>
      </div>
    </div>
  </Stage>
);
DuoPoses.transition = liteRise;

// 08 · Duo — Split View
const DuoSplitView: Page = () => (
  <Stage tone="light">
    <ProductTag>iPhone Duo</ProductTag>
    <Rise style={{ position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center' }}>
      <h2 style={headline(80)}>iPhone 首次，兩個 App 並排。</h2>
    </Rise>
    <Rise delay={150} style={{ position: 'absolute', left: 0, right: 0, top: 226, textAlign: 'center' }}>
      <Sub size={32}>iOS 27 分割顯示・一邊和 Siri 對話，一邊瀏覽・儲存 App 配對，隨時回來</Sub>
    </Rise>
    <Rise delay={250} kind="zoom" style={{ position: 'absolute', left: 410, top: 300 }}>
      <Photo src={duoSplitView} width={1100} height={733} lift />
    </Rise>
  </Stage>
);
DuoSplitView.transition = liteRise;

// 09 · Duo — camera
const DuoCamera: Page = () => (
  <Stage tone="light">
    <ProductTag>iPhone Duo</ProductTag>
    <Rise delay={100} kind="zoom" style={{ position: 'absolute', left: 120, top: 150 }}>
      <Photo src={duoCameraBack} width={342} height={800} />
    </Rise>
    <div style={{ position: 'absolute', left: 560, top: 172, width: 1240 }}>
      <Rise>
        <h2 style={headline(64)}>4800 萬像素雙融合相機系統。</h2>
      </Rise>
      <Rise delay={150} style={{ marginTop: 20 }}>
        <Sub size={30}>主相機、超廣角，加上光學品質 2 倍望遠。零快門延遲。</Sub>
      </Rise>
      <div style={{ marginTop: 48, display: 'flex', gap: 24 }}>
        <Steps>
          <Step>
            <Sample src={duoPhotoUltrawide} width={397} height={298} title="超廣角" caption="13 mm・ƒ/2.2・120°" />
          </Step>
          <Step>
            <Sample src={duoPhotoTele} width={397} height={298} title="2 倍望遠" caption="52 mm・光學品質" />
          </Step>
          <Step>
            <Sample src={duoPhotoLowlight} width={397} height={298} title="低光源" caption="26 mm・ƒ/1.6・OIS" />
          </Step>
        </Steps>
      </div>
      <Rise delay={400} style={{ marginTop: 56 }}>
        <Sub size={26} style={{ color: LIGHT.faint }}>
          4K120 fps 杜比視界・Center Stage 前置相機・螢幕下 FaceTime 相機・Duo 雙面預覽
        </Sub>
      </Rise>
    </div>
  </Stage>
);
DuoCamera.transition = liteRise;

// 10 · Duo — performance & battery
const DuoPower: Page = () => (
  <Stage tone="light">
    <ProductTag>iPhone Duo</ProductTag>
    <Rise style={{ position: 'absolute', left: 120, top: 172 }}>
      <h2 style={headline(72)}>A20 Pro。兩顆電池。整天續航。</h2>
    </Rise>
    <div style={{ position: 'absolute', left: 120, top: 400 }}>
      <div style={{ display: 'flex', gap: 80 }}>
        <Steps>
          <Step>
            <Stat value={24} suffix="小時" size={200} label="一般使用" width={500} />
          </Step>
          <Step>
            <Stat value={44} suffix="小時" size={200} label="外螢幕影片播放" width={500} />
          </Step>
          <Step>
            <Stat value={50} suffix="%" size={200} label="20 分鐘快速充電（60W USB-C）" width={520} />
          </Step>
        </Steps>
      </div>
    </div>
    <Rise delay={300} style={{ position: 'absolute', left: 120, top: 900, display: 'flex', gap: 56 }}>
      <Sub size={28}>2 奈米 A20 Pro</Sub>
      <Sub size={28}>雙 16 核心神經網路引擎</Sub>
      <Sub size={28}>C2 數據機・N1 無線晶片</Sub>
      <Sub size={28}>MagSafe・Qi2 25W</Sub>
    </Rise>
  </Stage>
);
DuoPower.transition = liteRise;

// 11 · Duo — price & dates
const TierChip = ({ tier, price }: { tier: string; price: string }) => {
  const p = usePalette();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        padding: '14px 24px',
        borderRadius: 999,
        background: p.tile,
        border: `1px solid ${p.tileLine}`,
      }}
    >
      <span style={{ fontSize: 26, fontWeight: 600 }}>{tier}</span>
      <span style={{ fontSize: 26, color: p.muted, fontVariantNumeric: 'tabular-nums' }}>{price}</span>
    </div>
  );
};

const DateBlock = ({ date, label }: { date: string; label: string }) => {
  const p = usePalette();
  return (
    <div>
      <div style={{ ...headline(72), letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{date}</div>
      <div style={{ marginTop: 10, fontSize: 28, color: p.muted }}>{label}</div>
    </div>
  );
};

const DuoPrice: Page = () => (
  <Stage tone="light">
    <ProductTag>iPhone Duo</ProductTag>
    <div style={{ position: 'absolute', left: 120, top: 190 }}>
      <Rise>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <Num value={74900} prefix="NT$" duration={1600} style={{ fontSize: 200 }} />
          <span style={{ ...digits, fontSize: 72, letterSpacing: '-0.02em' }}>起</span>
        </div>
      </Rise>
      <Rise delay={200} style={{ marginTop: 28 }}>
        <Sub size={32}>256GB 起，最高 2TB。星光白色、夜空色。</Sub>
      </Rise>
      <Rise delay={350} style={{ marginTop: 44, display: 'flex', gap: 16 }}>
        <TierChip tier="256GB" price="NT$74,900" />
        <TierChip tier="512GB" price="NT$81,900" />
        <TierChip tier="1TB" price="NT$96,900" />
        <TierChip tier="2TB" price="NT$118,900" />
      </Rise>
      <Rise delay={500} style={{ marginTop: 96, display: 'flex', gap: 160 }}>
        <DateBlock date="10 月 16 日" label="晚上 8 點開放預購" />
        <DateBlock date="10 月 23 日" label="正式開賣・搭載 iOS 27.1" />
      </Rise>
    </div>
  </Stage>
);
DuoPrice.transition = liteRise;

// 12 · Section — iPhone 18 Pro (black stage returns)
const ProIntro: Page = () => (
  <Stage>
    <Rise kind="zoom" style={{ position: 'absolute', inset: 0 }}>
      <Photo src={proHero} width={1920} height={1080} position="center 42%" />
    </Rise>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.9) 100%)',
      }}
    />
    <MorphElement id="pro-title">
      <h1
        style={{
          position: 'absolute',
          left: 120,
          top: 760,
          margin: 0,
          fontFamily: DISPLAY,
          fontSize: 160,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.045em',
          color: '#f5f5f7',
          whiteSpace: 'nowrap',
        }}
      >
        iPhone 18 Pro
      </h1>
    </MorphElement>
    <Rise delay={200} style={{ position: 'absolute', left: 124, top: 944 }}>
      <Sub size={40} style={{ color: '#a1a1a6' }}>
        與 iPhone 18 Pro Max。可變光圈、A20 Pro、史上最長續航。
      </Sub>
    </Rise>
  </Stage>
);
ProIntro.transition = dividerBreath;

// 13 · Pro — finishes (title morphs in from the divider)
const ProColors: Page = () => {
  const i = useCycle(4, 2800, 3);
  return (
    <Stage>
      <ProductTag morphId="pro-title">iPhone 18 Pro</ProductTag>
      <Rise delay={MORPH_MS - 200} style={{ position: 'absolute', left: 120, top: 172 }}>
        <h2 style={headline(72)}>四種色彩。全新勃根地紅色。</h2>
      </Rise>
      <Rise delay={MORPH_MS} style={{ position: 'absolute', right: 120, top: 92, display: 'flex', gap: 8 }}>
        <ColorChip name="黑色" color={SWATCH.black} on={i === 0} />
        <ColorChip name="銀色" color={SWATCH.silver} on={i === 1} />
        <ColorChip name="冰川藍色" color={SWATCH.glacier} on={i === 2} />
        <ColorChip name="勃根地紅色" color={SWATCH.burgundy} on={i === 3} />
      </Rise>
      <Rise delay={MORPH_MS - 100} kind="zoom" style={{ position: 'absolute', left: 220, top: 290, width: 1480, height: 782 }}>
        <div style={{ position: 'relative', width: 1480, height: 782 }}>
          <Layer src={proColorBlack} on={i === 0} />
          <Layer src={proColorSilver} on={i === 1} />
          <Layer src={proColorGlacier} on={i === 2} />
          <Layer src={proColorBurgundy} on={i === 3} />
        </div>
      </Rise>
    </Stage>
  );
};
ProColors.transition = morphIn;

// 14 · Pro — variable aperture (hero)
const ProAperture: Page = () => (
  <Stage>
    <Rise kind="zoom" style={{ position: 'absolute', inset: 0 }}>
      <Photo src={proApertureLens} width={1920} height={1080} position="72% center" />
    </Rise>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 30%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0) 72%)',
      }}
    />
    <ProductTag>iPhone 18 Pro</ProductTag>
    <div style={{ position: 'absolute', left: 120, top: 300, width: 1000 }}>
      <Rise delay={150}>
        <h2 style={headline(96)}>iPhone 首度，<br />可變光圈。</h2>
      </Rise>
      <Rise delay={300} style={{ marginTop: 36 }}>
        <Sub size={36} style={{ color: '#a1a1a6' }}>
          六片雷射切割葉片，由全新轉子機構驅動。
          <br />
          從 ƒ/1.48 到 ƒ/4.0，無段變化。
        </Sub>
      </Rise>
      <Rise delay={450} style={{ marginTop: 56, display: 'flex', gap: 48 }}>
        <Sub size={28} style={{ color: '#86868b' }}>4800 萬像素融合主相機</Sub>
        <Sub size={28} style={{ color: '#86868b' }}>全新感光元件</Sub>
        <Sub size={28} style={{ color: '#86868b' }}>開放給開發者的 API</Sub>
      </Rise>
    </div>
  </Stage>
);

// 15 · Pro — one lens, three depths (animated iris)
const ProDepth: Page = () => (
  <Stage>
    <ProductTag>iPhone 18 Pro</ProductTag>
    <div style={{ position: 'absolute', left: 120, top: 172, width: 1100 }}>
      <Rise>
        <h2 style={headline(72)}>同一顆鏡頭，三種景深。</h2>
      </Rise>
      <Rise delay={150} style={{ marginTop: 24 }}>
        <Sub size={32}>光圈自動調整；Pro 控制模式下，也能手動指定。</Sub>
      </Rise>
    </div>
    <Rise delay={200} kind="fade" style={{ position: 'absolute', left: 1400, top: 100 }}>
      <Iris size={400} />
    </Rise>
    <div style={{ position: 'absolute', left: 120, top: 540 }}>
      <div style={{ display: 'flex', gap: 60 }}>
        <Steps>
          <Step>
            <Sample src={proPhotoF148} title="ƒ/1.48" caption="低光源，收進最多光線" />
          </Step>
          <Step>
            <Sample src={proPhotoF18} title="ƒ/1.8" caption="人像，光線與景深的最佳平衡" />
          </Step>
          <Step>
            <Sample src={proPhotoF4} title="ƒ/4.0" caption="群體合照，更多人在焦點內" />
          </Step>
        </Steps>
      </div>
    </div>
  </Stage>
);

// 16 · Pro — A20 Pro
const ProChip: Page = () => (
  <Stage>
    <Rise kind="zoom" style={{ position: 'absolute', left: -190, top: -20, width: 2300, height: 1131 }}>
      <Photo src={proA20Xray} width={2300} height={1131} />
    </Rise>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.72) 28%, rgba(0,0,0,0.12) 48%, rgba(0,0,0,0.1) 62%, rgba(0,0,0,0.85) 100%)',
      }}
    />
    <ProductTag>iPhone 18 Pro</ProductTag>
    <Rise style={{ position: 'absolute', left: 120, top: 172 }}>
      <h2 style={headline(72)}>A20 Pro。首款 2 奈米手機晶片。</h2>
    </Rise>
    <Rise delay={150} style={{ position: 'absolute', left: 120, top: 270 }}>
      <Sub size={32} style={{ color: '#a1a1a6' }}>
        6 核心 CPU・7 核心 GPU・雙 16 核心神經網路引擎・散熱面積三倍的全新均溫板
      </Sub>
    </Rise>
    <div style={{ position: 'absolute', left: 120, top: 748 }}>
      <div style={{ display: 'flex', gap: 24 }}>
        <Steps>
          <Step>
            <Tile value={20} prefix="+" suffix="%" label="CPU 速度（對比 A19 Pro）" width={402} />
          </Step>
          <Step>
            <Tile value={40} prefix="+" suffix="%" label="GPU 速度" width={402} />
          </Step>
          <Step>
            <Tile value={2} suffix="倍" label="AI 運算能力" width={402} />
          </Step>
          <Step>
            <Tile value={40} prefix="+" suffix="%" label="持續效能" width={402} />
          </Step>
        </Steps>
      </div>
    </div>
  </Stage>
);

// 17 · Pro — battery
const ProBattery: Page = () => (
  <Stage>
    <div
      style={{
        position: 'absolute',
        left: 140,
        top: -120,
        width: 1000,
        height: 900,
        background: 'radial-gradient(ellipse at 30% 45%, rgba(48,209,88,0.28) 0%, rgba(48,209,88,0) 60%)',
        filter: 'blur(40px)',
      }}
    />
    <ProductTag>iPhone 18 Pro</ProductTag>
    <div style={{ position: 'absolute', left: 120, top: 176 }}>
      <Rise>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <Num value={43} duration={1800} style={{ fontSize: 360, letterSpacing: '-0.06em' }} />
          <span style={{ ...digits, fontSize: 96, letterSpacing: '-0.02em' }}>小時</span>
        </div>
      </Rise>
      <Rise delay={200} style={{ marginTop: 24 }}>
        <h2 style={headline(48, { fontWeight: 600 })}>iPhone 18 Pro Max 影片播放。iPhone 史上最長續航。</h2>
      </Rise>
    </div>
    <div style={{ position: 'absolute', left: 120, top: 740 }}>
      <div style={{ display: 'flex', gap: 96 }}>
        <Steps>
          <Step>
            <Stat value={34} suffix="小時" size={96} suffixSize={40} label="iPhone 18 Pro 影片播放" />
          </Step>
          <Step>
            <Stat value={15} suffix="分鐘" size={96} suffixSize={40} label="有線快充至 50%" />
          </Step>
          <Step>
            <Stat value={7} suffix="小時" size={96} suffixSize={40} label="Pro Max 充電 5 分鐘，可播放的影片時長" />
          </Step>
        </Steps>
      </div>
    </div>
  </Stage>
);

// 18 · Pro — pro photography tools
const ProTools: Page = () => (
  <Stage>
    <ProductTag>iPhone 18 Pro</ProductTag>
    <Rise style={{ position: 'absolute', left: 120, top: 172 }}>
      <h2 style={headline(72)}>為專業而生的相機控制。</h2>
    </Rise>
    <Rise delay={150} style={{ position: 'absolute', left: 120, top: 270 }}>
      <Sub size={32}>手動光圈、快門與白平衡；每一張照片，都能驗證真實。</Sub>
    </Rise>
    <div style={{ position: 'absolute', left: 120, top: 400 }}>
      <div style={{ display: 'flex', gap: 60 }}>
        <Steps>
          <Step>
            <Sample src={proControls} title="Pro 控制" caption="光圈・快門速度・白平衡・直方圖" />
          </Step>
          <Step>
            <Sample src={proReferenceImage} title="Apple 參考影像" caption="感光元件簽章，驗證照片真實性" />
          </Step>
          <Step>
            <Sample src={proZoom8x} title="8 倍光學品質變焦" caption="Center Stage 前置相機・1800 萬像素" />
          </Step>
        </Steps>
      </div>
    </div>
  </Stage>
);

// 19 · Pro — price & dates
const PriceBlock = ({ name, price, delay }: { name: string; price: number; delay?: number }) => (
  <div>
    <div style={{ fontSize: 36, fontWeight: 600, color: '#a1a1a6', letterSpacing: '-0.01em' }}>{name}</div>
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 14 }}>
      <Num value={price} prefix="NT$" delay={delay} duration={1500} style={{ fontSize: 120 }} />
      <span style={{ ...digits, fontSize: 48, letterSpacing: '-0.02em' }}>起</span>
    </div>
  </div>
);

const ProPrice: Page = () => (
  <Stage>
    <ProductTag>iPhone 18 Pro</ProductTag>
    <div style={{ position: 'absolute', left: 120, top: 190, width: 1000 }}>
      <Rise>
        <PriceBlock name="iPhone 18 Pro・6.3 吋" price={44900} />
      </Rise>
      <Rise delay={200} style={{ marginTop: 48 }}>
        <PriceBlock name="iPhone 18 Pro Max・6.9 吋" price={49900} delay={200} />
      </Rise>
      <Rise delay={400} style={{ marginTop: 56 }}>
        <Sub size={30}>256GB・512GB・1TB・2TB。黑色、銀色、冰川藍色、勃根地紅色。</Sub>
      </Rise>
      <Rise delay={550} style={{ marginTop: 64, display: 'flex', gap: 120 }}>
        <DateBlock date="9 月 12 日" label="晚上 8 點開放預購" />
        <DateBlock date="9 月 18 日" label="正式開賣・iOS 27 於 9 月 14 日推出" />
      </Rise>
    </div>
    <Rise delay={250} kind="zoom" style={{ position: 'absolute', left: 1200, top: 140 }}>
      <Photo src={pro2up} width={600} height={840} />
    </Rise>
  </Stage>
);

// 20 · Summary
const Cell = ({ children, head, label }: { children: ReactNode; head?: boolean; label?: boolean }) => (
  <div
    style={{
      padding: head ? '0 0 24px' : '20px 0',
      fontSize: head ? 40 : 32,
      fontWeight: head ? 700 : label ? 500 : 400,
      color: label ? '#86868b' : '#f5f5f7',
      letterSpacing: head ? '-0.025em' : '-0.005em',
      borderBottom: head ? `1px solid rgba(255,255,255,0.3)` : `1px solid ${DARK.line}`,
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

const Row = ({ label, a, b, c }: { label: string; a: string; b: string; c: string }) => (
  <>
    <Cell label>{label}</Cell>
    <Cell>{a}</Cell>
    <Cell>{b}</Cell>
    <Cell>{c}</Cell>
  </>
);

const Summary: Page = () => (
  <Stage>
    <Rise style={{ position: 'absolute', left: 120, top: 120 }}>
      <h2 style={headline(88)}>一次看懂。</h2>
    </Rise>
    <Rise delay={200} style={{ position: 'absolute', left: 120, top: 300, width: 1680 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 480px 480px 480px', columnGap: 0 }}>
        <Cell head>{' '}</Cell>
        <Cell head>iPhone Duo</Cell>
        <Cell head>iPhone 18 Pro</Cell>
        <Cell head>iPhone 18 Pro Max</Cell>
        <Row label="顯示器" a="7.6 吋 + 5.4 吋" b="6.3 吋" c="6.9 吋" />
        <Row label="晶片" a="A20 Pro" b="A20 Pro" c="A20 Pro" />
        <Row label="主相機" a="4800 萬 雙融合" b="4800 萬 可變光圈" c="4800 萬 可變光圈" />
        <Row label="影片播放" a="31–44 小時" b="34 小時" c="43 小時" />
        <Row label="售價" a="NT$74,900 起" b="NT$44,900 起" c="NT$49,900 起" />
        <Row label="開賣" a="10 月 23 日" b="9 月 18 日" c="9 月 18 日" />
      </div>
    </Rise>
    <Rise delay={500} kind="fade" style={{ position: 'absolute', left: 120, top: 980 }}>
      <div style={{ fontSize: 24, color: '#6e6e73' }}>
        資料來源：Apple Newsroom「Apple 發表 iPhone Duo」「Apple 推出 iPhone 18 Pro 和 iPhone 18 Pro Max」（2026 年 9 月 9 日）・apple.com/tw 技術規格
      </div>
    </Rise>
  </Stage>
);

// ─── Module exports ──────────────────────────────────────────────────────────
export const meta: SlideMeta = {
  title: 'Apple 秋季發表會 2026 — iPhone Duo 與 iPhone 18 Pro',
  createdAt: '2026-09-10T11:13:33.978Z',
};

export default [
  Cover,
  Lineup,
  DuoIntro,
  DuoDesign,
  DuoThin,
  DuoDisplay,
  DuoPoses,
  DuoSplitView,
  DuoCamera,
  DuoPower,
  DuoPrice,
  ProIntro,
  ProColors,
  ProAperture,
  ProDepth,
  ProChip,
  ProBattery,
  ProTools,
  ProPrice,
  Summary,
] satisfies Page[];
