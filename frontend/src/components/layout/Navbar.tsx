import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, Calendar, DollarSign, Gift, Menu, PanelLeftClose, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { reunionsApi, usersApi } from '@/services/api/users'
import { canViewDons, canViewUsers } from '@/lib/access'

export default function Navbar() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement | null>(null)
  const [now, setNow] = useState<Date>(() => new Date())

  const canSeeDons = canViewDons(user)
  const canSeeUsers = canViewUsers(user)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setUserMenuOpen(false)
      if (notificationsRef.current && !notificationsRef.current.contains(target)) setNotificationsOpen(false)
    }

    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const pendingReunionsQuery = useQuery({
    queryKey: ['navbar-pending-reunions'],
    queryFn: async () => {
      const response = await reunionsApi.getReunions({ status: 'pending', light: true, per_page: 1, page: 1 })
      return response.data
    },
    enabled: !!token,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const pendingApprovalsQuery = useQuery({
    queryKey: ['navbar-pending-approvals'],
    queryFn: async () => {
      const response = await usersApi.getUsers({ is_approved: false, light: true, per_page: 1, page: 1 })
      return response.data
    },
    enabled: !!token && canSeeUsers,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const pendingReunionsCount = pendingReunionsQuery.data?.data?.total ?? 0
  const pendingApprovalsCount = pendingApprovalsQuery.data?.data?.total ?? 0
  const notificationsCount = pendingReunionsCount + (canSeeUsers ? pendingApprovalsCount : 0)

  const dateLong = useMemo(
    () =>
      now.toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }),
    [now]
  )
  const dateShort = useMemo(() => now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), [now])
  const timeLong = useMemo(
    () =>
      now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [now]
  )
  const timeShort = useMemo(() => now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), [now])

  return (
    <header
      className={`h-16 bg-darkslate border-b border-gray-700 fixed top-0 left-0 ${sidebarOpen ? 'md:left-64' : 'md:left-0'} right-0 z-30 flex items-center justify-between px-6 transition-[left] duration-300`}
    >
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 text-white hover:bg-gray-800 hover:text-white"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-white px-3">
            <Link to="/cotisations" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden lg:inline">Cotisations</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-white px-3">
            <Link to="/reunions" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden lg:inline">Réunions</span>
            </Link>
          </Button>
          {canSeeDons && (
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-white px-3">
              <Link to="/dons" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span className="hidden lg:inline">Dons</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="hidden md:flex flex-1 justify-center px-4">
        <div className="text-gray-200 font-body text-sm truncate max-w-[520px]">
          <span className="capitalize">{dateLong}</span>
          <span className="mx-2 text-gray-400">•</span>
          <span className="tabular-nums">{timeLong}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="md:hidden text-gray-200 font-body text-xs sm:text-sm">
          <span className="tabular-nums">{dateShort}</span>
          <span className="mx-2 text-gray-400">•</span>
          <span className="tabular-nums">{timeShort}</span>
        </div>

        <div ref={notificationsRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-gray-800 hover:text-white"
            onClick={() => {
              setUserMenuOpen(false)
              setNotificationsOpen((v) => !v)
            }}
          >
            <Bell className="w-5 h-5" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 px-1 h-5 bg-[#D64545] text-white text-xs rounded-full flex items-center justify-center font-bold tabular-nums">
                {notificationsCount > 99 ? '99+' : notificationsCount}
              </span>
            )}
          </Button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">
                  {notificationsCount > 0 ? `${notificationsCount} en attente` : 'Aucune notification'}
                </p>
              </div>

              <div className="py-1">
                <Link
                  to="/reunions"
                  onClick={() => setNotificationsOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#135796]" />
                    Réunions en attente
                  </span>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-1 rounded-full tabular-nums">
                    {pendingReunionsCount}
                  </span>
                </Link>

                {canSeeUsers && (
                  <Link
                    to="/users"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#9C5931]" />
                      Utilisateurs à approuver
                    </span>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-1 rounded-full tabular-nums">
                      {pendingApprovalsCount}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={userMenuRef} className="relative flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-body text-sm font-medium text-gray-100">
              {user?.full_name || 'Utilisateur'}
            </p>
            <p className="font-body text-xs text-gray-300">
              {user?.role || 'membre'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(false)
              setUserMenuOpen((v) => !v)
            }}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#135796] focus:ring-offset-2 focus:ring-offset-darkslate"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
              <AvatarFallback className="bg-[#135796] text-white font-heading">
                {user?.full_name ? getInitials(user.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name || 'Utilisateur'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || user?.telephone || ''}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Profil
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    logout()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
