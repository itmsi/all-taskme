import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import Input from '../components/Input'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, loading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    const result = await registerUser(data)
    if (result.success) {
      toast.success('Registrasi berhasil!')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Buat akun baru
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Atau{' '}
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            masuk ke akun yang sudah ada
          </Link>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Nama Lengkap"
          type="text"
          autoComplete="name"
          {...register('full_name', {
            required: 'Nama lengkap wajib diisi',
            minLength: {
              value: 2,
              message: 'Nama minimal 2 karakter'
            }
          })}
          error={errors.full_name?.message}
        />

        <Input
          label="Username"
          type="text"
          autoComplete="username"
          {...register('username', {
            required: 'Username wajib diisi',
            minLength: {
              value: 3,
              message: 'Username minimal 3 karakter'
            },
            pattern: {
              value: /^[a-zA-Z0-9_]+$/,
              message: 'Username hanya boleh huruf, angka, dan underscore'
            }
          })}
          error={errors.username?.message}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          {...register('email', {
            required: 'Email wajib diisi',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Format email tidak valid'
            }
          })}
          error={errors.email?.message}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('password', {
              required: 'Password wajib diisi',
              minLength: {
                value: 6,
                message: 'Password minimal 6 karakter'
              }
            })}
            error={errors.password?.message}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>

        <Input
          label="Konfirmasi Password"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword', {
            required: 'Konfirmasi password wajib diisi',
            validate: value => value === password || 'Password tidak cocok'
          })}
          error={errors.confirmPassword?.message}
        />

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Memproses...' : 'Daftar'}
        </Button>
      </form>
    </div>
  )
}
