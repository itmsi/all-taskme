import { useState, useEffect } from 'react'
import { X, FolderOpen, Calendar, Users, Settings } from 'lucide-react'
import Button from './Button'
import Input from './Input'
import TaskStatusManager from './TaskStatusManager'
import { projectsAPI, teamsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ProjectModal({ isOpen, onClose, project = null, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_id: '',
    start_date: '',
    end_date: '',
    status: 'active'
  })
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState([])
  const [showStatusManager, setShowStatusManager] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setFormData({
          name: project.name || '',
          description: project.description || '',
          team_id: project.team_id || '',
          start_date: project.start_date ? project.start_date.split('T')[0] : '',
          end_date: project.end_date ? project.end_date.split('T')[0] : '',
          status: project.status || 'active'
        })
      } else {
        setFormData({
          name: '',
          description: '',
          team_id: '',
          start_date: '',
          end_date: '',
          status: 'active'
        })
      }
      fetchTeams()
    }
  }, [isOpen, project])

  const fetchTeams = async () => {
    try {
      const response = await teamsAPI.getUserTeams()
      setTeams(response.data.teams || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (project) {
        await projectsAPI.updateProject(project.id, formData)
        toast.success('Proyek berhasil diupdate!')
      } else {
        const response = await projectsAPI.createProject(formData)
        const newProject = response.data.data
        
        // Create default task statuses for new project
        await createDefaultTaskStatuses(newProject.id)
        
        toast.success('Proyek berhasil dibuat!')
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error(project ? 'Gagal mengupdate proyek' : 'Gagal membuat proyek')
    } finally {
      setLoading(false)
    }
  }

  const createDefaultTaskStatuses = async (projectId) => {
    const defaultStatuses = [
      { name: 'To Do', color: '#6B7280', position: 0 },
      { name: 'In Progress', color: '#3B82F6', position: 1 },
      { name: 'Review', color: '#F59E0B', position: 2 },
      { name: 'Done', color: '#10B981', position: 3 }
    ]

    try {
      for (const status of defaultStatuses) {
        await tasksAPI.createTaskStatus({
          ...status,
          project_id: projectId
        })
      }
    } catch (error) {
      console.error('Error creating default statuses:', error)
      // Don't show error to user as project was created successfully
    }
  }

  const handleDelete = async () => {
    if (!project) return
    
    if (!confirm('Apakah Anda yakin ingin menghapus proyek ini?')) return

    setLoading(true)
    try {
      await projectsAPI.deleteProject(project.id)
      toast.success('Proyek berhasil dihapus!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Gagal menghapus proyek')
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
            <FolderOpen className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              {project ? 'Edit Proyek' : 'Buat Proyek Baru'}
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
                Nama Proyek *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama proyek"
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
                placeholder="Masukkan deskripsi proyek"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Tim *
              </label>
              <select
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Pilih tim</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Tanggal Mulai
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Tanggal Selesai
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Aktif</option>
                <option value="completed">Selesai</option>
                <option value="on_hold">Ditunda</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            {/* Task Status Management */}
            {project && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Status Task</h4>
                    <p className="text-xs text-gray-500">Kelola status task untuk project ini</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowStatusManager(true)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Kelola Status
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div>
              {project && (
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
                disabled={loading || !formData.name.trim() || !formData.team_id}
              >
                {loading ? 'Menyimpan...' : (project ? 'Update' : 'Buat')}
              </Button>
            </div>
          </div>
        </form>

        <TaskStatusManager
          projectId={project?.id}
          isOpen={showStatusManager}
          onClose={() => setShowStatusManager(false)}
          onSuccess={() => {
            // Refresh project data if needed
          }}
        />
      </div>
    </div>
  )
}
