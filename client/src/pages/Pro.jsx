import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores'
import { motion, useInView } from 'framer-motion'
import {
  Sparkles, CheckCircle2, Zap, Shield, ArrowLeft,
  Brain, Calendar, FileText, Bell, TrendingUp,
  BarChart3, Crown,
} from 'lucide-react'
import { C, fonts, tint } from '../utils/theme'

const PRO_FEATURES = [
  { icon: Brain, title: 'Unlimited AI Study Plans', desc: 'Generate as many plans as you need, recalculated every time your deadlines change.' },
  { icon: Sparkles, title: 'Unlimited AI Chat', desc: 'No daily message cap. Ask StudyPulse anything, anytime.' },
  { icon: Zap, title: 'Smart Priority Scoring', desc: 'AI ranks your tasks by weight, deadline, and difficulty — not just due date.' },
  { icon: FileText, title: 'PDF & iCal Export', desc: 'Export your study plans to PDF or sync to any calendar app via .ics.' },
  { icon: Bell, title: 'Email Deadline Reminders', desc: '24h and 2h reminders sent to your inbox. Never miss a submission again.' },
  { icon: TrendingUp, title: 'Grade Predictions', desc: 'AI estimates your final grade based on current scores and remaining assignments.' },
  { icon: Calendar, title: 'Smart Calendar Blocking', desc: 'StudyPulse blocks study time in Google Calendar automatically, respecting your existing events.' },
  { icon: BarChart3, title: 'Progress Analytics', desc: 'Track your study consistency, assignment completion rate, and grade trends over time.' },
]

const FAQ = [
  {
    q: 'Is the free tier really free forever?',
    a: 'Yes. StudyPulse is MIT-licensed open source. Self-host it forever at zero cost. StudyPulse Pro is a hosted version that adds premium AI features.',
  },
  {
    q: 'What happens when my trial ends?',
    a: 'You drop back to the free tier — your data stays safe. Nothing is deleted.',
  },
  {
    q: 'Do you store my Google data?',
    a: 'On the self-hosted version: never. On StudyPulse Cloud, assignment metadata is stored encrypted to power AI features, and you can delete it anytime.',
  },
  {
    q: 'Can I use StudyPulse without Google Classroom?',
    a: 'Yes. You can add assignments manually and still use all AI features including study plans and chat.',
  },
  {
    q: 'Is there a student discount?',
    a: "We're a student-built app. The Pro tier is already priced for students at ฿199/month (~$5.50). Email us with your student ID for an extra 30% off.",
  },
]

