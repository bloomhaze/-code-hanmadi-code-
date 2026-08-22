# 한마디(Hanmadi) — 핸드오프 노트

다른 작업자(또는 다른 Claude 계정)가 이어서 작업할 수 있도록 프로젝트 상태를 정리한 문서입니다.
**작업 맥락은 채팅이 아니라 이 문서 + `git log`에 있습니다.** 먼저 이 문서를 읽고 시작하세요.

---

## 1. 프로젝트 개요
- **한마디**: 내 일기를 바탕으로 영어를 배우는 웹 앱 (한글 일기 → AI 번역/영어 일기 → AI 교정, 단어·표현 저장, 복습 퀴즈, 원어민 듣기).
- **스택**: React 18 + Vite 6, Tailwind CSS v4(`@tailwindcss/vite`), Supabase(인증·DB·Storage·Edge Functions), Groq(무료 AI), Microsoft Azure(음성 합성 TTS).
- **배포**: 프론트는 **Vercel** (GitHub `main` 자동배포, 도메인 `li-code.vercel.app`). AI 백엔드는 **Supabase Edge Function** `smooth-worker` (수동배포).

## 2. 저장소 / 브랜치
- Repo: `bloomhaze/-code-hanmadi-code-`
- 작업 브랜치: `claude/continue-previous-session-94cel4`
- 배포 브랜치: `main`  ← Vercel이 이 브랜치를 자동배포
- 지금까지 배포 방식: 작업 브랜치에 커밋 → `main`으로 push (fast-forward)
  ```bash
  git push -u origin claude/continue-previous-session-94cel4
  git push origin claude/continue-previous-session-94cel4:main   # ← 프론트 배포 트리거
  ```

## 3. 로컬 실행
```bash
npm install
# .env.local 필요 (아래 4번). 없으면 supabase createClient가 빈 값이라 화면이 안 뜸.
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드 (dist/)
npm run preview   # 빌드 미리보기
```

## 4. repo에 없는 값 (보안상 git 제외 — 따로 확보해야 함) ⚠️
- **프론트 `.env.local`** (`.gitignore`됨):
  - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` → Supabase 대시보드 Settings → API
- **Edge Function 시크릿** (Supabase 대시보드 → Edge Functions → Secrets):
  - `GROQ_API_KEY` (console.groq.com)
  - `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` (원어민 TTS)
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (탈퇴/TTS 캐시용, 보통 자동 주입)
- **Supabase Storage**: public 버킷 `tts-cache` (음성 캐시)가 있어야 함.

## 5. AI 백엔드 (Edge Function) — 중요
- 소스: `supabase/functions/smooth-worker/index.ts` (배포 함수명 = 폴더명 = `smooth-worker`)
- 배포:
  ```bash
  supabase functions deploy smooth-worker
  ```
  (Supabase CLI + `supabase link` 필요. 대시보드 편집기에 붙여넣어 Deploy 해도 됨.)
- **프론트를 배포해도 이 함수는 반영 안 됨** — 프롬프트/AI 로직을 바꾸면 반드시 위 명령으로 별도 배포.
- 모델: `SMART_MODEL = openai/gpt-oss-120b`(우선), `GROQ_MODEL = llama-3.3-70b-versatile`(폴백).
  모든 AI 액션(번역/교정/교정이유/단어뜻/검색)이 gpt-oss 우선 + llama 폴백 구조. 한 모델이 죽어도 동작.
  실패 시 `callGroq`가 `console.error('[groq] ...')`로 로그를 남기므로, 문제 시 Supabase **Logs**에서 원인 확인.
- action별 기능: `translate`(번역), `correct`(교정, 4분류 최소교정), `explain`(교정이유), `word`(단어뜻), `search`(표현검색), `grade`(작문채점), `tts`(음성), `deleteAccount`(탈퇴).

## 6. 코드 지도 (자주 건드리는 곳)
- `src/App.jsx` — 전역 상태·라우팅·auth·저장/토글 로직 (⚠️ 에디터가 binary로 볼 수 있음, grep -a 사용)
- `src/screens/` — 화면들 (Home, Write, DiaryDetail, Vocab, Quiz, My, Onboarding, Legal, DevFeedback …)
- `src/components/` — 시트·팝업·바 (WordSearchSheet, FixPopup, CalendarSheet, TopBar, SentenceResult …)
- `src/data/` — `legal.js`(약관/방침 초안 + 노션 URL), `diary.js`(SEG_STYLE 교정색), `writeTopics.js` …
- `src/lib/` — `supabase.js`, `write.js`(번역/교정 호출), `word.js`, `saved.js`, `diaries.js`, `diffSeg.js` …
- `src/index.css` — Tailwind v4 토큰(`--color-accent: #0066ff`) + 키프레임 애니메이션
- `public/favicon.svg` — 앱 로고 파비콘

