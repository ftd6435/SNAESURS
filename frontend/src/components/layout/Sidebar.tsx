import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building,
  DollarSign,
  Calendar,
  CreditCard,
  Gift,
  UserCheck,
  AlertTriangle,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { canAccessBadges, canManageFinancials, canManageSettings, canViewDons, canViewUsers, isReadonlyMember } from '@/lib/access'

const menuItems = [
  {
    title: 'Tableau de Bord',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    title: 'Membres',
    icon: Users,
    path: '/users',
  },
  {
    title: 'Cotisations',
    icon: DollarSign,
    path: '/cotisations',
  },
  {
    title: 'Réunions',
    icon: Calendar,
    path: '/reunions',
  },
  {
    title: 'Dons',
    icon: Gift,
    path: '/dons',
  },
  {
    title: 'Dépenses',
    icon: CreditCard,
    path: '/depenses',
  },
  {
    title: 'Badges',
    icon: UserCheck,
    path: '/badges',
  },
  {
    title: 'Sanctions',
    icon: AlertTriangle,
    path: '/sanctions',
  },
  {
    title: 'Affectations',
    icon: Building,
    path: '/settings/assignments',
  },
  {
    title: 'Paramètres',
    icon: Settings,
    path: '/settings',
  },
]

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const readonlyMember = isReadonlyMember(user)
  const filteredMenuItems = menuItems.filter((item) => {
    if (readonlyMember) {
      return ['/dashboard', '/cotisations', '/reunions', '/sanctions', '/dons'].includes(item.path)
    }

    if (item.path === '/users') return canViewUsers(user)
    if (item.path === '/settings' || item.path === '/settings/assignments') return canManageSettings(user)
    if (item.path === '/dons') return canViewDons(user)
    if (item.path === '/depenses') return canManageFinancials(user)
    if (item.path === '/badges') return canAccessBadges(user)
    return true
  })

  const closeSidebarIfMobile = () => {
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-darkslate shadow-xl z-50',
          className
        )}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <img src="/images/logo.png" alt="SNAESURS" className="h-12 w-12 rounded-full object-cover bg-white/10" />
                <span className="text-white font-heading text-lg font-semibold tracking-wide truncate">
                  SNAESURS
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white md:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={closeSidebarIfMobile}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 font-body font-medium transition-all duration-200 rounded-lg',
                        isActive
                          ? 'bg-[#135796] text-white border-r-4 border-[#1E6EC0]'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