const FadeIn = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function Pro() {
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const { user } = useAuthStore()

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing: billingAnnual ? 'annual' : 'monthly',
          email: user?.email || undefined,
          supabaseUserId: user?.id || undefined,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setCheckoutError('Could not connect to payment server. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const monthlyPrice = 199
  const annualPrice = Math.round(monthlyPrice * 12 * 0.75)
  const annualMonthly = Math.round(annualPrice / 12)

  return (
    <div
      style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: fonts.body, overflowX: 'hidden' }}
    >
      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${C.borderSoft}`,
        background: C.bg,
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', color: C.textMuted,
          }}>
            <ArrowLeft size={15} />
            <span style={{ fontFamily: fonts.heading, fontSize: 13, fontWeight: 600 }}>Back</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--grad-logo, linear-gradient(135deg, #10b981, #059669))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
            }}>
              <Zap size={16} color="#ffffff" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 15, color: C.text }}>StudyPulse Pro</span>
            <Crown size={14} style={{ color: '#fbbf24' }} />
          </div>
          <Link to="/login" style={{
            padding: '7px 16px', borderRadius: 8,
            background: 'var(--accent-blue, #10b981)',
            color: '#ffffff', textDecoration: 'none',
            fontFamily: fonts.heading,
            fontSize: 12, fontWeight: 700,
          }}>
            TRY FREE FIRST
          </Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <section style={{ padding: '80px 24px 60px', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 100,
              background: 'var(--accent-blue-soft, rgba(59, 130, 246, 0.12))',
              border: `1px solid ${tint(C.blueDark, 0.35)}`,
              fontFamily: fonts.heading, fontSize: 11.5, fontWeight: 700,
              color: C.blue, letterSpacing: '0.01em', textTransform: 'none', marginBottom: 24,
            }}>
              <Crown size={12} /> StudyPulse Pro
            </div>
            <h1 style={{
              fontFamily: fonts.heading,
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              color: C.text, marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.02em',
            }}>
              Study smarter. <span style={{ color: C.blue }}>Not harder.</span>
            </h1>
            <p style={{
              fontSize: 16, color: C.textMuted,
              maxWidth: 500, margin: '0 auto', lineHeight: 1.7,
            }}>
              StudyPulse Pro unlocks unlimited AI assistance, automatic study scheduling, grade predictions, and exam mastery tools.
            </p>
          </motion.div>
        </section>

        {/* Pricing card */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <FadeIn>
              {/* Billing toggle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                <div style={{
                  display: 'flex', gap: 4, padding: 4, borderRadius: 10,
                  background: 'var(--bg-card, #101c17)',
                  border: `1px solid ${C.border}`,
                }}>
                  {[
                    { label: 'Monthly', val: false },
                    { label: 'Annual · Save 25%', val: true },
                  ].map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setBillingAnnual(opt.val)}
                      style={{
                        padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: billingAnnual === opt.val ? 'var(--accent-blue-soft, rgba(59, 130, 246, 0.12))' : 'transparent',
                        color: billingAnnual === opt.val ? C.blue : C.textMuted,
                        fontFamily: fonts.heading,
                        fontSize: 12.5, fontWeight: 700,
                        letterSpacing: '0.01em',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price card */}
              <div style={{
                borderRadius: 14, padding: '40px 36px',
                border: '1px solid rgba(168,85,247,0.35)',
                borderTop: '3px solid var(--accent-purple, #a855f7)',
                background: 'var(--bg-card, #101c17)',
                boxShadow: '0 12px 32px -8px rgba(0,0,0,0.35)',
                position: 'relative', overflow: 'hidden',
                textAlign: 'center',
              }}>

                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.01em',
                  color: 'var(--accent-purple, #c084fc)', marginBottom: 16,
                  textTransform: 'none',
                }}>Pro Plan</div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 48, fontWeight: 700, color: 'var(--text-primary, #f0f4fc)',
                    letterSpacing: '-0.03em',
                  }}>฿{billingAnnual ? annualMonthly : monthlyPrice}</span>
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: 'var(--text-muted, #64748b)' }}>/ month</span>
                </div>

                {billingAnnual && (
                  <div style={{
                    fontFamily: "'Manrope', sans-serif", fontSize: 13, color: '#4ade80',
                    fontWeight: 600, marginBottom: 8,
                  }}>
                    Billed ฿{annualPrice}/year · Save ฿{monthlyPrice * 12 - annualPrice}
                  </div>
                )}

                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: 'var(--text-muted, #64748b)', marginBottom: 28 }}>
                  7-day free trial · Cancel anytime
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  style={{
                    width: '100%', padding: '14px 24px', borderRadius: 10,
                    background: 'var(--accent-purple, #a855f7)',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 14, fontWeight: 700, letterSpacing: '0.02em',
                    boxShadow: '0 4px 14px rgba(168,85,247,0.3)',
                    marginBottom: 16,
                  }}
                >
                  {checkoutLoading ? 'Redirecting...' : 'Start Free Trial'}
                </motion.button>

                {checkoutError && (
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: '#f87171', marginTop: 8, textAlign: 'center' }}>
                    {checkoutError}
                  </p>
                )}

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: "'Manrope', sans-serif", fontSize: 12, color: 'var(--text-muted, #64748b)',
                }}>
                  <Shield size={13} />
                  No credit card required for trial
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Pro features */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <FadeIn style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(20px, 2.5vw, 26px)',
                fontWeight: 700,
                color: 'var(--text-primary, #f0f4fc)',
                letterSpacing: '-0.02em',
              }}>What You Get</div>
            </FadeIn>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {PRO_FEATURES.map((f, i) => (
                <FadeIn key={f.title} delay={i * 0.06}>
                  <div style={{
                    display: 'flex', gap: 14, padding: 20, borderRadius: 12,
                    border: '1px solid var(--border-color, #232d42)',
                    background: 'var(--bg-card, #101c17)',
                    boxShadow: '0 4px 16px -4px rgba(0,0,0,0.25)',
                  }}>
                    <div style={{
                      width: 38, height: 38, flexShrink: 0, borderRadius: 10,
                      background: 'rgba(168,85,247,0.12)',
                      border: '1px solid rgba(168,85,247,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <f.icon size={18} style={{ color: 'var(--accent-purple, #c084fc)' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-primary, #f0f4fc)', marginBottom: 4 }}>{f.title}</div>
                      <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Free vs Pro comparison */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <FadeIn style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(20px, 2.5vw, 26px)',
                fontWeight: 700,
                color: 'var(--text-primary, #f0f4fc)',
                letterSpacing: '-0.02em',
              }}>Free vs Pro</div>
            </FadeIn>
            <FadeIn>
              <div style={{
                borderRadius: 14, overflow: 'hidden',
                border: '1px solid var(--border-color, #232d42)',
                background: 'var(--bg-card, #101c17)',
                boxShadow: '0 8px 24px -6px rgba(0,0,0,0.3)',
              }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '14px 20px',
                  background: 'var(--bg-secondary, #0e131f)',
                  borderBottom: '1px solid var(--border-color, #232d42)',
                }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted, #64748b)' }}>FEATURE</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-secondary, #94a3b8)', textAlign: 'center' }}>FREE</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--accent-purple, #c084fc)', textAlign: 'center' }}>PRO</div>
                </div>
                {[
                  ['Google Classroom Sync', '✓', '✓'],
                  ['Gmail Intelligence', '✓', '✓'],
                  ['Calendar Integration', '✓', '✓'],
                  ['Grade Calculator', '✓', '✓'],
                  ['AI Study Plans', '5/month', 'Unlimited'],
                  ['AI Chat', '10/day', 'Unlimited'],
                  ['Priority Scoring', '—', '✓'],
                  ['PDF Export', '—', '✓'],
                  ['Email Reminders', '—', '✓'],
                  ['Grade Predictions', '—', '✓'],
                  ['Analytics Dashboard', '—', '✓'],
                  ['Smart Calendar Blocking', '—', '✓'],
                ].map(([feat, free, pro], idx) => (
                  <div key={feat} style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    padding: '12px 20px', alignItems: 'center',
                    borderBottom: idx < 11 ? '1px solid var(--border-color, #1e2638)' : 'none',
                    background: idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  }}>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>{feat}</div>
                    <div style={{
                      textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 12, color: free === '✓' ? '#4ade80' : free === '—' ? 'var(--text-muted, #475569)' : 'var(--accent-blue, #10b981)',
                    }}>{free}</div>
                    <div style={{
                      textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 12, fontWeight: pro !== '—' ? 600 : 400,
                      color: pro === '✓' || pro === 'Unlimited' ? 'var(--accent-purple, #c084fc)' : pro === '—' ? 'var(--text-muted, #475569)' : 'var(--accent-purple, #c084fc)',
                    }}>{pro}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <FadeIn style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(20px, 2.5vw, 26px)',
                fontWeight: 700,
                color: 'var(--text-primary, #f0f4fc)',
                letterSpacing: '-0.02em',
              }}>Frequently Asked Questions</div>
            </FadeIn>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAQ.map((item, i) => (
                <FadeIn key={i} delay={i * 0.06}>
                  <div style={{
                    borderRadius: 12,
                    border: '1px solid var(--border-color, #232d42)',
                    background: 'var(--bg-card, #101c17)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      style={{
                        width: '100%', padding: '16px 20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #f0f4fc)' }}>
                        {item.q}
                      </span>
                      <span style={{ color: 'var(--text-muted, #64748b)', fontSize: 18, lineHeight: 1, flexShrink: 0, marginLeft: 12 }}>
                        {openFaq === i ? '−' : '+'}
                      </span>
                    </button>
                    {openFaq === i && (
                      <div style={{ padding: '0 20px 16px' }}>
                        <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>
                          {item.a}
                        </div>
                      </div>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ padding: '0 24px 80px', textAlign: 'center' }}>
          <FadeIn>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: 'var(--text-muted, #64748b)', marginBottom: 16 }}>
              Not ready to commit? Try the free demo first.
            </p>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 10,
              border: '1px solid rgba(59,130,246,0.25)',
              background: 'rgba(59,130,246,0.08)',
              color: 'var(--accent-blue, #10b981)', textDecoration: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13, fontWeight: 600,
            }}>
              <Sparkles size={14} /> Try Demo — No Login Needed
            </Link>
          </FadeIn>
        </section>

      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color, #232d42)',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: "'Manrope', sans-serif", fontSize: 13, color: 'var(--text-muted, #64748b)'
        }}>
          <Zap size={14} style={{ color: 'var(--accent-blue, #10b981)' }} /> StudyPulse · Made with care for students
        </div>
      </footer>
    </div>
  )
}
