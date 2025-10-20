import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, GripVertical, Palette } from 'lucide-react'
import Button from './Button'
import Input from './Input'
import { tasksAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function TaskStatusManager({ projectId, isOpen, onClose, onSuccess }) {
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingStatus, setEditingStatus] = useState(null)
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: '#6B7280',
    position: 0
  })

  const defaultColors = [
    '#6B7280', // Gray
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
  ]

  useEffect(() => {
    if (isOpen && projectId) {
      fetchStatuses()
    }
  }, [isOpen, projectId])

  const fetchStatuses = async () => {
    try {
      setLoading(true)
      const response = await tasksAPI.getTaskStatuses(projectId)
      setStatuses(response.data.data || [])
    } catch (error) {
      console.error('Error fetching task statuses:', error)
      toast.error('Gagal mengambil status task')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStatus = async () => {
    if (!newStatus.name.trim()) {
      toast.error('Nama status tidak boleh kosong')
      return
    }

    try {
      setLoading(true)
      const statusData = {
        name: newStatus.name,
        color: newStatus.color,
        position: statuses.length
      }
      
      await tasksAPI.createTaskStatus(projectId, statusData)
      toast.success('Status berhasil dibuat!')
      setNewStatus({ name: '', color: '#6B7280', position: 0 })
      fetchStatuses()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating status:', error)
      toast.error('Gagal membuat status')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (statusId, updatedData) => {
    try {
      setLoading(true)
      await tasksAPI.updateTaskStatus(statusId, updatedData)
      toast.success('Status berhasil diupdate!')
      setEditingStatus(null)
      fetchStatuses()
      onSuccess?.()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Gagal mengupdate status')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStatus = async (statusId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus status ini?')) return

    try {
      setLoading(true)
      await tasksAPI.deleteTaskStatus(statusId)
      toast.success('Status berhasil dihapus!')
      fetchStatuses()
      onSuccess?.()
    } catch (error) {
      console.error('Error deleting status:', error)
      toast.error('Gagal menghapus status')
    } finally {
      setLoading(false)
    }
  }

  const handleColorChange = (statusId, color) => {
    if (editingStatus === statusId) {
      const status = statuses.find(s => s.id === statusId)
      handleUpdateStatus(statusId, { ...status, color })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Kelola Status Task
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Add New Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Tambah Status Baru</h3>
            <div className="flex items-center space-x-3">
              <Input
                type="text"
                value={newStatus.name}
                onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                placeholder="Nama status (contoh: In Progress)"
                className="flex-1"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Button
                  onClick={handleCreateStatus}
                  disabled={loading || !newStatus.name.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
            </div>
          </div>

          {/* Status List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Status yang Tersedia</h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : statuses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Palette className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Belum ada status task</p>
                <p className="text-sm">Tambahkan status pertama untuk project ini</p>
              </div>
            ) : (
              statuses.map((status, index) => (
                <div key={status.id} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  
                  <div className="flex-1">
                    {editingStatus === status.id ? (
                      <div className="flex items-center space-x-3">
                        <Input
                          type="text"
                          value={status.name}
                          onChange={(e) => {
                            const updatedStatuses = statuses.map(s => 
                              s.id === status.id ? { ...s, name: e.target.value } : s
                            )
                            setStatuses(updatedStatuses)
                          }}
                          className="flex-1"
                        />
                        <div className="flex items-center space-x-1">
                          {defaultColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleColorChange(status.id, color)}
                              className={`w-6 h-6 rounded border-2 ${
                                status.color === color ? 'border-gray-800' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(status.id, status)}
                          disabled={loading}
                        >
                          Simpan
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingStatus(null)
                            fetchStatuses() // Reset changes
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="font-medium text-gray-900">{status.name}</span>
                        <span className="text-xs text-gray-500">Posisi {index + 1}</span>
                      </div>
                    )}
                  </div>

                  {editingStatus !== status.id && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingStatus(status.id)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStatus(status.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Default Statuses Suggestion */}
          {statuses.length === 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Saran Status Default:</h4>
              <div className="flex flex-wrap gap-2">
                {['To Do', 'In Progress', 'Review', 'Done'].map((statusName, index) => (
                  <button
                    key={statusName}
                    onClick={() => {
                      setNewStatus({
                        name: statusName,
                        color: defaultColors[index % defaultColors.length],
                        position: index
                      })
                    }}
                    className="px-3 py-1 text-xs bg-white border border-blue-200 rounded-full text-blue-700 hover:bg-blue-100"
                  >
                    {statusName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t">
          <Button onClick={onClose} variant="secondary">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
