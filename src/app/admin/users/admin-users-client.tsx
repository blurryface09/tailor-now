'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Phone, MapPin, ShoppingBag, Scissors, Shield, UserX, UserCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'
import toast from 'react-hot-toast'

const ROLE_CONFIG = {
  customer: { label: 'Customer', color: 'bg-blue-100 text-blue-700', icon: <ShoppingBag size={11} /> },
  tailor:   { label: 'Creative', color: 'bg-violet-100 text-violet-700', icon: <Scissors size={11} /> },
  admin:    { label: 'Admin',    color: 'bg-red-100 text-red-700', icon: <Shield size={11} /> },
}

export function AdminUsersClient({ users: initial, orderCounts }: { users: Profile[]; orderCounts: Record<string, number> }) {
  const supabase = createClient()
  const [users, setUsers] = useState(initial)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'tailor' | 'admin'>('all')

  const promoteToAdmin = async (id: string) => {
    if (!confirm('Make this user an admin? They will have full access to the admin panel.')) return
    const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setUsers(u => u.map(x => x.id === id ? { ...x, role: 'admin' } : x))
    toast.success('User promoted to admin')
  }

  const demoteUser = async (id: string, currentRole: string) => {
    if (!confirm(`Remove ${currentRole} role? User will become a regular customer.`)) return
    const { error } = await supabase.from('profiles').update({ role: 'customer' }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setUsers(u => u.map(x => x.id === id ? { ...x, role: 'customer' } : x))
    toast.success('Role updated')
  }

  const filtered = users.filter(u => {
    const matchesSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase()) ||
      u.city?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const counts = {
    all: users.length,
    customer: users.filter(u => u.role === 'customer').length,
    tailor: users.filter(u => u.role === 'tailor').length,
    admin: users.filter(u => u.role === 'admin').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} total accounts</p>
        </div>
        <input
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
          placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', 'customer', 'tailor', 'admin'] as const).map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${roleFilter === r ? 'bg-violet-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'}`}>
            {r === 'tailor' ? 'Creative' : r.charAt(0).toUpperCase() + r.slice(1)} <span className="ml-1 opacity-70">({counts[r]})</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Contact', 'Location', 'Role', 'Orders', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found</td></tr>
              )}
              {filtered.map(u => {
                const roleCfg = ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.customer
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.full_name || <span className="text-gray-400">No name</span>}</p>
                          <p className="text-xs text-gray-400 font-mono">{u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {u.email && <p className="flex items-center gap-1 text-xs text-gray-500"><Mail size={11} /> {u.email}</p>}
                        {u.phone && <p className="flex items-center gap-1 text-xs text-gray-500"><Phone size={11} /> {u.phone}</p>}
                        {!u.email && !u.phone && <p className="text-xs text-gray-300">—</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.city
                        ? <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} />{u.city}{u.state ? `, ${u.state}` : ''}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${roleCfg.color}`}>
                        {roleCfg.icon} {roleCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">{orderCounts[u.id] || 0}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.role === 'customer' && (
                          <button onClick={() => promoteToAdmin(u.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg border border-transparent hover:border-violet-200 transition-all"
                            title="Make admin">
                            <Shield size={13} /> Admin
                          </button>
                        )}
                        {u.role === 'admin' && (
                          <button onClick={() => demoteUser(u.id, u.role)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-200 transition-all"
                            title="Remove admin">
                            <UserX size={13} /> Demote
                          </button>
                        )}
                        {u.role === 'tailor' && (
                          <button onClick={() => demoteUser(u.id, u.role)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all"
                            title="Remove tailor role">
                            <UserCheck size={13} /> To Customer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
