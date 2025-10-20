import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Crown, UserPlus, X, Trash2 } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import { teamsAPI, usersAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function AddTeamPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [members, setMembers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAllUsers()
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Gagal mengambil daftar user')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addMember = () => {
    if (!selectedUserId) {
      toast.error('Pilih user terlebih dahulu')
      return
    }

    const user = users.find(u => u.id === selectedUserId)
    if (!user) {
      toast.error('User tidak ditemukan')
      return
    }

    // Check if user is already added
    if (members.some(m => m.user_id === selectedUserId)) {
      toast.error('User sudah ditambahkan ke tim')
      return
    }

    // Check if trying to add leader when leader already exists
    if (selectedRole === 'leader' && members.some(m => m.role === 'leader')) {
      toast.error('Tim hanya boleh memiliki satu leader')
      return
    }

    const newMember = {
      user_id: selectedUserId,
      role: selectedRole,
      user: user
    }

    setMembers(prev => [...prev, newMember])
    setSelectedUserId('')
    setSelectedRole('member')
  }

  const removeMember = (userId) => {
    setMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nama tim harus diisi')
      return
    }

    if (members.length === 0) {
      toast.error('Minimal harus ada satu anggota tim')
      return
    }

    // Check if there's a leader
    const hasLeader = members.some(m => m.role === 'leader')
    if (!hasLeader) {
      toast.error('Tim harus memiliki leader')
      return
    }

    setLoading(true)
    try {
      // Find the leader
      const leader = members.find(m => m.role === 'leader')
      
      // Create team first with leader
      const teamResponse = await teamsAPI.createTeam({
        name: formData.name,
        description: formData.description,
        leader_id: leader.user_id
      })

      const team = teamResponse.data.team

      // Add other members to team
      for (const member of members) {
        if (member.role !== 'leader') {
          await teamsAPI.addTeamMember(team.id, {
            user_id: member.user_id,
            role: member.role
          })
        }
      }

      toast.success('Tim berhasil dibuat!')
      navigate('/teams')
    } catch (error) {
      console.error('Error creating team:', error)
      toast.error('Gagal membuat tim')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/teams')}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buat Tim Baru</h1>
            <p className="mt-2 text-gray-600">
              Buat tim baru dan tambahkan anggota untuk kolaborasi yang lebih baik.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Team Information */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center mb-6">
                <Users className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Informasi Tim</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Tim *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama tim"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Masukkan deskripsi tim"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <UserPlus className="h-5 w-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Anggota Tim</h2>
                </div>
                <span className="text-sm text-gray-500">
                  {members.length} anggota
                </span>
              </div>

              {/* Add Member Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih User
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih user...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="leader">Leader</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={addMember}
                      disabled={!selectedUserId}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Tambah
                    </Button>
                  </div>
                </div>
              </div>

              {/* Members List */}
              {members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.user.full_name}</p>
                          <p className="text-sm text-gray-500">@{member.user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`badge ${
                          member.role === 'leader' ? 'badge-warning' : 
                          member.role === 'member' ? 'badge-primary' : 'badge-gray'
                        }`}>
                          {member.role === 'leader' ? 'Leader' : 
                           member.role === 'member' ? 'Member' : 'Viewer'}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMember(member.user_id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Belum ada anggota tim</p>
                  <p className="text-sm">Tambahkan anggota tim menggunakan form di atas</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/teams')}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim() || members.length === 0}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Membuat Tim...
                </>
              ) : (
                'Buat Tim'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
