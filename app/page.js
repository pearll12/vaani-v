"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#05070f",
  surface: "#0d1020",
  card: "#111627",
  border: "rgba(255,255,255,0.07)",
  borderMid: "rgba(255,255,255,0.12)",
  text: "#eef2ff",
  muted: "#6b7280",
  soft: "#9ca3af",
  purple: "#a855f7",
  purpleDim: "rgba(168,85,247,0.12)",
  purpleBorder: "rgba(168,85,247,0.3)",
  blue: "#3b82f6",
  blueDim: "rgba(59,130,246,0.12)",
  pink: "#ec4899",
  pinkDim: "rgba(236,72,153,0.1)",
  green: "#22c55e",
  greenDim: "rgba(34,197,94,0.1)",
  teal: "#06b6d4",
};

// ─── MULTILINGUAL SUPPORT (HINDI + ENGLISH) ──────────────────────────────────
const translations = {
  en: {
    features: "Features",
    howItWorks: "How it Works",
    pricing: "Pricing",
    startFree: "Start Free →",
    watchDemo: "▷ Watch Demo",
    aiPowered: "AI-POWERED WHATSAPP ORDER MANAGEMENT",
    ordersAre: "Orders are coming.",
    butAre: "But are you keeping up?",
    turnWhatsApp: "Turn WhatsApp chats into organized business — automatically.",
    vaaniUnderstand: "Vaani understands Hinglish, voice notes, and chaos. So you don't have to.",
    startFreeNoCC: "Start Free — No Credit Card",
    trusted500: "✦ Trusted by 500+ WhatsApp businesses across India",
    reality: "THE REALITY",
    yourPhone: "Your phone is ringing. Your chat is flooding.",
    ordersSlip: "And orders are slipping through.",
    missedOrders: "Missed orders every day",
    missedDesc: "Messages pile up. You can't track who ordered what, when, or how much. Orders fall through the cracks.",
    voiceNotes: "Voice notes you can't process",
    voiceDesc: "Customers send voice notes in Hindi, Tamil, Gujarati. Manually listening to each one wastes hours.",
    manualTracking: "Manual tracking = chaos",
    manualDesc: "Excel sheets, sticky notes, memory. One mistake and a customer is angry, payment is lost.",
    magic: "THE MAGIC",
    chaosBecomes: "Chaos becomes clarity",
    inSeconds: "in seconds, not hours.",
    fromSingle: "From a single WhatsApp message to a fully tracked, invoiced, and paid order — automatically.",
    hinglishAI: "Hinglish AI",
    hinglishDesc: "Understands mixed language messages. \"Bhaiya 3 kg aloo\" becomes a structured order.",
    voiceAI: "Voice Note AI",
    voiceAIDesc: "Transcribes and extracts order details from voice messages in 10+ Indian languages.",
    autoInvoice: "Auto Invoice",
    autoInvoiceDesc: "Professional PDF invoices generated and sent via WhatsApp the moment an order is confirmed.",
    razorpay: "Razorpay Payments",
    razorpayDesc: "Payment links auto-generated and sent. UPI, cards, net banking — all collected seamlessly.",
    dashboard: "Order Dashboard",
    dashboardDesc: "Real-time view of pending, partial, and paid orders. No more spreadsheet juggling.",
    reminders: "Payment Reminders",
    remindersDesc: "Automatic follow-ups for overdue payments. Recover revenue you didn't even know you lost.",
    features: "FEATURES",
    everything: "Everything your business needs.",
    nothing: "Nothing you don't.",
    builtIndia: "BUILT FOR INDIA",
    builtFor: "Built for Real Businesses",
    inIndia: "in India.",
    hinglishMulti: "Hinglish + Multilingual AI",
    hinglishMultiDesc: "Hindi, Tamil, Gujarati, Bengali — our AI speaks your customers' language.",
    whatsappNative: "WhatsApp-native",
    whatsappNativeDesc: "No new app to learn. Your customers already know WhatsApp. We plug right in.",
    revenueRecovery: "Revenue Recovery",
    revenueRecoveryDesc: "Track every pending payment. Automated reminders recover what you'd have written off.",
    productPreview: "PRODUCT PREVIEW",
    commandCenter: "Your command center. Always clear.",
    todaysOrders: "Today's Orders",
    revenue: "Revenue",
    pendingPayments: "Pending Payments",
    recovered: "Recovered",
    recentOrders: "Recent Orders",
    getStarted: "GET STARTED TODAY",
    stopManaging: "Stop managing chats.",
    startRunning: "Start running a business.",
    join500: "Join 500+ Indian businesses using Vaani to turn WhatsApp chaos into clean, automated revenue.",
    startFreeToday: "Start Free Today →",
    talkFounder: "Talk to Founder",
    free14: "Free 14-day trial · No credit card · Setup in 5 minutes",
    whatsappConnect: "WHATSAPP INTEGRATION",
    connectVia: "Connect Your WhatsApp Business Account",
    joinCode: "Join Code: Join your team and manage orders together",
    whatsappConnectDesc: "Connect your WhatsApp Business Account to Vaani in seconds.",
    enterJoinCode: "Enter Your Join Code",
    connectNow: "Connect Now",
  },
  hi: {
    features: "विशेषताएं",
    howItWorks: "कैसे काम करता है",
    pricing: "मूल्य निर्धारण",
    startFree: "मुफ्त में शुरू करें →",
    watchDemo: "▷ डेमो देखें",
    aiPowered: "AI-संचालित व्हाट्सएप ऑर्डर प्रबंधन",
    ordersAre: "ऑर्डर आ रहे हैं।",
    butAre: "लेकिन क्या आप इसका पालन कर पा रहे हैं?",
    turnWhatsApp: "व्हाट्सएप चैट को स्वचालित व्यावसायिक क्रम में बदलें।",
    vaaniUnderstand: "वाणी हिंग्लिश, वॉयस नोट्स और अराजकता को समझता है। तो आपको नहीं करना पड़ता।",
    startFreeNoCC: "मुफ्त शुरू करें — कोई क्रेडिट कार्ड नहीं",
    trusted500: "✦ भारत भर में 500+ व्हाट्सएप व्यवसायों द्वारा विश्वस्त",
    reality: "वास्तविकता",
    yourPhone: "आपका फोन बज रहा है। आपकी चैट भर रही है।",
    ordersSlip: "और ऑर्डर गायब हो रहे हैं।",
    missedOrders: "हर दिन मिस्ड ऑर्डर",
    missedDesc: "संदेश इकट्ठा होते हैं। आप ट्रैक नहीं कर सकते कि किसने क्या, कब और कितना ऑर्डर किया। ऑर्डर अंतर में खो जाते हैं।",
    voiceNotes: "वॉयस नोट्स जिन्हें आप प्रोसेस नहीं कर सकते",
    voiceDesc: "ग्राहक हिंदी, तमिल, गुजराती में वॉयस नोट्स भेजते हैं। हर एक को मैन्युअली सुनना घंटों बर्बाद करता है।",
    manualTracking: "मैनुअल ट्रैकिंग = अराजकता",
    manualDesc: "एक्सेल शीट, स्टिकी नोट्स, स्मृति। एक गलती और ग्राहक नाराज, भुगतान खो गया।",
    magic: "जादू",
    chaosBecomes: "अराजकता स्पष्टता बन जाती है",
    inSeconds: "सेकंड में, घंटों में नहीं।",
    fromSingle: "एक व्हाट्सएप संदेश से पूरी तरह ट्रैक किए गए, चालान किए गए, और भुगतान किए गए ऑर्डर तक — स्वचालित रूप से।",
    hinglishAI: "हिंग्लिश AI",
    hinglishDesc: "मिश्रित भाषा संदेशों को समझता है। \"भैया 3 किलो आलू\" एक संरचित ऑर्डर बन जाता है।",
    voiceAI: "वॉयस नोट AI",
    voiceAIDesc: "10+ भारतीय भाषाओं में वॉयस संदेशों को ट्रांसक्राइब करता है और ऑर्डर विवरण निकालता है।",
    autoInvoice: "स्वचालित चालान",
    autoInvoiceDesc: "पेशेवर PDF चालान तैयार किए जाते हैं और ऑर्डर की पुष्टि के क्षण में व्हाट्सएप के माध्यम से भेजे जाते हैं।",
    razorpay: "Razorpay भुगतान",
    razorpayDesc: "भुगतान लिंक स्वचालित रूप से तैयार और भेजे जाते हैं। UPI, कार्ड, नेट बैंकिंग — सभी निरंतर एकत्र होते हैं।",
    dashboard: "ऑर्डर डैशबोर्ड",
    dashboardDesc: "लंबित, आंशिक और भुगतान किए गए ऑर्डर का वास्तविक समय दृश्य। और कोई स्प्रेडशीट नहीं।",
    reminders: "भुगतान रिमाइंडर",
    remindersDesc: "देय भुगतान के लिए स्वचालित फॉलो-अप। वह राजस्व पुनः प्राप्त करें जिसे आप खो सकते थे।",
    features: "विशेषताएं",
    everything: "आपके व्यवसाय के लिए सब कुछ।",
    nothing: "कुछ नहीं जो आपको नहीं चाहिए।",
    builtIndia: "भारत में निर्मित",
    builtFor: "असली व्यवसायों के लिए निर्मित",
    inIndia: "भारत में।",
    hinglishMulti: "हिंग्लिश + बहुभाषी AI",
    hinglishMultiDesc: "हिंदी, तमिल, गुजराती, बंगाली — हमारी AI आपके ग्राहकों की भाषा बोलती है।",
    whatsappNative: "व्हाट्सएप-मूल",
    whatsappNativeDesc: "सीखने के लिए कोई नई ऐप नहीं। आपके ग्राहकों को पहले से ही व्हाट्सएप पता है। हम सीधे प्लग इन करते हैं।",
    revenueRecovery: "राजस्व वसूली",
    revenueRecoveryDesc: "हर लंबित भुगतान को ट्रैक करें। स्वचालित रिमाइंडर जो आप खो सकते थे उसे पुनः प्राप्त करें।",
    productPreview: "उत्पाद पूर्वावलोकन",
    commandCenter: "आपका कमांड सेंटर। हमेशा स्पष्ट।",
    todaysOrders: "आज के ऑर्डर",
    revenue: "राजस्व",
    pendingPayments: "लंबित भुगतान",
    recovered: "वसूल किया गया",
    recentOrders: "हाल के ऑर्डर",
    getStarted: "आज ही शुरू करें",
    stopManaging: "चैट प्रबंधित करना बंद करें।",
    startRunning: "व्यवसाय चलाना शुरू करें।",
    join500: "भारत भर में 500+ व्यवसायों के साथ जुड़ें जो व्हाट्सएप अराजकता को स्वच्छ, स्वचालित राजस्व में बदल रहे हैं।",
    startFreeToday: "आज ही मुफ्त शुरू करें →",
    talkFounder: "संस्थापक से बात करें",
    free14: "14 दिन की मुफ्त ट्रायल · कोई क्रेडिट कार्ड नहीं · 5 मिनट में सेटअप",
    whatsappConnect: "व्हाट्सएप एकीकरण",
    connectVia: "अपने व्हाट्सएप बिजनेस अकाउंट को कनेक्ट करें",
    joinCode: "जॉइन कोड: अपनी टीम के साथ जुड़ें और ऑर्डर प्रबंधित करें",
    whatsappConnectDesc: "अपने व्हाट्सएप बिजनेस अकाउंट को वाणी से सेकंड में कनेक्ट करें।",
    enterJoinCode: "अपना जॉइन कोड दर्ज करें",
    connectNow: "अभी कनेक्ट करें",
  },
};

