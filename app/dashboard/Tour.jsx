'use client'
import { useState, useEffect } from 'react'
import { Joyride, STATUS } from 'react-joyride'
import { useTheme } from '@/lib/theme'

const TOUR_DATA = [
  {
    target: 'body',
    placement: 'center',
    en: {
      title: 'Welcome to your Dashboard! 💗',
      content: 'Let\'s take a quick 1-minute tour to see how your new AI-powered business dashboard works.',
    },
    hi: {
      title: 'आपके नए डैशबोर्ड में आपका स्वागत है! 💗',
      content: 'आइए एक मिनट का टूर लें और देखें कि आपका नया AI-पावर्ड बिज़नेस डैशबोर्ड कैसे काम करता है।',
    },
    disableBeacon: true,
  },
  {
    target: '#tour-nav-orders',
    placement: 'right',
    en: {
      title: '📦 Order Automatic Sync',
      content: 'When your customers send voice notes or photos on WhatsApp, their orders appear here instantly—no manual entry needed!',
    },
    hi: {
      title: '📦 आटोमेटिक ऑर्डर सिंक',
      content: 'जब आपके ग्राहक WhatsApp पर वॉइस या फोटो भेजते हैं, तो उनके ऑर्डर बिना मैन्युअल एंट्री के यहाँ तुरंत दिखते हैं!',
    }
  },
  {
    target: '#tour-nav-invoices',
    placement: 'right',
    en: {
      title: '📄 1-Click Invoices',
      content: 'Generate professional GST-ready PDF invoices and securely send them to customers over WhatsApp in one click.',
    },
    hi: {
      title: '📄 1-क्लिक इनवॉइस (बिल)',
      content: 'प्रोफेशनल GST-रेडी PDF इनवॉइस बनाएं और एक क्लिक में WhatsApp के जरिए ग्राहकों को सुरक्षित रूप से भेजें।',
    }
  },
  {
    target: '#tour-nav-khata',
    placement: 'right',
    en: {
      title: '📒 Your Digital Khata',
      content: 'Say goodbye to physical ledgers. This tracks all udhaar payments automatically based on unpaid orders.',
    },
    hi: {
      title: '📒 आपका डिजिटल खाता',
      content: 'फिजिकल बहीखातों को अलविदा कहें। यह बकाया ऑर्डर्स के आधार पर सभी उधार पेमेंट्स को आटोमेटिक ट्रैक करता है।',
    }
  },
  {
    target: '#tour-nav-inventory',
    placement: 'right',
    en: {
      title: '📦 Real-Time Inventory',
      content: 'Your stock drops automatically when an order arrives and restores if it\'s cancelled. You\'ll even get low-stock alerts!',
    },
    hi: {
      title: '📦 रियल-टाइम इन्वेंटरी (स्टॉक)',
      content: 'ऑर्डर आते ही आपका स्टॉक आटोमेटिक रूप से कम हो जाता है। आपको WhatsApp पर लो-स्टॉक अलर्ट भी मिलेंगे!',
    }
  },
  {
    target: '#tour-chatbot',
    placement: 'left',
    en: {
      title: '👩 Talk to Priya',
      content: 'Meet your personal AI assistant! She can answer questions about your data and give demos.',
    },
    hi: {
      title: '👩 प्रिया से बात करें',
      content: 'मिलिए अपनी निजी AI असिस्टेंट से! वह आपके डेटा के बारे में सवालों के जवाब दे सकती है।',
    }
  }
]

// Convert to Joyride format
const TOUR_STEPS = TOUR_DATA.map((s, i) => ({
  target: s.target,
  placement: s.placement,
  disableBeacon: s.disableBeacon,
  disableOverlayClose: true,
  spotlightPadding: 8,
  title: i.toString(),
}))

function CustomTooltip({
  index,
  step,
  isLastStep,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  lang,
  setLang,
  theme
}) {
  const dataIndex = parseInt(step.title, 10)
  const data = TOUR_DATA[dataIndex]
  const content = data[lang]
  const isDark = theme === 'dark'

  return (
    <div
      {...tooltipProps}
      style={{
        width: 380,
        maxWidth: '90vw',
        background: isDark ? 'rgba(25, 25, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(200,113,55,0.2)',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: isDark ? '#fff' : '#111',
      }}
    >
      {/* Header Panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
        
        {/* Language Toggles */}
        <div style={{ display: 'flex', gap: 6, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 12 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setLang('en'); }}
            style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: lang === 'en' ? '#c87137' : 'transparent',
              color: lang === 'en' ? '#fff' : '#888'
            }}
          >
            EN
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLang('hi'); }}
            style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: lang === 'hi' ? '#c87137' : 'transparent',
              color: lang === 'hi' ? '#fff' : '#888'
            }}
          >
            हिंदी
          </button>
        </div>

      </div>

      {/* Main Content */}
      <div style={{ padding: '24px 20px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: 18, fontWeight: 700, color: isDark ? '#fff' : '#111', letterSpacing: '-0.3px', lineHeight: 1.3 }}>
          {content.title}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: isDark ? '#aaa' : '#666', lineHeight: 1.6 }}>
          {content.content}
        </p>
      </div>

      {/* Footer / Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)', borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
        
        {/* Step Indicator */}
        <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>
          {index + 1} <span style={{ opacity: 0.5 }}>/</span> {TOUR_STEPS.length}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {index > 0 && (
            <button {...backProps} style={{ background: 'transparent', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', color: isDark ? '#fff' : '#111', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {lang === 'hi' ? 'पीछे' : 'Back'}
            </button>
          )}
          <button {...primaryProps} style={{ background: 'linear-gradient(135deg, #c87137, #e8974a)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(200,113,55,0.3)', transition: 'all 0.2s' }}>
            {isLastStep ? (lang === 'hi' ? 'खत्म करें' : 'Finish Tour') : (lang === 'hi' ? 'आगे बढ़ें' : 'Next')}
          </button>
        </div>
      </div>

      <button {...closeProps} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: '#666', fontSize: 16, cursor: 'pointer' }}>
        ✕
      </button>

    </div>
  )
}

export default function Tour() {
  const [run, setRun] = useState(false)
  const [lang, setLang] = useState('en')
  const { theme } = useTheme()

  useEffect(() => {
    // Only run once per user
    const hasSeenTour = localStorage.getItem('vaani_tour_completed')
    if (!hasSeenTour) {
      setTimeout(() => setRun(true), 1500)
    }
  }, [])

  const handleJoyrideCallback = (data) => {
    const { status } = data
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRun(false)
      localStorage.setItem('vaani_tour_completed', 'true')
    }
  }

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous={true}
      showProgress={false}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      tooltipComponent={(props) => (
        <CustomTooltip 
          {...props} 
          lang={lang} 
          setLang={setLang}
          theme={theme}
        />
      )}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.4)',
        },
        spotlight: {
          borderRadius: 12,
        }
      }}
    />
  )
}
