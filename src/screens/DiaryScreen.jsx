import { useState } from 'react'
import { SearchIcon, PencilIcon } from '../components/icons.jsx'
import { DIARY_ENTRIES, diaryBadge } from '../data/diary.js'

const ACCENT = '#0066FF'

// 일기 탭 — grouped list of diary entries with a togglable search field.
export default function DiaryScreen({ onWrite, onOpen, deletedIds }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visible = DIARY_ENTRIES.filter((e) => !deletedIds?.has(e.id))
  const list = visible.filter(
    (e) =>
      !q ||
      e.preview.toLowerCase().includes(q) ||
      (e.allEn && e.allEn.toLowerCase().includes(q)) ||
      e.date.toLowerCase().includes(q),
  )
  const hasItems = visible.length > 0
  const noDiaries = visible.length === 0 // 작성한 일기 자체가 없음
  const noSearchResults = hasItems && q && list.length === 0 // 검색 결과만 없음

  return (
    <div className="flex h-full flex-col bg-white">
      {/* header */}
      <div className="flex h-12 shrink-0 items-center justify-between bg-white px-5 pt-4">
        <span className="font-sans text-[20px] font-semibold text-ink" style={{ letterSpacing: '-.4px' }}>
          일기
        </span>
        {hasItems && (
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: searchOpen ? '#f1f1f2' : 'transparent' }}
          >
            <SearchIcon color={searchOpen ? '#121212' : '#121212'} />
          </button>
        )}
      </div>

      {/* content */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-white">
        <div className="flex flex-col gap-6 px-5 pb-10 pt-4">
          {searchOpen && (
            <div
              className="-mt-2.5 flex h-12 items-center rounded-2xl px-3.5"
              style={{ boxShadow: 'inset 0 0 0 1px #ececee' }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="일기 내용 검색"
                autoFocus
                className="w-full border-none bg-transparent font-sans text-[15px] text-ink outline-none placeholder:text-[#b0b0b0]"
              />
            </div>
          )}

          {list.map((e) => {
            const badge = diaryBadge(e.lang)
            return (
              <button
                type="button"
                key={e.id}
                onClick={() => onOpen?.(e.id)}
                className="flex flex-col gap-2.5 text-left"
              >
                <span
                  className="font-inter text-[18px] font-medium text-ink"
                  style={{ letterSpacing: '.2px' }}
                >
                  {e.date}
                </span>
                <div
                  className="flex flex-col gap-2 rounded-[20px] bg-[#f7f7f7] px-[18px] py-4 transition-shadow"
                  style={{ boxShadow: 'inset 0 0 0 .5px #eee' }}
                >
                  <div className="flex min-h-[22px] items-center justify-between pb-1">
                    <span
                      className="flex h-[22px] w-[31px] items-center justify-center rounded-full"
                      style={{ background: badge.bg }}
                    >
                      <span
                        className="font-inter text-[11px] font-semibold"
                        style={{ color: badge.color }}
                      >
                        {e.lang}
                      </span>
                    </span>
                  </div>
                  <span
                    className="text-[15px] font-normal text-ink-2"
                    style={{
                      fontFamily:
                        e.lang === 'EN'
                          ? "'Inter Variable', 'Inter', sans-serif"
                          : "'Pretendard Variable', 'Pretendard', sans-serif",
                      lineHeight: e.lang === 'EN' ? '24px' : '20.8px',
                      letterSpacing: '-.2px',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                      overflow: 'hidden',
                    }}
                  >
                    {e.preview}
                  </span>
                </div>
              </button>
            )
          })}

          {/* search yielded nothing (but diaries do exist) */}
          {noSearchResults && (
            <div className="flex flex-col items-center pt-[180px]">
              <span className="font-inter text-[16px] font-medium text-ink">관련된 일기가 없어요</span>
            </div>
          )}

          {/* no diaries written at all */}
          {noDiaries && (
            <div className="flex flex-col items-center gap-1.5 pt-[180px]">
              <span className="font-inter text-[16px] font-medium text-ink">작성한 일기가 없어요</span>
              <span className="font-inter text-[13px] font-light text-muted-2">
                내 이야기로 영어 공부를 시작해보세요
              </span>
              <button
                type="button"
                onClick={onWrite}
                className="mt-3.5 flex items-center gap-1.5 rounded-full py-2.5 pl-4 pr-5"
                style={{ background: ACCENT }}
              >
                <PencilIcon size={16} />
                <span className="font-inter text-[14px] font-medium text-white">일기 쓰기</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
