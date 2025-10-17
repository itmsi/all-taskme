import { useState } from 'react'
import { Plus, Users, Crown, User } from 'lucide-react'
import Button from '../components/Button'

export default function TeamsPage() {
  const [teams] = useState([])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tim</h1>
          <p className="mt-2 text-gray-600">
            Kelola tim dan anggota untuk kolaborasi yang lebih baik.
          </p>
        </div>
        <Button>
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
          <Button>
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
                    {team.memberCount} anggota
                  </div>
                  <span className={`badge ${
                    team.role === 'leader' ? 'badge-warning' : 
                    team.role === 'member' ? 'badge-primary' : 'badge-gray'
                  }`}>
                    {team.role === 'leader' ? 'Leader' : 
                     team.role === 'member' ? 'Member' : 'Viewer'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
