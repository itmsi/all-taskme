import { useState, useEffect } from 'react'
import { X, CheckSquare, Calendar, User, AlertCircle } from 'lucide-react'
import Button from './Button'
import Input from './Input'
import LocationInput from './LocationInput'
import { tasksAPI, projectsAPI, usersAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function TaskModal({ isOpen, onClose, task = null, projectId = null, onSuccess }) {
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
    location_address: ''
  })
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [statuses, setStatuses] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectId)

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          title: task.title || '',
          description: task.description || '',
          priority: task.priority || 'medium',
          due_date: task.due_date ? task.due_date.split('T')[0] : '',
          estimated_hours: task.estimated_hours || '',
          assigned_to: task.assigned_to || [],
          status_id: task.status_id || '',
          location_name: task.location_name || '',
          location_latitude: task.location_latitude || '',
          location_longitude: task.location_longitude || '',
          location_address: task.location_address || ''
        })
        setSelectedProjectId(task.project_id || projectId)
      } else {
        setFormData({
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
          location_address: ''
        })
        setSelectedProjectId(projectId)
      }
      fetchProjects()
      fetchUsers()
    }
  }, [isOpen, task, projectId])

  useEffect(() => {
    if (selectedProjectId) {
      fetchTaskStatuses(selectedProjectId)
    }
  }, [selectedProjectId])

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getUserProjects()
      setProjects(response.data.data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getUsers()
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchTaskStatuses = async (projectId) => {
    try {
      const response = await tasksAPI.getTaskStatuses(projectId)
      setStatuses(response.data.statuses || [])
    } catch (error) {
      console.error('Error fetching task statuses:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null
      }

      if (task) {
        await tasksAPI.updateTask(task.id, submitData)
        toast.success('Tugas berhasil diupdate!')
      } else {
        await tasksAPI.createTask(selectedProjectId, submitData)
        toast.success('Tugas berhasil dibuat!')
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(task ? 'Gagal mengupdate tugas' : 'Gagal membuat tugas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return

    setLoading(true)
    try {
      await tasksAPI.deleteTask(task.id)
      toast.success('Tugas berhasil dihapus!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Gagal menghapus tugas')
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <CheckSquare className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              {task ? 'Edit Tugas' : 'Buat Tugas Baru'}
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
                Judul Tugas *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul tugas"
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
                placeholder="Masukkan deskripsi tugas"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {!projectId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proyek *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Pilih proyek</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Prioritas
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimasi Jam
                </label>
                <Input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, status_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih status</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Ditetapkan Kepada
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={formData.assigned_to.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {user.full_name} ({user.username})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div>
              {task && (
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
                disabled={loading || !formData.title.trim() || !selectedProjectId}
              >
                {loading ? 'Menyimpan...' : (task ? 'Update' : 'Buat')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
