// Sample diary content ported from the "한마디 홈탭" 시안.
// The mock "today" in the design is 2026-06-04.

export const TODAY = { year: 2026, month: 6, day: 4 }

// A text segment. kind: 'n' normal | 'w' wrong (교정 전) | 'f' fixed (교정 후)
export const seg = (t, kind = 'n') => ({ t, kind })

export const SEG_STYLE = {
  n: { bg: 'transparent', color: '#121212', strike: false, weight: 400 },
  w: { bg: '#ffe1e1', color: '#ff4242', strike: true, weight: 400 },
  f: { bg: '#dcebff', color: '#0066ff', strike: false, weight: 500 },
}

const S = seg

// Home-tab entries keyed by "M-D". Each entry: { ko, enSegs, hasCorrection, fixSegs }
export const HOME_ENTRIES = {
  '6-4': [
    {
      ko: '여름엔 모기, 장마, 습도 내가 좋아하는 게 없다.',
      enSegs: [S("There's nothing I like about summer. It's full of mosquitoes, rain, and humidity.")],
      hasCorrection: false,
      fixSegs: [],
    },
    {
      ko: '여름이 없는 나라로 떠나고 싶다.',
      enSegs: [S('I want to live somewhere without summer.')],
      hasCorrection: false,
      fixSegs: [],
    },
  ],
  '6-3': [
    {
      ko: '오늘 카페에서 오랜 친구를 만났다.',
      enSegs: [S('I ran into an old friend at a café today.')],
      hasCorrection: false,
      fixSegs: [],
    },
    {
      ko: '정말 오랜만이라 어색할 줄 알았는데 금방 편해졌다.',
      enSegs: [S('I thought it would feel awkward since it had been so long, but we quickly became comfortable.')],
      hasCorrection: false,
      fixSegs: [],
    },
    {
      ko: '커피를 마시며 그동안 있었던 일들을 나눴다.',
      enSegs: [S('Over coffee, we shared everything that had happened.')],
      hasCorrection: false,
      fixSegs: [],
    },
  ],
  '6-1': [
    {
      ko: '오늘 나는 오랫동안 못봤던 친구와 카페에 갔다.',
      hasCorrection: true,
      enSegs: [
        S('Today, I '),
        S('goed', 'w'),
        S(' to a café with my friend '),
        S('who I not seen', 'w'),
        S(' for a long time.'),
      ],
      fixSegs: [
        S('Today, I '),
        S('went', 'f'),
        S(' to a café with my friend '),
        S("whom I hadn't seen", 'f'),
        S(' for a long time.'),
      ],
    },
    {
      ko: '우리는 많은 이야기를 했고 정말 재밌었다.',
      hasCorrection: true,
      enSegs: [S('We '), S('talke', 'w'), S(' about many things and it was '), S('very fun time.', 'w')],
      fixSegs: [S('We '), S('talked', 'f'), S(' about many things and it was '), S('a lot of fun.', 'f')],
    },
  ],
}

// Which days (in June) have a diary written — drives the week-strip / calendar dots.
export const DAYS_WITH_ENTRY = new Set(['6-1', '6-3', '6-4'])

// Language badge per day (shown when a day has an entry).
export const DAY_LANG = { '6-1': 'EN', '6-3': 'KR', '6-4': 'KR' }

// Rotating writing prompts on the "오늘" empty card.
export const PROMPTS = (name) => [
  `${name}님, 오늘은 어떤 하루를 보냈나요?`,
  '오늘 감사한 일은 무엇인가요?',
  '요즘 푹 빠진 게 있나요?',
  '요즘 고민거리가 있나요?',
  '오늘 느낀 감정은 무엇인가요?',
  '오늘 꼭 기억하고 싶은 순간은?',
]

