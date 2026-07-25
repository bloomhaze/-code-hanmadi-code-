import { seg } from '../data/diary.js'

// 원문(original)과 교정문(corrected)을 단어 단위로 비교해서,
// 화면 하이라이트용 세그먼트를 만든다.
//   enSegs : 원문   — 바뀐(빠진) 부분 kind='w'
//   fixSegs: 교정문 — 새로 고쳐진 부분 kind='f'
export function diffSegs(original, corrected) {
  const a = (original || '').trim().split(/\s+/).filter(Boolean)
  const b = (corrected || '').trim().split(/\s+/).filter(Boolean)
  const { aChanged, bChanged } = wordDiff(a, b)
  return {
    enSegs: buildSegs(a, aChanged, 'w'),
    fixSegs: buildSegs(b, bChanged, 'f'),
  }
}

const norm = (w) => w.toLowerCase()

// LCS 기반 단어 diff → 각 배열에서 '바뀐 단어' 표시
function wordDiff(a, b) {
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = norm(a[i]) === norm(b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const aChanged = new Array(n).fill(false)
  const bChanged = new Array(m).fill(false)
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (norm(a[i]) === norm(b[j])) {
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      aChanged[i++] = true
    } else {
      bChanged[j++] = true
    }
  }
  while (i < n) aChanged[i++] = true
  while (j < m) bChanged[j++] = true
  return { aChanged, bChanged }
}

// 같은 상태(정상/변경)인 단어들을 하나의 세그먼트로 묶는다.
// 단어 사이 공백은 '양쪽 모두 변경'일 때만 하이라이트에 포함하고,
// 그 외(정상↔변경 경계 등)에는 정상(n)으로 두어 하이라이트 배경이
// 단어 앞뒤로 삐져나오지 않게 한다.
function buildSegs(words, changed, changedKind) {
  const out = []
  const push = (kind, t) => {
    if (!t) return
    const last = out[out.length - 1]
    if (last && last.kind === kind) last.t += t
    else out.push({ kind, t })
  }
  for (let k = 0; k < words.length; k++) {
    if (k > 0) push(changed[k] && changed[k - 1] ? changedKind : 'n', ' ')
    push(changed[k] ? changedKind : 'n', words[k])
  }
  return out.map((s) => seg(s.t, s.kind))
}
