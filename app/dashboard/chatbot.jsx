// components/ChatbotWidget.jsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { CHATBOT_GUIDES, LANGUAGES, speakText } from '@/lib/chatbot'

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [language, setLanguage] = useState('en')
  const [messages, setMessages] = useState([])
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const guide = CHATBOT_GUIDES[language]

  const handleOpen = () => {
    setIsOpen(true)
    if (messages.length === 0) {
      setMessages([{ type: 'bot', text: guide.welcome, canSpeak: true }])
      setShowQuickActions(true)
    }
  }

  const handleSendMessage = (text) => {
    if (!text.trim()) return
    // Add user message
    setMessages(prev => [...prev, { type: 'user', text }])
    setShowQuickActions(false)

    // Simulate bot thinking
    setTimeout(() => {
      const reply = getBotReply(text)
      setMessages(prev => [...prev, { type: 'bot', text: reply, canSpeak: true }])
      setShowQuickActions(true)
    }, 500)
  }

  const getBotReply = (userInput) => {
    const input = userInput.toLowerCase()
    // Feature keywords
    if (input.includes('khata') || input.includes('udhaar') || input.includes('credit')) {
      return guide.features.khata
    }
    if (input.includes('payment') || input.includes('pay') || input.includes('collect')) {
      return guide.features.payments
    }
    if (input.includes('order') || input.includes('order status')) {
      return guide.features.orders
    }
    if (input.includes('reminder') || input.includes('remind')) {
      return guide.features.reminders
    }
    if (input.includes('invoice') || input.includes('bill')) {
      return guide.features.invoices
    }
    if (input.includes('report') || input.includes('analytics')) {
      return guide.features.reports
    }
    if (input.includes('how to') || input.includes('help') || input.includes('guide')) {
      return guide.faq.howTo
    }
    if (input.includes('restart') || input.includes('start over') || input.includes('reset')) {
      resetChat()
      return guide.restartConfirm
    }
    // Default fallback
    return guide.fallback
  }

  const resetChat = () => {
    setMessages([{ type: 'bot', text: guide.welcome, canSpeak: true }])
    setShowQuickActions(true)
  }

  const handleQuickAction = (actionKey) => {
    let reply = ''
    switch (actionKey) {
      case 'khata': reply = guide.features.khata; break
      case 'payments': reply = guide.features.payments; break
      case 'orders': reply = guide.features.orders; break
      case 'reminders': reply = guide.features.reminders; break
      case 'faq': reply = guide.faq.common; break
      default: reply = guide.fallback
    }
    setMessages(prev => [...prev, 
      { type: 'user', text: guide.quickLabels[actionKey] },
      { type: 'bot', text: reply, canSpeak: true }
    ])
    setShowQuickActions(true)
  }

  const handleSpeak = (text) => {
    speakText(text, language)
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #c87137 0%, #d98d5e 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 999,
            animation: 'pulse 2s infinite',
          }}
          title="BusinessVaani Guide"
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 380,
          height: 560,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #c87137 0%, #d98d5e 100%)',
            color: '#fff',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{guide.name}</h3>
              <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.8 }}>Your AI Business Guide</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={resetChat}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  fontSize: 14,
                }}
                title="Restart conversation"
              >
                ↻
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            background: 'rgba(200, 113, 55, 0.05)',
          }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  resetChat()
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: language === lang.code ? '1px solid #c87137' : '1px solid var(--border)',
                  background: language === lang.code ? 'rgba(200, 113, 55, 0.2)' : 'transparent',
                  color: language === lang.code ? '#c87137' : 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {lang.name}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                gap: 8,
              }}>
                {msg.type === 'bot' && (
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(200, 113, 55, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                  }}>
                    🤖
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: msg.type === 'user' ? 'rgba(200, 113, 55, 0.15)' : 'var(--surface)',
                  border: msg.type === 'bot' ? '1px solid var(--border)' : 'none',
                  color: 'var(--text)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                  {msg.canSpeak && (
                    <button
                      onClick={() => handleSpeak(msg.text)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 8,
                        padding: '4px 10px',
                        borderRadius: 20,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: '#c87137',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      🔊 {language === 'en' ? 'Listen' : language === 'hi' ? 'सुनें' : 'கேளுங்கள்'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {showQuickActions && (
            <div style={{
              padding: '12px',
              borderTop: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}>
              {Object.entries(guide.quickActions).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleQuickAction(key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: '1px solid #c87137',
                    background: 'rgba(200, 113, 55, 0.1)',
                    color: '#c87137',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={resetChat}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                🔄 {guide.restartLabel}
              </button>
            </div>
          )}

          {/* Input Box */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
          }}>
            <input
              type="text"
              placeholder={guide.inputPlaceholder}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(e.target.value)
                  e.target.value = ''
                }
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 24,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={(e) => {
                const input = e.target.previousSibling
                handleSendMessage(input.value)
                input.value = ''
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#c87137',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  )
}