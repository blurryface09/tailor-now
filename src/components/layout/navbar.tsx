'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import type { Profile } from '@/types'
import {
  Bell, MessageSquare, User, LogOut, Scissors, LayoutDashboard,
  ChevronDown, Menu, X, Shield, Users, Package, Star, TrendingUp,
  AlertTriangle, Store,
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
  { href: '/admin/onboard-tailor',  icon: <Scissors size={14} />,        label: 'Onboard Creative' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single()
          .then(({ data }) => setProfile(data))
      }
    })
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => pathname === href || (href !== '/admin' && pathname.startsWith(href))

  return (
    <nav className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-md shadow-violet-900/5 border-b border-gray-100'
        : 'bg-white border-b border-gray-100'
    )}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href={profile?.role === 'tailor' ? '/dashboard' : profile?.role === 'admin' ? '/admin' : profile ? '/home' : '/'}
          className="transition-transform hover:scale-[1.02] duration-200"
        >
          <Logo size="sm" variant="full" animated />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {/* Customer nav */}
          {profile?.role === 'customer' && (
            <>
              <Link href="/feed" className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                isActive('/feed') ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:text-violet-700 hover:bg-violet-50'
              )}>
                Feed
              </Link>
              <Link href="/browse" className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                isActive('/browse') ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:text-violet-700 hover:bg-violet-50'
              )}>
                Find Creatives
              </Link>
            </>
          )}

          {/* Tailor nav */}
          {profile?.role === 'tailor' && (
            <>
              <Link href="/dashboard" className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
                isActive('/dashboard') ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:text-violet-700 hover:bg-violet-50'
              )}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <Link href="/tailor/orders" className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                isActive('/tailor/orders') ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:text-violet-700 hover:bg-violet-50'
              )}>
                Orders
              </Link>
              <Link href="/tailor/posts" className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                isActive('/tailor/posts') ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:text-violet-700 hover:bg-violet-50'
              )}>
                Posts
              </Link>
              <Link href="/tailor/portfolio" className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                isActive('/tailor/portfolio') ? 'bg-violet-100 text-violet-700' : 'text-gray-600 hover:text-violet-700 hover:bg-violet-50'
              )}>
                Portfolio
              </Link>
            </>
          )}

          {/* Admin nav — dropdown */}
          {profile?.role === 'admin' && (
            <div className="relative group">
              <button className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                pathname.startsWith('/admin')
                  ? 'bg-violet-700 text-white'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
              )}>
                <Shield size={15} /> Admin
                <ChevronDown size={13} className="transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
                <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Panel</p>
                {ADMIN_LINKS.map(link => (
                  <Link key={link.href} href={link.href}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors',
                      isActive(link.href)
                        ? 'bg-violet-50 text-violet-700 font-semibold'
                        : 'text-gray-700 hover:bg-violet-50 hover:text-violet-700'
                    )}>
                    {link.icon} {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {profile ? (
            <>
              {profile.role !== 'admin' && (
                <Link href={profile.role === 'tailor' ? '/tailor/chat' : '/chat'}
                  className="relative p-2 text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-all duration-200 hover:scale-110">
                  <MessageSquare size={20} />
                </Link>
              )}
              {profile.role !== 'admin' && (
                <Link href="/notifications"
                  className="relative p-2 text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-all duration-200 hover:scale-110">
                  <Bell size={20} />
                </Link>
              )}
              <div className="relative group">
                <button className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-violet-50 transition-all duration-200 border border-transparent hover:border-violet-100">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm',
                    profile.role === 'admin'
                      ? 'bg-gradient-to-br from-violet-700 to-violet-900'
                      : 'bg-gradient-to-br from-violet-500 to-violet-700'
                  )}>
                    {profile.role === 'admin' ? <Shield size={14} /> : (profile.full_name?.[0]?.toUpperCase() || 'U')}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">{profile.full_name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className="hidden md:block text-gray-400 transition-transform duration-200 group-hover:rotate-180" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{profile.full_name}</p>
                    <p className={cn('text-xs font-medium capitalize', profile.role === 'admin' ? 'text-violet-600' : 'text-gray-400')}>
                      {profile.role === 'admin' && '⚡ '}{profile.role}
                    </p>
                  </div>
                  {profile.role !== 'admin' && (
                    <Link href={profile.role === 'tailor' ? '/tailor/profile' : '/profile'} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                      <User size={15} /> My Profile
                    </Link>
                  )}
                  {profile.role === 'customer' && (
                    <Link href="/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                      <Scissors size={15} /> My Orders
                    </Link>
                  )}
                  {profile.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                      <Shield size={15} /> Admin Dashboard
                    </Link>
                  )}
                  <div className="border-t border-gray-50 mt-1 pt-1">
                    <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors rounded-b-xl">
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-violet-700 px-3 py-2 rounded-xl hover:bg-violet-50 transition-all duration-200">
                Sign in
              </Link>
              <Link href="/signup" className="bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-violet-800 transition-all duration-200 shadow-sm shadow-violet-300 hover:shadow-violet-400 hover:scale-[1.03] active:scale-[0.97]">
                Get Started
              </Link>
            </>
          )}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        'md:hidden overflow-hidden transition-all duration-300',
        menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {profile?.role === 'customer' && (
            <>
              <Link href="/feed" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors" onClick={() => setMenuOpen(false)}>
                Feed
              </Link>
              <Link href="/browse" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors" onClick={() => setMenuOpen(false)}>
                Find Creatives
              </Link>
            </>
          )}
          {profile?.role === 'tailor' && (
            <>
              <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors" onClick={() => setMenuOpen(false)}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <Link href="/tailor/orders" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors" onClick={() => setMenuOpen(false)}>
                Orders
              </Link>
              <Link href="/tailor/posts" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors" onClick={() => setMenuOpen(false)}>
                Posts
              </Link>
            </>
          )}
          {profile?.role === 'admin' && (
            <>
              <p className="px-4 pt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin</p>
              {ADMIN_LINKS.map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                  onClick={() => setMenuOpen(false)}>
                  {link.icon} {link.label}
                </Link>
              ))}
            </>
          )}
          {!profile && (
            <Link href="/signup" className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-700 text-center mt-2" onClick={() => setMenuOpen(false)}>
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
