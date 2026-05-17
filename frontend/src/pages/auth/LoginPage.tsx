import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/useAuthStore'
import { authApi, type LoginData } from '@/services/api/auth'
import { toast } from '@/components/ui/sonner'

const loginSchema = z.object({
  login: z.string().min(1, 'Identifiant requis'),
  password: z.string().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [useOtp, setUseOtp] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        if (result.token && result.data) {
          login(result.data, result.token)
          toast.success('Connexion réussie')
          navigate('/dashboard')
        } else if (result.data?.telephone) {
          toast.info(result.message)
          navigate('/verify-otp', {
            state: { telephone: result.data.telephone },
          })
        }
      } else {
        toast.error(result.message || 'Erreur de connexion')
      }
    },
    onError: () => {
      toast.error('Une erreur est survenue')
    },
  })

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      login: data.login,
      password: useOtp ? undefined : data.password,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img src="/images/logo.png" alt="SNAESURS" className="h-16" />
            </div>
            <CardTitle className="font-heading text-2xl">Connexion</CardTitle>
            <CardDescription>
              Accédez à votre compte SNAESURS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={loginMethod === 'email' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setLoginMethod('email')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={loginMethod === 'phone' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setLoginMethod('phone')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Téléphone
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {loginMethod === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
                </label>
                <div className="relative">
                  {loginMethod === 'email' ? (
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  ) : (
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  )}
                  <Input
                    {...register('login')}
                    type={loginMethod === 'email' ? 'email' : 'tel'}
                    placeholder={
                      loginMethod === 'email'
                        ? 'exemple@email.com'
                        : '+224621234567'
                    }
                    className="pl-10"
                  />
                </div>
                {errors.login && (
                  <p className="text-sm text-red-500">{errors.login.message}</p>
                )}
              </div>

              {loginMethod === 'phone' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useOtp"
                    checked={useOtp}
                    onChange={(e) => setUseOtp(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="useOtp" className="text-sm">
                    Se connecter avec OTP
                  </label>
                </div>
              )}

              {(!useOtp || loginMethod === 'email') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mot de passe</label>
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
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  'Connexion...'
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte?{' '}
                <Link
                  to="/register"
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  S'inscrire
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
