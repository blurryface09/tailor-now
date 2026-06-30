export interface ScoreInput {
  profile_likes?: number | null
  profile_views?: number | null
  total_orders?: number | null
}

export type LevelName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum'

export interface LevelInfo {
  level: LevelName
  emoji: string
  color: string
  bg: string
  border: string
  minScore: number
  nextScore: number | null
}

export const LEVELS: LevelInfo[] = [
  { level: 'Platinum', emoji: '💎', color: 'text-cyan-700',   bg: 'bg-cyan-50',    border: 'border-cyan-200',   minScore: 350, nextScore: null },
  { level: 'Gold',     emoji: '🥇', color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200', minScore: 100, nextScore: 350 },
  { level: 'Silver',   emoji: '🥈', color: 'text-slate-600',  bg: 'bg-slate-100',  border: 'border-slate-300',  minScore: 25,  nextScore: 100 },
  { level: 'Bronze',   emoji: '🥉', color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200', minScore: 0,   nextScore: 25  },
]

/** score = likes × 1 + views × 0.1 + completed_orders × 10 */
export function calcScore(t: ScoreInput): number {
  return Math.round(
    (t.profile_likes ?? 0) * 1 +
    (t.profile_views ?? 0) * 0.1 +
    (t.total_orders ?? 0) * 10
  )
}

export function getLevel(score: number): LevelInfo {
  return LEVELS.find(l => score >= l.minScore) ?? LEVELS[LEVELS.length - 1]
}
