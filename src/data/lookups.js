// Local mock knowledge base standing in for the 시안's on-device AI calls
// (window.claude.complete). Covers the words/phrases in the sample diaries.
import { seg } from './diary.js'

// term (lowercased) -> { term, pos, kr, ex, exKr }
const M = (term, pos, kr, ex, exKr) => ({ term, pos, kr, ex, exKr })

export const WORD_MEANINGS = {
  'ran into': M('run into', '구동사', '우연히 마주치다', 'I ran into an old teacher yesterday.', '어제 옛 선생님을 우연히 마주쳤어.'),
  'run into': M('run into', '구동사', '우연히 마주치다', 'I ran into an old teacher yesterday.', '어제 옛 선생님을 우연히 마주쳤어.'),
  'caught up on': M('catch up on', '구동사', '(밀린 것을) 따라잡다', 'I need to catch up on my emails.', '밀린 이메일을 확인해야 해.'),
  'catch up on': M('catch up on', '구동사', '(밀린 것을) 따라잡다', 'I need to catch up on my emails.', '밀린 이메일을 확인해야 해.'),
  'at ease': M('at ease', '숙어', '편안한, 마음이 놓이는', 'I felt at ease right away.', '나는 금방 마음이 편해졌어.'),
  awkward: M('awkward', '형용사', '어색한, 불편한', 'It was so awkward at first.', '처음엔 정말 어색했어.'),
  comfortable: M('comfortable', '형용사', '편안한', 'I feel comfortable around her.', '그녀와 있으면 마음이 편해.'),
  humidity: M('humidity', '명사', '습도, 습기', 'The humidity makes summer unbearable.', '습도 때문에 여름이 견디기 힘들어.'),
  mosquitoes: M('mosquito', '명사', '모기', 'Mosquitoes bite me every summer.', '모기가 매년 여름에 나를 문다.'),
  summer: M('summer', '명사', '여름', 'I want to live somewhere without summer.', '여름이 없는 곳에서 살고 싶어.'),
  friend: M('friend', '명사', '친구', 'She is my oldest friend.', '그녀는 나의 가장 오래된 친구야.'),
  café: M('café', '명사', '카페', 'We met at a cozy café.', '우리는 아늑한 카페에서 만났어.'),
  cafe: M('café', '명사', '카페', 'We met at a cozy café.', '우리는 아늑한 카페에서 만났어.'),
  coffee: M('coffee', '명사', '커피', 'We chatted over coffee.', '우리는 커피를 마시며 이야기했어.'),
  shared: M('share', '동사', '나누다, 공유하다', 'We shared everything that day.', '그날 우리는 모든 걸 나눴어.'),
  happened: M('happen', '동사', '일어나다, 생기다', 'Tell me what happened.', '무슨 일이 있었는지 말해줘.'),
  blunt: M('blunt', '형용사', '직설적인, 무뚝뚝한', 'He gave me blunt but honest advice.', '그는 직설적이지만 솔직한 조언을 해줬어.'),
  borrowed: M('borrow', '동사', '빌리다', 'I borrowed a book from a friend.', '친구에게 책을 빌렸어.'),
  philosophy: M('philosophy', '명사', '철학', "It's a book about his philosophy.", '그의 철학에 관한 책이야.'),
}

export function lookupWord(term) {
  const key = (term || '').toLowerCase()
  const hit = WORD_MEANINGS[key]
  if (hit) return hit
  return { term: term, pos: '', kr: '뜻 정보를 준비 중이에요', ex: '', exKr: '' }
}

// wrong-substring (as tapped) -> friendly Korean reason
export const FIX_REASONS = {
  goed: "'go'는 불규칙 동사예요. 과거형은 'goed'가 아니라 'went'로 써요. go-went-gone으로 외워두면 좋아요.",
  'who i not seen':
    "관계절에서 사람 목적어는 'who'보다 'whom'이 정확하고, '오랫동안 못 본' 상태는 대과거 \"hadn't seen\"으로 표현해요.",
  talke: "철자 오류예요. 'talk'의 과거형은 '-ed'를 붙인 'talked'로 써요.",
  'very fun time.':
    "'fun'은 명사로도 쓰여서 'a lot of fun'이 자연스럽고, 여기서는 'such a great time'처럼 표현하면 더 원어민스러워요.",
  'catch up our story about what happend':
    "'catch up on'이 '밀린 이야기를 나누다'라는 구동사예요. 과거형과 어순을 살려 \"caught up on what had happened\"로 고쳤어요.",
}

