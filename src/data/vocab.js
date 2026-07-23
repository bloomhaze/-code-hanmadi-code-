// Vocab data (단어장 탭) — ported from the 시안 vocabData().
// kinds: 'word' | 'phrase' | 'sentence'

const W = (term, kr, ex, exKr) => ({ kind: 'word', term, kr, ex, exKr })
const P = (term, kr, ex, exKr) => ({ kind: 'phrase', term, kr, ex, exKr })
const S = (term, ko) => ({ kind: 'sentence', term, ko })

export const VOCAB_DATA = {
  word: [
    W('awkward', '어색한, 어려운', 'I ran into my ex. It was so awkward.', '전 애인을 마주쳤는데 진짜 어색했어.'),
    W('suffering', '고통, 괴로움', "I've been suffering from insomnia lately.", '요즘 불면증으로 고생하고 있어.'),
    W('humidity', '습도, 습기', 'The humidity makes summer unbearable.', '습도 때문에 여름이 견디기 힘들어.'),
    W('blunt', '직설적인, 무뚝뚝한', 'He gave me some blunt but honest advice.', '그는 직설적이지만 솔직한 조언을 해줬어.'),
    W('mosquito', '모기', 'Mosquitoes bite me every summer.', '모기가 매년 여름에 나를 문다.'),
  ],
  phrase: [
    P('fell back into', '(예전 상태로) 돌아가다', 'We fell back into our old routine.', '우리는 예전 습관으로 다시 돌아갔어.'),
    P('out of the blue', '갑자기, 뜬금없이', 'She called me out of the blue.', '그녀가 갑자기 나에게 전화했어.'),
    P('catch up on', '(밀린 것을) 따라잡다', 'I need to catch up on my emails.', '밀린 이메일을 확인해야 해.'),
    P('brutally honest', '가차없이 솔직한', 'Can I be brutally honest with you?', '너한테 아주 솔직하게 말해도 될까?'),
  ],
  sentence: [
    S('I ran into an old friend at a café today.', '오늘 카페에서 오랜 친구를 만났다.'),
    S('We talked about all sorts of things over coffee.', '커피 마시면서 별별 얘기를 다 했다.'),
    S('It had been so long that I thought it would be awkward.', '정말 오랜만이라 어색할 줄 알았다.'),
    S('I want to live somewhere without summer.', '여름이 없는 나라로 떠나고싶다.'),
  ],
}
