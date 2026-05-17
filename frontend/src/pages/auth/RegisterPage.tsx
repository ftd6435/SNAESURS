import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Home,
  Calendar,
  UserPlus,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authApi } from '@/services/api/auth'
import { toast } from '@/components/ui/sonner'

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Nom complet requis'),
    telephone: z.string().min(8, 'Numéro de téléphone requis'),
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Mot de passe doit contenir au moins 6 caractères'),
    password_confirmation: z.string(),
    adresse: z.string().optional(),
    genre: z.enum(['m', 'f', 'autre']).optional(),
    date_naissance: z.string().optional(),
    person_a_contacter: z.string().optional(),
    phone_person_a_contacter: z.string().optional(),
    structure_id: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirmation'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')

  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      genre: 'm',
    },
  })

  const registerMutation = useMutation({
    mutationFn: (formData: FormData) => authApi.register(formData),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        setSuccessMessage(
          result.message ||
            'Inscription réussie. Votre compte est en attente d\'approbation par un administrateur. Vous serez notifié une fois votre compte approuvé.'
        )
        setShowSuccessModal(true)
        reset({ genre: 'm' })
        setAvatarFile(null)
        setAvatarPreview(null)
      } else {
        toast.error(result.message || 'Erreur lors de l\'inscription')
      }
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const payload = error.response?.data as any
        const validationErrors = payload?.errors || payload?.error

        if (validationErrors && typeof validationErrors === 'object') {
          Object.entries(validationErrors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : String(messages)
            setError(field as keyof RegisterFormValues, { type: 'server', message })
          })
          toast.error(payload?.message || 'Veuillez corriger les erreurs du formulaire.')
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

  const onSubmit = (data: RegisterFormValues) => {
    clearErrors()
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value)
      }
    })

    if (avatarFile) {
      formData.append('avatar', avatarFile)
    }

    registerMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 py-12">
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-gray-900">Inscription envoyée</h2>
              <p className="mt-2 text-sm text-gray-600">{successMessage}</p>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    setShowSuccessModal(false)
                    navigate('/login')
                  }}
                >
                  OK
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-6 top-6"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="mx-auto mb-4">
              <img src="/images/logo.png" alt="SNAESURS" className="h-16" />
            </div>
            <CardTitle className="font-heading text-2xl">Créer un compte</CardTitle>
            <CardDescription>
              Rejoignez la communauté SNAESURS
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {avatarPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
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
                      {...register('full_name')}
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-sm text-red-500">{errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Téléphone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      {...register('telephone')}
                      type="tel"
                      placeholder="+224621234567"
                      className="pl-10"
                    />
                  </div>
                  {errors.telephone && (
                    <p className="text-sm text-red-500">{errors.telephone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="exemple@email.com"
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Genre</label>
                  <select
                    {...register('genre')}
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
                    {...register('date_naissance')}
                    type="date"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Adresse</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    {...register('adresse')}
                    type="text"
                    placeholder="Votre adresse"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Personne à contacter</label>
                  <Input
                    {...register('person_a_contacter')}
                    type="text"
                    placeholder="Nom de la personne"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Téléphone de contact</label>
                  <Input
                    {...register('phone_person_a_contacter')}
                    type="tel"
                    placeholder="+224621234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mot de passe *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmer le mot de passe *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      {...register('password_confirmation')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="text-sm text-red-500">{errors.password_confirmation.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  'Inscription en cours...'
                ) : (
                  <>
                    Créer un compte
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
