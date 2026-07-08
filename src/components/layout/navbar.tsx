'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import type { Profile } from '@/types'
import {
  Bell, MessageSquare, User, LogOut, Scissors, LayoutDashboard,
  ChevronDown, Menu, X, Shield, Users, Package, Star, TrendingUp,
  AlertTriangle, Store, Radio, ImageIcon, Sun, Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'

const ADMIN_LINKS = [
  { href: '/admin',                 icon: <LayoutDashboard size={14} />, label: 'Dashboard' },
  { href: '/admin/tailors',         icon: <Scissors size={14} />,        label: 'Creatives' },
  { href: '/admin/users',           icon: <Users size={14} />,           label: 'Accounts' },
  { href: '/admin/orders',          icon: <Package size={14} />,         label: 'Orders' },
  { href: '/admin/reviews',         icon: <Star size={14} />,            label: 'Reviews' },
  { href: '/admin/disputes',        icon: <AlertTriangle size={14} />,   label: 'Disputes' },
  { href: '/admin/payouts',         icon: <TrendingUp size={14} />,      label: 'Payouts' },
  { href: '/admin/marketplace',     icon: <Store size={14} />,           label: 'Marketplace' },
  { href: '/admin/fabrics',         icon: <Package size={14} />,         label: 'Fabrics' },
  { href: '/admin/onboard-tailor',  icon: <Scissors size={14} />,        label: 'Onboard Creative' },
  { href: '/admin/broadcast',       icon: <Radio size={14} />,           label: 'Broadcast' },
  { href: '/admin/feed',            icon: <ImageIcon size={14} />,       label: 'Feed Posts' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [adminTheme, setAdminTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.localStorage.getItem('tailornow-admin-theme') === 'dark' ? 'dark' : 'light'
  })

  const isAdminPath = pathname?.startsWith('/admin') || false

  // Admin defaults to light and can be toggled from the account settings menu.
  const isDark = Boolean((isAdminPath && adminTheme === 'dark') ||
    pathname?.startsWith('/tailor') ||
    pathname?.startsWith('/dashboard'))

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => setProfile(data))
      }
    })
  }, [])

  useEffect(() => {
    const root = document.documentElement

    if (isAdminPath) {
      root.dataset.adminRoute = 'true'
      root.dataset.adminTheme = adminTheme
    } else {
      delete root.dataset.adminRoute
      delete root.dataset.adminTheme
    }

    return () => {
      delete root.dataset.adminRoute
      delete root.dataset.adminTheme
    }
  }, [isAdminPath, adminTheme])

  useEffect(() => {
    if (!userId) return

    const loadCounts = async () => {
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .or(`customer_id.eq.${userId},tailor_id.eq.${userId}`)
      const roomIds = (rooms || []).map(r => r.id)
      if (roomIds.length > 0) {
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .in('room_id', roomIds)
          .eq('read', false)
          .neq('sender_id', userId)
        setUnreadMessages(count || 0)
      }
      const { count: nc } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
      setUnreadNotifs(nc || 0)
    }

    loadCounts()

    const msgChannel = supabase.channel('navbar-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => loadCounts())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, () => loadCounts())
      .subscribe()

    const notifChannel = supabase.channel('navbar-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => loadCounts())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => loadCounts())
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(notifChannel)
    }
  }, [userId])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const toggleAdminTheme = () => {
    setAdminTheme(current => {
      const next = current === 'dark' ? 'light' : 'dark'
      window.localStorage.setItem('tailornow-admin-theme', next)
      return next
    })
  }

  const isActive = (href: string) => pathname === href || (href !== '/admin' && pathname.startsWith(href))

  // ── Theme-aware class helpers ──────────────────────────────
  const navBg = isDark
    ? scrolled ? 'bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-lg shadow-black/30'
               : 'bg-black/60 backdrop-blur-xl border-b border-white/[0.05]'
    : scrolled ? 'bg-white/95 backdrop-blur-2xl border-b border-zinc-200/80 shadow-sm'
               : 'bg-white/85 backdrop-blur-xl border-b border-zinc-200/60'

  const linkBase = isDark
    ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'

  const linkActive = isDark
    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
    : 'bg-violet-100 text-violet-700 border border-violet-200'

  const iconBtn = isDark
    ? 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'

  const dropdownBg = isDark
    ? 'bg-zinc-900/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50'
    : 'bg-white border border-zinc-200 shadow-xl shadow-zinc-200/60'

  const dropdownItem = isDark
    ? 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'

  const dropdownDivider = isDark ? 'border-white/[0.06]' : 'border-zinc-100'

  const userName = isDark ? 'text-zinc-300' : 'text-zinc-700'
  const userChevron = isDark ? 'text-zinc-500' : 'text-zinc-400'
  const userBtn = isDark ? 'hover:bg-white/[0.08] hover:border-white/10' : 'hover:bg-zinc-50 hover:border-zinc-200'
  const mobileBg = isDark ? 'bg-zinc-900/98 border-t border-white/[0.06]' : 'bg-white border-t border-zinc-200'
  const mobileItem = isDark ? 'text-zinc-300 hover:bg-white/[0.06] hover:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
  const mobileMenuBtn = isDark ? 'text-zinc-400 hover:bg-white/[0.08] hover:text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'

  return (
    <nav className={cn('sticky top-0 z-50 transition-all duration-300', navBg)}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href={profile?.role === 'tailor' ? '/dashboard' : profile?.role === 'admin' ? '/admin' : profile ? '/home' : '/'}
          className="transition-transform hover:scale-[1.02] duration-200"
        >
          <Logo size="sm" variant="full" animated dark={isDark} />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {profile?.role === 'customer' && (
            <>
              <Link href="/feed" className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200', isActive('/feed') ? linkActive : linkBase)}>Feed</Link>
              <Link href="/browse" className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200', isActive('/browse') ? linkActive : linkBase)}>Find Creatives</Link>
              <Link href="/fabrics" className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200', isActive('/fabrics') ? (isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200') : linkBase)}>🧵 Fabrics</Link>
              <Link href="/hall-of-fame" className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200', isActive('/hall-of-fame') ? linkActive : linkBase)}>🏆 Hall of Fame</Link>
            </>
          )}

          {profile?.role === 'tailor' && (
            <>
              <Link href="/dashboard" className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5', isActive('/dashboard') ? linkActive : linkBase)}><LayoutDashboard size={15} /> Dashboard</Link>
              <Link href="/tailor/orders" className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200', isActive('/tailor/orders') ? linkActive : linkBase)}>Orders</Link>
              <Link href="/tailor/posts" className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200', isActive('/tailor/posts') ? linkActive : linkBase)}>Posts</Link>
              <Link href="/tailor/portfolio" className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200', isActive('/tailor/portfolio') ? linkActive : linkBase)}>Portfolio</Link>
              <Link href="/hall-of-fame" className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200', isActive('/hall-of-fame') ? linkActive : linkBase)}>🏆 Hall of Fame</Link>
            </>
          )}

          {profile?.role === 'admin' && (
            <div className="relative group">
              <button className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                pathname.startsWith('/admin')
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20'
              )}>
                <Shield size={15} /> Admin
                <ChevronDown size={13} className="transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className={cn('absolute left-0 top-full mt-2 w-52 rounded-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50', dropdownBg)}>
                <p className={cn('px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest', isDark ? 'text-zinc-500' : 'text-zinc-400')}>Admin Panel</p>
                {ADMIN_LINKS.map(link => (
                  <Link key={link.href} href={link.href}
                    className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors', isActive(link.href) ? linkActive + ' font-semibold' : dropdownItem)}>
                    {link.icon} {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {profile ? (
            <>
              {profile.role !== 'admin' && (
                <Link href={profile.role === 'tailor' ? '/tailor/chat' : '/chat'}
                  className={cn('relative p-2 rounded-xl transition-all duration-200 hover:scale-110', iconBtn)}>
                  <MessageSquare size={20} />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
              )}
              {profile.role !== 'admin' && (
                <Link href="/notifications"
                  className={cn('relative p-2 rounded-xl transition-all duration-200 hover:scale-110', iconBtn)}>
                  <Bell size={20} />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {unreadNotifs > 99 ? '99+' : unreadNotifs}
                    </span>
                  )}
                </Link>
              )}
              <div className="relative group">
                <button className={cn('flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-all duration-200 border border-transparent', userBtn)}>
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm',
                    profile.role === 'admin' ? 'bg-gradient-to-br from-violet-600 to-violet-900' : 'bg-gradient-to-br from-violet-500 to-violet-700')}>
                    {profile.role === 'admin' ? <Shield size={14} /> : (profile.full_name?.[0]?.toUpperCase() || 'U')}
                  </div>
                  <span className={cn('hidden md:block text-sm font-medium', userName)}>{profile.full_name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className={cn('hidden md:block transition-transform duration-200 group-hover:rotate-180', userChevron)} />
                </button>
                <div className={cn('absolute right-0 top-full mt-2 w-52 rounded-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50', dropdownBg)}>
                  <div className={cn('px-4 py-2 border-b mb-1', dropdownDivider)}>
                    <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-zinc-900')}>{profile.full_name}</p>
                    <p className={cn('text-xs font-medium capitalize', profile.role === 'admin' ? 'text-violet-500' : isDark ? 'text-zinc-500' : 'text-zinc-400')}>
                      {profile.role === 'admin' && '⚡ '}{profile.role}
                    </p>
                  </div>
                  {profile.role !== 'admin' && (
                    <Link href={profile.role === 'tailor' ? '/tailor/profile' : '/profile'} className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors', dropdownItem)}>
                      <User size={15} /> My Profile
                    </Link>
                  )}
                  {profile.role === 'customer' && (
                    <Link href="/orders" className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors', dropdownItem)}>
                      <Scissors size={15} /> My Orders
                    </Link>
                  )}
                  {profile.role === 'admin' && (
                    <>
                      <Link href="/admin" className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors', dropdownItem)}>
                        <Shield size={15} /> Admin Dashboard
                      </Link>
                      <button onClick={toggleAdminTheme} className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors w-full text-left', dropdownItem)}>
                        {adminTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                        {adminTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                      </button>
                    </>
                  )}
                  <div className={cn('border-t mt-1 pt-1', dropdownDivider)}>
                    <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors rounded-b-xl">
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/hall-of-fame" className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200', isActive('/hall-of-fame') ? linkActive : linkBase)}>🏆 Hall of Fame</Link>
              <Link href="/login" className={cn('text-sm font-medium px-3 py-2 rounded-xl transition-all duration-200', isDark ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100')}>
                Sign in
              </Link>
              <Link href="/signup" className="bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-violet-500 transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.03] active:scale-[0.97]">
                Get Started
              </Link>
            </>
          )}
          <button
            className={cn('md:hidden p-2 rounded-xl transition-colors', mobileMenuBtn)}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn('md:hidden overflow-hidden transition-all duration-300', menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0')}>
        <div className={cn('px-4 py-3 space-y-1', mobileBg)}>
          {profile?.role === 'customer' && (
            <>
              <Link href="/feed" className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)} onClick={() => setMenuOpen(false)}>Feed</Link>
              <Link href="/browse" className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)} onClick={() => setMenuOpen(false)}>Find Creatives</Link>
              <Link href="/hall-of-fame" className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)} onClick={() => setMenuOpen(false)}>🏆 Hall of Fame</Link>
            </>
          )}
          {profile?.role === 'tailor' && (
            <>
              <Link href="/dashboard" className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)} onClick={() => setMenuOpen(false)}><LayoutDashboard size={15} /> Dashboard</Link>
              <Link href="/tailor/orders" className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)} onClick={() => setMenuOpen(false)}>Orders</Link>
              <Link href="/tailor/posts" className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)} onClick={() => setMenuOpen(false)}>Posts</Link>
              <Link href="/hall-of-fame" className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)} onClick={() => setMenuOpen(false)}>🏆 Hall of Fame</Link>
            </>
          )}
          {profile?.role === 'admin' && (
            <>
              <p className={cn('px-4 pt-2 text-[10px] font-bold uppercase tracking-widest', isDark ? 'text-zinc-500' : 'text-zinc-400')}>Admin</p>
              {ADMIN_LINKS.map(link => (
                <Link key={link.href} href={link.href}
                  className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)}
                  onClick={() => setMenuOpen(false)}>
                  {link.icon} {link.label}
                </Link>
              ))}
              <button
                onClick={() => { toggleAdminTheme(); setMenuOpen(false) }}
                className={cn('flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)}>
                {adminTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {adminTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              </button>
            </>
          )}
          {profile && (
            <div className={cn('border-t mt-2 pt-2', dropdownDivider)}>
              <div className="px-4 py-2">
                <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-zinc-900')}>{profile.full_name}</p>
                <p className={cn('text-xs capitalize', isDark ? 'text-zinc-500' : 'text-zinc-400')}>{profile.role === 'tailor' ? 'Creative' : profile.role}</p>
              </div>
              <Link href={profile.role === 'tailor' ? '/tailor/profile' : '/profile'}
                className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)}
                onClick={() => setMenuOpen(false)}>
                <User size={15} /> My Profile
              </Link>
              {profile.role === 'customer' && (
                <Link href="/orders"
                  className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)}
                  onClick={() => setMenuOpen(false)}>
                  <Scissors size={15} /> My Orders
                </Link>
              )}
              <button
                onClick={() => { setMenuOpen(false); handleLogout() }}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
          {!profile && (
            <>
              <Link href="/hall-of-fame" className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', mobileItem)} onClick={() => setMenuOpen(false)}>🏆 Hall of Fame</Link>
              <Link href="/signup" className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 text-center mt-2 shadow-lg shadow-violet-500/25" onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
