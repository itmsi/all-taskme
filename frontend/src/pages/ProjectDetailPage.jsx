import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  CheckSquare, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle
} from 'lucide-react'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import TaskModal from '../components/TaskModal'
import { projectsAPI, tasksAPI } from '../services/api'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true)
        
        const [projectResponse, tasksResponse, statusesResponse] = await Promise.all([
          projectsAPI.getProjectById(id),
          tasksAPI.getProjectTasks(id),
          tasksAPI.getTaskStatuses(id)
        ])
        
        setProject(projectResponse.data.data)
        setTasks(tasksResponse.data.data || [])
        setStatuses(statusesResponse.data.data || [])
      } catch (error) {
        console.error('Error fetching project data:', error)
        // Redirect to projects page if project not found
        navigate('/projects')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProjectData()
    }
  }, [id, navigate])

  const handleCreateTask = () => {
    setSelectedTask(null)
    setIsTaskModalOpen(true)
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  const handleTaskModalSuccess = () => {
    // Refetch tasks
    const fetchTasks = async () => {
      try {
        const response = await tasksAPI.getProjectTasks(id)
        setTasks(response.data.data || [])
      } catch (error) {
        console.error('Error fetching tasks:', error)
      }
    }
    fetchTasks()
  }

  const getStatusIcon = (statusName) => {
    switch (statusName?.toLowerCase()) {
      case 'todo':
      case 'to do':
        return <Circle className="h-4 w-4 text-gray-400" />
      case 'in progress':
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'review':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'done':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Proyek tidak ditemukan</h3>
          <p className="text-gray-500 mb-6">
            Proyek yang Anda cari tidak ada atau Anda tidak memiliki akses.
          </p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Proyek
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-2 text-gray-600">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Tugas
          </Button>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Proyek</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
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
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tim</span>
                <span className="font-medium">{project.team_name || 'Tanpa tim'}</span>
              </div>
              {project.end_date && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Deadline</span>
                  <span className="font-medium">
                    {new Date(project.end_date).toLocaleDateString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Tugas</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total Tugas</span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Selesai</span>
                <span className="font-medium text-green-600">
                  {tasks.filter(task => task.status_name?.toLowerCase() === 'done' || task.status_name?.toLowerCase() === 'completed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Dalam Progress</span>
                <span className="font-medium text-blue-600">
                  {tasks.filter(task => task.status_name?.toLowerCase() === 'in progress' || task.status_name?.toLowerCase() === 'in_progress').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Belum Dimulai</span>
                <span className="font-medium text-gray-600">
                  {tasks.filter(task => task.status_name?.toLowerCase() === 'todo' || task.status_name?.toLowerCase() === 'to do').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Bar</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Progress Proyek</span>
                <span className="text-gray-900">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tugas Proyek</h3>
            <Button size="sm" onClick={handleCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Tugas Baru
            </Button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Belum ada tugas</h4>
              <p className="text-gray-500 mb-6">
                Buat tugas pertama untuk proyek ini.
              </p>
              <Button onClick={handleCreateTask}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Tugas Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(task.status_name)}
                      <span className="text-sm text-gray-500">{task.status_name || 'To Do'}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'low'}
                    </span>
                    
                    {task.due_date && (
                      <span className="text-sm text-gray-500">
                        {new Date(task.due_date).toLocaleDateString('id-ID')}
                      </span>
                    )}
                    
                    {task.estimated_hours && (
                      <span className="text-sm text-gray-500">
                        {task.estimated_hours}h
                      </span>
                    )}
                    
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        onSuccess={handleTaskModalSuccess}
        projectId={id}
      />
    </div>
  )
}
