'use client'
import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [platform, setPlatform] = useState('') // 'android', 'ios', 'desktop'
  const [step, setStep] = useState(1)

  const [lang, setLang] = useState('hi')
  const [activeTab, setActiveTab] = useState('android')

  const t = {
    hi: {
      title: "Vaani App Install करें",
      subtitle: "बेहतर अनुभव के लिए इसे ऐप की तरह इस्तेमाल करें।",
      install: "Install",
      setup: "Setup",
      guide: "App कैसे रखें?",
      step: "स्टेप",
      android: "Android",
      ios: "iPhone / iOS",
      desktop: "Laptop / Desktop",
      next: "अगला (Next)",
      back: "पीछे (Back)",
      done: "हो गया!",
      steps: {
        android: [
          {
            title: "1. ब्राउज़र मेन्यू खोलें",
            desc: "Chrome ब्राउज़र में सबसे ऊपर दाईं ओर (top-right) तीन बिंदुओं ⋮ पर क्लिक करें।"
          },
          {
            title: "2. Install करें",
            desc: "मेन्यू की लिस्ट में 'Install App' या 'Add to Home screen' बटन पर क्लिक करें। फिर 'Install' चुनें।"
          }
        ],
        ios: [
          {
            title: "1. शेयर (Share) बटन",
            desc: "iPhone के Safari ब्राउज़र में नीचे के बीच में 'Share' [↑] बटन पर क्लिक करें।"
          },
          {
            title: "2. होम स्क्रीन पर जोड़ें",
            desc: "शेयर मेन्यु में नीचे स्क्रॉल करें और 'Add to Home Screen' [+] चुनें। फिर 'Add' दबाएं।"
          }
        ],
        desktop: [
          {
            title: "1. Address Bar देखें",
            desc: "सबसे ऊपर जहाँ वेबसाइट का नाम (vaani-v...) लिखा है, वहाँ दाईं ओर एक कंप्यूटर [⊕] जैसा छोटा आइकॉन दिखेगा।"
          },
          {
            title: "2. Install दबाएं",
            desc: "उस आइकॉन पर क्लिक करें और फिर 'Install' बटन दबाएं। अब ऐप आपके लैपटॉप पर खुल जाएगा!"
          }
        ]
      }
    },
    en: {
      title: "Install Vaani App",
      subtitle: "Use it like a real app for a faster and better experience.",
      install: "Install",
      setup: "Setup",
      guide: "How to Install?",
      step: "Step",
      android: "Android",
      ios: "iPhone / iOS",
      desktop: "Laptop / Desktop",
      next: "Next Step",
      back: "Back",
      done: "Completed!",
      steps: {
        android: [
          {
            title: "1. Open Browser Menu",
            desc: "Click the three dots ⋮ in the top right of your Chrome browser."
          },
          {
            title: "2. Click Install",
            desc: "Find and click 'Install App' or 'Add to Home screen' in the menu."
          }
        ],
        ios: [
          {
            title: "1. Tap Share Option",
            desc: "Click the 'Share' [↑] button at the bottom center of Safari."
          },
          {
            title: "2. Add to Home Screen",
            desc: "Scroll down in the menu and select 'Add to Home Screen' [plus icon]."
          }
        ],
        desktop: [
          {
            title: "1. Look at Address Bar",
            desc: "At the top right of the address bar (next to the website URL), click the small computer [⊕] icon."
          },
          {
            title: "2. Click Install",
            desc: "A popup will appear. Click 'Install' to add Vaani to your applications."
          }
        ]
      }
    }
  }

  useEffect(() => {
    // Check if running as standalone PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (isPWA) return

    // Better environment detection
    const isIOS = (/iPad|iPhone|iPod/.test(navigator.userAgent)) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' && window.innerWidth <= 1024);

    if (isIOS) {
      setPlatform('ios')
      setActiveTab('ios')
    } else if (!isMobile) {
      setPlatform('desktop')
      setActiveTab('desktop')
    } else {
      setPlatform('android')
      setActiveTab('android')
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    // Always show if not PWA (per user request for persistence)
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 3000)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [])

  const dismissPrompt = () => {
    setShowPrompt(false)
    setShowGuide(false)
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') dismissPrompt()
        setDeferredPrompt(null)
      } catch (err) {
        console.error('Install failed', err)
        setShowGuide(true)
      }
    } else {
      setShowGuide(true)
    }
  }

  // SVG Illustrations
  const AndroidMenuSVG = () => (
    <svg width="120" height="200" viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="100" height="180" rx="12" stroke="#333" strokeWidth="2" />
      <rect x="15" y="15" width="90" height="10" rx="2" fill="#222" />
      <circle cx="95" cy="20" r="1.5" fill="#f59e0b" />
      <circle cx="95" cy="25" r="1.5" fill="#f59e0b" />
      <circle cx="95" cy="30" r="1.5" fill="#f59e0b" />
      <rect x="50" y="35" width="55" height="80" rx="4" fill="#1a1a1f" stroke="#333" strokeWidth="1" />
      <rect x="55" y="45" width="45" height="4" rx="1" fill="#333" />
      <rect x="55" y="55" width="45" height="4" rx="1" fill="#333" />
      <rect x="55" y="65" width="45" height="6" rx="1" fill="#f59e0b" opacity="0.8" />
      <rect x="55" y="75" width="45" height="4" rx="1" fill="#333" />
    </svg>
  )

  const DesktopSVG = () => (
    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="120" height="80" rx="8" stroke="#333" strokeWidth="2" fill="#09090b" />
      <rect x="15" y="15" width="110" height="8" rx="2" fill="#222" stroke="#333" strokeWidth="0.5" />
      <circle cx="118" cy="19" r="4" fill="#f59e0b" opacity="0.9" />
      <path d="M116.5 19H119.5M118 17.5V20.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
      <rect x="30" y="30" width="80" height="40" rx="4" fill="#1a1a1f" />
      <rect x="10" y="24" width="120" height="1" fill="#222" />
    </svg>
  )

  if (!showPrompt) return null

  const currentT = t[lang]
  const currentSteps = currentT.steps[activeTab] || currentT.steps['android']
  const currentStep = currentSteps[step - 1]

  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pwa-tab-btn { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>

      {/* Main Bar Prompt */}
      {!showGuide && (
        <div style={{
          position: 'fixed', bottom: 85, left: '12px', right: '12px', zIndex: 1000,
          animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{
            background: 'rgba(26, 26, 31, 0.85)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px',
            padding: '12px 16px', boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', gap: '12px', color: '#fff'
          }}>
            <div style={{
              width: '42px', height: '42px', background: 'linear-gradient(135deg, #f59e0b, #eab308)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 900, color: '#000', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
            }}>V</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fff' }}>{currentT.title}</h3>
              <p style={{ margin: 0, fontSize: '10.5px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{currentT.subtitle}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleInstallClick} style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: '12px', padding: '8px 16px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                {deferredPrompt ? currentT.install : currentT.setup}
              </button>
              <button onClick={dismissPrompt} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#888', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Installation Guide Modal */}
      {showGuide && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            width: '94%', maxWidth: '420px', background: '#09090b', borderRadius: '32px',
            border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', padding: '24px 20px',
            color: '#fff', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
              <button onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #333', borderRadius: '10px', padding: '6px 12px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                {lang === 'hi' ? 'English' : 'हिंदी'}
              </button>
              <button onClick={dismissPrompt} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{currentT.guide}</div>

            {/* Platform Tabs */}
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '14px',
              padding: '4px', marginBottom: '24px', border: '1px solid #1f1f23'
            }}>
              {['android', 'ios', 'desktop'].map(tab => (
                <button
                  key={tab}
                  className="pwa-tab-btn"
                  onClick={() => { setActiveTab(tab); setStep(1); }}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: '10px', border: 'none',
                    background: activeTab === tab ? '#f59e0b' : 'transparent',
                    color: activeTab === tab ? '#000' : 'rgba(255,255,255,0.4)',
                    fontSize: '11px', fontWeight: 800, cursor: 'pointer'
                  }}
                >{currentT[tab]}</button>
              ))}
            </div>

            <div style={{ animation: 'fadeIn 0.3s' }}>
              <h4 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 12px', color: '#fff' }}>{currentStep.title}</h4>

              <div style={{ width: '100%', aspectRatio: '1.6/1', background: '#000', borderRadius: 20, overflow: 'hidden', marginBottom: 20, border: '1px solid #1a1a1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeTab === 'android' ? (
                  <div style={{ transform: 'scale(1.1)' }}>
                    {step === 1 ? <AndroidMenuSVG /> : <AndroidMenuSVG />} {/* Can differentiate menu/install later */}
                  </div>
                ) : activeTab === 'desktop' ? (
                  <DesktopSVG />
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: '#f59e0b' }}>
                    <span style={{ fontSize: 40 }}>{step === 1 ? '↑' : '[+]'}</span>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: 0, minHeight: '66px', padding: '0 10px' }}>
                {currentStep.desc}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {step === 2 && (
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  {currentT.back}
                </button>
              )}
              {step === 1 ? (
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '14px', borderRadius: '16px', background: '#f59e0b', border: 'none', color: '#000', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
                  {currentT.next}
                </button>
              ) : (
                <button onClick={dismissPrompt} style={{ flex: 1, padding: '14px', borderRadius: '16px', background: '#f59e0b', border: 'none', color: '#000', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
                  {currentT.done}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

