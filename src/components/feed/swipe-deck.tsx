'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, X, ArrowRight, MapPin, RotateCcw } from 'lucide-react'
import type { Post } from '@/types'

/**
 * Full-screen card deck for the feed's Discover mode.
 *
 * Gestures are hand-rolled on pointer events rather than pulled from a library:
 * this is the only place in the app that needs dragging, and a dependency for one
 * component is not worth the bundle.
 *
 * Swiping right likes the post, left skips it. Everything the gesture does is also
 * reachable from the buttons underneath — a deck that only responds to dragging is
 * unusable with a keyboard, a screen reader, or a trackpad.
 */

// Past this much horizontal travel, releasing commits the swipe instead of
// snapping back. Also the point at which the LIKE / SKIP overlay reaches full
// opacity, so the visual and the behaviour agree.
const COMMIT_DISTANCE = 110
const EXIT_MS = 280

type Props = {
  posts: Post[]
  userId: string | null
  onLike: (postId: string, alreadyLiked: boolean) => void
}

export function SwipeDeck({ posts, userId, onLike }: Props) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState({ dx: 0, dy: 0, active: false })
  const [exiting, setExiting] = useState<'like' | 'skip' | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)

  const current = posts[index]
  const next = posts[index + 1]

  const commit = useCallback((direction: 'like' | 'skip') => {
    if (!current || exiting) return
    if (direction === 'like') {
      if (!userId) {
        // Fall through to the parent's own sign-in messaging rather than
        // duplicating it here.
        onLike(current.id, false)
        setDrag({ dx: 0, dy: 0, active: false })
        return
      }
      if (!current.liked_by_me) onLike(current.id, false)
    }
    setExiting(direction)
    window.setTimeout(() => {
      setIndex(i => i + 1)
      setExiting(null)
      setDrag({ dx: 0, dy: 0, active: false })
    }, EXIT_MS)
  }, [current, exiting, onLike, userId])

  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting) return
    // Keeps receiving move events even when the pointer leaves the card.
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = false
    setDrag({ dx: 0, dy: 0, active: true })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current || exiting) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) movedRef.current = true
    setDrag({ dx, dy, active: true })
  }

  const onPointerUp = () => {
    if (!startRef.current || exiting) return
    const { dx } = drag
    startRef.current = null
    if (dx > COMMIT_DISTANCE) commit('like')
    else if (dx < -COMMIT_DISTANCE) commit('skip')
    else setDrag({ dx: 0, dy: 0, active: false })
  }

  if (!current) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-lg font-bold text-zinc-900 mb-1.5">That&apos;s everything for now</h2>
        <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">
          You&apos;ve seen every look in the feed. Ready to have something made?
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIndex(0)}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
            <RotateCcw size={14} /> Start over
          </button>
          <Link
            href="/browse"
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-violet-500/25">
            Browse creatives <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  // While exiting, throw the card well clear of the viewport so it cannot reappear
  // mid-animation on a narrow screen.
  const dx = exiting ? (exiting === 'like' ? 600 : -600) : drag.dx
  const dy = exiting ? -60 : drag.dy
  const rotation = dx / 18
  const likeOpacity = Math.min(Math.max(dx, 0) / COMMIT_DISTANCE, 1)
  const skipOpacity = Math.min(Math.max(-dx, 0) / COMMIT_DISTANCE, 1)

  const target = current.creative_id ? `/tailors/${current.creative_id}` : `/p/${current.id}`
  const authorName = current.creative_id
    ? current.creative?.business_name || 'a creative'
    : 'TailorNow'

  return (
    <div className="select-none">
      {/* Height is deliberately conservative. Guests get a "Get started free" bar
          pinned to the bottom of the viewport, and anything taller pushes the
          action row underneath it on a phone-sized screen. Measured against
          390x844 (iPhone), the smallest screen that matters here. */}
      <div className="relative h-[44vh] min-h-[300px] mb-4">

        {/* Card behind, for depth. Purely decorative. */}
        {next && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden bg-zinc-200 scale-[0.94] translate-y-3 opacity-60"
            aria-hidden="true">
            {next.image_urls?.[0] && (
              <Image src={next.image_urls[0]} alt="" fill sizes="(max-width:640px) 100vw, 512px"
                className="object-cover" />
            )}
          </div>
        )}

        {/* Active card */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`,
            transition: drag.active ? 'none' : `transform ${EXIT_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            touchAction: 'none',
          }}
          className="absolute inset-0 rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl cursor-grab active:cursor-grabbing">

          {current.image_urls?.[0] && (
            <Image src={current.image_urls[0]} alt={current.title || 'Look'} fill priority
              sizes="(max-width:640px) 100vw, 512px" className="object-cover pointer-events-none" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 pointer-events-none" />

          {/* Drag feedback */}
          <div style={{ opacity: likeOpacity }}
            className="absolute top-8 left-6 border-4 border-amber-400 text-amber-400 text-2xl font-black px-4 py-1.5 rounded-xl -rotate-12 pointer-events-none">
            LOVE
          </div>
          <div style={{ opacity: skipOpacity }}
            className="absolute top-8 right-6 border-4 border-zinc-300 text-zinc-300 text-2xl font-black px-4 py-1.5 rounded-xl rotate-12 pointer-events-none">
            SKIP
          </div>

          {/* Detail. Tapping opens the profile, but only when the pointer did not
              drag — otherwise every swipe would also navigate. */}
          <Link
            href={target}
            onClick={e => { if (movedRef.current) e.preventDefault() }}
            className="absolute bottom-0 left-0 right-0 p-5 pt-16">
            {current.title && (
              <p className="text-white font-bold text-lg leading-tight mb-1">{current.title}</p>
            )}
            <p className="text-white/70 text-sm truncate">
              {authorName}
              {current.creative?.city && (
                <span className="text-white/50"> · <MapPin size={10} className="inline -mt-0.5" /> {current.creative.city}</span>
              )}
            </p>
          </Link>
        </div>
      </div>

      {/* Above the buttons, not below: the last element on the page is the one the
          fixed guest banner covers. */}
      <p className="text-center text-xs text-zinc-500 mb-4">
        Swipe right to love · left to skip · {posts.length - index} left
      </p>

      {/* Same actions as the gestures, for anyone not dragging. */}
      <div className="flex items-center justify-center gap-5">
        <button
          onClick={() => commit('skip')}
          aria-label="Skip this look"
          className="w-14 h-14 rounded-full bg-white border-2 border-zinc-200 text-zinc-400 flex items-center justify-center hover:border-zinc-300 hover:text-zinc-600 transition-all active:scale-90 shadow-sm">
          <X size={24} />
        </button>
        <Link
          href={target}
          className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 border border-violet-200 px-4 py-2.5 rounded-full transition-colors">
          Get this made <ArrowRight size={12} />
        </Link>
        <button
          onClick={() => commit('like')}
          aria-label="Love this look"
          className="w-14 h-14 rounded-full bg-amber-400 text-black flex items-center justify-center hover:bg-amber-300 transition-all active:scale-90 shadow-lg shadow-amber-500/30">
          <Heart size={24} className={current.liked_by_me ? 'fill-black' : ''} />
        </button>
      </div>
    </div>
  )
}
