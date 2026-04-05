'use client'
import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [platform, setPlatform] = useState('') // 'android' or 'ios'
  const [step, setStep] = useState(1)

  const [lang, setLang] = useState('hi')
  const [activeTab, setActiveTab] = useState('android')

  const t = {
    hi: {
      title: "Vaani App Install करें",
      subtitle: "बेहतर अनुभव के लिए ऐप की तरह इस्तेमाल करें।",
      install: "Install",
      setup: "Setup",
      guide: "Installation Guide",
      step: "स्टेप",
      android: "Android",
      ios: "iPhone / iOS",
      next: "अगला स्टेप",
      back: "पीछे",
      done: "हो गया!",
      steps: {
        android: [
          { 
            title: "1. ब्राउज़र मेन्यू", 
            desc: "Chrome ब्राउज़र में ऊपर दाईं ओर (top-right) तीन बिंदुओं ⋮ पर क्लिक करें।" 
          },
          { 
            title: "2. होम स्क्रीन पर जोड़ें", 
            desc: "मेन्यू में 'Install App' या 'Add to Home screen' बटन को ढूँढें और क्लिक करें।" 
          }
        ],
        ios: [
          { 
            title: "1. शेयर ऑप्शन", 
            desc: "Safari ब्राउज़र में नीचे के बीच में 'Share' [↑] बटन पर क्लिक करें।" 
          },
          { 
            title: "2. होम स्क्रीन पर जोड़ें", 
            desc: "शेयर मेन्यु में नीचे स्क्रॉल करें और 'Add to Home Screen' [+] चुनें।" 
          }
        ]
      }
    },
    en: {
      title: "Install Vaani App",
      subtitle: "Use it like a real app for a better experience.",
      install: "Install",
      setup: "Setup",
      guide: "Installation Guide",
      step: "Step",
      android: "Android",
      ios: "iPhone / iOS",
      next: "Next Step",
      back: "Back",
      done: "Completed!",
      steps: {
        android: [
          { 
            title: "1. Browser Menu", 
            desc: "Click the three dots ⋮ in the top right of Chrome browser." 
          },
          { 
            title: "2. Add to Home Screen", 
            desc: "Find and click 'Install App' or 'Add to Home screen' in the menu." 
          }
        ],
        ios: [
          { 
            title: "1. Share Option", 
            desc: "Click the 'Share' [↑] button at the bottom center of Safari." 
          },
          { 
            title: "2. Add to Home Screen", 
            desc: "Scroll down in the share menu and select 'Add to Home Screen' [+]." 
          }
        ]
      }
    }
  }

  useEffect(() => {
    // Check if user has already dismissed the prompt in this session
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed')
    if (dismissed) return

    // Check if running as standalone PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (isPWA) return

    // Improved iOS detection
    const isIOS = (/iPad|iPhone|iPod/.test(navigator.userAgent)) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Inclusive mobile/tablet detection
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     (typeof window !== 'undefined' && window.innerWidth <= 1024);

    if (isIOS) {
      setPlatform('ios')
      setActiveTab('ios')
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 4000)
      return () => clearTimeout(timer)
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setPlatform('android')
      setActiveTab('android')
      setShowPrompt(true)
    }

    // Fallback for Android/General Browsers
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !showPrompt) {
        setPlatform('android-manual')
        setActiveTab('android')
        setShowPrompt(true)
      }
    }, 6000)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [deferredPrompt, showPrompt])

  const dismissPrompt = () => {
    sessionStorage.setItem('pwa_prompt_dismissed', 'true')
    setShowPrompt(false)
    setShowGuide(false)
  }

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) {
      setShowGuide(true)
      return
    }
    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') dismissPrompt()
      setDeferredPrompt(null)
    } catch (err) {
      console.error('Install failed', err)
      setShowGuide(true)
    }
  }

  // SVG Illustrations for Android (since PNGs are missing)
  const AndroidMenuSVG = () => (
    <svg width="120" height="200" viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="100" height="180" rx="12" stroke="#333" strokeWidth="2"/>
      <rect x="15" y="15" width="90" height="10" rx="2" fill="#222"/>
      <circle cx="95" cy="20" r="1.5" fill="#c87137"/>
      <circle cx="95" cy="25" r="1.5" fill="#c87137"/>
      <circle cx="95" cy="30" r="1.5" fill="#c87137"/>
      <rect x="50" y="35" width="55" height="80" rx="4" fill="#1a1a1f" stroke="#333" strokeWidth="1"/>
      <rect x="55" y="45" width="45" height="4" rx="1" fill="#333"/>
      <rect x="55" y="55" width="45" height="4" rx="1" fill="#333"/>
      <rect x="55" y="65" width="45" height="6" rx="1" fill="#c87137" opacity="0.8"/>
      <rect x="55" y="75" width="45" height="4" rx="1" fill="#333"/>
    </svg>
  )

  const AndroidAddSVG = () => (
    <svg width="120" height="200" viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="100" height="180" rx="12" stroke="#333" strokeWidth="2"/>
      <rect x="25" y="80" width="70" height="40" rx="8" fill="#1a1a1f" stroke="#c87137" strokeWidth="1"/>
      <text x="35" y="100" fill="#fff" fontSize="8" fontWeight="bold">Install App?</text>
      <rect x="65" y="105" width="25" height="10" rx="2" fill="#c87137"/>
      <text x="69" y="112" fill="#fff" fontSize="6" fontWeight="bold">Install</text>
    </svg>
  )

  if (!showPrompt) return null

  const currentT = t[lang]
  const currentSteps = currentT.steps[activeTab]
  const currentStep = currentSteps[step - 1]

  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pwa-tab-btn { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .pwa-guide-img { transition: transform 0.3s ease; }
        .pwa-guide-img:hover { transform: scale(1.02); }
      `}</style>

      {/* Main Bar Prompt */}
      {!showGuide && (
        <div style={{
          position: 'fixed', bottom: 80, left: '16px', right: '16px', zIndex: 1000,
          animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{
            background: 'rgba(26, 26, 31, 0.8)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '22px',
            padding: '14px 18px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', gap: '14px', color: '#fff'
          }}>
            <div style={{
              width: '44px', height: '44px', background: 'linear-gradient(135deg, #c87137, #e8974a)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 900, color: '#fff', boxShadow: '0 4px 12px rgba(200, 113, 55, 0.3)'
            }}>V</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>{currentT.title}</h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{currentT.subtitle}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {platform === 'android' ? (
                <button onClick={handleAndroidInstall} style={{ background: '#c87137', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>{currentT.install}</button>
              ) : (
                <button onClick={() => setShowGuide(true)} style={{ background: '#c87137', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>{currentT.setup}</button>
              )}
              <button onClick={dismissPrompt} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Installation Guide Modal */}
      {showGuide && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            width: '92%', maxWidth: '400px', background: '#121216', borderRadius: '32px',
            border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', padding: '28px',
            color: '#fff', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
            position: 'relative'
          }}>
            {/* Language Toggle in Corner */}
            <button 
              onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
              style={{
                position: 'absolute', top: 28, left: 28, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px',
                color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              {lang === 'hi' ? 'English' : 'हिंदी'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24, alignItems: 'center' }}>
              <button 
                onClick={dismissPrompt} 
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}
              >×</button>
            </div>

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>{currentT.guide}</div>

            {/* Platform Selector Tabs */}
            <div style={{ 
              display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', 
              padding: '6px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.04)' 
            }}>
              <button 
                className="pwa-tab-btn"
                onClick={() => { setActiveTab('android'); setStep(1); }} 
                style={{ 
                  flex: 1, padding: '10px', borderRadius: '12px', border: 'none', 
                  background: activeTab === 'android' ? '#c87137' : 'transparent', 
                  color: activeTab === 'android' ? '#fff' : 'rgba(255,255,255,0.5)', 
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer' 
                }}
              >{currentT.android}</button>
              <button 
                className="pwa-tab-btn"
                onClick={() => { setActiveTab('ios'); setStep(1); }} 
                style={{ 
                  flex: 1, padding: '10px', borderRadius: '12px', border: 'none', 
                  background: activeTab === 'ios' ? '#c87137' : 'transparent', 
                  color: activeTab === 'ios' ? '#fff' : 'rgba(255,255,255,0.5)', 
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer' 
                }}
              >{currentT.ios}</button>
            </div>

            <div style={{ animation: 'fadeIn 0.3s' }}>
              <p style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: '#fff', letterSpacing: '-0.5px' }}>
                {currentStep.title}
              </p>
              
              <div style={{ width: '100%', aspectRatio: '1.4/1', background: '#09090b', borderRadius: 24, overflow: 'hidden', marginBottom: 24, border: '1px solid #1f1f23', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeTab === 'android' ? (
                  <div style={{ transform: 'scale(1.2)' }}>
                    {step === 1 ? <AndroidMenuSVG /> : <AndroidAddSVG />}
                  </div>
                ) : (
                  <img 
                    className="pwa-guide-img"
                    src={step === 1 ? "/images/pwa/ios_share.png" : "/images/pwa/ios_add.png"} 
                    alt="Guide" 
                    onError={(e) => { e.target.style.display = 'none' }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                )}
              </div>
              
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, padding: '0 8px', margin: 0, minHeight: '44px' }}>
                {currentStep.desc}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 14, marginTop: 32 }}>
              {step === 2 && (
                <button 
                  onClick={() => setStep(1)} 
                  style={{ flex: 1, padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid #222', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >{currentT.back}</button>
              )}
              {step === 1 ? (
                <button 
                  onClick={() => setStep(2)} 
                  style={{ flex: 1, padding: '14px', borderRadius: '16px', background: 'linear-gradient(135deg, #c87137, #e8974a)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(200, 113, 55, 0.3)' }}
                >{currentT.next}</button>
              ) : (
                <button 
                  onClick={dismissPrompt} 
                  style={{ flex: 1, padding: '14px', borderRadius: '16px', background: 'linear-gradient(135deg, #c87137, #e8974a)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(200, 113, 55, 0.3)' }}
                >{currentT.done}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

