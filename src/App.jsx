import { useState } from 'react'
import StatusBar from './components/StatusBar.jsx'
import TabBar from './components/TabBar.jsx'
import Toast from './components/Toast.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import DiaryScreen from './screens/DiaryScreen.jsx'
import VocabScreen from './screens/VocabScreen.jsx'
import PlaceholderScreen from './screens/PlaceholderScreen.jsx'

const USER_NAME = '현진'

export default function App() {
  const [tab, setTab] = useState('home')
  const [toast, setToast] = useState('')

  const showToast = (msg) => setToast(msg)

  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{
        width: 375,
        height: 812,
        borderRadius: 44,
        boxShadow: '0 24px 70px rgba(30,34,50,.28)',
        fontFamily: "'Pretendard', -apple-system, sans-serif",
      }}
    >
      <StatusBar />

      {tab === 'home' && (
        <HomeScreen
          userName={USER_NAME}
          onWrite={() => showToast('일기 작성 화면은 다음 단계에서 만들어요')}
          onToast={showToast}
        />
      )}
      {tab === 'diary' && (
        <DiaryScreen
          onWrite={() => showToast('일기 작성 화면은 다음 단계에서 만들어요')}
          onOpen={() => showToast('일기 상세 화면은 다음 단계에서 만들어요')}
        />
      )}
      {tab === 'vocab' && (
        <VocabScreen
          onWrite={() => showToast('일기 작성 화면은 다음 단계에서 만들어요')}
          onToast={showToast}
        />
      )}
      {tab === 'my' && <PlaceholderScreen title="마이페이지" message="프로필과 설정이 여기에 있어요" />}

      <TabBar active={tab} onChange={setTab} />

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