## 7. 이번 세션에서 한 작업 (요약)
`git log`에 상세. 주요 항목:
- 비회원 저장 시 로그인 유도 바텀시트(구글만), 일기/표현 **중복 저장(더블탭) 방지**
- **번역 프롬프트**: 오버 의역 방지(사실 보존), temp 0.45
- **교정 프롬프트 전면 개편**: 4분류(grammar/unnatural/rewrite/correct) 최소 교정, 축약형·숫자·과교정 방지, temp 0.2
- 교정이유·단어뜻 **gpt-oss 우선+llama 폴백** (모델 장애 대응) + 에러 로깅
- 이용약관·개인정보처리방침 → **노션 외부 링크로 연결** (메뉴 + 온보딩)
- 다양한 UI: 엠프티 일러스트 통일, 캘린더 모바일 바텀시트, 모바일 상단바 숨김, 작성 textarea 세로 확장, 퀴즈 화면 아이콘/폰트, 파비콘, 닉네임/아바타 재로그인 유지(커스텀 키) 등

## 8. 남은 할 일 / 확인 필요 (TODO 체크리스트)
- [ ] **노션 공개 링크로 교체**: 현재 약관/방침이 `app.notion.com/p/...` (로그인 필요한 편집용 주소). 노션 "웹에 공유(Publish)" 후 나오는 `*.notion.site` **공개 링크**로 `src/data/legal.js`의 `TERMS_URL`/`PRIVACY_URL` 교체.
- [ ] **회원 탈퇴 시 데이터 실제 삭제 확인 (중요)**: `deleteAccount`는 auth 유저만 삭제. `diaries`/`saved_items` 테이블이 `auth.users`에 **`ON DELETE CASCADE`**로 걸려 있어야 실제로 함께 삭제됨. Supabase에서 FK 설정 확인 (약관/방침의 "탈퇴 시 영구 삭제" 문구와 일치하도록).
- [ ] **약관/방침 문서 보완**: 사업자 정보(상호·대표자·주소), 보호책임자 이름·이메일, 유료 결제/환불 조항(결제 도입 시). 초안은 노션 + 세션에서 만든 `.md` 참고.
- [ ] **프리미엄 결제**: 마이페이지 "연간/월간 결제"는 현재 "준비 중" 토스트만. 결제 도입 시 구현.
- [ ] **알림(리마인더/푸시)**: 설정 UI는 있으나 실제 푸시 발송 미구현 — 도입 시 방침에 기기토큰 항목 추가.
- [ ] (선택) AI 안정성: 사용량 많아지면 Groq 유료 티어 또는 3rd 폴백 모델 추가.

## 9. 자주 하는 실수 방지
- 프론트만 배포하고 **엣지 함수 배포를 빼먹지 말 것** (프롬프트/AI 변경 시).
- 파비콘/index.html/번들 변경은 브라우저 **하드 리프레시** 필요(캐시 강함).
- `main`이 이미 머지된 PR이면 새 작업은 최신 default 브랜치에서 다시 시작.
