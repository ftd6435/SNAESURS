import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import OtpVerificationPage from '@/pages/auth/OtpVerificationPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import UsersListPage from '@/pages/users/UsersListPage'
import CotisationsPage from '@/pages/cotisations/CotisationsPage'
import ReunionsPage from '@/pages/reunions/ReunionsPage'
import DonsPage from '@/pages/financials/FinancialsPage'
import DepensesPage from '@/pages/depenses/DepensesPage'
import SanctionsPage from '@/pages/sanctions/SanctionsPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import StructuresPage from '@/pages/settings/StructuresPage'
import AssignmentsPage from '@/pages/settings/AssignmentsPage'
import BadgesPage from '@/pages/badges/BadgesPage'
import PublicUserProfilePage from '@/pages/public/PublicUserProfilePage'

function App() {
  return (
    <div className="min-h-screen bg-surface">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OtpVerificationPage />} />
        <Route path="/public/users/:code" element={<PublicUserProfilePage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersListPage />} />
          <Route path="cotisations" element={<CotisationsPage />} />
          <Route path="reunions" element={<ReunionsPage />} />
          <Route path="dons" element={<DonsPage />} />
          <Route path="depenses" element={<DepensesPage />} />
          <Route path="financials" element={<Navigate to="/dons" replace />} />
          <Route path="badges" element={<BadgesPage />} />
          <Route path="sanctions" element={<SanctionsPage />} />
          <Route path="settings" element={<StructuresPage />} />
          <Route path="settings/assignments" element={<AssignmentsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<div>Page non trouvée</div>} />
      </Routes>
      <Toaster />
    </div>
  )
}

export default App
