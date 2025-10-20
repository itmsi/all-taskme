import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Crown, User, Edit, Trash2 } from 'lucide-react'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import { teamsAPI } from '../services/api'

export default function TeamsPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
  }, [])

  const handleCreateTeam = () => {
    navigate('/teams/add')
  }

  const handleEditTeam = (team) => {
    navigate(`/teams/${team.id}/edit`)
  }

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const response = await teamsAPI.getUserTeams()
      setTeams(response.data.teams || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tim</h1>
          <p className="mt-2 text-gray-600">
            Kelola tim dan anggota untuk kolaborasi yang lebih baik.
          </p>
        </div>
        <Button onClick={handleCreateTeam}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Tim
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada tim</h3>
          <p className="text-gray-500 mb-6">
            Buat tim pertama Anda untuk mulai berkolaborasi dengan anggota lain.
          </p>
          <Button onClick={handleCreateTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Tim Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div key={team.id} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-500">{team.description}</p>
                  </div>
                  {team.role === 'leader' && (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {team.member_count || 0} anggota
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${
                      team.role === 'leader' ? 'badge-warning' : 
                      team.role === 'member' ? 'badge-primary' : 'badge-gray'
                    }`}>
                      {team.role === 'leader' ? 'Leader' : 
                       team.role === 'member' ? 'Member' : 'Viewer'}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditTeam(team)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
