// 개발자에게 한마디 → 이메일 전송 (Web3Forms).
// 액세스 키는 svs9645@gmail.com 으로 발급받은 값. 공개돼도 안전한 키(수신 주소는 키에 고정).
// 우선순위: 빌드 환경변수(VITE_WEB3FORMS_KEY) → 아래 상수.
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || '__WEB3FORMS_KEY__'

const hasKey = WEB3FORMS_KEY && !WEB3FORMS_KEY.startsWith('__')

// 성공 시 true. 키가 없거나 실패하면 false(호출부에서 사용자 경험은 성공으로 처리).
export async function sendFeedbackEmail({ content, email, userId }) {
  if (!hasKey) return false
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: '[한마디] 개발자에게 한마디',
        from_name: '한마디 앱',
        email: email || 'noreply@hanmadi.app', // 답장(Reply-To)용
        message: `${content}\n\n— 보낸 사용자: ${email || '비회원'}${userId ? ` (${userId})` : ''}`,
      }),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && data.success !== false
  } catch {
    return false
  }
}
