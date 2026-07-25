import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase.js'
import TopBar from './components/TopBar.jsx'
import TabBar from './components/TabBar.jsx'
import Toast from './components/Toast.jsx'
import WriteMethodSheet from './components/WriteMethodSheet.jsx'
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
import DeleteDialog from './components/DeleteDialog.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import { findEntryByKo } from './data/diary.js'
import { lookupWord, lookupFix } from './data/lookups.js'
import { explainFix } from './lib/write.js'
import { explainWord } from './lib/word.js'

const USER_NAME = '현진'

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [guestMode, setGuestMode] = useState(false) // "먼저 둘러볼래요"
  const [tab, setTab] = useState('home')
  const [homeKey, setHomeKey] = useState(0) // bump to remount Home (logo "refresh")
  const [overlay, setOverlay] = useState(null) // {type:'write', mode} | {type:'detail', id}
  const [writeSheet, setWriteSheet] = useState(false)
  const [quizSheet, setQuizSheet] = useState(false)
  const [quiz, setQuiz] = useState(null) // { type }
  const [dialog, setDialog] = useState(null) // { kind:'delete', id } | { kind:'logout'|'withdraw' }
  const [deletedIds, setDeletedIds] = useState(() => new Set())
  const [toast, setToast] = useState(null) // { message, undo, check } | null
  const [wordPop, setWordPop] = useState({ open: false })
  const [fixPop, setFixPop] = useState({ open: false })
  const [activeWord, setActiveWord] = useState(null)
  const lookTimer = useRef(null)
  const fixReq = useRef(0)
  const wordReq = useRef(0)

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

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) showToast('로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.')
    // on success the browser redirects to Google, then back here
  }

  const authed = !!session
  const user = session?.user
  const userEmail = user?.email || ''
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || USER_NAME
  const showOnboarding = authReady && !authed && !guestMode

  // ---- navigation ----
  const openWriteSheet = () => setWriteSheet(true)
  const chooseWrite = (mode) => {
    setWriteSheet(false)
    setOverlay({ type: 'write', mode })
  }
  const openDetail = (id) => setOverlay({ type: 'detail', id })
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
  const saveWrite = () => {
    closeOverlay()
    showToast('일기를 저장했어요')
    setTab('diary')
  }

  // ---- word / correction popups (mock async lookups) ----
  const tapWord = async (wid, term, sentence) => {
    setActiveWord(wid)
    const token = ++wordReq.current
    setWordPop({ open: true, term, loading: true })
    // 뒤늦게 도착한 응답이 다른 단어를 덮어쓰지 않도록 토큰으로 가드.
    const finish = (res) => {
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
  const confirmDelete = () => {
    const id = dialog?.id
    setDeletedIds((s) => new Set(s).add(id))
    setDialog(null)
    closeOverlay()
    setTab('diary')
    showToast('일기를 삭제했어요')
  }
  const confirmDialog = async () => {
    const kind = dialog?.kind
    setDialog(null)
    // Both logout and withdraw end the session here. (True account deletion
    // needs a server-side admin call; this signs the user out for now.)
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
        <div className="relative min-h-0 flex-1">
          {tab === 'home' && (
            <HomeScreen
              key={homeKey}
              userName={userName}
              onWrite={openWriteSheet}
              onToast={showToast}
              onOpenEntry={openEntryByKo}
            />
          )}
          {tab === 'diary' && (
            <DiaryScreen onWrite={openWriteSheet} onOpen={openDetail} deletedIds={deletedIds} />
          )}
          {tab === 'vocab' && (
            <VocabScreen onWrite={openWriteSheet} onToast={showToast} onStartQuiz={openQuizSheet} />
          )}
          {tab === 'my' && (
            <MyScreen
              userName={userName}
              email={userEmail}
              isGuest={!authed}
              onNotif={() => setOverlay({ type: 'notif' })}
              onLogout={() => setDialog({ kind: 'logout' })}
              onWithdraw={() => setDialog({ kind: 'withdraw' })}
              onToast={showToast}
            />
          )}
        </div>

        {showTabBar && <TabBar active={tab} onChange={setTab} />}

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
          activeWord={activeWord}
          activeFix={fixPop.open ? fixPop.id : null}
        />
      )}
      {overlay?.type === 'detail' && (
        <DiaryDetailScreen
          id={overlay.id}
          onBack={closeOverlay}
          onDelete={() => setDialog({ kind: 'delete', id: overlay.id })}
          onToast={showToast}
          onTapWord={tapWord}
          onTapFix={tapFix}
          activeWord={activeWord}
          activeFix={fixPop.open ? fixPop.id : null}
        />
      )}

        {overlay?.type === 'notif' && <NotifScreen onClose={closeOverlay} />}

        {quiz && <QuizScreen type={quiz.type} onClose={() => setQuiz(null)} onToast={showToast} />}

        {showOnboarding && (
          <OnboardingScreen
            onGoogle={loginWithGoogle}
            onComplete={() => setGuestMode(true)}
            onToast={showToast}
          />
        )}

        {/* ---- sheets & popups ---- */}
        {writeSheet && <WriteMethodSheet onChoose={chooseWrite} onClose={() => setWriteSheet(false)} />}
        {quizSheet && <QuizTypeSheet onStart={startQuiz} onClose={() => setQuizSheet(false)} />}
        <WordPopup state={wordPop} onClose={closeWordPop} onToast={showToast} />

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
