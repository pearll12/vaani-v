"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  MessageSquare, Mic, FileText, CreditCard, BarChart3, Bell,
  Package, Phone, Mail, ArrowRight, AlertTriangle, ShoppingCart,
  Zap, Globe, ChevronDown, Layers, Users, ShoppingBag, Send, Heart, Check,
} from "lucide-react";

/* ═══════════════ WARM EARTHY PALETTE ═══════════════ */
const P = {
  bg: "#FFF8F0", surface: "#FFF1E6", card: "#FFFFFF",
  border: "rgba(92,61,46,0.08)", borderM: "rgba(92,61,46,0.14)",
  text: "#3D2C23", soft: "#6B5B50", muted: "#A89888",
  primary: "#E07A5F", primaryL: "#FCE8E2", primaryD: "#C4614A",
  sage: "#6B8F71", sageL: "#D4E7D0",
  amber: "#D4A373", amberL: "#FDE8CD",
  teal: "#5B9EA6", tealL: "#D3EEF0",
  purple: "#8B6DB0", purpleL: "#E8DDF2",
  rose: "#D4596E", roseL: "#F8DDE3",
  wa: "#25D366", waL: "#D1FAE5",
  shadow: "0 4px 24px rgba(92,61,46,0.06)",
  shadowM: "0 8px 32px rgba(92,61,46,0.10)",
  shadowL: "0 16px 48px rgba(92,61,46,0.12)",
};

/* ═══════════════ UTILITIES ═══════════════ */
function Reveal({ children, delay = 0, x = 0, y = 30 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, x, y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

function FIcon({ icon: Icon, size = 24, color, bg, dur = 3 }) {
  return (
    <motion.div animate={{ y: [0, -5, 0] }}
      transition={{ repeat: Infinity, duration: dur, ease: "easeInOut" }}
      whileHover={{ scale: 1.12, rotate: 8 }}
      style={{
        width: size * 2.2, height: size * 2.2, borderRadius: size * 0.65,
        background: bg, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0
      }}>
      <Icon size={size} color={color} strokeWidth={2} />
    </motion.div>
  );
}

function PersonFig({ color = P.primary, flip = false, delay = 0 }) {
  return (
    <motion.div animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 2.5, delay, ease: "easeInOut" }}
      style={{
        display: "inline-flex", flexDirection: "column", alignItems: "center",
        transform: flip ? "scaleX(-1)" : "none"
      }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#FDDCB5",
        boxShadow: "inset -2px -2px 0 #ECC9A0"
      }} />
      <div style={{ width: 22, height: 18, background: color, borderRadius: "8px 8px 3px 3px", marginTop: 2 }} />
      <div style={{ display: "flex", gap: 2, marginTop: 1 }}>
        <div style={{ width: 7, height: 12, background: "#5C4033", borderRadius: "0 0 3px 3px" }} />
        <div style={{ width: 7, height: 12, background: "#5C4033", borderRadius: "0 0 3px 3px" }} />
      </div>
    </motion.div>
  );
}

