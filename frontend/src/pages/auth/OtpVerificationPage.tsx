import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/useAuthStore'
import { authApi } from '@/services/api/auth'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

interface LocationState {
  telephone: string
  from?: string
  data?: any
}

export default function OtpVerificationPage() {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState
  const login = useAuthStore((state) => state.login)

  useEffect(() => {
    if (!state?.telephone) {
      navigate('/login')
    }
  }, [state, navigate])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp]
    newOtp[index] = value.slice(0, 1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const verifyOtpMutation = useMutation({
    mutationFn: (otpCode: string) => authApi.verifyOtp({
      telephone: state!.telephone,
      otp: otpCode,
    }),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        if (result.token && result.data) {
          login(result.data, result.token)
          toast.success('Vérification réussie!')
          navigate('/dashboard')
        } else {
          toast.info(result.message || 'Veuillez compléter votre profil')
        }
      } else {
        toast.error(result.message || 'Code OTP invalide')
      }
    },
    onError: () => {
      toast.error('Erreur de vérification')
    },
  })

  const resendOtpMutation = useMutation({
    mutationFn: () => authApi.resendOtp(state!.telephone),
    onSuccess: (response) => {
      const result = response.data
      if (result.status === 1) {
        toast.success('OTP renvoyé avec succès!')
        setResendTimer(60)
        setCanResend(false)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        toast.error(result.message || 'Erreur lors de la réémission')
      }
    },
    onError: () => {
      toast.error('Erreur lors de la réémission')
    },
  })

  const handleVerify = () => {
    const otpCode = otp.join('')
    if (otpCode.length === 6) {
      verifyOtpMutation.mutate(otpCode)
    }
  }

  const handleResend = () => {
    if (canResend) {
      resendOtpMutation.mutate()
    }
  }

  if (!state?.telephone) {
    return null
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
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-6 top-6"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="mx-auto mb-4">
              <img src="/images/logo.png" alt="SNAESURS" className="h-16" />
            </div>
            <CardTitle className="font-heading text-2xl">Vérification OTP</CardTitle>
            <CardDescription>
              Un code à 6 chiffres a été envoyé à{' '}
              <span className="font-medium text-darkslate">{state.telephone}</span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-heading font-bold"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || resendOtpMutation.isPending}
                  className="text-sm text-primary hover:text-primary-hover disabled:text-gray-400 flex items-center gap-1"
                >
                  <RefreshCw className={cn('w-4 h-4', resendOtpMutation.isPending && 'animate-spin')} />
                  {canResend ? "Renvoyer l'OTP" : `Renvoyer dans ${resendTimer}s`}
                </button>
              </div>

              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={otp.join('').length !== 6 || verifyOtpMutation.isPending}
              >
                {verifyOtpMutation.isPending ? (
                  'Vérification...'
                ) : (
                  <>
                    Vérifier
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Vous n'avez pas reçu le code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend}
                    className="text-primary hover:text-primary-hover font-medium disabled:text-gray-400"
                  >
                    Renvoyer
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
