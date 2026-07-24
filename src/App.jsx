import { useRef, useState } from 'react'
import StatusBar from './components/StatusBar.jsx'
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
import PremiumScreen from './screens/PremiumScreen.jsx'
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
  const [onboarding, setOnboarding] = useState(true)
  const [tab, setTab] = useState('home')
  const [overlay, setOverlay] = useState(null) // {type:'write', mode} | {type:'detail', id}
  const [writeSheet, setWriteSheet] = useState(false)
  const [quizSheet, setQuizSheet] = useState(false)
  const [quiz, setQuiz] = useState(null) // { type }
  const [dialog, setDialog] = useState(null) // { kind:'delete', id } | { kind:'logout'|'withdraw' }
  const [deletedIds, setDeletedIds] = useState(() => new Set())
  const [toast, setToast] = useState('')
  const [wordPop, setWordPop] = useState({ open: false })
  const [fixPop, setFixPop] = useState({ open: false })
  const [activeWord, setActiveWord] = useState(null)
  const lookTimer = useRef(null)

  const showToast = (msg) => setToast(msg)

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
  const confirmDialog = () => {
    const kind = dialog?.kind
    setDialog(null)
    showToast(kind === 'withdraw' ? '탈퇴가 완료되었어요' : '로그아웃되었어요')
  }

  const showTabBar = !overlay && !onboarding && !quiz

  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{
        width: 375,
        height: 812,
        borderRadius: 44,
        boxShadow: '0 24px 70px rgba(30,34,50,.28)',
        fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, sans-serif",
      }}
    >
      <StatusBar />

      {/* ---- tab screens ---- */}
      {tab === 'home' && (
        <HomeScreen
          userName={USER_NAME}
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
          userName={USER_NAME}
          onPremium={() => setOverlay({ type: 'premium' })}
          onNotif={() => setOverlay({ type: 'notif' })}
          onLogout={() => setDialog({ kind: 'logout' })}
          onWithdraw={() => setDialog({ kind: 'withdraw' })}
          onToast={showToast}
        />
      )}

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

      {overlay?.type === 'premium' && (
        <PremiumScreen onClose={closeOverlay} onToast={showToast} />
      )}
      {overlay?.type === 'notif' && <NotifScreen onClose={closeOverlay} />}

      {quiz && <QuizScreen type={quiz.type} onClose={() => setQuiz(null)} onToast={showToast} />}

      {onboarding && (
        <OnboardingScreen onComplete={() => setOnboarding(false)} onToast={showToast} />
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

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
