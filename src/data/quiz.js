// Quiz pool + helpers — ported from the 시안 quiz logic (SRS persistence omitted;
// order is a simple shuffle since it isn't visible in the UI).
import { VOCAB_DATA } from './vocab.js'

const STOP = new Set(
  ('the a an and or but if so of to in on at by for with from as is am are was were be been being do does did have has had ' +
    'i you he she it we they me him her us them my your his its our their this that these those there here not no yes up out ' +
    'off too very can will would should could may might must just then than also')
    .split(' '),
)

// Pick the most "content-ful" word to blank out (longest, tie-break toward center).
export function pickBlankKey(sentence) {
  const tokens = (sentence || '').match(/[A-Za-z][A-Za-z'-]*/g) || []
  if (!tokens.length) return ''
  const content = tokens.filter((w) => w.length >= 3 && !STOP.has(w.toLowerCase()))
  const pool = content.length ? content : tokens
  const mid = (sentence || '').length / 2
  let best = pool[0]
  let bestScore = -1
  for (const w of pool) {
    const idx = sentence.indexOf(w)
    const centered = 1 - Math.abs(idx + w.length / 2 - mid) / (mid || 1)
    const score = w.length + centered
    if (score > bestScore) {
      bestScore = score
      best = w
    }
  }
  return best
}

// Find a saved word/phrase that appears in a sentence (for blanking).
function savedTermIn(sentence) {
  const cands = [...VOCAB_DATA.phrase.map((p) => p.term), ...VOCAB_DATA.word.map((w) => w.term)]
    .filter((t) => t && t.trim())
    .sort((a, b) => b.length - a.length)
  const low = (sentence || '').toLowerCase()
  for (const t of cands) {
    const tl = t.toLowerCase()
    let from = 0
    let idx
    while ((idx = low.indexOf(tl, from)) !== -1) {
      const before = idx === 0 ? '' : sentence[idx - 1]
      const after = idx + tl.length >= sentence.length ? '' : sentence[idx + tl.length]
      if (!/[a-z]/i.test(before) && !/[a-z]/i.test(after)) return sentence.slice(idx, idx + t.length)
      from = idx + 1
    }
  }
  return ''
}

export function blankAnswerFor(cur) {
  const term = ((cur && cur.term) || '').trim()
  const words = term.split(/\s+/).filter(Boolean)
  if (words.length <= 1) return term
  if (cur && cur.kind === 'sentence') {
    const found = savedTermIn(term)
    if (found) return found
  }
  return pickBlankKey(term)
}

export function writeHintFor(cur) {
  if (!cur) return ''
  if (cur.kind !== 'sentence') return cur.term || ''
  const model = cur.term || ''
  const low = model.toLowerCase()
  for (const p of VOCAB_DATA.phrase) if (low.includes(p.term.toLowerCase())) return p.term
  return pickBlankKey(model)
}

// Build the candidate pool for a quiz type.
function poolFor(type) {
  const items = []
  const pushAll = (arr, kind) => arr.forEach((it, i) => items.push({ ...it, key: `${kind}-${i}` }))
  if (type === 'write') {
    pushAll(VOCAB_DATA.sentence, 'sentence')
  } else if (type === 'flash') {
    pushAll(VOCAB_DATA.word, 'word')
    pushAll(VOCAB_DATA.phrase, 'phrase')
  } else {
    // blank: multi-word phrases + short single sentences
    VOCAB_DATA.phrase.forEach((it, i) => {
      if ((it.term || '').trim().split(/\s+/).length >= 2) items.push({ ...it, key: `phrase-${i}` })
    })
    VOCAB_DATA.sentence.forEach((it, i) => {
      const t = (it.term || '').trim()
      const wc = t.split(/\s+/).filter(Boolean).length
      const enders = (t.match(/[.!?]/g) || []).length
      const oneSentence = enders <= 1 && !/[.!?]\s+\S/.test(t)
      if (wc <= 12 && oneSentence) items.push({ ...it, key: `sentence-${i}` })
    })
  }
  return items
}

// Deterministic-ish shuffle seeded by length so repeat runs vary without Date/random.
function shuffle(arr, seed = 0) {
  const a = arr.slice()
  let s = seed + a.length * 97 + 13
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Build a session of exactly 10 questions (cycling the pool if smaller).
export function buildQuizList(type, seed = 0) {
  const pool = shuffle(poolFor(type), seed)
  if (!pool.length) return []
  const list = pool.slice(0, 10)
  let i = 0
  while (list.length < 10) list.push(pool[i++ % pool.length])
  return list
}

// The Korean prompt / meaning for a card.
export function koOf(cur) {
  return (cur && (cur.ko || cur.kr || cur.exKr)) || ''
}

// 작문 채점은 src/lib/grade.js 로 이동 (Supabase Edge Function 기반 AI 채점 + 엄격 폴백).
