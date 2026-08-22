import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase.js'
import TopBar from './components/TopBar.jsx'
import TabBar from './components/TabBar.jsx'
import Toast from './components/Toast.jsx'
import WriteMethodSheet from './components/WriteMethodSheet.jsx'
import SaveLoginSheet from './components/SaveLoginSheet.jsx'
import WordPopup from './components/WordPopup.jsx'
import FixPopup from './components/FixPopup.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import DiaryScreen from './screens/DiaryScreen.jsx'
import VocabScreen from './screens/VocabScreen.jsx'
import MyScreen from './screens/MyScreen.jsx'
import WriteScreen from './screens/WriteScreen.jsx'
import DiaryDetailScreen from './screens/DiaryDetailScreen.jsx'
import OnboardingScreen from './screens/OnboardingScreen.jsx'
import QuizScreen from './screens/QuizScreen.jsx'
import QuizTypeSheet from './components/QuizTypeSheet.jsx'
import NotifScreen from './screens/NotifScreen.jsx'
import ProfileEditScreen from './screens/ProfileEditScreen.jsx'
import DevFeedbackScreen from './screens/DevFeedbackScreen.jsx'
import LegalScreen from './screens/LegalScreen.jsx'
import PremiumScreen from './screens/PremiumScreen.jsx'
import { TERMS_URL, PRIVACY_URL } from './data/legal.js'
import DeleteDialog from './components/DeleteDialog.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import { findEntryByKo } from './data/diary.js'
import { lookupWord, lookupFix } from './data/lookups.js'
import { explainFix } from './lib/write.js'
import { explainWord } from './lib/word.js'
import { saveDiary, listMyDiaries, deleteDiary, todayTitle } from './lib/diaries.js'
import { listMySaved, addSaved, removeSaved } from './lib/saved.js'
import { saveQuizResult, reviewedCount } from './lib/quizlog.js'
import { uploadAvatar } from './lib/avatar.js'