export function lookupFix(word) {
  const key = (word || '').trim().toLowerCase()
  return FIX_REASONS[key] || '이 부분이 더 자연스러운 표현으로 다듬어졌어요.'
}

// ---- Mock word/expression search (단어 검색 시트) ----
// Stands in for the 시안's LLM expression search. Keyed by Korean query;
// results are ordered most-common-first. Unknown queries get a generic set.
const SEARCH_DB = {
  두근거리다: [
    { term: 'my heart is racing', kr: '심장이 두근거리다', ex: 'My heart was racing before the interview.', exKr: '면접 전에 심장이 두근거렸어.' },
    { term: 'butterflies in my stomach', kr: '긴장돼서 두근거리다', ex: 'I had butterflies in my stomach on stage.', exKr: '무대에서 긴장돼 두근거렸어.' },
    { term: 'nervous', kr: '초조한, 떨리는', ex: 'I felt so nervous before the show.', exKr: '공연 전에 너무 떨렸어.' },
  ],
  어색하다: [
    { term: 'awkward', kr: '어색한, 불편한', ex: 'It felt awkward seeing him again.', exKr: '그를 다시 보니 어색했어.' },
    { term: 'feel out of place', kr: '겉도는 느낌이다', ex: 'I felt out of place at the party.', exKr: '파티에서 나 혼자 겉도는 느낌이었어.' },
  ],
  따라잡다: [
    { term: 'catch up on', kr: '(밀린 것을) 따라잡다', ex: 'I need to catch up on my emails.', exKr: '밀린 이메일을 확인해야 해.' },
    { term: 'keep up with', kr: '(뒤처지지 않고) 따라가다', ex: 'It’s hard to keep up with the news.', exKr: '뉴스를 따라가기가 벅차.' },
  ],
}

export function searchExpressions(query) {
  const q = (query || '').trim()
  if (!q) return []
  if (SEARCH_DB[q]) return SEARCH_DB[q]
  // generic fallback so any query returns something plausible
  return [
    { term: q, kr: '입력한 표현', ex: `Here is how you might use "${q}".`, exKr: '이렇게 활용해볼 수 있어요.' },
    { term: 'you could also say…', kr: '이렇게도 표현할 수 있어요', ex: 'Try describing it in your own words.', exKr: '내 말로 자유롭게 표현해보세요.' },
  ]
}

// ---- Mock write results (translation / correction) ----
// The 시안 sends the diary to an LLM; here we return a canned, well-formed
// result so the full flow (loading → sentence/all view, word & fix popups)
// works offline. Demo content is the "café" story.
const segText = (segs) => segs.map((g) => g.t).join('')

export const MOCK_KO_RESULT = {
  sentences: [
    { ko: '오늘 카페에서 오랜 친구를 만났다.', en: 'I ran into an old friend at a café today.' },
    {
      ko: '정말 오랜만이라 어색할 줄 알았는데 금방 편해졌다.',
      en: 'It had been so long that I thought it would be awkward, but I felt at ease right away.',
    },
    { ko: '커피를 마시며 그동안 있었던 일들을 나눴다.', en: "We caught up on everything over coffee." },
  ],
}
MOCK_KO_RESULT.allKo = MOCK_KO_RESULT.sentences.map((s) => s.ko).join(' ')
MOCK_KO_RESULT.allEn = MOCK_KO_RESULT.sentences.map((s) => s.en).join(' ')

export const MOCK_EN_RESULT = {
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
  ],
}
MOCK_EN_RESULT.allKo = MOCK_EN_RESULT.sentences.map((s) => s.ko).join(' ')
MOCK_EN_RESULT.allEn = MOCK_EN_RESULT.sentences.map((s) => segText(s.fixSegs)).join(' ')
