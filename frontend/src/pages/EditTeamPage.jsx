import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Users, Crown, UserPlus, X, Trash2, Edit } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import { teamsAPI, usersAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function EditTeamPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')

  useEffect(() => {
    if (id) {
      fetchTeamData()
      fetchUsers()
    }
  }, [id])

  const fetchTeamData = async () => {
    try {
      setInitialLoading(true)
      const [teamResponse, membersResponse] = await Promise.all([
        teamsAPI.getTeamById(id),
        teamsAPI.getTeamMembers(id)
      ])

      const teamData = teamResponse.data.team
      const membersData = membersResponse.data.members

      setTeam(teamData)
      setFormData({
        name: teamData.name || '',
        description: teamData.description || ''
      })
      setMembers(membersData)
    } catch (error) {
      console.error('Error fetching team data:', error)
      toast.error('Gagal mengambil data tim')
      navigate('/teams')
    } finally {
      setInitialLoading(false)
    }
  }

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

  const addMember = async () => {
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
      toast.error('User sudah menjadi anggota tim')
      return
    }

    // Check if trying to add leader when leader already exists
    if (selectedRole === 'leader' && members.some(m => m.role === 'leader')) {
      toast.error('Tim hanya boleh memiliki satu leader')
      return
    }

    try {
      const response = await teamsAPI.addTeamMember(id, {
        user_id: selectedUserId,
        role: selectedRole
      })

      const newMember = response.data.member
      newMember.user = user

      setMembers(prev => [...prev, newMember])
      setSelectedUserId('')
      setSelectedRole('member')
      toast.success('Anggota berhasil ditambahkan')
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Gagal menambahkan anggota')
    }
  }

  const removeMember = async (userId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus anggota ini?')) return

    try {
      await teamsAPI.removeTeamMember(id, userId)
      setMembers(prev => prev.filter(m => m.user_id !== userId))
      toast.success('Anggota berhasil dihapus')
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Gagal menghapus anggota')
    }
  }

  const updateMemberRole = async (userId, newRole) => {
    try {
      if (newRole === 'leader') {
        // Check if there's already a leader
        if (members.some(m => m.role === 'leader' && m.user_id !== userId)) {
          toast.error('Tim hanya boleh memiliki satu leader')
          return
        }
        
        // Update team leader
        await teamsAPI.updateTeamLeader(id, { leader_id: userId })
        // Update local state
        setMembers(prev => prev.map(m => 
          m.user_id === userId ? { ...m, role: 'leader' } : 
          m.role === 'leader' ? { ...m, role: 'member' } : m
        ))
        toast.success('Leader tim berhasil diupdate')
      } else {
        await teamsAPI.updateMemberRole(id, userId, { role: newRole })
        setMembers(prev => prev.map(m => 
          m.user_id === userId ? { ...m, role: newRole } : m
        ))
        toast.success('Role anggota berhasil diupdate')
      }
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error('Gagal mengupdate role anggota')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nama tim harus diisi')
      return
    }

    setLoading(true)
    try {
      await teamsAPI.updateTeam(id, formData)
      toast.success('Tim berhasil diupdate!')
      navigate('/teams')
    } catch (error) {
      console.error('Error updating team:', error)
      toast.error('Gagal mengupdate tim')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus tim ini? Tindakan ini tidak dapat dibatalkan.')) return

    setLoading(true)
    try {
      await teamsAPI.deleteTeam(id)
      toast.success('Tim berhasil dihapus!')
      navigate('/teams')
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error('Gagal menghapus tim')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tim tidak ditemukan</h3>
          <p className="text-gray-500 mb-6">Tim yang Anda cari tidak ditemukan atau tidak memiliki akses.</p>
          <Button onClick={() => navigate('/teams')}>
            Kembali ke Daftar Tim
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/teams')}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Tim</h1>
              <p className="mt-2 text-gray-600">
                Kelola informasi tim dan anggota untuk kolaborasi yang lebih baik.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            onClick={handleDeleteTeam}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus Tim
          </Button>
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
                      {users.filter(user => !members.some(m => m.user_id === user.id)).map((user) => (
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
                          {member.role === 'leader' ? (
                            <Crown className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <User className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.user.full_name}</p>
                          <p className="text-sm text-gray-500">@{member.user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <select
                          value={member.role}
                          onChange={(e) => updateMemberRole(member.user_id, e.target.value)}
                          disabled={member.role === 'leader'}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="leader">Leader</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeMember(member.user_id)}
                          disabled={member.role === 'leader'}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:text-gray-300"
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
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
