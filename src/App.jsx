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
  const tapWord = (wid, term, sentence) => {
    setActiveWord(wid)
    setWordPop({ open: true, term, loading: true })
    clearTimeout(lookTimer.current)
    lookTimer.current = setTimeout(() => {
      setWordPop({ open: true, loading: false, ...lookupWord(term) })
    }, 450)
  }
  const closeWordPop = () => {
    setWordPop({ open: false })
    setActiveWord(null)
  }
  const tapFix = (word) => {
    setFixPop({ open: true, loading: true })
    clearTimeout(lookTimer.current)
    lookTimer.current = setTimeout(() => {
      setFixPop({ open: true, loading: false, reason: lookupFix(word) })
    }, 450)
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
  // Brand bar stays on the content overlays (write/detail/notif) too —
  // only the full-screen onboarding & quiz hide it.
  const showTopBar = !showOnboarding && !quiz

  return (
    <div className="flex h-[100dvh] w-full flex-col items-center overflow-hidden bg-white">
      {/* brand bar spans the full width (max 1440), logo aligned left */}
      {showTopBar && <TopBar onLogoClick={goHome} />}

      <div
        className="relative flex w-full min-h-0 max-w-[500px] flex-1 flex-col overflow-hidden bg-white"
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
          onBack={closeOverlay}
          onSave={saveWrite}
          onToast={showToast}
          onTapWord={tapWord}
          onTapFix={tapFix}
          activeWord={activeWord}
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
        <FixPopup state={fixPop} onClose={closeFixPop} />

        {dialog?.kind === 'delete' && <DeleteDialog onConfirm={confirmDelete} onClose={() => setDialog(null)} />}
        {(dialog?.kind === 'logout' || dialog?.kind === 'withdraw') && (
          <ConfirmDialog kind={dialog.kind} onYes={confirmDialog} onClose={() => setDialog(null)} />
        )}

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  )
}
