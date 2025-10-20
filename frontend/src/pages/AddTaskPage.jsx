import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  X, 
  Plus, 
  Users, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  MessageSquare,
  FileText,
  Image,
  Download,
  Trash2,
  Eye,
  Grid3X3,
  Phone,
  Building,
  MapPin,
  Camera,
  Mic,
  CheckCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import RichTextEditor from '../components/RichTextEditor'
import LocationInput from '../components/LocationInput'
import TaskExtensionsModal from '../components/TaskExtensionsModal'
import { tasksAPI, projectsAPI, usersAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function AddTaskPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get project info from location state if coming from project detail page
  const projectFromState = location.state?.project
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    assigned_to: [],
    status_id: '',
    location_name: '',
    location_latitude: '',
    location_longitude: '',
    location_address: '',
    // Task extensions fields
    number_phone: '',
    sales_name: '',
    name_pt: '',
    iup: '',
    latitude: '',
    longitude: '',
    photo_link: '',
    count_photo: 0,
    voice_link: '',
    count_voice: 0,
    voice_transcript: '',
    is_completed: false
  })
  
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [statuses, setStatuses] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || projectFromState?.id || '')
  const [showExtensions, setShowExtensions] = useState(false)
  const [extensionsModalOpen, setExtensionsModalOpen] = useState(false)
  const [taskExtensions, setTaskExtensions] = useState(null)

  // Check if we're coming from project detail page
  const isFromProjectDetail = Boolean(projectId || projectFromState)

  useEffect(() => {
    fetchProjects()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      console.log('Selected project ID changed:', selectedProjectId)
      fetchTaskStatuses(selectedProjectId)
    } else {
      console.log('No project selected, clearing statuses')
      setStatuses([])
    }
  }, [selectedProjectId])

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getUserProjects()
      setProjects(response.data.data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Gagal memuat daftar proyek')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getUsers()
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Gagal memuat daftar pengguna')
    }
  }

  const fetchTaskStatuses = async (projectId) => {
    try {
      console.log('Fetching task statuses for project:', projectId)
      const response = await tasksAPI.getTaskStatuses(projectId)
      console.log('Task statuses response:', response.data)
      setStatuses(response.data.data || [])
    } catch (error) {
      console.error('Error fetching task statuses:', error)
      toast.error('Gagal memuat daftar status')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        due_date: formData.due_date || null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        status_id: formData.status_id || null,
        assigned_to: formData.assigned_to,
        location_name: formData.location_name || null,
        location_latitude: formData.location_latitude ? parseFloat(formData.location_latitude) : null,
        location_longitude: formData.location_longitude ? parseFloat(formData.location_longitude) : null,
        location_address: formData.location_address || null
      }

      // Include task extensions fields directly in the main data
      if (taskExtensions) {
        submitData.number_phone = taskExtensions.number_phone || null
        submitData.sales_name = taskExtensions.sales_name || null
        submitData.name_pt = taskExtensions.name_pt || null
        submitData.iup = taskExtensions.iup || null
        submitData.latitude = taskExtensions.latitude ? parseFloat(taskExtensions.latitude) : null
        submitData.longitude = taskExtensions.longitude ? parseFloat(taskExtensions.longitude) : null
        submitData.photo_link = taskExtensions.photo_link || null
        submitData.count_photo = parseInt(taskExtensions.count_photo) || 0
        submitData.voice_link = taskExtensions.voice_link || null
        submitData.count_voice = parseInt(taskExtensions.count_voice) || 0
        submitData.voice_transcript = taskExtensions.voice_transcript || null
        submitData.is_completed = taskExtensions.is_completed || false
      }

      console.log('Submitting task data:', submitData)
      console.log('Project ID:', selectedProjectId)
      
      const response = await tasksAPI.createTask(selectedProjectId, submitData)
      toast.success('Tugas berhasil dibuat!')
      
      // Navigate to the created task detail page
      navigate(`/tasks/${response.data.data.id}`)
    } catch (error) {
      console.error('Error creating task:', error)
      if (error.response?.data?.message) {
        toast.error(`Error: ${error.response.data.message}`)
      } else {
        toast.error('Gagal membuat tugas. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUserToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(userId)
        ? prev.assigned_to.filter(id => id !== userId)
        : [...prev.assigned_to, userId]
    }))
  }

  const handleLocationChange = (locationData) => {
    setFormData(prev => ({
      ...prev,
      location_name: locationData?.name || '',
      location_latitude: locationData?.latitude || '',
      location_longitude: locationData?.longitude || '',
      location_address: locationData?.address || ''
    }))
  }

  const handleSaveExtensions = async (extensionsData) => {
    try {
      setTaskExtensions(extensionsData)
      setExtensionsModalOpen(false)
    } catch (error) {
      console.error('Error saving task extensions:', error)
      throw error
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (isFromProjectDetail && projectFromState) {
                navigate(`/projects/${projectFromState.id}`)
              } else {
                navigate('/tasks')
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buat Tugas Baru</h1>
            {isFromProjectDetail && projectFromState && (
              <p className="text-sm text-gray-600 mt-1">
                Untuk proyek: <span className="font-medium text-blue-600">{projectFromState.name}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !selectedProjectId}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dasar</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Judul Tugas *
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Masukkan judul tugas"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deskripsi
                    </label>
                    <RichTextEditor
                      value={formData.description || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      placeholder="Tulis deskripsi tugas..."
                      height="200px"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Project Selection */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Proyek</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Proyek *
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isFromProjectDetail}
                  >
                    <option value="">Pilih proyek</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {isFromProjectDetail && (
                    <p className="text-sm text-gray-500 mt-1">
                      Proyek sudah dipilih dari halaman detail proyek
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Tugas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Prioritas
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Rendah</option>
                      <option value="medium">Sedang</option>
                      <option value="high">Tinggi</option>
                      <option value="urgent">Mendesak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Deadline
                    </label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimasi Jam
                    </label>
                    <Input
                      type="number"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, status_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Pilih status ({statuses.length} tersedia)</option>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                    {statuses.length === 0 && selectedProjectId && (
                      <p className="text-sm text-yellow-600 mt-1">
                        Belum ada status untuk project ini. Silakan buat status terlebih dahulu.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokasi</h3>
                <LocationInput
                  value={formData.location_name || formData.location_latitude ? {
                    name: formData.location_name,
                    latitude: formData.location_latitude,
                    longitude: formData.location_longitude,
                    address: formData.location_address
                  } : null}
                  onChange={handleLocationChange}
                />
              </div>
            </div>

            {/* Assigned Members */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Users className="h-5 w-5 inline mr-2" />
                  Ditetapkan Kepada
                </h3>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Memuat daftar pengguna...</p>
                  ) : (
                    <div className="space-y-2">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.assigned_to.includes(user.id)}
                            onChange={() => handleUserToggle(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.full_name?.charAt(0) || user.username?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.full_name || user.username}
                              </p>
                              <p className="text-xs text-gray-500">@{user.username}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Preview */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Circle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">To Do</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                      {formData.priority}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formData.title || 'Judul tugas akan muncul di sini'}
                  </div>
                  {formData.due_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(formData.due_date).toLocaleDateString('id-ID')}
                    </div>
                  )}
                  {formData.estimated_hours && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {formData.estimated_hours}h
                    </div>
                  )}
                  {formData.location_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {formData.location_name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Task Extensions */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Task Extensions</h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setExtensionsModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </div>
                
                {taskExtensions ? (
                  <div className="space-y-2 text-sm">
                    {taskExtensions.number_phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {taskExtensions.number_phone}
                      </div>
                    )}
                    {taskExtensions.sales_name && (
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {taskExtensions.sales_name}
                      </div>
                    )}
                    {taskExtensions.name_pt && (
                      <div className="flex items-center text-gray-600">
                        <Building className="h-4 w-4 mr-2" />
                        {taskExtensions.name_pt}
                      </div>
                    )}
                    {taskExtensions.photo_link && (
                      <div className="flex items-center text-gray-600">
                        <Camera className="h-4 w-4 mr-2" />
                        {taskExtensions.count_photo} foto
                      </div>
                    )}
                    {taskExtensions.voice_link && (
                      <div className="flex items-center text-gray-600">
                        <Mic className="h-4 w-4 mr-2" />
                        {taskExtensions.count_voice} voice
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Belum ada extensions</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Task Extensions Modal */}
      <TaskExtensionsModal
        isOpen={extensionsModalOpen}
        onClose={() => setExtensionsModalOpen(false)}
        taskId={null} // null for new task
        initialData={taskExtensions}
        onSave={handleSaveExtensions}
      />
    </div>
  )
}
