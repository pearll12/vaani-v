"use client";
// ← AI bot FAB + all navbar/copy fixes applied
import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

/* ─── Palette ──────────────────────────────────────────────────────── */
const P = {
  bg: "#FFFBF5",
  surface: "#FFF8EF",
  card: "#FFFFFF",
  border: "rgba(28,25,23,0.08)",
  borderM: "rgba(28,25,23,0.14)",
  text: "#1C1917",
  soft: "#57534E",
  muted: "#A8A29E",
  green: "#16A34A",
  greenL: "#DCFCE7",
  greenM: "#86EFAC",
  wa: "#25D366",
  waL: "#D1FAE5",
  purple: "#7C3AED",
  purpleL: "#EDE9FE",
  teal: "#0891B2",
  tealL: "#CFFAFE",
  rose: "#E11D48",
  roseL: "#FFE4E6",
  amber: "#D97706",
  amberL: "#FEF3C7",
  shadow: "0 4px 24px rgba(28,25,23,0.08)",
  shadowM: "0 8px 40px rgba(28,25,23,0.12)",
  shadowL: "0 20px 60px rgba(28,25,23,0.14)",
};

/* ─── Reveal wrapper ───────────────────────────────────────────────── */
function Reveal({ children, delay = 0, x = 0, y = 30, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, x, y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

/* ─── Animated WhatsApp phone illustration ─────────────────────────── */
const heroMsgs = [
  { text: "bhaiya 2kg aloo bhejna kal 🙏", own: false, name: "Ramesh" },
  { text: "Ji zaroor!", own: true },
  { text: "order confirm hai na?", own: false, name: "Priya" },
  { text: "🎤 Voice note 0:23", own: false, name: "Suresh", voice: true },
  { text: "mera invoice kab aayega?", own: false, name: "Kavita" },
  { text: "kal payment kar dunga 🙏", own: false, name: "Vijay" },
];

function PhoneIllustration() {
  const [count, setCount] = useState(2);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setCount(c => c < heroMsgs.length ? c + 1 : 2);
      }, 1000);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      style={{
        width: 280, background: P.card, borderRadius: 36,
        boxShadow: `${P.shadowL}, 0 0 0 8px ${P.border}`,
        overflow: "hidden", border: `1px solid ${P.border}`,
      }}
    >
      {/* Status bar */}
      <div style={{ background: "#075E54", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: P.wa, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏪</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Sharma Ji Ka Store</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>WhatsApp Business</div>
        </div>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}
          style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: P.greenM }}
        />
      </div>

      {/* Chat area */}
      <div style={{ background: "#ECE5DD", padding: "12px 10px", minHeight: 320, display: "flex", flexDirection: "column", gap: 6, justifyContent: "flex-end" }}>
        <AnimatePresence>
          {heroMsgs.slice(0, count).map((m, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.85, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              style={{ display: "flex", justifyContent: m.own ? "flex-end" : "flex-start" }}
            >
              <div style={{
                maxWidth: "80%", padding: "7px 11px", borderRadius: m.own ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
                background: m.own ? "#DCF8C6" : P.card,
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                fontSize: 12,
              }}>
                {!m.own && <div style={{ fontSize: 10, fontWeight: 700, color: P.purple, marginBottom: 2 }}>{m.name}</div>}
                {m.voice ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: P.wa, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>▶</motion.div>
                    <div style={{ flex: 1, height: 2, background: "#ccc", borderRadius: 2, position: "relative" }}>
                      <div style={{ width: "35%", height: "100%", background: P.wa, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, color: P.soft }}>0:23</span>
                  </div>
                ) : (
                  <span style={{ color: P.text }}>{m.text}</span>
                )}
                <div style={{ fontSize: 9, color: P.muted, textAlign: "right", marginTop: 2 }}>
                  {["9:12", "9:13", "9:45", "10:02", "10:33", "11:01"][i]} {m.own && "✓✓"}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 4, padding: "8px 12px", background: P.card, borderRadius: "4px 14px 14px 14px", width: "fit-content", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#90949c" }} />
            ))}
          </motion.div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ background: "#F0F0F0", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, background: P.card, borderRadius: 20, padding: "7px 14px", fontSize: 12, color: P.muted }}>Type a message</div>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: P.wa, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎤</div>
      </div>
    </motion.div>
  );
}

