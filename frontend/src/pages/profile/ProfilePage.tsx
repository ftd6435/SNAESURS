import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { User, Mail, Phone, Home, Calendar, Lock, Eye, EyeOff, UserPlus, Save } from 'lucide-react'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/useAuthStore'
import { usersApi } from '@/services/api/users'
import { toast } from '@/components/ui/sonner'

type ActiveTab = 'profile' | 'password'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const passwordFormRef = useRef<HTMLFormElement | null>(null)

  const { user, updateUser } = useAuthStore()

  const updateProfileMutation = useMutation({
    mutationFn: (data: FormData) => usersApi.updateProfile(data),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        if (result.data) {
          updateUser(result.data)
        }
        toast.success('Profil mis à jour avec succès')
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    },
    onError: () => {
      toast.error('Une erreur est survenue')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => usersApi.changePassword(data),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('Mot de passe changé avec succès')
        setPasswordErrors({})
        passwordFormRef.current?.reset()
      } else {
        toast.error(result.message || 'Erreur lors du changement')
      }
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const payload = error.response?.data as any
        const validationErrors = payload?.errors || payload?.error

        if (validationErrors && typeof validationErrors === 'object') {
          const next: Record<string, string> = {}
          Object.entries(validationErrors).forEach(([field, messages]) => {
            next[field] = Array.isArray(messages) ? String(messages[0]) : String(messages)
          })
          setPasswordErrors(next)
          toast.error(payload?.message || 'Veuillez corriger les erreurs.')
          return
        }

        toast.error(payload?.message || 'Une erreur est survenue')
        return
      }

      toast.error('Une erreur est survenue')
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (avatarFile) {
      formData.append('avatar', avatarFile)
    }

    updateProfileMutation.mutate(formData)
  }

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordErrors({})
    const formData = new FormData(e.currentTarget)

    changePasswordMutation.mutate({
      current_password: formData.get('current_password') as string,
      password: formData.get('password') as string,
      password_confirmation: formData.get('password_confirmation') as string,
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-h1 text-darkslate mb-2">Mon Profil</h1>
        <p className="text-gray-600">Gérez votre profil et vos paramètres</p>
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'profile' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('profile')}
          className="rounded-none"
        >
          <User className="w-4 h-4 mr-2" />
          Modifier le profil
        </Button>
        <Button
          variant={activeTab === 'password' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('password')}
          className="rounded-none"
        >
          <Lock className="w-4 h-4 mr-2" />
          Changer le mot de passe
        </Button>
      </div>

      {activeTab === 'profile' ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={avatarPreview || user.avatar_url}
                      alt={user.full_name}
                    />
                    <AvatarFallback className="bg-primary text-white font-heading text-2xl">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-primary-hover transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Photo de profil (optionnel)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom complet *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      name="full_name"
                      type="text"
                      defaultValue={user.full_name}
                      placeholder="John Doe"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Téléphone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      name="telephone"
                      type="tel"
                      defaultValue={user.telephone}
                      placeholder="+224621234567"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      name="email"
                      type="email"
                      defaultValue={user.email || ''}
                      placeholder="exemple@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Genre</label>
                  <select
                    name="genre"
                    defaultValue={user.genre || 'm'}
                    className="flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-base ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135796] focus-visible:ring-[#135796]/20 focus-visible:ring-offset-2"
                  >
                    <option value="m">Masculin</option>
                    <option value="f">Féminin</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date de naissance</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    name="date_naissance"
                    type="date"
                    defaultValue={user.date_naissance || ''}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Adresse</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    name="adresse"
                    type="text"
                    defaultValue={user.adresse || ''}
                    placeholder="Votre adresse"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Personne à contacter</label>
                  <Input
                    name="person_a_contacter"
                    type="text"
                    defaultValue={user.person_a_contacter || ''}
                    placeholder="Nom de la personne"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Téléphone de contact</label>
                  <Input
                    name="phone_person_a_contacter"
                    type="tel"
                    defaultValue={user.phone_person_a_contacter || ''}
                    placeholder="+224621234567"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Changer le mot de passe</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={passwordFormRef} onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mot de passe actuel *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    name="current_password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordErrors.current_password && (
                  <p className="text-sm text-red-500">{passwordErrors.current_password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nouveau mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    name="password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordErrors.password && (
                  <p className="text-sm text-red-500">{passwordErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmer le nouveau mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    name="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordErrors.password_confirmation && (
                  <p className="text-sm text-red-500">{passwordErrors.password_confirmation}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {changePasswordMutation.isPending ? 'Changement en cours...' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
