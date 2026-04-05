'use client'
import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [platform, setPlatform] = useState('') // 'android' or 'ios'
  const [step, setStep] = useState(1)

  useEffect(() => {
    // Check if user has already dismissed the prompt in this session
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed')
    if (dismissed) return

    // Check if running as standalone PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (isPWA) return

    // Improved iOS detection (including modern iPads)
    const isIOS = (/iPad|iPhone|iPod/.test(navigator.userAgent)) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Check if it's some other mobile device (Android, etc.)
    const isMobile = /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isIOS) {
      setPlatform('ios')
      // Show iOS prompt after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setPlatform('android')
      setShowPrompt(true)
    }

    // Fallback for Android/Mobile if native prompt doesn't fire
    const fallbackTimer = isMobile ? setTimeout(() => {
      if (!deferredPrompt && !showPrompt) {
        setPlatform('android-manual') // Use manual guide for android
        setShowPrompt(true)
      }
    }, 8000) : null

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

  if (!showPrompt) return null

  return (
    <>
      {/* Main Bar Prompt */}
      {!showGuide && (
        <div style={{
          position: 'fixed', bottom: 80, left: '16px', right: '16px', zIndex: 1000,
          animation: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <style>{`
            @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
          <div style={{
            background: 'var(--card-bg, #1a1a1f)', backdropFilter: 'blur(16px)',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.1))', borderRadius: '20px',
            padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', gap: '12px', color: '#fff'
          }}>
            <div style={{
              width: '42px', height: '42px', background: 'linear-gradient(135deg, #c87137, #e8974a)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: 800, color: '#fff'
            }}>V</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Vaani App Install करें</h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary, rgba(255,255,255,0.6))' }}>Use it like a real app for faster speed.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {platform === 'android' ? (
                <button onClick={handleAndroidInstall} style={{ background: '#c87137', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>Install</button>
              ) : (
                <button onClick={() => setShowGuide(true)} style={{ background: '#c87137', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>How to Install</button>
              )}
              <button onClick={dismissPrompt} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px' }}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Visual Guide Modal */}
      {showGuide && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            width: '90%', maxWidth: '380px', background: '#1a1a1f', borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', padding: '24px',
            color: '#fff', textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#666' }}>PWA Installation Guide</div>
              <button 
                onClick={dismissPrompt} 
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 16 }}
              >Skip</button>
            </div>

            {platform.startsWith('android') ? (
              /* Android Guide */
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>
                  {step === 1 ? 'Step 1: 3-Dots Menu' : 'Step 2: Add to Home Screen'}
                </p>
                <div style={{ width: '100%', aspectRatio: '1.2/1', background: '#111', borderRadius: 16, overflow: 'hidden', marginBottom: 20, border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={step === 1 ? "/images/pwa/android_menu.png" : "/images/pwa/android_add.png"} 
                    alt="Guide" 
                    onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=Menu+Buttons" }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                </div>
                <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5, padding: '0 10px' }}>
                  {step === 1 
                    ? "Chrome में ऊपर दाईं ओर (top right) 3-dots पर क्लिक करें।" 
                    : "मेन्यू में 'Install App' या 'Add to Home screen' चुनें।"}
                </p>
              </div>
            ) : (
              /* iOS Guide (Default) */
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>
                  {step === 1 ? 'Step 1: Share Button' : 'Step 2: Add to Home Screen'}
                </p>
                <div style={{ width: '100%', aspectRatio: '1.2/1', background: '#111', borderRadius: 16, overflow: 'hidden', marginBottom: 20, border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={step === 1 ? "/images/pwa/ios_share.png" : "/images/pwa/ios_add.png"} 
                    alt="Guide" 
                    onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=Share+Button" }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                </div>
                <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5, padding: '0 10px' }}>
                  {step === 1 
                    ? "Safari ब्राउज़र में नीचे दिए गए 'Share' बटन पर क्लिक करें।" 
                    : "मेन्यू में 'Add to Home Screen' पर क्लिक करें।"}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {step === 2 && (
                <button 
                  onClick={() => setStep(1)} 
                  style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#fff', fontSize: 14, fontWeight: 600 }}
                >Back</button>
              )}
              {step === 1 ? (
                <button 
                  onClick={() => setStep(2)} 
                  style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg, #c87137, #e8974a)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700 }}
                >Next Step</button>
              ) : (
                <button 
                  onClick={dismissPrompt} 
                  style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg, #c87137, #e8974a)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700 }}
                >Completed!</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
