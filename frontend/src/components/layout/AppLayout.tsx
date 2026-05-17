import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import Navbar from './Navbar'
import PageContainer from './PageContainer'
import { usersApi } from '@/services/api/users'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'

export default function AppLayout() {
  const token = useAuthStore((s) => s.token)
  const updateUser = useAuthStore((s) => s.updateUser)
  const logout = useAuthStore((s) => s.logout)
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)

  useEffect(() => {
    if (!token) return
    usersApi.getMe()
      .then((res) => {
        const payload: any = res.data
        updateUser(payload?.data ?? payload)
      })
      .catch(() => logout())
  }, [token, updateUser, logout])

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <Navbar />
      <main className={`ml-0 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'} mt-16 min-h-screen transition-[margin] duration-300`}>
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
    </div>
  )
}
