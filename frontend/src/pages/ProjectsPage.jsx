import { useState, useEffect } from 'react'
import { Plus, FolderOpen, Calendar, Users } from 'lucide-react'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import { projectsAPI } from '../services/api'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const response = await projectsAPI.getUserProjects()
        setProjects(response.data.data || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

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
          <h1 className="text-3xl font-bold text-gray-900">Proyek</h1>
          <p className="mt-2 text-gray-600">
            Kelola dan pantau progress proyek Anda.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Buat Proyek
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada proyek</h3>
          <p className="text-gray-500 mb-6">
            Buat proyek pertama Anda untuk mulai mengorganisir tugas dan tim.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Buat Proyek Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                  </div>
                  <span className={`badge ${
                    project.status === 'active' ? 'badge-success' :
                    project.status === 'completed' ? 'badge-primary' :
                    project.status === 'on_hold' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {project.status === 'active' ? 'Aktif' :
                     project.status === 'completed' ? 'Selesai' :
                     project.status === 'on_hold' ? 'Ditunda' : 'Dibatalkan'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {project.end_date ? new Date(project.end_date).toLocaleDateString('id-ID') : 'Tanpa deadline'}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {project.team_name || 'Tanpa tim'}
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
