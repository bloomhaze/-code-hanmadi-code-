// Quiz pool + helpers — 로그인 후 사용자가 실제로 저장한 표현(saved_items) 기반.
//   saved 항목: { id, type: 'word'|'phrase'|'sentence', term, kr?, ex?, exKr?, ko? }

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

// Find one of the user's saved words/phrases inside a sentence (for blanking).
function savedTermIn(sentence, terms = []) {
  const cands = terms.filter((t) => t && t.trim()).sort((a, b) => b.length - a.length)
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
    const found = savedTermIn(term, (cur && cur.savedTerms) || [])
    if (found) return found
  }
  return pickBlankKey(term)
}

export function writeHintFor(cur) {
  if (!cur) return ''
  if (cur.kind !== 'sentence') return cur.term || ''
  if (cur.hint) return cur.hint
  const model = cur.term || ''
  const low = model.toLowerCase()
  for (const t of (cur.savedTerms || [])) if (t && low.includes(t.toLowerCase())) return t
  return pickBlankKey(model)
}

// 저장 항목 → 퀴즈 카드 형태
const mapItem = (it) => ({ term: it.term, kind: it.type, ko: it.ko, kr: it.kr, exKr: it.exKr, key: it.id })

// Build the candidate pool for a quiz type from the user's saved items.
function poolFor(type, saved) {
  const words = saved.filter((s) => s.type === 'word')
  const phrases = saved.filter((s) => s.type === 'phrase')
  const sentences = saved.filter((s) => s.type === 'sentence')
  // 문장 빈칸/작문에서 핵심 표현으로 쓸 후보(저장한 표현·단어)
  const savedTerms = [...phrases, ...words].map((s) => s.term).filter(Boolean)

  if (type === 'write') {
    return sentences.map((it) => ({ ...mapItem(it), savedTerms }))
  }
  if (type === 'flash') {
    return [...words, ...phrases].map(mapItem)
  }
  // blank: 여러 단어짜리 표현 + 짧은 단일 문장
  const out = []
  phrases.forEach((it) => {
    if ((it.term || '').trim().split(/\s+/).filter(Boolean).length >= 2) out.push(mapItem(it))
  })
  sentences.forEach((it) => {
    const t = (it.term || '').trim()
    const wc = t.split(/\s+/).filter(Boolean).length
    const enders = (t.match(/[.!?]/g) || []).length
    const oneSentence = enders <= 1 && !/[.!?]\s+\S/.test(t)
    if (wc <= 12 && oneSentence) out.push({ ...mapItem(it), savedTerms })
  })
  return out
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

// 저장한 표현으로 최대 10문항 세션 구성. 저장분이 적으면 있는 만큼만(목업 패딩 없음).
export function buildQuizList(type, saved = [], seed = 0) {
  const pool = shuffle(poolFor(type, saved || []), seed)
  if (!pool.length) return []
  return pool.slice(0, 10)
}

// The Korean prompt / meaning for a card.
// 앞에 붙는 품사 분류 태그(예: "(구동사) ", "(형용사) ")는 퀴즈에선 제거.
export function koOf(cur) {
  const s = (cur && (cur.ko || cur.kr || cur.exKr)) || ''
  return s.replace(/^\s*\([^)]*\)\s*/, '').trim()
}

// 작문 채점은 src/lib/grade.js 로 이동 (Supabase Edge Function 기반 AI 채점 + 엄격 폴백).