function CartFig() {
  return (
    <motion.div animate={{ x: [-8, 8, -8], rotate: [-2, 2, -2] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      style={{ display: "inline-block", position: "relative", width: 44, height: 38 }}>
      <div style={{
        position: "absolute", bottom: 10, left: 4, width: 32, height: 18,
        background: P.primary, borderRadius: "2px 2px 6px 6px", boxShadow: `inset -3px -3px 0 ${P.primaryD}`
      }}>
        <div style={{ position: "absolute", top: -5, left: 4, width: 8, height: 8, background: P.sage, borderRadius: 3, transform: "rotate(10deg)" }} />
        <div style={{ position: "absolute", top: -7, right: 4, width: 7, height: 10, background: P.amber, borderRadius: 3, transform: "rotate(-5deg)" }} />
      </div>
      <div style={{
        position: "absolute", bottom: 26, left: 8, width: 12, height: 10,
        border: `2.5px solid ${P.primaryD}`, borderBottom: "none", borderRadius: "6px 6px 0 0"
      }} />
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        style={{ position: "absolute", bottom: 2, left: 8, width: 8, height: 8, borderRadius: "50%", background: "#5C3D2E", border: `2px solid ${P.amber}` }} />
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        style={{ position: "absolute", bottom: 2, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#5C3D2E", border: `2px solid ${P.amber}` }} />
    </motion.div>
  );
}

function WaveDivider({ from, to, children }) {
  return (
    <div style={{ position: "relative", background: from, marginBottom: -1, overflow: "hidden" }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 80 }}>
        <path d="M0,20 C320,80 520,0 720,40 C920,80 1120,10 1440,30 L1440,80 L0,80 Z" fill={to} />
      </svg>
      {children && (
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", zIndex: 5, display: "flex", gap: 20, alignItems: "flex-end" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ NAVBAR ═══════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 72, padding: "0 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between",
        background: scrolled ? "rgba(255,248,240,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${P.border}` : "none",
        transition: "all 0.35s ease"
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/logo.png" alt="BusinessVaani" style={{ height: 44, width: "auto" }} />
      </div>
      <div className="nav-links" style={{ display: "flex", gap: 32, fontSize: 14 }}>
        {[{ l: "Features", h: "#features" }, { l: "How it works", h: "#how-it-works" },
        { l: "Contact", h: "#contact" }].map(n => (
          <motion.a key={n.l} href={n.h} whileHover={{ color: P.text, y: -1 }}
            style={{ color: P.soft, textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }}>{n.l}</motion.a>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <motion.a href="/login" whileHover={{ background: P.surface }}
          style={{
            padding: "10px 22px", borderRadius: 12, fontSize: 13, fontWeight: 700,
            color: P.text, textDecoration: "none", border: `1px solid ${P.borderM}`,
            transition: "background 0.2s"
          }}>Login</motion.a>
        <motion.a href="/signup" whileHover={{ scale: 1.04, boxShadow: `0 8px 24px ${P.primary}44` }}
          whileTap={{ scale: 0.97 }}
          style={{
            padding: "10px 24px", borderRadius: 12, fontSize: 13, fontWeight: 700,
            background: `linear-gradient(135deg, ${P.primary}, ${P.primaryD})`,
            color: "#fff", textDecoration: "none", boxShadow: `0 4px 14px ${P.primary}33`
          }}>Sign Up</motion.a>
      </div>
    </motion.nav>
  );
}

/* ═══════════════ PHONE ILLUSTRATION ═══════════════ */
const heroMsgs = [
  { text: "bhaiya 2kg aloo bhejna kal", own: false, name: "Ramesh" },
  { text: "Ji zaroor!", own: true },
  { text: "order confirm hai na?", own: false, name: "Priya" },
  { text: "Voice note 0:23", own: false, name: "Suresh", voice: true },
  { text: "mera invoice kab aayega?", own: false, name: "Kavita" },
  { text: "kal payment kar dunga", own: false, name: "Vijay" },
];

function PhoneIllustration() {
  const [count, setCount] = useState(2);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setTyping(true);
      setTimeout(() => { setTyping(false); setCount(c => c < heroMsgs.length ? c + 1 : 2); }, 1000);
    }, 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      style={{
        width: 280, background: P.card, borderRadius: 36,
        boxShadow: `${P.shadowL}, 0 0 0 8px ${P.border}`,
        overflow: "hidden", border: `1px solid ${P.border}`
      }}>
      <div style={{ background: "#075E54", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: P.wa, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShoppingBag size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Sharma Ji Ka Store</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>WhatsApp Business</div>
        </div>
        <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}
          style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#86EFAC" }} />
      </div>
      <div style={{ background: "#F5EDE5", padding: "12px 10px", minHeight: 320, display: "flex", flexDirection: "column", gap: 6, justifyContent: "flex-end" }}>
        <AnimatePresence>
          {heroMsgs.slice(0, count).map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.85, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              style={{ display: "flex", justifyContent: m.own ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "7px 11px",
                borderRadius: m.own ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
                background: m.own ? "#D4E7D0" : P.card,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)", fontSize: 12
              }}>
                {!m.own && <div style={{ fontSize: 10, fontWeight: 700, color: P.primary, marginBottom: 2 }}>{m.name}</div>}
                {m.voice ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: P.sage, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Mic size={13} color="#fff" />
                    </motion.div>
                    <div style={{ flex: 1, height: 2, background: "#ccc", borderRadius: 2, position: "relative" }}>
                      <div style={{ width: "35%", height: "100%", background: P.sage, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, color: P.soft }}>0:23</span>
                  </div>
                ) : <span style={{ color: P.text }}>{m.text}</span>}
                <div style={{ fontSize: 9, color: P.muted, textAlign: "right", marginTop: 2 }}>
                  {["9:12", "9:13", "9:45", "10:02", "10:33", "11:01"][i]} {m.own && "✓✓"}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: "flex", gap: 4, padding: "8px 12px", background: P.card, borderRadius: "4px 14px 14px 14px", width: "fit-content", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: P.muted }} />
            ))}
          </motion.div>
        )}
      </div>
      <div style={{ background: "#EDE5DC", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, background: P.card, borderRadius: 20, padding: "7px 14px", fontSize: 12, color: P.muted }}>Type a message</div>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: P.sage, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mic size={16} color="#fff" />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════ CHAOS ILLUSTRATION ═══════════════ */
const chaosItems = [
  { icon: Package, msg: "bhaiya 2kg aloo", x: "5%", y: "10%", rot: -8, color: P.sage, bg: P.sageL, delay: 0 },
  { icon: AlertTriangle, msg: "kal dunga bhaiya", x: "60%", y: "5%", rot: 5, color: P.amber, bg: P.amberL, delay: 0.1 },
  { icon: Mic, msg: "Voice 0:42", x: "20%", y: "35%", rot: -3, color: P.purple, bg: P.purpleL, delay: 0.2 },
  { icon: FileText, msg: "invoice kab?", x: "55%", y: "30%", rot: 7, color: P.rose, bg: P.roseL, delay: 0.3 },
  { icon: Zap, msg: "HELLO??", x: "8%", y: "60%", rot: -10, color: P.rose, bg: P.roseL, delay: 0.4 },
  { icon: ShoppingBag, msg: "order cancel!", x: "65%", y: "58%", rot: 4, color: P.amber, bg: P.amberL, delay: 0.5 },
  { icon: Package, msg: "5kg tamatar", x: "35%", y: "68%", rot: -6, color: P.sage, bg: P.sageL, delay: 0.6 },
  { icon: FileText, msg: "receipt bhejo", x: "70%", y: "80%", rot: 8, color: P.teal, bg: P.tealL, delay: 0.7 },
];

function ChaosIllustration() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height: 380 }}>
      <motion.div animate={{ rotate: [-5, 5, -5], y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        style={{ position: "absolute", left: "50%", top: "28%", transform: "translateX(-50%)" }}>
        <FIcon icon={AlertTriangle} size={40} color={P.rose} bg={P.roseL} dur={1.4} />
      </motion.div>
      <div style={{
        position: "absolute", left: "50%", top: "66%", transform: "translateX(-50%)",
        fontSize: 12, fontWeight: 600, color: P.rose, background: P.roseL,
        padding: "4px 12px", borderRadius: 999, border: `1px solid ${P.rose}33`, whiteSpace: "nowrap"
      }}>Can&apos;t keep up!</div>
      {chaosItems.map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0, rotate: item.rot * 2 }}
          animate={inView ? { opacity: 1, scale: 1, rotate: item.rot, y: [0, -4, 0] } : {}}
          transition={{ delay: item.delay, duration: 0.5, y: { repeat: Infinity, duration: 2 + i * 0.3, ease: "easeInOut" } }}
          style={{ position: "absolute", left: item.x, top: item.y }}>
          <div style={{
            padding: "6px 12px", borderRadius: 12, background: item.bg, border: `1px solid ${P.border}`, boxShadow: P.shadow,
            fontSize: 12, fontWeight: 600, color: P.text, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6
          }}>
            <item.icon size={14} color={item.color} strokeWidth={2.2} /> {item.msg}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════ HORIZONTAL SCROLL WRAPPER ═══════════════ */
function HorizontalSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
  const progressW = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Background Image Element for both mobile and desktop
  const BgImageLayer = () => (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(/large_retail.png)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5 }} />
      {/* Soft gradient overlay to ensure text is extremely readable */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom right, rgba(255,248,240,0.85) 0%, rgba(255,248,240,0.6) 100%)" }} />
    </div>
  );

  return (
    <div ref={ref} className="horizontal-wrapper" style={{ height: "200vh" }}>
      <div className="horizontal-sticky" style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

        <BgImageLayer />

        <motion.div className="horizontal-container" style={{ display: "flex", width: "200vw", height: "100vh", x, zIndex: 1, position: "relative" }}>
          <div className="horizontal-panel" style={{ width: "100vw", height: "100vh", flexShrink: 0, overflow: "hidden", background: "transparent" }}>
            <HeroContent />
          </div>
          <div className="horizontal-panel" style={{ width: "100vw", height: "100vh", flexShrink: 0, overflow: "hidden", background: "rgba(255,241,230,0.7)" }}>
            <ProblemContent />
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div className="scroll-indicators" style={{ position: "absolute", bottom: 0, left: 0, height: 4, background: `linear-gradient(90deg, ${P.primary}, ${P.amber})`, width: progressW, borderRadius: 2, zIndex: 10 }} />
      </div>
    </div>
  );
}

