import { useState, useEffect } from 'react'
import { X, Users, Crown } from 'lucide-react'
import Button from './Button'
import Input from './Input'
import { teamsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function TeamModal({ isOpen, onClose, team = null, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (isOpen) {
      if (team) {
        setFormData({
          name: team.name || '',
          description: team.description || '',
          leader_id: team.leader_id || ''
        })
      } else {
        setFormData({
          name: '',
          description: '',
          leader_id: ''
        })
      }
      fetchUsers()
    }
  }, [isOpen, team])

  const fetchUsers = async () => {
    try {
      const response = await teamsAPI.getUserTeams() // This will get users from teams context
      // For now, we'll use a simple approach - in real app you'd have a users endpoint
      setUsers([])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (team) {
        await teamsAPI.updateTeam(team.id, formData)
        toast.success('Tim berhasil diupdate!')
      } else {
        await teamsAPI.createTeam(formData)
        toast.success('Tim berhasil dibuat!')
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving team:', error)
      toast.error(team ? 'Gagal mengupdate tim' : 'Gagal membuat tim')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!team) return
    
    if (!confirm('Apakah Anda yakin ingin menghapus tim ini?')) return

    setLoading(true)
    try {
      await teamsAPI.deleteTeam(team.id)
      toast.success('Tim berhasil dihapus!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error('Gagal menghapus tim')
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
            <Users className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              {team ? 'Edit Tim' : 'Buat Tim Baru'}
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
                Nama Tim *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama tim"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Masukkan deskripsi tim"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Crown className="h-4 w-4 inline mr-1" />
                Leader Tim
              </label>
              <select
                value={formData.leader_id}
                onChange={(e) => setFormData({ ...formData, leader_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih leader tim</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div>
              {team && (
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
                disabled={loading || !formData.name.trim()}
              >
                {loading ? 'Menyimpan...' : (team ? 'Update' : 'Buat')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
