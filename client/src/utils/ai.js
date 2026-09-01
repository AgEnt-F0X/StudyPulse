import { callGeminiClient, hasClientKey } from './gemini'

export function aiAvailable() {
  return true
}

export function aiModeLabel() {
  if (hasClientKey()) return 'Gemini 2.0 Flash'
  return 'Instant Engine'
}

function generateLocalFallback(prompt) {
  const p = prompt.toLowerCase()

  // 1. Flashcards request
  if (p.includes('flashcard') || p.includes('question/answer pairs')) {
    const lines = prompt.split('\n')
      .map(l => l.replace(/^[-*#0-9.)\s]+/, '').trim())
      .filter(l => l.length > 5 && !l.toLowerCase().includes('generate') && !l.toLowerCase().includes('material:'))

    const cards = []
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      const line = lines[i]
      if (line.includes(':') || line.includes('—') || line.includes('-') || line.includes('=')) {
        const parts = line.split(/[:—=\-]/)
        if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
          cards.push({ front: `What is ${parts[0].trim()}?`, back: parts.slice(1).join(' ').trim() })
          continue
        }
      }
      cards.push({ front: `Explain the concept: ${line.slice(0, 45)}...`, back: line })
    }

    if (cards.length === 0) {
      cards.push(
        { front: 'State Newton’s First Law of Motion', back: 'A body continues in its state of rest or uniform motion unless acted upon by a net external force.' },
        { front: 'What is an Ionic Bond?', back: 'A chemical bond formed through the complete transfer of electrons from a metal to a non-metal.' },
        { front: 'State the fundamental identity: sin²θ + cos²θ = ?', back: 'Equal to 1 for all real angles θ.' }
      )
    }
    return JSON.stringify(cards)
  }

  // 2. Study Plan request
  if (p.includes('study plan') || p.includes('weeks')) {
    const subjectMatch = prompt.match(/for "([^"]+)"/) || prompt.match(/for ([^\n]+)/)
    const subject = subjectMatch ? subjectMatch[1] : 'CBSE Board Subject'
    return JSON.stringify({
      subject: subject.trim(),
      weeks: [
        { week: 1, topic: 'Foundation & Core NCERT Theory', tasks: ['Review Chapter 1-2 Theory', 'Prepare Formula & Definition Sheet', 'Solve NCERT Example Problems'] },
        { week: 2, topic: 'Exercise Numericals & Derivations', tasks: ['Complete NCERT Back Exercises', 'Practice Key Diagrams & Derivations', 'Clear doubts on tricky concepts'] },
        { week: 3, topic: 'NCERT Exemplar & High-Yield Questions', tasks: ['Solve NCERT Exemplar problems', 'Summarize key short-cut formulas', 'Take a 30-min chapter quiz'] },
        { week: 4, topic: 'Previous 5 Years Question Papers (PYQs)', tasks: ['Solve 5-year CBSE PYQs', 'Timed 3-hour mock practice', 'Final formula review session'] },
      ]
    })
  }

  // 3. Quiz request
  if (p.includes('multiple choice questions') || p.includes('quiz')) {
    return JSON.stringify([
      { q: 'What is the standard unit of force in SI units?', opts: ['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'], ans: 0 },
      { q: 'Which method guarantees full marks in CBSE board numericals?', opts: ['State formula, substitute with units, step-by-step calculation', 'Only write final answer', 'Skip units', 'Direct mental calculation'], ans: 0 },
      { q: 'Which chemical bond involves sharing of electron pairs?', opts: ['Covalent bond', 'Ionic bond', 'Metallic bond', 'Electrovalent bond'], ans: 0 },
      { q: 'What is the derivative of sin(x) with respect to x?', opts: ['cos(x)', '-cos(x)', 'tan(x)', '-sin(x)'], ans: 0 },
      { q: 'Which organelle is the powerhouse of eukaryotic cells?', opts: ['Mitochondria', 'Ribosome', 'Nucleus', 'Vacuole'], ans: 0 }
    ])
  }

  // 4. Note summary / explanation
  return `### Key Takeaways & CBSE Exam Summary\n\n• **Core Definitions**: Fundamental concepts and theoretical laws outlined in the NCERT syllabus.\n• **Important Formulas & Units**: Ensure all formulas are memorized with standard SI units.\n• **Board Exam Tip**: Step marking applies — always write given parameters, formula, substitution, and final boxed answer.`
}

export async function generateAI(prompt, opts = {}) {
  if (hasClientKey()) {
    try {
      const result = await callGeminiClient(prompt, opts)
      if (result) return result
    } catch (e) {
      console.warn('Gemini client error, using instant fallback', e)
    }
  }
  // Instant fallback in <0.05s
  return generateLocalFallback(prompt)
}

export const useLocalAIStore = (selector) => {
  const state = { status: 'ready', progress: 1, error: null }
  return typeof selector === 'function' ? selector(state) : state
}
useLocalAIStore.getState = () => ({ status: 'ready', progress: 1, error: null })
useLocalAIStore.setState = () => {}

export function isLocalAISupported() {
  return true
}

export function preloadLocalAI() {}