// ─── Reusable animation variants ──────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };
const slideRight = { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } };
const slideLeft = { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 } };
const scaleUp = { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } };

function Reveal({ children, delay = 0, className = "", variant = fadeUp }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={variant}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Floating Chat Bubble ─────────────────────────────────────────────────────
function FloatingBubble({ msg, from, style, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{ delay, duration: 0.6, y: { repeat: Infinity, duration: 4 + Math.random() * 2, ease: "easeInOut" } }}
      style={style}
      className="absolute"
    >
      <div
        style={{
          background: from === "user" ? "#25d366" : C.card,
          color: from === "user" ? "#000" : C.text,
          border: `1px solid ${from === "user" ? "transparent" : C.border}`,
          borderRadius: from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "10px 14px",
          fontSize: 13,
          fontWeight: 500,
          maxWidth: 220,
          backdropFilter: "blur(12px)",
          boxShadow: from === "user"
            ? "0 8px 32px rgba(37,211,102,0.25)"
            : "0 8px 32px rgba(0,0,0,0.4)",
          whiteSpace: "nowrap",
        }}
      >
        {msg}
      </div>
    </motion.div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = "", prefix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const steps = 60;
    const increment = target / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ lang, setLang }) {
  const [scrolled, setScrolled] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(5,7,15,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(25px)" : "none",
        borderBottom: scrolled ? `1.5px solid rgba(168,85,247,0.15)` : "none",
        transition: "all 0.3s ease",
      }}
    >
      <motion.div style={{ display: "flex", alignItems: "center", gap: 10 }} whileHover={{ scale: 1.05 }}>
        <motion.div
          whileHover={{ scale: 1.15, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, #a855f7, #3b82f6)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: "#fff",
            boxShadow: `0 8px 32px rgba(168,85,247,0.4)`,
            cursor: "pointer",
          }}
        >V</motion.div>
        <span style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>Vaani</span>
      </motion.div>

      <div style={{ display: "flex", gap: 40, fontSize: 14, color: C.soft, alignItems: "center" }}>
        {["Features", "How it Works", "Pricing"].map((item) => (
          <motion.a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
            whileHover={{ color: C.text, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            style={{ color: C.soft, textDecoration: "none", cursor: "pointer" }}>
            {item}
          </motion.a>
        ))}
        
        {/* Language Switcher */}
        <div style={{ display: "flex", gap: 8, borderLeft: `1.5px solid rgba(168,85,247,0.2)`, paddingLeft: 32 }}>
          {["en", "hi"].map((langCode) => (
            <motion.button
              key={langCode}
              onClick={() => setLang(langCode)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 800,
                background: lang === langCode 
                  ? `linear-gradient(135deg, #a855f7, #3b82f6)` 
                  : "rgba(255,255,255,0.05)",
                color: lang === langCode ? "#fff" : C.soft,
                border: lang === langCode ? "none" : `1.5px solid ${C.border}`,
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: lang === langCode ? `0 8px 20px rgba(168,85,247,0.3)` : "none",
              }}
            >
              {langCode === "en" ? "EN" : "हिंदी"}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.a
        href="/login"
        whileHover={{ scale: 1.06, boxShadow: `0 15px 50px ${C.purple}44` }}
        whileTap={{ scale: 0.95 }}
        style={{
          padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 800,
          background: `linear-gradient(135deg, #a855f7, #3b82f6)`,
          color: "#fff", textDecoration: "none", cursor: "pointer",
          boxShadow: `0 8px 24px rgba(168,85,247,0.3)`,
          transition: "all 0.3s",
        }}
      >
        {t.startFree}
      </motion.a>
    </motion.nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ lang }) {
  const t = translations[lang];
  const bubbles = [
    { msg: lang === "hi" ? "भैया 2 किलो आलू भेजना कल" : "bhaiya 2kg aloo bhejna kal", from: "user", style: { top: "22%", left: "6%" }, delay: 0.8 },
    { msg: lang === "hi" ? "ऑर्डर #247 की पुष्टि ✓" : "Order #247 confirmed ✓", from: "bot", style: { top: "15%", right: "8%" }, delay: 1.2 },
    { msg: lang === "hi" ? "चालान व्हाट्सएप के माध्यम से भेजा गया 🧾" : "Invoice sent via WhatsApp 🧾", from: "bot", style: { bottom: "30%", right: "5%" }, delay: 1.6 },
    { msg: lang === "hi" ? "भुगतान प्राप्त ₹840 💰" : "Payment received ₹840 💰", from: "bot", style: { bottom: "22%", left: "8%" }, delay: 2.0 },
    { msg: lang === "hi" ? "10 ऑर्डर लंबित..." : "10 orders pending...", from: "user", style: { top: "42%", left: "2%" }, delay: 2.4 },
  ];

  return (
    <section style={{
      minHeight: "100vh", position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: C.bg,
    }}>
      {/* Radial glows */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.25, 0.18] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ scale: [1, 0.95, 1], opacity: [0.12, 0.18, 0.12] }}
        transition={{ duration: 5, repeat: Infinity }}
        style={{
          position: "absolute", bottom: "5%", left: "20%",
          width: 400, height: 400, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Floating bubbles */}
      {bubbles.map((b, i) => <FloatingBubble key={i} {...b} />)}

      {/* Hero content */}
      <div style={{ textAlign: "center", maxWidth: 760, padding: "0 24px", position: "relative", zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "10px 20px", borderRadius: 50,
            background: `linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.1))`,
            border: `1.5px solid rgba(168,85,247,0.3)`,
            fontSize: 13, fontWeight: 700, color: C.purple,
            marginBottom: 28, letterSpacing: "0.05em",
            boxShadow: `0 8px 32px rgba(168,85,247,0.1)`,
          }}
        >
          <motion.span animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: "50%", background: `linear-gradient(135deg, #a855f7, #3b82f6)`, display: "inline-block" }} />
          {t.aiPowered}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.08,
            letterSpacing: "-0.03em", color: C.text, margin: 0,
          }}
        >
          {t.ordersAre}
          <br />
          <span style={{
            background: `linear-gradient(135deg, ${C.purple}, ${C.blue}, ${C.pink})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {t.butAre}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          style={{ fontSize: 18, color: C.soft, marginTop: 24, lineHeight: 1.7, maxWidth: 540, margin: "24px auto 0" }}
        >
          {t.turnWhatsApp}
          <br />
          {t.vaaniUnderstand}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 48, flexWrap: "wrap" }}
        >
          <motion.a
            href="/login"
            whileHover={{ scale: 1.06, boxShadow: `0 20px 60px ${C.purple}66, 0 0 30px ${C.purple}44` }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "16px 40px", borderRadius: 16, fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em",
              background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
              color: "#fff", textDecoration: "none", cursor: "pointer",
              boxShadow: `0 12px 40px ${C.purple}55`,
              border: "none",
              transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {t.startFreeNoCC}
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.03, borderColor: C.purpleBorder, backgroundColor: "rgba(168,85,247,0.08)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "16px 32px", borderRadius: 16, fontSize: 15, fontWeight: 700,
              background: "rgba(255,255,255,0.04)", color: C.text,
              border: `1.5px solid ${C.border}`, cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {t.watchDemo}
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{ fontSize: 12, color: C.muted, marginTop: 20 }}
        >
          {t.trusted500}
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          color: C.muted, fontSize: 20,
        }}
      >↓</motion.div>
    </section>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────
const chaosMessages = [
  { from: "user", text: "bhaiya kal 2kg aloo bhejna", time: "9:12 AM" },
  { from: "user", text: "aur 1kg tamatar bhi", time: "9:12 AM" },
  { from: "bot", text: "Ji zaroor 🙏", time: "9:13 AM" },
  { from: "user2", text: "Kya mera order ship hua?", time: "9:45 AM" },
  { from: "user3", text: "[Voice note 0:23]", time: "10:02 AM", audio: true },
  { from: "user", text: "bhaiya order confirm hai na?", time: "10:15 AM" },
  { from: "user4", text: "Payment kab karni hai?", time: "10:33 AM" },
  { from: "user2", text: "Hello?? koi sun raha hai?", time: "11:01 AM" },
];

function ProblemSection({ lang }) {
  const t = translations[lang];
  const [visibleCount, setVisibleCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setVisibleCount(p => {
        if (p >= chaosMessages.length) { clearInterval(timer); return p; }
        return p + 1;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [inView]);

  const userColors = { user: "#25d366", user2: "#3b82f6", user3: "#f59e0b", user4: "#ec4899" };

  return (
    <section ref={ref} style={{ padding: "100px 24px", background: C.bg, position: "relative" }} className="problem-grid">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: C.purple, marginBottom: 12 }}>
            {t.reality}
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>
            {t.yourPhone}
            <br />
            <span style={{ color: C.pink }}>{t.ordersSlip}</span>
          </h2>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          {/* Chat simulation */}
          <Reveal delay={0.1}>
            <div style={{
              background: "#0a1628",
              border: `1px solid ${C.border}`,
              borderRadius: 24, overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
            }}>
              {/* WhatsApp header */}
              <div style={{
                background: "#1a2744", padding: "14px 20px",
                display: "flex", alignItems: "center", gap: 12,
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏪</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{lang === "hi" ? "शर्मा जी की दुकान" : "Sharma Ji Ka Store"}</div>
                  <div style={{ fontSize: 11, color: "#25d366" }}>{lang === "hi" ? "बिजनेस अकाउंट" : "Business Account"}</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 11, color: C.pink, fontWeight: 600, animation: "pulse 1.5s infinite" }}>
                  🔴 {lang === "hi" ? "8 अपठित" : "8 unread"}
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: "20px 16px", minHeight: 320, display: "flex", flexDirection: "column", gap: 10 }}>
                <AnimatePresence>
                  {chaosMessages.slice(0, visibleCount).map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.from === "bot" ? 20 : -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      style={{
                        display: "flex",
                        justifyContent: msg.from === "bot" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div style={{
                        maxWidth: "75%",
                        background: msg.from === "bot" ? "#25d366" : C.card,
                        color: msg.from === "bot" ? "#000" : C.text,
                        border: msg.from === "bot" ? "none" : `1px solid ${C.border}`,
                        borderRadius: msg.from === "bot" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        padding: "8px 12px",
                        fontSize: 13,
                      }}>
                        {msg.from !== "bot" && msg.from !== "user" && (
                          <div style={{ fontSize: 10, fontWeight: 700, color: userColors[msg.from] || C.purple, marginBottom: 2 }}>
                            {msg.from === "user2" ? (lang === "hi" ? "राज" : "Ramesh") : msg.from === "user3" ? (lang === "hi" ? "प्रिया" : "Priya") : (lang === "hi" ? "सुरेश" : "Suresh")}
                          </div>
                        )}
                        {msg.audio ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span>🎤</span>
                            <div style={{ height: 2, width: 80, background: "rgba(255,255,255,0.3)", borderRadius: 2 }} />
                            <span style={{ fontSize: 11 }}>0:23</span>
                          </div>
                        ) : msg.text}
                        <div style={{ fontSize: 10, color: msg.from === "bot" ? "rgba(0,0,0,0.5)" : C.muted, marginTop: 2, textAlign: "right" }}>{msg.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {visibleCount < chaosMessages.length && (
                  <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                        style={{ width: 6, height: 6, borderRadius: "50%", background: C.muted }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* Pain points */}
          <Reveal delay={0.2}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { icon: "😰", title: t.missedOrders, desc: t.missedDesc },
                { icon: "🎤", title: t.voiceNotes, desc: t.voiceDesc },
                { icon: "📋", title: t.manualTracking, desc: t.manualDesc },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ x: 12, borderColor: C.softBorder, boxShadow: `0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 ${C.border}` }}
                  style={{
                    display: "flex", gap: 18, padding: "24px",
                    background: `linear-gradient(135deg, ${C.card} 0%, rgba(255,255,255,0.01) 100%)`,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 18,
                    transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                    cursor: "pointer",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.4, type: "spring", stiffness: 200 }}
                    style={{ fontSize: 32, flexShrink: 0 }}>
                    {p.icon}
                  </motion.div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6, letterSpacing: "-0.01em" }}>{p.title}</div>
                    <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.7 }}>{p.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Transformation Section ───────────────────────────────────────────────────
function TransformSection({ lang }) {
  const t = translations[lang];
  const steps = [
    { icon: "💬", label: lang === "hi" ? "व्हाट्सएप चैट" : "WhatsApp Chat", sub: lang === "hi" ? "कोई भी भाषा, वॉयस, टेक्स्ट" : "Any language, voice, text", color: "#25d366" },
    { icon: "🤖", label: lang === "hi" ? "AI समझता है" : "AI Understands", sub: lang === "hi" ? "हिंग्लिश, वॉयस, इरादा" : "Hinglish, voice, intent", color: C.purple },
    { icon: "📦", label: lang === "hi" ? "संरचित ऑर्डर" : "Structured Order", sub: lang === "hi" ? "आइटम, मात्रा, कीमत, खरीदार" : "Item, qty, price, buyer", color: C.blue },
    { icon: "🧾", label: lang === "hi" ? "स्वचालित चालान" : "Auto Invoice", sub: lang === "hi" ? "PDF तुरंत तैयार" : "PDF generated instantly", color: C.teal },
    { icon: "💰", label: lang === "hi" ? "भुगतान लिंक" : "Payment Link", sub: lang === "hi" ? "Razorpay, UPI, स्वचालित भेजा" : "Razorpay, UPI, auto-sent", color: "#f59e0b" },
  ];

  return (
    <section style={{ padding: "100px 24px", background: C.surface }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: C.blue, marginBottom: 12 }}>
            {t.magic}
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: C.text, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
            {t.chaosBecomes}
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${C.blue}, ${C.teal})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{t.inSeconds}</span>
          </h2>
          <p style={{ color: C.soft, fontSize: 16, maxWidth: 500, margin: "0 auto 64px" }}>
            {t.fromSingle}
          </p>
        </Reveal>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, boxShadow: `0 20px 60px ${step.color}33` }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "28px 20px", borderRadius: 20, width: 140,
                  background: C.card, border: `1px solid ${C.border}`,
                  cursor: "default", transition: "box-shadow 0.3s",
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `${step.color}22`, border: `1px solid ${step.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginBottom: 12,
                }}>{step.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{step.label}</div>
                <div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>{step.sub}</div>
              </motion.div>
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.4, duration: 0.5 }}
                  style={{
                    width: 40, height: 2, margin: "0 4px",
                    background: `linear-gradient(90deg, ${steps[i].color}, ${steps[i + 1].color})`,
                    transformOrigin: "left",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features({ lang }) {
  const t = translations[lang];
  const features = [
    { icon: "🗣️", title: t.hinglishAI, desc: t.hinglishDesc, color: C.purple, glow: "rgba(168,85,247,0.2)" },
    { icon: "🎙️", title: t.voiceAI, desc: t.voiceAIDesc, color: C.blue, glow: "rgba(59,130,246,0.2)" },
    { icon: "🧾", title: t.autoInvoice, desc: t.autoInvoiceDesc, color: C.teal, glow: "rgba(6,182,212,0.2)" },
    { icon: "💳", title: t.razorpay, desc: t.razorpayDesc, color: "#f59e0b", glow: "rgba(245,158,11,0.2)" },
    { icon: "📊", title: t.dashboard, desc: t.dashboardDesc, color: C.pink, glow: "rgba(236,72,153,0.2)" },
    { icon: "🔔", title: t.reminders, desc: t.remindersDesc, color: C.green, glow: "rgba(34,197,94,0.2)" },
  ];

  return (
    <section id="features" style={{ padding: "100px 24px", background: C.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: C.teal, marginBottom: 12 }}>
            {t.features}
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: C.text, letterSpacing: "-0.02em", margin: 0 }}>
            {t.everything}
            <br />
            <span style={{ color: C.soft, fontWeight: 500 }}>{t.nothing}</span>
          </h2>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -12, borderColor: `${f.color}88`, boxShadow: `0 30px 80px ${f.glow}, inset 0 1px 0 ${f.color}22` }}
              style={{
                padding: "36px", borderRadius: 24,
                background: `linear-gradient(135deg, ${C.card} 0%, rgba(255,255,255,0.02) 100%)`,
                border: `1.5px solid ${C.border}`,
                cursor: "default", transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* Gradient overlay on hover */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  position: "absolute", top: 0, right: -50, width: 150, height: 150,
                  borderRadius: "50%", background: `radial-gradient(circle, ${f.color}15 0%, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: `linear-gradient(135deg, ${f.color}22 0%, ${f.color}08 100%)`,
                border: `1.5px solid ${f.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, marginBottom: 24,
                position: "relative", zIndex: 1,
              }}>{f.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 12, position: "relative", zIndex: 1, letterSpacing: "-0.01em" }}>{f.title}</div>
              <div style={{ fontSize: 14, color: C.soft, lineHeight: 1.8, position: "relative", zIndex: 1 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Unique / Stats ───────────────────────────────────────────────────────────
function UniqueSection({ lang }) {
  const t = translations[lang];
  const stats = [
    { value: 500, suffix: "+", label: lang === "hi" ? "सक्रिय व्यवसाय" : "Businesses Active", color: C.purple },
    { value: 98, suffix: "%", label: lang === "hi" ? "ऑर्डर सटीकता" : "Order Accuracy", color: C.blue },
    { value: 3, suffix: "x", label: lang === "hi" ? "तेजी से प्रसंस्करण" : "Faster Processing", color: C.teal },
    { value: 40, suffix: "%", label: lang === "hi" ? "राजस्व वसूल" : "Revenue Recovered", color: C.pink },
  ];

  return (
    <section style={{ padding: "100px 24px", background: C.surface }} className="unique-grid">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <Reveal>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: C.purple, marginBottom: 16 }}>
              {t.builtIndia}
            </div>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 900, color: C.text, letterSpacing: "-0.02em", margin: "0 0 24px", lineHeight: 1.15 }}>
              {t.builtFor}<br />
              <span style={{
                background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{t.inIndia}</span>
            </h2>

            {[
              { icon: "🇮🇳", title: t.hinglishMulti, desc: t.hinglishMultiDesc },
              { icon: "📱", title: t.whatsappNative, desc: t.whatsappNativeDesc },
              { icon: "💸", title: t.revenueRecovery, desc: t.revenueRecoveryDesc },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.2 }}
                style={{ display: "flex", gap: 16, marginBottom: 24 }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: C.purpleDim, border: `1px solid ${C.purpleBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 13, color: C.soft, lineHeight: 1.6 }}>{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </Reveal>

          <Reveal delay={0.2}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.7 }}
                  whileHover={{ scale: 1.06, boxShadow: `0 30px 80px ${s.color}33, inset 0 1px 0 ${s.color}22` }}
                  style={{
                    padding: "40px 32px", borderRadius: 24, textAlign: "center",
                    background: `linear-gradient(135deg, ${C.card} 0%, rgba(255,255,255,0.02) 100%)`,
                    border: `1.5px solid ${C.border}`,
                    transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                    cursor: "default",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    style={{
                      position: "absolute", top: -50, right: -50, width: 180, height: 180,
                      borderRadius: "50%", background: `radial-gradient(circle, ${s.color}20 0%, transparent 70%)`,
                      pointerEvents: "none",
                    }}
                  />
                  <div style={{
                    fontSize: "clamp(40px, 6vw, 56px)", fontWeight: 900, letterSpacing: "-0.03em",
                    background: `linear-gradient(135deg, ${s.color} 0%, rgba(255,255,255,0.3) 100%)`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    marginBottom: 12,
                    position: "relative", zIndex: 1,
                  }}>
                    <Counter target={s.value} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 13, color: C.soft, fontWeight: 700, letterSpacing: "0.05em", position: "relative", zIndex: 1 }}>{s.label.toUpperCase()}</div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Dashboard Preview ────────────────────────────────────────────────────────
function DashboardPreview({ lang }) {
  const t = translations[lang];
  const orders = [
    { id: "#281", name: lang === "hi" ? "राजेश कुमार" : "Ramesh Kumar", item: lang === "hi" ? "आलू 5 किग्रा, टमाटर 2 किग्रा" : "Aloo 5kg, Tamatar 2kg", amount: "₹840", status: "paid" },
    { id: "#282", name: lang === "hi" ? "प्रिया शर्मा" : "Priya Sharma", item: lang === "hi" ? "धनिया 500 ग्राम, अदरक 1 किग्रा" : "Dhaniya 500g, Adrak 1kg", amount: "₹320", status: "pending" },
    { id: "#283", name: lang === "hi" ? "मोहन दास" : "Mohan Das", item: lang === "hi" ? "प्याज 3 किग्रा" : "Pyaaz 3kg", amount: "₹180", status: "invoiced" },
    { id: "#284", name: lang === "hi" ? "सुनीता देवी" : "Sunita Devi", item: lang === "hi" ? "हरी मिर्च 250 ग्राम, लहसुन 500 ग्राम" : "Hari Mirch 250g, Lahsun 500g", amount: "₹220", status: "paid" },
  ];

  const statusColor = { paid: C.green, pending: "#f59e0b", invoiced: C.blue };
  const statusBg = { paid: C.greenDim, pending: "rgba(245,158,11,0.1)", invoiced: C.blueDim };

  return (
    <section id="product-preview" style={{ padding: "100px 24px", background: C.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: C.green, marginBottom: 12 }}>
            {t.productPreview}
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: C.text, letterSpacing: "-0.02em", margin: "0 0 64px" }}>
            {t.commandCenter}
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            whileHover={{ y: -12 }}
            style={{
              background: `linear-gradient(135deg, ${C.card} 0%, rgba(255,255,255,0.01) 100%)`,
              border: `1.5px solid ${C.borderMid}`,
              borderRadius: 32, overflow: "hidden",
              boxShadow: `0 60px 160px rgba(0,0,0,0.7), 0 0 0 1px ${C.border}`,
              transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Dashboard topbar */}
            <div style={{
              padding: "20px 32px", borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff" }}>
                  V
                </motion.div>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>Vaani {t.dashboard}</span>
              </div>
              <div style={{ display: "flex", gap: 32, fontSize: 13, color: C.soft }}>
                <span style={{ color: C.text, fontWeight: 700 }}>{t.todaysOrders}</span>
                <span style={{ fontSize: 12 }}>{t.revenue}</span><span style={{ fontSize: 12 }}>{t.pendingPayments}</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: C.green, fontWeight: 700 }}>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 12px ${C.green}` }}
                />
                {lang === "hi" ? "लाइव सिंक" : "Live sync"}
              </motion.div>
            </div>

            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderBottom: `1px solid ${C.border}` }} className="kpi-preview-grid">
              {[
                { label: t.todaysOrders, val: "24", delta: "+12%", color: C.purple },
                { label: t.revenue, val: "₹18,240", delta: "+8%", color: C.blue },
                { label: t.pendingPayments, val: "₹6,800", delta: "-3%", color: "#f59e0b" },
                { label: t.recovered, val: "₹4,320", delta: "+22%", color: C.green },
              ].map((kpi, i) => (
                <motion.div
                  key={i}
                  whileHover={{ background: "rgba(255,255,255,0.04)" }}
                  style={{
                    padding: "28px 32px", borderRight: i < 3 ? `1px solid ${C.border}` : "none",
                    transition: "all 0.3s",
                    cursor: "pointer",
                  }}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, marginBottom: 10, letterSpacing: "0.08em" }}>{kpi.label.toUpperCase()}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>{kpi.val}</div>
                  <div style={{ fontSize: 13, color: kpi.delta.startsWith("+") ? C.green : C.pink, marginTop: 6, fontWeight: 700 }}>{kpi.delta} <span style={{ fontSize: 11, color: C.muted }}>{lang === "hi" ? "आज" : "today"}</span></div>
                </motion.div>
              ))}
            </div>

            {/* Orders table */}
            <div style={{ padding: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>{t.recentOrders}</div>
                <motion.div
                  whileHover={{ x: 4 }}
                  style={{ fontSize: 12, color: C.purple, fontWeight: 700, cursor: "pointer" }}>
                  {lang === "hi" ? "सभी देखें →" : "View all →"}
                </motion.div>
              </div>
              {orders.map((o, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                  whileHover={{ background: "rgba(255,255,255,0.05)", paddingLeft: 8 }}
                  style={{
                    display: "flex", alignItems: "center", padding: "16px 12px",
                    borderBottom: i < orders.length - 1 ? `1px solid ${C.border}` : "none",
                    gap: 18, cursor: "pointer", borderRadius: 10, transition: "all 0.3s",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, width: 48, letterSpacing: "0.05em" }}>{o.id}</div>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{o.name}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{o.item.substring(0, 40)}</div>
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: C.soft }}>{o.item.substring(0, 35)}...</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text, minWidth: 70, letterSpacing: "-0.01em" }}>{o.amount}</div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 800,
                      background: statusBg[o.status], color: statusColor[o.status],
                      border: `1.5px solid ${statusColor[o.status]}55`,
                      textTransform: "capitalize",
                      transition: "all 0.3s",
                      cursor: "pointer",
                    }}>
                    {lang === "hi" ? (o.status === "paid" ? "भुगता गया" : o.status === "pending" ? "लंबित" : "चालान किया गया") : o.status}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA({ lang }) {
  const t = translations[lang];
  
  return (
    <section style={{ padding: "120px 24px", background: C.bg, position: "relative", overflow: "hidden" }}>
      {/* Glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 800, height: 400, borderRadius: "50%",
          background: `radial-gradient(ellipse, rgba(168,85,247,0.2) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 2 }}>
        <Reveal>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: C.purple, marginBottom: 20 }}>
            {t.getStarted}
          </div>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 900, letterSpacing: "-0.03em", color: C.text, margin: "0 0 20px", lineHeight: 1.1 }}>
            {t.stopManaging}
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${C.purple}, ${C.blue}, ${C.pink})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {t.startRunning}
            </span>
          </h2>
          <p style={{ fontSize: 18, color: C.soft, marginBottom: 48, lineHeight: 1.7 }}>
            {t.join500}
          </p>

          <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.08, boxShadow: `0 30px 80px ${C.purple}77, 0 0 40px ${C.purple}55` }}
              whileTap={{ scale: 0.93 }}
              style={{
                padding: "20px 56px", borderRadius: 18, fontSize: 18, fontWeight: 900, letterSpacing: "-0.01em",
                background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
                color: "#fff", textDecoration: "none", cursor: "pointer",
                boxShadow: `0 16px 48px ${C.purple}66`,
                border: "none",
                display: "inline-block",
                transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                position: "relative",
              }}
            >
              {t.startFreeToday}
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.04, borderColor: C.purpleBorder, backgroundColor: "rgba(255,255,255,0.08)" }}
              whileTap={{ scale: 0.96 }}
              style={{
                padding: "20px 48px", borderRadius: 18, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em",
                background: "rgba(255,255,255,0.06)", color: C.text,
                border: `1.5px solid ${C.borderMid}`, cursor: "pointer",
                backdropFilter: "blur(12px)",
                transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {t.talkFounder}
            </motion.button>
          </div>

          <p style={{ fontSize: 13, color: C.muted, marginTop: 24 }}>
            {t.free14}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── WhatsApp Integration Section ─────────────────────────────────────────────
function WhatsAppIntegration({ lang }) {
  const t = translations[lang];
  const [joinCode, setJoinCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [showWhatsAppDemo, setShowWhatsAppDemo] = useState(false);
  const [demoMessages, setDemoMessages] = useState([]);

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(code);
    setJoinCode(code);
  };

  const handleConnect = () => {
    if (phoneNumber && joinCode.length >= 6) {
      // Show WhatsApp demo with messages
      setShowWhatsAppDemo(true);
      setDemoMessages([]);
      
      // Simulate messages appearing
      const messages = [
        { type: "bot", text: lang === "hi" ? "🎉 सफलतापूर्वक जुड़ गया!" : "🎉 Successfully connected!", delay: 300 },
        { type: "bot", text: lang === "hi" ? "आपका Vaani सेटअप पूरा। अब ऑर्डर भेजें!" : "Your Vaani setup complete. Start sending orders!", delay: 1000 },
        { type: "user", text: lang === "hi" ? "भैया 2 किलो आलू भेजना कल" : "bhaiya 2kg aloo bhejna kal", delay: 2000 },
        { type: "bot", text: lang === "hi" ? "✓ ऑर्डर #1842 प्राप्त हुआ" : "✓ Order #1842 received", delay: 2800 },
        { type: "bot", text: lang === "hi" ? "💰 भुगतान लिंक: https://pay.razorpay.com/..." : "💰 Pay now: https://pay.razorpay.com/...", delay: 3500 },
      ];

      messages.forEach((msg) => {
        setTimeout(() => {
          setDemoMessages(prev => [...prev, msg]);
        }, msg.delay);
      });

      setShowSuccess(true);
      setTimeout(() => {
        setPhoneNumber("");
        setJoinCode("");
        setGeneratedCode("");
        setShowSuccess(false);
      }, 5000);
    }
  };

  return (
    <section style={{ padding: "100px 24px", background: C.bg, position: "relative", overflow: "hidden" }} className="whatsapp-grid">
      {/* Animated gradient background */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(37,211,102,0.2) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          {/* Left - Form & Info */}
          <Reveal variant={slideRight}>
            <div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 20,
                  background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)",
                  fontSize: 13, fontWeight: 700, color: "#25d366",
                  marginBottom: 16, cursor: "pointer",
                }}
              >
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity }}>🔗</motion.span>
                {t.whatsappConnect}
              </motion.div>

              <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: C.text, letterSpacing: "-0.02em", margin: "0 0 16px", lineHeight: 1.2 }}>
                {t.connectVia}
              </h2>

              <p style={{ fontSize: 15, color: C.soft, lineHeight: 1.8, marginBottom: 40 }}>
                {t.whatsappConnectDesc} {lang === "hi" ? "एक क्लिक और आप तैयार हैं।" : "One click and you're ready."}
              </p>

              {/* Benefits with icons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
                {[
                  { icon: "✨", title: lang === "hi" ? "तुरंत सक्रिय" : "Instantly Active", desc: lang === "hi" ? "कोई प्रतीक्षा नहीं, सीधा काम शुरू" : "No wait time, start immediately" },
                  { icon: "🛡️", title: lang === "hi" ? "बिल्कुल सुरक्षित" : "Completely Secure", desc: lang === "hi" ? "एंड-टू-एंड एन्क्रिप्शन" : "End-to-end encrypted" },
                  { icon: "👨‍👩‍👧‍👦", title: lang === "hi" ? "पूरी टीम" : "Full Team", desc: lang === "hi" ? "सभी को एक साथ जोड़ें" : "Invite unlimited team members" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    whileHover={{ x: 8 }}
                    style={{
                      display: "flex", gap: 16, padding: "16px", borderRadius: 16,
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                      transition: "all 0.3s",
                    }}
                  >
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Right - Form & Demo */}
          <Reveal delay={0.1} variant={slideLeft}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Form Card */}
              <motion.div
                whileHover={{ boxShadow: `0 30px 100px ${C.green}25` }}
                style={{
                  padding: "36px", borderRadius: 24,
                  background: `linear-gradient(135deg, ${C.card} 0%, rgba(37,211,102,0.08) 100%)`,
                  border: `1px solid rgba(37,211,102,0.2)`,
                  transition: "all 0.3s",
                  position: "relative", overflow: "hidden",
                }}
              >
                {/* Background glow */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  style={{
                    position: "absolute", top: 0, right: 0,
                    width: 200, height: 200, borderRadius: "50%",
                    background: `radial-gradient(circle, rgba(37,211,102,0.3) 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }}
                />

                <div style={{ position: "relative", zIndex: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 24 }}>
                    {lang === "hi" ? "अपने विवरण दर्ज करें" : "Enter Your Details"}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {/* Phone Number Input */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: C.soft, display: "block", marginBottom: 10, letterSpacing: "0.05em" }}>
                        {lang === "hi" ? "व्हाट्सएप नंबर" : "WHATSAPP NUMBER"}
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.02, borderColor: C.green }}
                        type="tel"
                        placeholder={lang === "hi" ? "+91 9876543210" : "+91 98765 43210"}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        style={{
                          width: "100%", padding: "14px 16px", borderRadius: 14,
                          background: "rgba(0,0,0,0.2)", border: `1.5px solid ${C.border}`,
                          color: C.text, fontSize: 14, fontFamily: "inherit",
                          transition: "all 0.3s",
                        }}
                      />
                    </div>

                    {/* Join Code Input & Generate */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: C.soft, display: "block", marginBottom: 10, letterSpacing: "0.05em" }}>
                        {lang === "hi" ? "जॉइन कोड" : "JOIN CODE"}
                      </label>
                      <div style={{ display: "flex", gap: 10 }}>
                        <motion.input
                          whileFocus={{ scale: 1.02, borderColor: C.green }}
                          type="text"
                          placeholder="XXXXXX"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          maxLength="6"
                          style={{
                            flex: 1, padding: "14px 16px", borderRadius: 14,
                            background: "rgba(0,0,0,0.2)", border: `1.5px solid ${C.border}`,
                            color: C.text, fontSize: 14, fontFamily: "monospace", fontWeight: 800,
                            transition: "all 0.3s", letterSpacing: "0.15em",
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: `0 10px 30px ${C.purple}33` }}
                          whileTap={{ scale: 0.95 }}
                          onClick={generateCode}
                          style={{
                            padding: "14px 20px", borderRadius: 14, fontSize: 12, fontWeight: 800,
                            background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
                            color: "#fff", border: "none", cursor: "pointer",
                            transition: "all 0.3s",
                          }}
                        >
                          {lang === "hi" ? "बनाएं" : "GENERATE"}
                        </motion.button>
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                        {lang === "hi" ? "⚡ यादृच्छिक कोड बनाए" : "⚡ Generate a random code"}
                      </div>
                    </div>

                    {/* Connect Button */}
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: `0 20px 60px ${C.green}44` }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleConnect}
                      disabled={!phoneNumber || joinCode.length < 6}
                      style={{
                        padding: "16px", borderRadius: 14, fontSize: 15, fontWeight: 800,
                        background: phoneNumber && joinCode.length >= 6 
                          ? `linear-gradient(135deg, #25d366, #20a855)` 
                          : "rgba(37,211,102,0.15)",
                        color: "#fff", border: "none", cursor: phoneNumber && joinCode.length >= 6 ? "pointer" : "not-allowed",
                        transition: "all 0.3s",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {lang === "hi" ? "✨ अभी कनेक्ट करें" : "✨ CONNECT NOW"}
                    </motion.button>

                    {/* Success Message */}
                    <AnimatePresence>
                      {showSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          style={{
                            padding: "14px 16px", borderRadius: 12,
                            background: "rgba(37,211,102,0.2)", border: "1.5px solid #25d366",
                            color: "#25d366", fontSize: 13, fontWeight: 700, textAlign: "center",
                          }}
                        >
                          ✓ {lang === "hi" ? "सफलतापूर्वक जुड़ गया!" : "Connected successfully!"}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* WhatsApp Demo */}
              <AnimatePresence>
                {showWhatsAppDemo && (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                      background: "linear-gradient(135deg, #0a1628 0%, #0d1b2d 100%)",
                      border: `1.5px solid rgba(37,211,102,0.2)`,
                      borderRadius: 28, overflow: "hidden",
                      boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(37,211,102,0.1)",
                    }}
                  >
                    {/* WhatsApp Header */}
                    <div style={{
                      background: "linear-gradient(135deg, #1a2744 0%, #1d2f4d 100%)",
                      paddingTop: 16,
                      paddingBottom: 16,
                      paddingLeft: 20,
                      paddingRight: 20,
                      display: "flex", alignItems: "center", gap: 14,
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, #25d366, #20a855)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 8px 24px rgba(37,211,102,0.3)" }}>
                        ✓
                      </motion.div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>Vaani Bot</div>
                        <motion.div
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{ fontSize: 12, color: "#25d366", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <motion.span
                            animate={{ scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#25d366" }}
                          />
                          Online
                        </motion.div>
                      </div>
                      <span style={{ fontSize: 20, color: C.soft, cursor: "pointer" }}>⋯</span>
                    </div>

                    {/* Messages */}
                    <div style={{ padding: "20px 16px", minHeight: 320, maxHeight: 400, display: "flex", flexDirection: "column", gap: 14, overflow: "auto", background: "rgba(0,0,0,0.3)" }}>
                      <AnimatePresence>
                        {demoMessages.map((msg, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            style={{
                              display: "flex",
                              justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                              gap: 8,
                            }}
                          >
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              style={{
                                maxWidth: "75%",
                                background: msg.type === "user" 
                                  ? `linear-gradient(135deg, #25d366 0%, #20a855 100%)`
                                  : "rgba(255,255,255,0.08)",
                                color: msg.type === "user" ? "#000" : "#fff",
                                border: msg.type === "user" ? "none" : "1px solid rgba(255,255,255,0.1)",
                                borderRadius: msg.type === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                                padding: "12px 16px",
                                fontSize: 14,
                                fontWeight: 500,
                                lineHeight: 1.5,
                                wordBreak: "break-word",
                                transition: "all 0.3s",
                                boxShadow: msg.type === "user" ? "0 4px 12px rgba(37,211,102,0.3)" : "0 4px 12px rgba(0,0,0,0.2)",
                              }}>
                              {msg.text}
                            </motion.div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Input area */}
                    <div style={{
                      padding: "16px 20px",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      background: "linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(37,211,102,0.05) 100%)",
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <input
                        type="text"
                        placeholder={lang === "hi" ? "संदेश लिखें..." : "Type a message..."}
                        disabled
                        style={{
                          flex: 1, padding: "10px 16px", borderRadius: 999,
                          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                          color: C.muted, fontSize: 13, fontFamily: "inherit", opacity: 0.5,
                        }}
                      />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        disabled
                        style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "rgba(37,211,102,0.15)", border: "none",
                          color: "#25d366", fontSize: 18, cursor: "default", opacity: 0.5,
                        }}>
                        ➤
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ lang }) {
  return (
    <footer style={{
      padding: "40px 32px", borderTop: `1px solid ${C.border}`,
      background: C.surface, display: "flex", justifyContent: "space-between",
      alignItems: "center", flexWrap: "wrap", gap: 16,
    }}>
      <motion.div whileHover={{ scale: 1.05 }} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, color: "#fff",
        }}>V</div>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Vaani</span>
      </motion.div>
      <p style={{ fontSize: 13, color: C.muted }}>
        {lang === "hi" ? "व्यवसाय पहले से ही व्हाट्सएप पर होता है। हम इसे बुद्धिमान बनाते हैं।" : "Business already happens on WhatsApp. We just make it intelligent."}
      </p>
      <p style={{ fontSize: 12, color: C.muted }}>
        © 2025 Vaani. {lang === "hi" ? "भारत में प्यार से बनाया गया।" : "Made with ❤️ in India."}
      </p>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [lang, setLang] = useState("en");

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: C.bg }}>
      <Navbar lang={lang} setLang={setLang} />
      <Hero lang={lang} />
      <ProblemSection lang={lang} />
      <TransformSection lang={lang} />
      <Features lang={lang} />
      <UniqueSection lang={lang} />
      <DashboardPreview lang={lang} />
      <FinalCTA lang={lang} />
      <WhatsAppIntegration lang={lang} />
      <Footer lang={lang} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes float { 0%, 100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.purple}55; border-radius: 999px; transition: background 0.3s; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.purple}99; }
        @media (max-width: 768px) {
          .problem-grid { grid-template-columns: 1fr !important; }
          .unique-grid { grid-template-columns: 1fr !important; }
          .kpi-preview-grid { grid-template-columns: 1fr 1fr !important; }
          .whatsapp-grid { grid-template-columns: 1fr !important; }
          nav > div:nth-child(2) { display: none !important; }
        }
      `}</style>
    </div>
  );
}