// ---- Diary list + detail entries — ported from the 시안 diaryData() ----
// Translation entry sentence: { ko, en }
// Correction entry sentence:  { correction: true, ko, enSegs, fixSegs }
const RAW_ENTRIES = [
  {
    id: 0,
    date: '6월 4일',
    title: '2026년 6월 4일',
    lang: 'KR',
    correction: false,
    preview: '여름엔 모기, 장마, 습도 내가 좋아하는 게 없다. 여름이 없는 나라로 떠나고싶다.',
    sentences: [
      {
        ko: '여름엔 모기, 장마, 습도 내가 좋아하는 게 없다.',
        en: "There's nothing I like about summer. It's full of mosquitoes, rain, and humidity.",
      },
      { ko: '여름이 없는 나라로 떠나고싶다.', en: 'I want to live somewhere without summer.' },
    ],
  },
  {
    id: 1,
    date: '6월 3일',
    title: '2026년 6월 3일',
    lang: 'KR',
    correction: false,
    preview:
      '오늘 카페에서 오랜 친구를 만났다. 정말 오랜 만이라 어색할 줄 알았는데 막상 만나니까 금방 예전처럼 편해졌다. 같이 커피 마시면서 근황을 이야기하고 어쩌구',
    sentences: [
      { ko: '오늘 카페에서 오랜 친구를 만났다.', en: 'I ran into an old friend at a café today.' },
      {
        ko: '정말 오랜만이라 어색할 줄 알았는데 막상 만나니까 금방 예전처럼 편해졌다.',
        en: 'It had been so long that I thought it would be awkward, but I felt at ease right away.',
      },
      { ko: '같이 커피 마시면서 근황을 이야기했다.', en: "We caught up on how we'd been over coffee." },
    ],
  },
  {
    id: 2,
    date: '6월 2일',
    title: '2026년 6월 2일',
    lang: 'EN',
    correction: true,
    preview:
      "Today, I went to a cafe with my friend whom I hadn't seem for a long time. We talked about many things and it was such a great time.",
    sentences: [
      {
        correction: true,
        ko: '오늘 나는 오랫동안 못봤던 친구와 카페에 갔다.',
        enSegs: [
          seg('Today, I '),
          seg('goed', 'w'),
          seg(' to a café with my friend '),
          seg('who I not seen', 'w'),
          seg(' for a long time.'),
        ],
        fixSegs: [
          seg('Today, I '),
          seg('went', 'f'),
          seg(' to a café with my friend '),
          seg("whom I hadn't seen", 'f'),
          seg(' for a long time.'),
        ],
      },
      {
        correction: true,
        ko: '우리는 많은 이야기를 했고 정말 재밌었다.',
        enSegs: [seg('We '), seg('talke', 'w'), seg(' about many things and it was '), seg('very fun time.', 'w')],
        fixSegs: [seg('We '), seg('talked', 'f'), seg(' about many things and it was '), seg('such a great time.', 'f')],
      },
      {
        correction: true,
        ko: '최근에 있었던 많은 이야기들을 했다.',
        enSegs: [seg('We '), seg('catch up our story about what happend', 'w'), seg(' to us recently.')],
        fixSegs: [seg('We '), seg('caught up on what had happened', 'f'), seg(' to us recently.')],
      },
    ],
  },
  {
    id: 3,
    date: '6월 1일',
    title: '2026년 6월 1일',
    lang: 'KR',
    correction: false,
    preview:
      '나는 요즘 남자친구한테 책을 빌려서 읽고있다. 쇼펜하우어의 철학이 담긴 책이다. 쇼펜하우는 대부분 뼈를 때리는 말을 많이해서 정말 도움이 되는 것 같다아아',
    sentences: [
      { ko: '나는 요즘 남자친구한테 책을 빌려서 읽고 있다.', en: "These days I've been reading a book I borrowed from my boyfriend." },
      { ko: '쇼펜하우어의 철학이 담긴 책이다.', en: "It's a book about Schopenhauer's philosophy." },
      {
        ko: '쇼펜하우어는 뼈 때리는 말을 많이 해서 정말 도움이 되는 것 같다.',
        en: 'Schopenhauer says a lot of blunt, hard-hitting things, so it really feels helpful.',
      },
    ],
  },
]

const segText = (segs) => segs.map((g) => g.t).join('')

// Attach allKo / allEn (전체 보기 text) to each entry.
export const DIARY_ENTRIES = RAW_ENTRIES.map((e) => ({
  ...e,
  allKo: e.sentences.map((s) => s.ko).join(' '),
  allEn: e.sentences.map((s) => (s.correction ? segText(s.fixSegs) : s.en)).join(' '),
}))

export const getEntry = (id) => DIARY_ENTRIES.find((e) => e.id === id)

// Resolve the diary entry a home-tab card belongs to, by its Korean line.
export function findEntryByKo(ko) {
  const t = (ko || '').trim()
  return DIARY_ENTRIES.find((e) => e.sentences.some((s) => (s.ko || '').trim() === t))
}

// Badge styling for the diary list (KR badge is white on the grey card).
export function diaryBadge(lang) {
  return lang === 'EN'
    ? { bg: '#dcebff', color: '#0066ff' }
    : { bg: '#ffffff', color: '#7a7b7d' }
}

const DOW_KO = ['일', '월', '화', '수', '목', '금', '토']

// Build the Sun..Sat week that contains the selected date (offset in days from TODAY).
export function buildWeek(selOff) {
  const base = new Date(TODAY.year, TODAY.month - 1, TODAY.day)
  const sel = new Date(base)
  sel.setDate(base.getDate() + selOff)

  const weekStart = new Date(sel)
  weekStart.setDate(sel.getDate() - sel.getDay()) // back to Sunday

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const off = Math.round((d - base) / 86400000)
    const key = `${d.getMonth() + 1}-${d.getDate()}`
    return {
      dow: DOW_KO[d.getDay()],
      num: d.getDate(),
      key,
      off,
      isToday: off === 0,
      isFuture: off > 0,
      hasEntry: DAYS_WITH_ENTRY.has(key),
    }
  })
}

export function dateFromOff(selOff) {
  const base = new Date(TODAY.year, TODAY.month - 1, TODAY.day)
  const d = new Date(base)
  d.setDate(base.getDate() + selOff)
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    key: `${d.getMonth() + 1}-${d.getDate()}`,
    title: `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`,
  }
}
