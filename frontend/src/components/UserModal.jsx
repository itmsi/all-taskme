import { useState, useEffect } from 'react'
import { X, User, Mail, Shield, UserPlus } from 'lucide-react'
import Button from './Button'
import Input from './Input'
import { usersAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function UserModal({ isOpen, onClose, user = null, onSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'user'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          full_name: user.full_name || '',
          password: '', // Don't pre-fill password
          role: user.role || 'user'
        })
      } else {
        setFormData({
          username: '',
          email: '',
          full_name: '',
          password: '',
          role: 'user'
        })
      }
    }
  }, [isOpen, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (user) {
        // Update user (without password if not provided)
        const updateData = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        await usersAPI.updateProfile(updateData)
        toast.success('User berhasil diupdate!')
      } else {
        // Create new user
        await usersAPI.createUser(formData)
        toast.success('User berhasil dibuat!')
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(user ? 'Gagal mengupdate user' : 'Gagal membuat user')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return

    setLoading(true)
    try {
      await usersAPI.deleteUser(user.id)
      toast.success('User berhasil dihapus!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Gagal menghapus user')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              {user ? 'Edit User' : 'Buat User Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Masukkan username"
                required
                disabled={user} // Don't allow username change for existing users
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Masukkan email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Nama Lengkap *
              </label>
              <Input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password {!user && '*'}
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={user ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
                required={!user}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="h-4 w-4 inline mr-1" />
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div>
              {user && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Hapus
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.username.trim() || !formData.email.trim() || !formData.full_name.trim() || (!user && !formData.password.trim())}
              >
                {loading ? 'Menyimpan...' : (user ? 'Update' : 'Buat')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