/* ─── Chaos bubbles illustration ───────────────────────────────────── */
const chaosItems = [
  { msg: "bhaiya 2kg aloo", icon: "😅", x: "5%", y: "10%", rot: -8, color: P.waL, delay: 0 },
  { msg: "kal dunga bhaiya", icon: "⏰", x: "60%", y: "5%", rot: 5, color: P.amberL, delay: 0.1 },
  { msg: "🎤 Voice 0:42", icon: "🎤", x: "20%", y: "35%", rot: -3, color: P.purpleL, delay: 0.2 },
  { msg: "invoice kab?", icon: "❓", x: "55%", y: "30%", rot: 7, color: P.roseL, delay: 0.3 },
  { msg: "HELLO??", icon: "😠", x: "8%", y: "60%", rot: -10, color: P.roseL, delay: 0.4 },
  { msg: "order cancel!", icon: "❌", x: "65%", y: "58%", rot: 4, color: P.amberL, delay: 0.5 },
  { msg: "5kg tamatar", icon: "🍅", x: "35%", y: "68%", rot: -6, color: P.waL, delay: 0.6 },
  { msg: "receipt bhejo", icon: "🧾", x: "70%", y: "80%", rot: 8, color: P.tealL, delay: 0.7 },
];

function ChaosIllustration() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height: 380 }}>
      {/* Central stressed emoji */}
      <motion.div
        animate={{ rotate: [-5, 5, -5], y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        style={{ position: "absolute", left: "50%", top: "28%", transform: "translateX(-50%)", fontSize: 80, filter: "drop-shadow(0 8px 24px rgba(225,29,72,0.15))" }}
      >😰</motion.div>
      <div style={{ position: "absolute", left: "50%", top: "66%", transform: "translateX(-50%)", fontSize: 12, fontWeight: 600, color: P.rose, background: P.roseL, padding: "4px 12px", borderRadius: 999, border: `1px solid ${P.rose}33`, whiteSpace: "nowrap" }}>Can't keep up! 📱💥</div>

      {chaosItems.map((item, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, scale: 0, rotate: item.rot * 2 }}
          animate={inView ? { opacity: 1, scale: 1, rotate: item.rot, y: [0, -4, 0] } : {}}
          transition={{ delay: item.delay, duration: 0.5, y: { repeat: Infinity, duration: 2 + i * 0.3, ease: "easeInOut" } }}
          style={{ position: "absolute", left: item.x, top: item.y }}
        >
          <div style={{
            padding: "7px 12px", borderRadius: 12, background: item.color,
            border: `1px solid rgba(28,25,23,0.08)`,
            boxShadow: P.shadow, fontSize: 12, fontWeight: 600,
            color: P.text, whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>{item.icon}</span>{item.msg}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Flow step ────────────────────────────────────────────────────── */
function FlowStep({ icon, label, sub, color, colorL, index, isLast }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={inView ? { scale: 1, rotate: 0 } : {}}
          transition={{ delay: index * 0.15, type: "spring", stiffness: 240, damping: 20 }}
          style={{
            width: 56, height: 56, borderRadius: 18, flexShrink: 0,
            background: colorL, border: `2px solid ${color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, boxShadow: `0 4px 16px ${color}22`,
          }}
        >{icon}</motion.div>
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : {}}
            transition={{ delay: index * 0.15 + 0.3, duration: 0.5 }}
            style={{ width: 2, height: 36, background: `linear-gradient(${color}, ${color}22)`, transformOrigin: "top", margin: "4px 0" }}
          />
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: index * 0.15 + 0.1, duration: 0.5 }}
        style={{ marginLeft: 20, paddingTop: 10 }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: P.text }}>{label}</div>
        <div style={{ fontSize: 13, color: P.soft, marginTop: 3, lineHeight: 1.6 }}>{sub}</div>
      </motion.div>
    </div>
  );
}

/* ─── Feature card ─────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, color, colorL, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      style={{
        padding: "28px 26px", borderRadius: 20, background: P.card,
        border: `1px solid ${hov ? color + "44" : P.border}`,
        boxShadow: hov ? `${P.shadowM}, 0 0 0 4px ${color}11` : P.shadow,
        transition: "all 0.3s ease", cursor: "default",
      }}
    >
      <motion.div
        animate={hov ? { scale: 1.1, rotate: 8 } : { scale: 1, rotate: 0 }}
        style={{ width: 52, height: 52, borderRadius: 16, background: colorL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18 }}
      >{icon}</motion.div>
      <div style={{ fontSize: 16, fontWeight: 700, color: P.text, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: P.soft, lineHeight: 1.7 }}>{desc}</div>
    </motion.div>
  );
}

/* ─── Stat card ────────────────────────────────────────────────────── */
function StatCard({ val, label, icon, color, colorL, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const num = parseInt(val.replace(/[^0-9]/g, ""));

  useEffect(() => {
    if (!inView) return;
    let v = 0;
    const t = setInterval(() => {
      v += Math.ceil(num / 50);
      if (v >= num) { setCount(num); clearInterval(t); }
      else setCount(v);
    }, 30);
    return () => clearInterval(t);
  }, [inView, num]);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }} transition={{ delay, type: "spring", stiffness: 180 }}
      whileHover={{ y: -4, boxShadow: P.shadowL }}
      style={{ padding: "28px", borderRadius: 20, background: P.card, border: `1px solid ${P.border}`, boxShadow: P.shadow, textAlign: "center", transition: "box-shadow 0.3s" }}
    >
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color, letterSpacing: "-0.03em" }}>
        {val.includes("+") ? `${count}+` : val.includes("%") ? `${count}%` : val.includes("x") ? `${count}x` : val}
      </div>
      <div style={{ fontSize: 13, color: P.soft, marginTop: 6, fontWeight: 500 }}>{label}</div>
    </motion.div>
  );
}

/* ─── Navbar ───────────────────────────────────────────────────────── */
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
        height: 62, padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(255,251,245,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${P.border}` : "none",
        transition: "all 0.35s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <motion.div whileHover={{ scale: 1.1, rotate: 6 }}
          style={{
            width: 36, height: 36, borderRadius: 11,
            background: `linear-gradient(135deg, ${P.wa}, ${P.green})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "#fff", fontWeight: 900,
            boxShadow: `0 4px 16px ${P.wa}44`,
          }}
        >V</motion.div>
        <span style={{ fontSize: 18, fontWeight: 800, color: P.text, letterSpacing: "-0.02em" }}>BusinessVaani</span>
      </div>
      <div style={{ display: "flex", gap: 32, fontSize: 14, color: P.soft }}>
        {[
          { label: "Features", href: "#features" },
          { label: "How it works", href: "#how-it-works" },
        ].map(n => (
          <motion.a key={n.label} href={n.href} whileHover={{ color: P.text, y: -1 }} style={{ color: P.soft, textDecoration: "none", transition: "color 0.2s" }}>{n.label}</motion.a>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <motion.a href="/login" whileHover={{ background: P.surface }} style={{ padding: "9px 20px", borderRadius: 11, fontSize: 13, fontWeight: 600, color: P.text, textDecoration: "none", border: `1px solid ${P.border}`, transition: "background 0.2s" }}>Login</motion.a>
        <motion.a href="/login"
          whileHover={{ scale: 1.04, boxShadow: `0 8px 24px ${P.wa}44` }}
          whileTap={{ scale: 0.97 }}
          style={{
            padding: "9px 22px", borderRadius: 11, fontSize: 13, fontWeight: 700,
            background: `linear-gradient(135deg, ${P.wa}, ${P.green})`,
            color: "#fff", textDecoration: "none",
            boxShadow: `0 4px 14px ${P.wa}33`,
          }}
        >Sign Up</motion.a>
      </div>
    </motion.nav>
  );
}

/* ─── Hero section ─────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      minHeight: "100vh", background: P.bg,
      display: "flex", alignItems: "center",
      padding: "80px 40px 40px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Warm background blobs */}
      {[
        { c: P.waL, x: "-5%", y: "10%", s: 500 },
        { c: P.purpleL, x: "70%", y: "-5%", s: 400 },
        { c: P.amberL, x: "80%", y: "70%", s: 350 },
        { c: P.tealL, x: "-8%", y: "70%", s: 300 },
      ].map((b, i) => (
        <motion.div key={i}
          animate={{ scale: [1, 1.08, 1], x: [0, 10, 0], y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 8 + i * 2, ease: "easeInOut" }}
          style={{
            position: "absolute", left: b.x, top: b.y,
            width: b.s, height: b.s, borderRadius: "50%",
            background: b.c, filter: "blur(80px)", opacity: 0.7,
            pointerEvents: "none",
          }}
        />
      ))}

      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", position: "relative", zIndex: 2 }}>
        {/* Left copy */}
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: P.waL, border: `1px solid ${P.wa}33`, fontSize: 12, fontWeight: 700, color: P.green, marginBottom: 24 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: P.wa, display: "inline-block" }} />
            WhatsApp Business Automation · 10+ Indian Languages
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.03em", color: P.text, margin: "0 0 20px" }}
          >
            Orders are coming.
            <br />
            <span style={{ background: `linear-gradient(135deg, ${P.wa}, ${P.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Are you keeping up?
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            style={{ fontSize: 18, color: P.soft, lineHeight: 1.75, marginBottom: 36, maxWidth: 480 }}
          >
            BusinessVaani turns your WhatsApp chaos into a clean, automated business —
            orders, invoices, payments. In Hindi, Tamil, Telugu, Gujarati, Marathi, Hinglish. Automatically.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}
          >
            <motion.a href="/login"
              whileHover={{ scale: 1.05, boxShadow: `0 12px 32px ${P.wa}55` }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "15px 32px", borderRadius: 14, fontSize: 16, fontWeight: 800,
                background: `linear-gradient(135deg, ${P.wa}, ${P.green})`,
                color: "#fff", textDecoration: "none",
                boxShadow: `0 6px 22px ${P.wa}44`,
              }}
            >Login / Sign Up</motion.a>
            <motion.button whileHover={{ background: P.surface, borderColor: P.borderM }}
              style={{ padding: "15px 24px", borderRadius: 14, fontSize: 15, fontWeight: 600, background: "transparent", border: `1px solid ${P.border}`, color: P.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
            ><span style={{ fontSize: 18 }}>▷</span> Watch Demo</motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ marginTop: 28, fontSize: 13, color: P.muted, display: "flex", alignItems: "center", gap: 16 }}
          >
            {["Built for India", "10+ Indian languages", "AI-Powered"].map((t, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: P.wa }}>✓</span> {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right: phone illustration */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <PhoneIllustration />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}
        style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", fontSize: 22, color: P.muted }}
      >↓</motion.div>
    </section>
  );
}

/* ─── Problem section ──────────────────────────────────────────────── */
function Problem() {
  return (
    <section style={{ padding: "100px 40px", background: P.surface }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <ChaosIllustration />
          </div>
          <div>
            <Reveal>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: P.rose, marginBottom: 14 }}>THE PROBLEM</div>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: P.text, margin: "0 0 20px", lineHeight: 1.12 }}>
                Running a business on WhatsApp
                <span style={{ color: P.rose }}> is chaos.</span>
              </h2>
              <p style={{ fontSize: 16, color: P.soft, lineHeight: 1.8, marginBottom: 28 }}>
                Messages pile up. Voice notes you can't process. Hinglish orders in every format. Manual tracking. Missed payments. And at the end of the day — exhaustion.
              </p>
            </Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "📦", title: "Orders get missed", desc: "You can't track who ordered what, when, or how much.", bg: P.roseL, color: P.rose },
                { icon: "🎤", title: "Voice notes pile up", desc: "Customers send audio in Hindi, Tamil, Gujarati — you can't keep up.", bg: P.amberL, color: P.amber },
                { icon: "💸", title: "Payments go untracked", desc: "\"Kal dunga\" becomes next week, then never. ₹12,000+ lost monthly.", bg: P.purpleL, color: P.purple },
              ].map((p, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <motion.div whileHover={{ x: 6 }} style={{
                    display: "flex", gap: 16, padding: "16px 20px", borderRadius: 16,
                    background: P.card, border: `1px solid ${P.border}`,
                    boxShadow: P.shadow, transition: "all 0.2s",
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{p.icon}</div>
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
      </div>
    </section>
  );
}

/* ─── How it works ─────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { icon: "💬", label: "Customer sends a WhatsApp message", sub: "Any language — Hindi, Hinglish, Tamil, voice note. BusinessVaani understands it all.", color: P.wa, colorL: P.waL },
    { icon: "🤖", label: "BusinessVaani AI parses the order", sub: "\"bhaiya 2kg aloo bhejna\" → Item: Aloo, Qty: 2kg, Buyer: Ramesh. Instantly.", color: P.purple, colorL: P.purpleL },
    { icon: "📦", label: "Structured order created", sub: "Order #284 appears in your dashboard with all details filled in.", color: P.teal, colorL: P.tealL },
    { icon: "🧾", label: "Invoice auto-generated & sent", sub: "A professional PDF invoice is generated and sent via WhatsApp in seconds.", color: P.green, colorL: P.greenL },
    { icon: "💳", label: "Payment link sent automatically", sub: "Razorpay link via WhatsApp. UPI, cards, net banking. Money in your account.", color: P.amber, colorL: P.amberL },
  ];

  return (
    <section style={{ padding: "100px 40px", background: P.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
        <div>
          <Reveal>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: P.green, marginBottom: 14 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: P.text, margin: "0 0 16px", lineHeight: 1.12 }}>
              From chat to cash.
              <span style={{ color: P.green }}> Automatically.</span>
            </h2>
            <p style={{ fontSize: 16, color: P.soft, lineHeight: 1.8, marginBottom: 40 }}>
              You just chat. Vaani does everything else — in the background, silently.
            </p>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {steps.map((s, i) => (
              <FlowStep key={i} {...s} index={i} isLast={i === steps.length - 1} />
            ))}
          </div>
        </div>

        {/* Right: animated result card */}
        <Reveal delay={0.2} x={30} y={0}>
          <motion.div
            animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            style={{ position: "sticky", top: 100 }}
          >
            <div style={{ background: P.card, borderRadius: 24, boxShadow: P.shadowL, border: `1px solid ${P.border}`, overflow: "hidden" }}>
              {/* Card header */}
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${P.border}`, display: "flex", alignItems: "center", gap: 12, background: P.surface }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${P.wa}, ${P.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 15 }}>V</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: P.text }}>Vaani — Order Created</span>
                <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                  style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: P.green }}
                />
              </div>

              <div style={{ padding: "20px 24px" }}>
                {/* Original message */}
                <div style={{ padding: "12px 14px", background: P.waL, borderRadius: 12, marginBottom: 20, border: `1px solid ${P.wa}22` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: P.green, marginBottom: 4 }}>ORIGINAL WHATSAPP MESSAGE</div>
                  <div style={{ fontSize: 13, color: P.text, fontStyle: "italic" }}>"bhaiya kal 2kg aloo aur 1kg tamatar bhejna, kal taak chahiye"</div>
                  <div style={{ fontSize: 10, color: P.muted, marginTop: 4 }}>Ramesh Kumar · 9:12 AM</div>
                </div>

                {/* Parsed order */}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: P.muted, marginBottom: 12 }}>AI PARSED ↓</div>
                {[
                  { label: "Customer", val: "Ramesh Kumar", color: P.purple },
                  { label: "Item 1", val: "Aloo — 2 kg", color: P.green },
                  { label: "Item 2", val: "Tamatar — 1 kg", color: P.teal },
                  { label: "Amount", val: "₹840", color: P.amber },
                  { label: "Deliver by", val: "Tomorrow", color: P.rose },
                ].map((r, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 4 ? `1px solid ${P.border}` : "none" }}
                  >
                    <span style={{ fontSize: 12, color: P.soft }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.val}</span>
                  </motion.div>
                ))}

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  {[
                    { label: "📄 Invoice Sent", color: P.green, bg: P.greenL },
                    { label: "💳 Payment Link", color: P.purple, bg: P.purpleL },
                  ].map((a, i) => (
                    <motion.div key={i}
                      initial={{ scale: 0 }} whileInView={{ scale: 1 }}
                      viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.15, type: "spring" }}
                      style={{ flex: 1, padding: "10px", borderRadius: 10, background: a.bg, border: `1px solid ${a.color}33`, fontSize: 12, fontWeight: 700, color: a.color, textAlign: "center" }}
                    >{a.label}</motion.div>
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

/* ─── Features ─────────────────────────────────────────────────────── */
function Features() {
  const features = [
    { icon: "🗣️", title: "Hinglish AI", desc: "Understands mixed-language messages natively. No training, no setup.", color: P.green, colorL: P.greenL },
    { icon: "🎙️", title: "Voice Note AI", desc: "Transcribes and extracts orders from audio in 10+ Indian languages.", color: P.purple, colorL: P.purpleL },
    { icon: "🧾", title: "Auto Invoice", desc: "Professional PDF invoices generated and WhatsApp-sent the moment an order is confirmed.", color: P.teal, colorL: P.tealL },
    { icon: "💳", title: "Razorpay Payments", desc: "Auto-sends payment links. UPI, cards, net banking. Revenue collected instantly.", color: P.amber, colorL: P.amberL },
    { icon: "📊", title: "Live Dashboard", desc: "See every order, invoice, and payment in real-time. No spreadsheets.", color: P.rose, colorL: P.roseL },
    { icon: "🔔", title: "Payment Reminders", desc: "\"Kal dunga\" automated follow-ups. Recover revenue you thought was lost.", color: P.wa, colorL: P.waL },
  ];
  return (
    <section style={{ padding: "100px 40px", background: P.surface }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: P.teal, marginBottom: 14 }}>FEATURES</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: P.text, margin: 0, lineHeight: 1.12 }}>
            Everything automated.
            <span style={{ color: P.soft, fontWeight: 500 }}> Nothing manual.</span>
          </h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 0.08} />)}
        </div>
      </div>
    </section>
  );
}



/* ─── WhatsApp Twilio FAB ─────────────────────────────────────────── */
function WhatsAppTwilio() {
  const TWILIO_PHONE = "+14155238886";
  const TWILIO_JOIN_CODE = "join tip-book";
  const [showLabel, setShowLabel] = useState(false);

  return (
    <>
      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            style={{
              position: "fixed", bottom: 38, right: 94, zIndex: 999,
              padding: "8px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: P.wa, color: "#fff", boxShadow: P.shadow, whiteSpace: "nowrap",
              fontFamily: "monospace",
            }}
          >
            {TWILIO_JOIN_CODE}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        onMouseEnter={() => setShowLabel(true)}
        onMouseLeave={() => setShowLabel(false)}
        href={`https://wa.me/${TWILIO_PHONE}/?text=${encodeURIComponent(TWILIO_JOIN_CODE)}`}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.12, boxShadow: `0 12px 32px ${P.wa}55` }}
        whileTap={{ scale: 0.95 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 1000,
          width: 56, height: 56, borderRadius: "50%", border: "none",
          background: `linear-gradient(135deg, ${P.wa}, ${P.green})`,
          boxShadow: `0 8px 24px ${P.wa}55`,
          cursor: "pointer", fontSize: 24,
          display: "flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none",
        }}
      >
        💬
      </motion.a>
    </>
  );
}

/* ─── Footer ───────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ padding: "32px 40px", borderTop: `1px solid ${P.border}`, background: P.bg, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: `linear-gradient(135deg, ${P.wa}, ${P.green})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 14 }}>V</div>
        <span style={{ fontWeight: 700, color: P.text, fontSize: 15 }}>BusinessVaani</span>
      </div>
      <span style={{ fontSize: 13, color: P.muted }}>Business already happens on WhatsApp. We make it intelligent.</span>
      <span style={{ fontSize: 12, color: P.muted }}>© 2025 BusinessVaani · Made in India 🇮🇳</span>
    </footer>
  );
}

/* ─── Root ─────────────────────────────────────────────────────────── */
export default function Page() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:${P.bg};color:${P.text}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${P.greenM};border-radius:999px}
        @media(max-width:768px){
          .hero-grid,.problem-grid,.hiw-grid{grid-template-columns:1fr!important}
          nav>div:nth-child(2){display:none!important}
        }
      `}</style>
      <Navbar />
      <WhatsAppTwilio />
      <Hero />
      <Problem />
      <div id="how-it-works"><HowItWorks /></div>
      <div id="features"><Features /></div>
      <Footer />
    </>
  );
}