/* ═══════════════ HERO CONTENT ═══════════════ */
function HeroContent() {
  return (
    <section style={{
      height: "100%", display: "flex", alignItems: "center",
      padding: "80px 40px 40px", position: "relative", overflow: "hidden"
    }}>
      {[{ c: P.sageL, x: "-5%", y: "10%", s: 500 }, { c: P.purpleL, x: "70%", y: "-5%", s: 400 },
      { c: P.amberL, x: "80%", y: "70%", s: 350 }, { c: P.primaryL, x: "-8%", y: "70%", s: 300 }]
        .map((b, i) => (
          <motion.div key={i} animate={{ scale: [1, 1.08, 1], x: [0, 10, 0], y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 8 + i * 2, ease: "easeInOut" }}
            style={{ position: "absolute", left: b.x, top: b.y, width: b.s, height: b.s, borderRadius: "50%", background: b.c, filter: "blur(80px)", opacity: 0.7, pointerEvents: "none" }} />
        ))}
      <div className="hero-grid" style={{
        maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid",
        gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", position: "relative", zIndex: 2
      }}>
        <div>
          <motion.h1 className="hero-text-grad" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.03em", color: P.text, margin: "0 0 20px" }}>
            Orders are coming. <br />
            <span style={{ background: `linear-gradient(135deg, ${P.primary}, ${P.primaryD})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Are you keeping up?
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            style={{ fontSize: 17, color: P.text, lineHeight: 1.75, marginBottom: 36, maxWidth: 480, fontWeight: 500 }}>
            BusinessVaani turns your WhatsApp chaos into a clean, automated business — orders, invoices, payments. In Hindi, Tamil, Telugu, Marathi, and more. Automatically.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <motion.a href="/login" whileHover={{ scale: 1.05, boxShadow: `0 12px 32px ${P.primary}55` }} whileTap={{ scale: 0.97 }}
              style={{
                padding: "15px 32px", borderRadius: 14, fontSize: 16, fontWeight: 800, background: `linear-gradient(135deg, ${P.primary}, ${P.primaryD})`,
                color: "#fff", textDecoration: "none", boxShadow: `0 6px 22px ${P.primary}44`, display: "flex", alignItems: "center", gap: 8
              }}>Get Started <ArrowRight size={18} /></motion.a>
            <motion.a href="#how-it-works" whileHover={{ background: P.card, borderColor: P.borderM }}
              style={{
                padding: "15px 24px", borderRadius: 14, fontSize: 15, fontWeight: 700, background: "transparent", border: `2px solid ${P.borderM}`,
                color: P.text, cursor: "pointer", textDecoration: "none", transition: "all 0.2s"
              }}>See How It Works</motion.a>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ marginTop: 28, fontSize: 13, color: P.soft, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            {[{ icon: Globe, t: "Built for India" }, { icon: MessageSquare, t: "10+ Languages" }, { icon: Zap, t: "AI-Powered" }].map((b, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                <b.icon size={16} color={P.sage} /> {b.t}
              </span>
            ))}
          </motion.div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <PhoneIllustration />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ PROBLEM CONTENT ═══════════════ */
function ProblemContent() {
  const problems = [
    { icon: Package, title: "Orders get missed", desc: "You can't track who ordered what, when, or how much.", color: P.rose, bg: P.roseL },
    { icon: Mic, title: "Voice notes pile up", desc: "Customers send audio in Hindi, Tamil, Gujarati — you can't keep up.", color: P.amber, bg: P.amberL },
    { icon: CreditCard, title: "Payments go untracked", desc: "\"Kal dunga\" becomes next week, then never.", color: P.purple, bg: P.purpleL },
  ];
  return (
    <section style={{ height: "100%", display: "flex", alignItems: "center", padding: "80px 40px 40px" }}>
      <div className="problem-grid" style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div><ChaosIllustration /></div>
        <div>
          <Reveal>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: P.rose, marginBottom: 14 }}>THE PROBLEM</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", color: P.text, margin: "0 0 20px", lineHeight: 1.12 }}>
              Running a business on WhatsApp <span style={{ color: P.rose }}>is chaos.</span>
            </h2>
            <p style={{ fontSize: 15, color: P.soft, lineHeight: 1.8, marginBottom: 28, fontWeight: 500 }}>
              Messages pile up. Voice notes you can&apos;t process. Orders in multiple languages. Manual tracking. Missed payments. And exhaustion.
            </p>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {problems.map((p, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <motion.div whileHover={{ x: 6 }} style={{
                  display: "flex", gap: 16, padding: "16px 20px", borderRadius: 16, background: P.card,
                  border: `1px solid ${P.border}`, boxShadow: P.shadow, transition: "all 0.2s"
                }}>
                  <FIcon icon={p.icon} size={20} color={p.color} bg={p.bg} dur={2.5 + i} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: P.text, marginBottom: 4 }}>{p.title}</div>
                    <div style={{ fontSize: 13, color: P.soft, lineHeight: 1.6 }}>{p.desc}</div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ HOW IT WORKS ═══════════════ */
function FlowStep({ icon: Icon, label, sub, color, bg, index, isLast }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={inView ? { scale: 1, rotate: 0 } : {}}
          transition={{ delay: index * 0.15, type: "spring", stiffness: 240, damping: 20 }}
          style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: bg, border: `2px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${color}22` }}>
          <Icon size={22} color={color} strokeWidth={2} />
        </motion.div>
        {!isLast && <motion.div initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : {}} transition={{ delay: index * 0.15 + 0.3, duration: 0.5 }} style={{ width: 2, height: 36, background: `linear-gradient(${color}, ${color}22)`, transformOrigin: "top", margin: "4px 0" }} />}
      </div>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: index * 0.15 + 0.1, duration: 0.5 }} style={{ marginLeft: 20, paddingTop: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: P.text }}>{label}</div>
        <div style={{ fontSize: 13, color: P.soft, marginTop: 3, lineHeight: 1.6 }}>{sub}</div>
      </motion.div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: MessageSquare, label: "Customer sends a WhatsApp message", sub: "Any language — Hindi, Hinglish, Tamil, voice note. BusinessVaani understands it all.", color: P.sage, bg: P.sageL },
    { icon: Zap, label: "AI parses the order instantly", sub: "\"bhaiya 2kg aloo bhejna\" becomes Item: Aloo, Qty: 2kg, Customer: Ramesh. Instantly.", color: P.purple, bg: P.purpleL },
    { icon: Layers, label: "Structured order created", sub: "Order appears in your dashboard with every detail auto-filled.", color: P.teal, bg: P.tealL },
    { icon: FileText, label: "Invoice auto-generated & sent", sub: "A professional PDF invoice is generated and sent via WhatsApp in seconds.", color: P.primary, bg: P.primaryL },
    { icon: CreditCard, label: "Payment link sent automatically", sub: "Razorpay link via WhatsApp. UPI, cards, net banking. Money in your account.", color: P.amber, bg: P.amberL },
  ];
  return (
    <section id="how-it-works" style={{ padding: "100px 40px", background: P.bg }}>
      <div className="how-it-works-grid" style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
        <div>
          <Reveal>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: P.sage, marginBottom: 14 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", color: P.text, margin: "0 0 16px", lineHeight: 1.12 }}>
              From chat to cash. <span style={{ color: P.sage }}>Automatically.</span>
            </h2>
            <p style={{ fontSize: 15, color: P.soft, lineHeight: 1.8, marginBottom: 40 }}>You just chat. Vaani does everything else — in the background, silently.</p>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {steps.map((s, i) => <FlowStep key={i} {...s} index={i} isLast={i === steps.length - 1} />)}
          </div>
        </div>
        <Reveal delay={0.2} x={30} y={0}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} style={{ position: "sticky", top: 100 }}>
            <div style={{ background: P.card, borderRadius: 24, boxShadow: P.shadowL, border: `1px solid ${P.border}`, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${P.border}`, display: "flex", alignItems: "center", gap: 12, background: P.surface }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${P.primary}, ${P.primaryD})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={16} color="#fff" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: P.text }}>Vaani — Order Created</span>
                <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: P.sage }} />
              </div>
              <div style={{ padding: "20px 24px" }}>
                <div style={{ padding: "12px 14px", background: P.sageL, borderRadius: 12, marginBottom: 20, border: `1px solid ${P.sage}22` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: P.sage, marginBottom: 4 }}>ORIGINAL WHATSAPP MESSAGE</div>
                  <div style={{ fontSize: 13, color: P.text, fontStyle: "italic" }}>&quot;bhaiya kal 2kg aloo aur 1kg tamatar bhejna, kal taak chahiye&quot;</div>
                  <div style={{ fontSize: 10, color: P.muted, marginTop: 4 }}>Ramesh Kumar · 9:12 AM</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: P.muted, marginBottom: 12 }}>AI PARSED</div>
                {[{ label: "Customer", val: "Ramesh Kumar", color: P.purple }, { label: "Item 1", val: "Aloo — 2 kg", color: P.sage }, { label: "Item 2", val: "Tamatar — 1 kg", color: P.teal }, { label: "Amount", val: "₹840", color: P.amber }, { label: "Deliver by", val: "Tomorrow", color: P.rose }].map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 4 ? `1px solid ${P.border}` : "none" }}>
                    <span style={{ fontSize: 12, color: P.soft }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.val}</span>
                  </motion.div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  {[{ label: "Invoice Sent", icon: FileText, color: P.sage, bg: P.sageL }, { label: "Payment Link", icon: CreditCard, color: P.purple, bg: P.purpleL }].map((a, i) => (
                    <motion.div key={i} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.15, type: "spring" }} style={{ flex: 1, padding: "10px", borderRadius: 10, background: a.bg, border: `1px solid ${a.color}33`, fontSize: 12, fontWeight: 700, color: a.color, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <a.icon size={14} /> {a.label}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════ FEATURES ═══════════════ */
function FeatureCard({ icon: Icon, title, desc, color, bg, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      style={{ padding: "32px 28px", borderRadius: 22, background: P.card, borderTop: `1px solid ${hov ? color + "44" : P.border}`, borderRight: `1px solid ${hov ? color + "44" : P.border}`, borderBottom: `1px solid ${hov ? color + "44" : P.border}`, borderLeft: `6px solid ${color}`, boxShadow: hov ? `${P.shadowM}, 0 0 0 4px ${color}11` : P.shadow, transition: "all 0.3s ease", cursor: "default", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${bg}`, opacity: 0.5 }} />
      <motion.div animate={hov ? { scale: 1.15, rotate: 10, y: -4 } : { scale: 1, rotate: 0, y: 0 }} style={{ width: 56, height: 56, borderRadius: 18, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: `0 4px 16px ${color}22`, position: "relative", zIndex: 1 }}>
        <Icon size={26} color={color} strokeWidth={2} />
      </motion.div>
      <div style={{ fontSize: 17, fontWeight: 800, color: P.text, marginBottom: 10, position: "relative", zIndex: 1 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: P.soft, lineHeight: 1.75, position: "relative", zIndex: 1 }}>{desc}</div>
    </motion.div>
  );
}

function Features() {
  const features = [
    { icon: Globe, title: "Multi-Language AI", desc: "Understands Hindi, Tamil, Telugu, Marathi, English natively. No manual translation needed.", color: P.sage, bg: P.sageL },
    { icon: Mic, title: "Voice Intelligence", desc: "Transcribes voice notes and extracts orders easily. Perfect for busy moments.", color: P.purple, bg: P.purpleL },
    { icon: FileText, title: "Smart Invoicing", desc: "GST-compliant PDF invoices with Razorpay payment links.", color: P.teal, bg: P.tealL },
    { icon: BarChart3, title: "Live Dashboard", desc: "Real-time analytics for orders, revenue, inventory. Zero spreadsheets.", color: P.rose, bg: P.roseL },
    { icon: Package, title: "Inventory & Alerts", desc: "Automatic stock deduction per order with low-stock alerts.", color: P.amber, bg: P.amberL },
    { icon: Bell, title: "Smart Reminders", desc: "Automated payment follow-ups on WhatsApp to recover revenue.", color: P.primary, bg: P.primaryL },
  ];
  return (
    <section id="features" style={{ padding: "80px 40px 100px", background: P.surface }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: P.teal, marginBottom: 14 }}>FEATURES</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", color: P.text, margin: "0 0 12px", lineHeight: 1.12 }}>
              Everything automated. <span style={{ color: P.soft, fontWeight: 500 }}>Nothing manual.</span>
            </h2>
          </div>
        </Reveal>
        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 0.08} />)}
        </div>
      </div>
    </section>
  );
}


/* ═══════════════ PRICING ═══════════════ */
function PricingCard({ title, price, features, color, bg, isPopular, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay, duration: 0.5 }} onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      style={{
        padding: "40px 32px", borderRadius: 28, background: P.card,
        border: `1px solid ${isPopular ? color : P.border}`,
        position: "relative", display: "flex", flexDirection: "column",
        boxShadow: hov ? P.shadowL : isPopular ? P.shadowM : P.shadow,
        transform: hov ? "translateY(-8px)" : "none",
        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
      {isPopular && (
        <div style={{
          position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
          background: color, color: "#fff", padding: "6px 14px", borderRadius: 20,
          fontSize: 11, fontWeight: 800, letterSpacing: "0.05em"
        }}>MOST POPULAR</div>
      )}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: P.text, marginBottom: 8 }}>{title}</h3>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: P.text }}>{price}</span>
          {price !== "Free" && <span style={{ fontSize: 14, color: P.soft }}>/month</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, marginBottom: 36 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14, color: P.soft }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Check size={12} color={color} strokeWidth={3} />
            </div>
            <span>{f}</span>
          </div>
        ))}
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        style={{
          width: "100%", padding: "14px", borderRadius: 14, border: `1.5px solid ${color}`,
          background: hov ? color : "transparent", color: hov ? "#fff" : color,
          fontSize: 14, fontWeight: 700, transition: "all 0.2s"
        }}>
        Get Started
      </motion.button>
    </motion.div>
  );
}

function Pricing() {
  const plans = [
    {
      title: "Basic / Starter", price: "Free", color: P.sage, bg: P.sageL,
      features: ["WhatsApp Text Orders", "Multilingual Support", "Digital Stock Catalog", "Basic Store Dashboard", "Up to 10 Items Limit"]
    },
    {
      title: "Standard / Growth", price: "₹499", color: P.purple, bg: P.purpleL, isPopular: true,
      features: ["Unlimited Order Items", "GST-Compliant Invoices", "Razorpay Payment Links", "Auto Payment Reminders", "Advanced Sales Analytics"]
    },
    {
      title: "Premium / Pro", price: "₹1,499", color: P.teal, bg: P.tealL,
      features: ["AI Voice Note Orders", "Delivery Agent Fleet Mgt", "Customer Khata/Credit Log", "Dedicated Account Manager", "Business Management App"]
    }
  ];
  return (
    <section id="pricing" style={{ padding: "100px 40px", background: P.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: P.purple, marginBottom: 14 }}>PRICING</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", color: P.text, margin: "0 0 16px" }}>
              Tailored plans for <span style={{ color: P.purple }}>every shop size.</span>
            </h2>
            <p style={{ fontSize: 15, color: P.soft, maxWidth: 600, margin: "0 auto" }}>Start for free and scale as your orders grow. No hidden fees.</p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
          {plans.map((p, i) => <PricingCard key={i} {...p} delay={i * 0.1} />)}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ CONTACT US ═══════════════ */
function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", message: "" });
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const inputStyle = { width: "100%", padding: "14px 16px", borderRadius: 12, border: `1px solid ${P.border}`, background: P.bg, fontSize: 14, color: P.text, outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" };

  return (
    <section id="contact" style={{ padding: "80px 40px 100px", background: P.bg }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: P.primary, marginBottom: 14 }}>GET IN TOUCH</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", color: P.text, margin: "0 0 12px" }}>We&apos;d love to hear from you</h2>
            <p style={{ fontSize: 15, color: P.soft, lineHeight: 1.8 }}>Questions about BusinessVaani? Drop us a message.</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <form onSubmit={handleSubmit} style={{ background: P.card, borderRadius: 24, padding: "40px 36px", boxShadow: P.shadowM, border: `1px solid ${P.border}` }}>
            <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div><input style={inputStyle} placeholder="Your Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required disabled={status === "loading"} /></div>
              <div><input type="email" style={inputStyle} placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required disabled={status === "loading"} /></div>
            </div>
            <div style={{ marginBottom: 24 }}><textarea style={{ ...inputStyle, resize: "vertical", minHeight: 120 }} placeholder="Message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required disabled={status === "loading"} /></div>
            <motion.button type="submit" disabled={status === "loading"} whileHover={status === "idle" ? { scale: 1.02, boxShadow: `0 8px 24px ${P.primary}44` } : {}} whileTap={status === "idle" ? { scale: 0.98 } : {}} style={{ width: "100%", padding: "16px 32px", borderRadius: 14, border: "none", background: status === "sent" ? P.sage : status === "error" ? P.rose : P.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: status === "loading" ? "not-allowed" : "pointer", transition: "background 0.3s" }}>
              {status === "loading" ? "Sending..." : status === "sent" ? "Message sent successfully 💗" : status === "error" ? "Error Sending" : "Send Message"}
            </motion.button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════ WHATSAPP TWILIO FAB ═══════════════ */
function WhatsAppTwilio() {
  const TWILIO_PHONE = "+14155238886";
  const TWILIO_JOIN_CODE = "join bee-aware";
  const [showLabel, setShowLabel] = useState(false);
  return (
    <>
      <AnimatePresence>
        {showLabel && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            style={{ position: "fixed", bottom: 38, right: 94, zIndex: 999, padding: "8px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: P.wa, color: "#fff", boxShadow: P.shadow, whiteSpace: "nowrap", fontFamily: "monospace" }}>
            {TWILIO_JOIN_CODE}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.a onMouseEnter={() => setShowLabel(true)} onMouseLeave={() => setShowLabel(false)}
        href={`https://wa.me/${TWILIO_PHONE}/?text=${encodeURIComponent(TWILIO_JOIN_CODE)}`} target="_blank" rel="noopener noreferrer"
        whileHover={{ scale: 1.12, boxShadow: `0 12px 32px ${P.wa}55` }} whileTap={{ scale: 0.95 }} animate={{ y: [0, -6, 0] }} transition={{ y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }}
        style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1000, width: 62, height: 62, borderRadius: "50%", border: "none", background: `linear-gradient(135deg, ${P.wa}, #16A34A)`, boxShadow: `0 8px 24px ${P.wa}55`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
        <MessageSquare size={28} color="#fff" />
      </motion.a>
    </>
  );
}

/* ═══════════════ FOOTER ═══════════════ */
function Footer() {
  const linkStyle = { display: "block", fontSize: 13, color: "rgba(255,255,255,0.55)", textDecoration: "none", marginBottom: 12, transition: "color 0.2s" };
  return (
    <footer style={{ background: "#1A110D", color: "#fff", padding: "80px 40px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
          <div>
            <img src="/logo.png" alt="BusinessVaani" style={{ height: 44, filter: "brightness(8)", marginBottom: 16 }} />
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, maxWidth: 300, lineHeight: 1.8 }}>Built specifically for Indian shopkeepers. Scale your retail or wholesale business using the power of WhatsApp AI.</p>
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 18, color: P.amber, letterSpacing: "0.08em" }}>PRODUCT</h4>
            {["Features", "Dashboard", "Pricing"].map(l => <a key={l} href="#" style={linkStyle}>{l}</a>)}
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 18, color: P.amber, letterSpacing: "0.08em" }}>COMPANY</h4>
            {["About Us", "Contact"].map(l => <a key={l} href="#" style={linkStyle}>{l}</a>)}
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 18, color: P.amber, letterSpacing: "0.08em" }}>SUPPORT</h4>
            {["Help Center", "WhatsApp API"].map(l => <a key={l} href="#" style={linkStyle}>{l}</a>)}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          <span>© 2025 BusinessVaani. All rights reserved.</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>Made with <Heart size={12} fill={P.primary} color={P.primary} /> in India</span>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════ ROOT PAGE ═══════════════ */
export default function Page() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} html{scroll-behavior:smooth}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:${P.bg};color:${P.text}; overflow-x: hidden;}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:${P.amber};border-radius:999px}
        @media(max-width:768px){
          .nav-links{display:none!important}
          .hero-grid, .problem-grid, .how-it-works-grid, .footer-grid, .contact-grid, .features-grid { grid-template-columns: 1fr!important; gap: 40px!important; }
          .contact-grid { gap: 16px!important; }
          .horizontal-wrapper { height: auto!important; }
          .horizontal-sticky { position: relative!important; height: auto!important; overflow: hidden!important; }
          .horizontal-container { flex-direction: column!important; width: 100%!important; height: auto!important; transform: none!important; }
          .horizontal-panel { width: 100%!important; height: auto!important; padding: 20px 0!important; overflow: hidden!important; }
          .scroll-indicators { display: none!important; }
          section { padding: 80px 20px!important; }
          .hero-grid { text-align: center; }
          .hero-grid h1 { font-size: 38px!important; margin-top: 20px!important; }
          .hero-grid p { margin: 0 auto 30px!important; }
          .hero-grid > div > div { justify-content: center; }
          .hero-text-grad { padding-top: 32px; }
          form { padding: 32px 24px!important; }
        }
      `}</style>
      <Navbar />
      <WhatsAppTwilio />
      <HorizontalSection />
      <WaveDivider from={P.surface} to={P.bg}>
        <PersonFig color={P.sage} />
        <CartFig />
        <PersonFig color={P.primary} flip delay={0.4} />
      </WaveDivider>
      <div id="how-it-works"><HowItWorks /></div>
      <WaveDivider from={P.bg} to={P.surface}>
        <PersonFig color={P.purple} delay={0.2} />
        <ShoppingCart size={28} color={P.amber} style={{ marginBottom: 4 }} />
        <PersonFig color={P.teal} flip delay={0.6} />
      </WaveDivider>
      <div id="features"><Features /></div>
      <WaveDivider from={P.surface} to={P.bg} />
      <div id="pricing"><Pricing /></div>
      <WaveDivider from={P.bg} to={P.surface} />
      <ContactUs />
      <Footer />
    </>
  );
}
