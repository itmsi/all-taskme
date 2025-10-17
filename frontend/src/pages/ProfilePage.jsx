import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { User, Mail, Calendar, Save, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import Input from '../components/Input'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { user, updateProfile, changePassword } = useAuth()

  const profileForm = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      username: user?.username || '',
      avatar_url: user?.avatar_url || ''
    }
  })

  const passwordForm = useForm()

  const onProfileSubmit = async (data) => {
    const result = await updateProfile(data)
    if (result.success) {
      toast.success('Profil berhasil diupdate!')
    } else {
      toast.error(result.error)
    }
  }

  const onPasswordSubmit = async (data) => {
    const result = await changePassword(data)
    if (result.success) {
      toast.success('Password berhasil diubah!')
      passwordForm.reset()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profil</h1>
        <p className="mt-2 text-gray-600">
          Kelola informasi profil dan keamanan akun Anda.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Informasi Profil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Lock className="h-4 w-4 inline mr-2" />
            Keamanan
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Informasi Profil</h3>
            <p className="mt-1 text-sm text-gray-500">
              Update informasi profil Anda di sini.
            </p>
          </div>
          <div className="card-body">
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Nama Lengkap"
                  {...profileForm.register('full_name', {
                    required: 'Nama lengkap wajib diisi'
                  })}
                  error={profileForm.formState.errors.full_name?.message}
                />

                <Input
                  label="Username"
                  {...profileForm.register('username', {
                    required: 'Username wajib diisi',
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Username hanya boleh huruf, angka, dan underscore'
                    }
                  })}
                  error={profileForm.formState.errors.username?.message}
                />
              </div>

              <Input
                label="Email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />

              <Input
                label="Avatar URL"
                placeholder="https://example.com/avatar.jpg"
                {...profileForm.register('avatar_url')}
              />

              <div className="flex justify-end">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Ubah Password</h3>
            <p className="mt-1 text-sm text-gray-500">
              Pastikan menggunakan password yang kuat dan unik.
            </p>
          </div>
          <div className="card-body">
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              <div className="relative">
                <Input
                  label="Password Saat Ini"
                  type={showCurrentPassword ? 'text' : 'password'}
                  {...passwordForm.register('current_password', {
                    required: 'Password saat ini wajib diisi'
                  })}
                  error={passwordForm.formState.errors.current_password?.message}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Password Baru"
                  type={showNewPassword ? 'text' : 'password'}
                  {...passwordForm.register('new_password', {
                    required: 'Password baru wajib diisi',
                    minLength: {
                      value: 6,
                      message: 'Password minimal 6 karakter'
                    }
                  })}
                  error={passwordForm.formState.errors.new_password?.message}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Konfirmasi Password Baru"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...passwordForm.register('confirmPassword', {
                    required: 'Konfirmasi password wajib diisi',
                    validate: value => value === passwordForm.watch('new_password') || 'Password tidak cocok'
                  })}
                  error={passwordForm.formState.errors.confirmPassword?.message}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="flex justify-end">
                <Button type="submit">
                  <Lock className="h-4 w-4 mr-2" />
                  Ubah Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="mt-8 card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Informasi Akun</h3>
        </div>
        <div className="card-body">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">ID Pengguna</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{user?.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Bergabung</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`badge ${user?.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {user?.is_active ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