const USER_NAME = '현진'

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [guestMode, setGuestMode] = useState(false) // "먼저 둘러볼래요"
  const [tab, setTab] = useState('home')
  const [homeKey, setHomeKey] = useState(0) // bump to remount Home (logo "refresh")
  const [overlay, setOverlay] = useState(null) // {type:'write', mode} | {type:'detail', id}
  const [writeSheet, setWriteSheet] = useState(false)
  const [loginSheet, setLoginSheet] = useState(false) // 비회원 저장 시 로그인 유도
  const [quizSheet, setQuizSheet] = useState(false)
  const [quiz, setQuiz] = useState(null) // { type }
  const [dialog, setDialog] = useState(null) // { kind:'delete', id } | { kind:'logout'|'withdraw' }
  const [deletedIds, setDeletedIds] = useState(() => new Set())
  const [myDiaries, setMyDiaries] = useState([]) // 유저가 실제 저장한 일기(DB)
  const [mySaved, setMySaved] = useState([]) // 저장한 표현(DB)
  const [reviewed, setReviewed] = useState(0) // 복습(퀴즈) 총 문항 수
  const [toast, setToast] = useState(null) // { message, undo, check } | null
  const [wordPop, setWordPop] = useState({ open: false })
  const [fixPop, setFixPop] = useState({ open: false })
  const [activeWord, setActiveWord] = useState(null)
  const lookTimer = useRef(null)
  const fixReq = useRef(0)
  const wordReq = useRef(0)
  const wordCache = useRef(new Map()) // term+문장 → 조회 결과 (예문 고정)
  const savingRef = useRef(false) // 일기 저장 중복(더블탭) 방지
  const savingKeys = useRef(new Set()) // 표현 저장 중복(더블탭) 방지 — 진행 중인 key

  const showToast = (message, undo, check) => setToast({ message, undo, check })

  // ---- auth (Supabase) ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // ---- 내 일기 / 저장 표현 로드 (로그인 시) ----
  const refreshDiaries = () => listMyDiaries().then(setMyDiaries).catch(() => {})
  // 저장 목록을 불러오면서 중복(같은 type+term)은 최신 1개만 남기고 나머지는 DB에서 정리.
  const refreshSaved = async () => {
    try {
      const list = await listMySaved()
      const seen = new Set()
      const unique = []
      const dupIds = []
      for (const s of list) {
        const k = `${s.type}|${(s.term || '').trim().toLowerCase()}`
        if (seen.has(k)) {
          dupIds.push(s.id)
          continue
        }
        seen.add(k)
        unique.push(s)
      }
      if (dupIds.length) {
        for (const id of dupIds) {
          try {
            await removeSaved(id)
          } catch {
            /* 개별 실패는 무시 */
          }
        }
      }
      setMySaved(unique)
    } catch {
      /* 조회 실패 시 기존 상태 유지 */
    }
  }
  const refreshReviewed = () => reviewedCount().then(setReviewed).catch(() => {})
  useEffect(() => {
    if (session?.user) {
      refreshDiaries()
      refreshSaved()
      refreshReviewed()
    } else {
      setMyDiaries([])
      setMySaved([])
      setReviewed(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  // 퀴즈 완료 → 복습 기록 저장 후 카운트 갱신 (게스트는 저장 안 함)
  const onQuizComplete = async ({ total, correct }) => {
    if (!authed) return
    try {
      await saveQuizResult({ count: total, correct })
      await refreshReviewed()
    } catch {
      /* 무시 */
    }
  }

  // 저장 표현 조회/토글
  const savedKey = (type, term) => `${type}|${(term || '').trim().toLowerCase()}`
  const savedSet = useMemo(
    () => new Set(mySaved.map((s) => savedKey(s.type, s.term))),
    [mySaved],
  )
  const isSaved = (type, term) => savedSet.has(savedKey(type, term))
  // 저장돼 있으면 취소, 없으면 저장 (토글). 로그인 안 하면 안내.
  // 프로필 저장 — 닉네임/아바타를 커스텀 키(nickname/custom_avatar_url)에 저장.
  // 구글 OAuth 재로그인 시 full_name·avatar_url·picture는 구글 값으로 덮어써지므로,
  // 구글이 건드리지 않는 커스텀 키에 넣어야 변경한 값이 계속 유지된다.
  // 사진은 '저장'을 눌러야 실제로 반영된다.
  const saveProfile = async ({ nick, avatarFile }) => {
    try {
      const meta = { nickname: nick, full_name: nick, name: nick }
      if (avatarFile) {
        const url = await uploadAvatar(avatarFile)
        meta.custom_avatar_url = url
        meta.avatar_url = url
        meta.picture = url
      }
      const { data, error } = await supabase.auth.updateUser({ data: meta })
      if (error) throw error
      if (data?.user) setSession((s) => (s ? { ...s, user: data.user } : s))
      showToast('저장했어요', undefined, true)
    } catch {
      showToast('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  // 단어장에서 화면을 벗어날 때, 취소 보류(pending)됐던 항목들을 실제로 DB에서 삭제.
  const commitUnsave = async (ids) => {
    if (!ids?.length) return
    try {
      for (const id of ids) await removeSaved(id)
      await refreshSaved()
    } catch {
      /* 실패 시 다음 진입에 그대로 남아있게 둔다 */
    }
  }

  const toggleSave = async ({ type, term, data }) => {
    if (!authed) {
      showToast('로그인하면 표현을 저장할 수 있어요.')
      return
    }
    const key = savedKey(type, term)
    // 같은 표현을 동시에(더블탭) 저장/취소하지 못하도록 진행 중 key는 무시.
    if (savingKeys.current.has(key)) return
    savingKeys.current.add(key)
    // 같은 key의 항목 전부(혹시 남아있는 중복 포함) 취소 대상으로.
    const existingAll = mySaved.filter((s) => savedKey(s.type, s.term) === key)
    try {
      if (existingAll.length) {
        const snap = existingAll[0] // 되돌리기용 스냅샷 {id, type, term, ...data}
        for (const it of existingAll) await removeSaved(it.id)
        await refreshSaved()
        const undo = async () => {
          const { id, type: t, term: tm, ...rest } = snap
          try {
            await addSaved({ type: t, term: tm, data: rest })
            await refreshSaved()
          } catch {
            showToast('되돌리기에 실패했어요. 잠시 후 다시 시도해주세요.')
          }
        }
        showToast('저장을 취소했어요', undo) // 되돌리기 버튼 노출
      } else {
        await addSaved({ type, term, data })
        await refreshSaved()
        // 저장 성공 토스트는 표시하지 않음(북마크 아이콘 상태로 충분).
      }
    } catch {
      showToast('처리에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      savingKeys.current.delete(key)
    }
  }
  const wordType = (term) => ((term || '').trim().includes(' ') ? 'phrase' : 'word')

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        // 로그인할 때마다 계정 선택 화면을 띄운다 (탈퇴 직후 자동 재로그인 방지).
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) showToast('로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.')
    // on success the browser redirects to Google, then back here
  }

  const authed = !!session
  const user = session?.user
  const userEmail = user?.email || ''
  // 커스텀 닉네임(nickname)을 최우선으로 — 재로그인 시 구글이 덮어쓰는 full_name/name보다 우선.
  const userName =
    user?.user_metadata?.nickname || user?.user_metadata?.full_name || user?.user_metadata?.name || USER_NAME
  // 직접 올린 아바타(custom_avatar_url) 우선, 없으면 구글 프로필 사진, 그것도 없으면 MyScreen 기본 아바타.
  const avatarUrl =
    user?.user_metadata?.custom_avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    ''
  const showOnboarding = authReady && !authed && !guestMode

  // ---- navigation ----
  const openWriteSheet = () => setWriteSheet(true)
  const chooseWrite = (mode) => {
    setWriteSheet(false)
    setOverlay({ type: 'write', mode })
  }
  const openDetail = (id) => {
    // 실제 저장한 일기면 그 엔트리를 함께 전달, 아니면 mock(id 조회).
    const real = myDiaries.find((d) => d.id === id)
    setOverlay({ type: 'detail', id, entry: real || null })
  }
  const openEntryByKo = (ko) => {
    const e = findEntryByKo(ko)
    if (e) openDetail(e.id)
  }
  const closeOverlay = () => {
    setOverlay(null)
    setActiveWord(null)
    setWordPop({ open: false })
    setFixPop({ open: false })
  }
  const saveWrite = async (payload) => {
    // 게스트(비로그인)는 저장 전에 로그인 유도 바텀시트를 띄운다.
    if (!authed) {
      setLoginSheet(true)
      return
    }
    // 저장 버튼을 두 번 눌러도 한 번만 기록되도록 — 저장 진행 중이면 무시.
    if (savingRef.current) return
    savingRef.current = true
    try {
      await saveDiary({ ...payload, title: todayTitle() })
      await refreshDiaries()
      closeOverlay()
      showToast('일기를 저장했어요', undefined, true) // 저장 성공 → 체크 아이콘
      setTab('diary')
    } catch {
      showToast('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      savingRef.current = false
    }
  }

  // ---- word / correction popups (mock async lookups) ----
  const tapWord = async (wid, term, sentence) => {
    setActiveWord(wid)
    const key = `${(term || '').toLowerCase()} ${sentence || ''}`
    // 이미 조회한 단어는 캐시로 고정 — 다시 탭해도 예문이 바뀌지 않게.
    if (wordCache.current.has(key)) {
      setWordPop({ open: true, loading: false, ...wordCache.current.get(key) })
      return
    }
    const token = ++wordReq.current
    setWordPop({ open: true, term, loading: true })
    // 뒤늦게 도착한 응답이 다른 단어를 덮어쓰지 않도록 토큰으로 가드.
    const finish = (res) => {
      wordCache.current.set(key, res)
      if (wordReq.current === token) setWordPop({ open: true, loading: false, ...res })
    }
    // AI로 뜻/예문을 받아오고, 실패하거나 비면 로컬 사전(mock)으로 폴백.
    try {
      const res = await explainWord(term, sentence)
      finish(res.kr ? res : lookupWord(term))
    } catch {
      finish(lookupWord(term))
    }
  }
  const closeWordPop = () => {
    setWordPop({ open: false })
    setActiveWord(null)
  }
  const tapFix = async (fixId, word, original, corrected) => {
    // 같은 파란 영역을 다시 누르면 닫는다 (토글).
    if (fixPop.open && fixPop.id === fixId) {
      setFixPop({ open: false })
      return
    }
    const token = ++fixReq.current
    clearTimeout(lookTimer.current)
    setFixPop({ open: true, id: fixId, loading: true })
    // 뒤늦게 도착한 응답이 다른 영역을 덮어쓰지 않도록 토큰으로 가드.
    const finish = (reason) => {
      if (fixReq.current === token) setFixPop({ open: true, id: fixId, loading: false, reason })
    }
    // 문장 문맥(원문/교정문)이 있으면 AI에게 실제 교정 사유를 물어본다.
    // 실패하거나 문맥이 없으면 로컬 사유(mock)로 폴백.
    if (original && corrected) {
      try {
        finish((await explainFix(word, original, corrected)) || lookupFix(word))
      } catch {
        finish(lookupFix(word))
      }
      return
    }
    lookTimer.current = setTimeout(() => finish(lookupFix(word)), 450)
  }
  const closeFixPop = () => setFixPop({ open: false })

  // ---- quiz ----
  const openQuizSheet = () => setQuizSheet(true)
  const startQuiz = (type) => {
    setQuizSheet(false)
    setQuiz({ type })
  }

  // ---- dialogs ----
  const confirmDelete = async () => {
    const id = dialog?.id
    setDialog(null)
    closeOverlay()
    setTab('diary')
    // 실제 저장한 일기면 DB에서 삭제, 아니면(mock 데모) 로컬 숨김.
    if (myDiaries.some((d) => d.id === id)) {
      try {
        await deleteDiary(id)
        await refreshDiaries()
      } catch {
        showToast('삭제에 실패했어요. 잠시 후 다시 시도해주세요.')
        return
      }
    } else {
      setDeletedIds((s) => new Set(s).add(id))
    }
    showToast('일기를 삭제했어요')
  }
  const confirmDialog = async () => {
    const kind = dialog?.kind
    setDialog(null)
    // 탈퇴는 서버(관리자 권한)에서 실제 계정을 삭제한 뒤 로그아웃한다.
    if (kind === 'withdraw') {
      try {
        const { data: sess } = await supabase.auth.getSession()
        const token = sess?.session?.access_token
        const { data, error } = await supabase.functions.invoke('smooth-worker', {
          body: { action: 'deleteAccount' },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (error || data?.error) throw new Error(data?.error || error?.message || 'delete failed')
      } catch (e) {
        showToast('탈퇴 실패: ' + (e?.message || '알 수 없는 오류'))
        return
      }
    }
    await supabase.auth.signOut()
    setGuestMode(false)
    setTab('home')
    showToast(kind === 'withdraw' ? '탈퇴가 완료되었어요' : '로그아웃되었어요')
  }

  // Logo click → fresh Home: close everything and remount the Home screen.
  const goHome = () => {
    setOverlay(null)
    setWriteSheet(false)
    setQuizSheet(false)
    setQuiz(null)
    setDialog(null)
    setWordPop({ open: false })
    setFixPop({ open: false })
    setActiveWord(null)
    setTab('home')
    setHomeKey((k) => k + 1)
  }

  const showTabBar = !overlay && !showOnboarding && !quiz
  // Brand bar stays on all screens (tabs, write/detail/notif, quiz) —
  // only the full-screen onboarding hides it.
  const showTopBar = !showOnboarding

  // 교정 사유 패널이 열리면(데스크탑/태블릿) 본문 컬럼을 왼쪽으로 밀어
  // 우측에 패널 공간을 만든다. 모바일(<lg)에서는 밀지 않고 하단 바텀시트.
  const shiftForFix = fixPop.open ? 'lg:mr-[420px]' : ''

  // 모바일: 스크롤 내리면 하단탭 숨김, 올리면 다시 표시
  const [tabHidden, setTabHidden] = useState(false)
  const lastScrollY = useRef(0)
  const scrollLockUntil = useRef(0) // 토글 후 레이아웃 전환 동안 재토글 방지
  useEffect(() => {
    setTabHidden(false)
    lastScrollY.current = 0
    scrollLockUntil.current = 0
  }, [tab])
  const onContentScroll = (e) => {
    const y = e.target?.scrollTop ?? 0
    const now = Date.now()
    // 토글 직후 300ms는 레이아웃 전환에 의한 스크롤 이벤트라 무시(피드백 루프 방지)
    if (now < scrollLockUntil.current) {
      lastScrollY.current = y
      return
    }
    const dy = y - lastScrollY.current
    if (y <= 4) {
      if (tabHidden) {
        setTabHidden(false)
        scrollLockUntil.current = now + 320
      }
    } else if (dy > 6 && !tabHidden) {
      setTabHidden(true) // 아래로 스크롤 → 숨김
      scrollLockUntil.current = now + 320
    } else if (dy < -6 && tabHidden) {
      setTabHidden(false) // 위로 스크롤 → 표시
      scrollLockUntil.current = now + 320
    }
    lastScrollY.current = y
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center overflow-hidden bg-white">
      {/* brand bar spans the full width (max 1440), logo aligned left */}
      {showTopBar && <TopBar onLogoClick={goHome} />}

      <div className="flex w-full min-h-0 flex-1 justify-center overflow-hidden">
      <div
        className={`relative flex w-full min-h-0 max-w-[500px] flex-col overflow-hidden bg-white transition-[margin] duration-300 ${shiftForFix}`}
        style={{ fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, sans-serif" }}
      >
        {/* ---- tab screens (fill the region between the bars) ---- */}
        <div className="relative min-h-0 flex-1" onScrollCapture={onContentScroll}>
          {tab === 'home' && (
            <HomeScreen
              key={homeKey}
              userName={authed ? userName : ''}
              diaries={myDiaries}
              signupDate={user?.created_at}
              onWrite={openWriteSheet}
              onToast={showToast}
              onOpen={openDetail}
              onSaveExpr={toggleSave}
              isSaved={isSaved}
            />
          )}
          {tab === 'diary' && (
            <DiaryScreen
              diaries={myDiaries}
              onWrite={openWriteSheet}
              onOpen={openDetail}
              deletedIds={deletedIds}
            />
          )}
          {tab === 'vocab' && (
            <VocabScreen
              saved={mySaved}
              onUnsaveCommit={commitUnsave}
              onWrite={openWriteSheet}
              onToast={showToast}
              onStartQuiz={openQuizSheet}
            />
          )}
          {tab === 'my' && (
            <MyScreen
              userName={userName}
              email={userEmail}
              avatarUrl={avatarUrl}
              isGuest={!authed}
              onLogin={loginWithGoogle}
              onProfile={() => setOverlay({ type: 'profile' })}
              onNotif={() => setOverlay({ type: 'notif' })}
              onFeedback={() => setOverlay({ type: 'feedback' })}
              onPremium={() => setOverlay({ type: 'premium' })}
              onTerms={() => window.open(TERMS_URL, '_blank', 'noopener,noreferrer')}
              onPrivacy={() => window.open(PRIVACY_URL, '_blank', 'noopener,noreferrer')}
              onLogout={() => setDialog({ kind: 'logout' })}
              onWithdraw={() => setDialog({ kind: 'withdraw' })}
              onToast={showToast}
              diaryCount={myDiaries.length}
              savedCount={mySaved.length}
              reviewedCount={reviewed}
            />
          )}
        </div>

        {showTabBar && <TabBar active={tab} onChange={setTab} hidden={tabHidden} />}

        {/* ---- full-screen overlays ---- */}
        {overlay?.type === 'write' && (
        <WriteScreen
          mode={overlay.mode}
          userName={userName}
          onBack={closeOverlay}
          onSave={saveWrite}
          onToast={showToast}
          onTapWord={tapWord}
          onTapFix={tapFix}
          onSaveExpr={toggleSave}
          activeWord={activeWord}
          activeFix={fixPop.open ? fixPop.id : null}
        />
      )}
      {overlay?.type === 'detail' && (
        <DiaryDetailScreen
          id={overlay.id}
          entry={overlay.entry}
          onBack={closeOverlay}
          onDelete={() => setDialog({ kind: 'delete', id: overlay.id })}
          onToast={showToast}
          onTapWord={tapWord}
          onTapFix={tapFix}
          onSaveExpr={toggleSave}
          activeWord={activeWord}
          activeFix={fixPop.open ? fixPop.id : null}
        />
      )}

        {overlay?.type === 'notif' && <NotifScreen onClose={closeOverlay} />}

        {overlay?.type === 'feedback' && (
          <DevFeedbackScreen onBack={closeOverlay} onToast={showToast} />
        )}
        {overlay?.type === 'premium' && <PremiumScreen onBack={closeOverlay} onToast={showToast} />}
        {overlay?.type === 'terms' && <LegalScreen kind="terms" onBack={closeOverlay} />}
        {overlay?.type === 'privacy' && <LegalScreen kind="privacy" onBack={closeOverlay} />}

        {overlay?.type === 'profile' && (
          <ProfileEditScreen
            name={userName}
            avatarUrl={avatarUrl}
            onBack={closeOverlay}
            onSave={saveProfile}
            onToast={showToast}
          />
        )}

        {quiz && (
          <QuizScreen
            type={quiz.type}
            saved={mySaved}
            onClose={() => setQuiz(null)}
            onToast={showToast}
            onComplete={onQuizComplete}
          />
        )}

        {showOnboarding && (
          <OnboardingScreen
            onGoogle={loginWithGoogle}
            onComplete={() => setGuestMode(true)}
            onToast={showToast}
          />
        )}

        {/* ---- sheets & popups ---- */}
        {writeSheet && <WriteMethodSheet onChoose={chooseWrite} onClose={() => setWriteSheet(false)} />}
        {loginSheet && <SaveLoginSheet onGoogle={loginWithGoogle} onClose={() => setLoginSheet(false)} />}
        {quizSheet && <QuizTypeSheet onStart={startQuiz} onClose={() => setQuizSheet(false)} />}
        <WordPopup
          state={wordPop}
          saved={wordPop.open ? isSaved(wordType(wordPop.term), wordPop.term) : false}
          onToggleSave={() =>
            toggleSave({
              type: wordType(wordPop.term),
              term: wordPop.term,
              data: { kr: wordPop.kr, ex: wordPop.ex, exKr: wordPop.exKr },
            })
          }
          onClose={closeWordPop}
          onToast={showToast}
        />

        {dialog?.kind === 'delete' && <DeleteDialog onConfirm={confirmDelete} onClose={() => setDialog(null)} />}
        {(dialog?.kind === 'logout' || dialog?.kind === 'withdraw') && (
          <ConfirmDialog kind={dialog.kind} onYes={confirmDialog} onClose={() => setDialog(null)} />
        )}

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
      </div>

      {/* 교정 사유 — 데스크탑/태블릿은 우측 패널, 모바일은 하단 바텀시트.
          본문 컬럼 밖(변형되지 않는 위치)에 두어 뷰포트 기준으로 배치. */}
      <FixPopup state={fixPop} onClose={closeFixPop} />
    </div>
  )
}
