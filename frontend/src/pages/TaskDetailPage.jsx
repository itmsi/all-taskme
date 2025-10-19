import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Paperclip, 
  Send, 
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
  Trash2
} from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import { tasksAPI, usersAPI } from '../services/api'
import { useSocket } from '../contexts/SocketContext'

// Simple Text Editor Component
function TextEditor({ value, onChange, placeholder = "Tulis deskripsi task..." }) {
  const textareaRef = useRef(null)

  const handleInput = (e) => {
    onChange(e.target.value)
    // Auto resize
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        className="w-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={6}
        style={{ minHeight: '150px' }}
      />
    </div>
  )
}

// File Upload Component
function FileUpload({ files, onFilesChange, onFileRemove }) {
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files)
    onFilesChange([...files, ...newFiles])
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">File Attachments</h4>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add File
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => onFileRemove(index)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Member Assignment Component
function MemberAssignment({ members, assignedMembers, onMemberToggle, availableUsers }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = availableUsers.filter(user => 
    !assignedMembers.some(member => member.id === user.id) &&
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Assigned Members</h4>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {assignedMembers.length > 0 && (
        <div className="space-y-2">
          {assignedMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {member.full_name?.charAt(0) || member.username?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.full_name || member.username}</p>
                  <p className="text-xs text-gray-500">@{member.username}</p>
                </div>
              </div>
              <button
                onClick={() => onMemberToggle(member)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showDropdown && (
        <div className="border border-gray-300 rounded-lg p-3 bg-white shadow-lg">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-3"
          />
          <div className="max-h-40 overflow-y-auto space-y-2">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  onMemberToggle(user)
                  setShowDropdown(false)
                  setSearchTerm('')
                }}
                className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg text-left"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.full_name?.charAt(0) || user.username?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.full_name || user.username}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Chat Component
function TaskChat({ taskId, messages, onSendMessage, currentUser }) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage('')
    }
  }

  return (
    <div className="flex flex-col h-96 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900">Task Discussion</h4>
        <MessageSquare className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.user_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.user_id === currentUser?.id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.user_id === currentUser?.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState({})
  const [files, setFiles] = useState([])
  const [assignedMembers, setAssignedMembers] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setLoading(true)
        
        const [taskResponse, usersResponse, commentsResponse] = await Promise.all([
          tasksAPI.getTaskById(id),
          usersAPI.getUsers(),
          tasksAPI.getTaskComments(id)
        ])
        
        const taskData = taskResponse.data.data
        setTask(taskData)
        setEditedTask({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          due_date: taskData.due_date ? taskData.due_date.split('T')[0] : '',
          estimated_hours: taskData.estimated_hours || ''
        })
        setAssignedMembers(taskData.members || [])
        setAvailableUsers(usersResponse.data.data || [])
        setMessages(commentsResponse.data.data.comments || [])
        
        // Get current user from localStorage
        const token = localStorage.getItem('token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          setCurrentUser({ id: payload.userId })
        }
      } catch (error) {
        console.error('Error fetching task data:', error)
        navigate('/tasks')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchTaskData()
    }
  }, [id, navigate])

  // Socket connection for real-time chat
  useEffect(() => {
    if (socket && isConnected && id) {
      // Join task room
      socket.emit('join-task-room', id)
      
      // Listen for new messages
      socket.on('task-message', (message) => {
        setMessages(prev => [...prev, message])
      })

      // Listen for task updates
      socket.on('task-updated', (updatedTask) => {
        if (updatedTask.id === id) {
          setTask(updatedTask)
        }
      })

      return () => {
        socket.emit('leave-task-room', id)
        socket.off('task-message')
        socket.off('task-updated')
      }
    }
  }, [socket, isConnected, id])

  const handleSave = async () => {
    try {
      const response = await tasksAPI.updateTask(id, editedTask)
      setTask(response.data.data)
      setIsEditing(false)
      
      // Emit task update via socket
      if (socket && isConnected) {
        socket.emit('task-update', { id, task: response.data.data })
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleMemberToggle = async (member) => {
    try {
      const isAssigned = assignedMembers.some(m => m.id === member.id)
      
      if (isAssigned) {
        // Remove member
        await tasksAPI.removeTaskMember(id, member.id)
        setAssignedMembers(prev => prev.filter(m => m.id !== member.id))
      } else {
        // Add member
        await tasksAPI.addTaskMember(id, { user_id: member.id })
        setAssignedMembers(prev => [...prev, member])
      }
    } catch (error) {
      console.error('Error updating task members:', error)
    }
  }

  const handleSendMessage = async (content) => {
    try {
      const response = await tasksAPI.createTaskComment(id, { message: content })
      const newMessage = response.data.data
      
      setMessages(prev => [...prev, newMessage])
      
      // Emit via socket for real-time updates
      if (socket && isConnected) {
        socket.emit('task-message', newMessage)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
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

  if (!task) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Task tidak ditemukan</h3>
          <p className="text-gray-500 mb-6">
            Task yang Anda cari tidak ada atau Anda tidak memiliki akses.
          </p>
          <Button onClick={() => navigate('/tasks')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Tasks
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/tasks')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              {getStatusIcon(task.status_name)}
              <span className="text-sm text-gray-500">{task.status_name || 'To Do'}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority || 'low'}
              </span>
            </div>
            {isEditing ? (
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
                className="text-2xl font-bold"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              {isEditing ? (
                <TextEditor
                  value={editedTask.description || ''}
                  onChange={(value) => setEditedTask(prev => ({ ...prev, description: value }))}
                  placeholder="Tulis deskripsi task..."
                />
              ) : (
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {task.description || 'No description provided.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* File Attachments */}
          <div className="card">
            <div className="card-body">
              <FileUpload
                files={files}
                onFilesChange={setFiles}
                onFileRemove={(index) => setFiles(prev => prev.filter((_, i) => i !== index))}
              />
            </div>
          </div>

          {/* Chat */}
          <div className="card">
            <div className="card-body">
              <TaskChat
                taskId={id}
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  {isEditing ? (
                    <select
                      value={editedTask.priority}
                      onChange={(e) => setEditedTask(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'low'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedTask.due_date}
                      onChange={(e) => setEditedTask(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID') : 'No due date'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedTask.estimated_hours}
                      onChange={(e) => setEditedTask(prev => ({ ...prev, estimated_hours: e.target.value }))}
                      placeholder="0"
                    />
                  ) : (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {task.estimated_hours ? `${task.estimated_hours}h` : 'Not estimated'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <div className="text-sm text-blue-600 font-medium">
                    {task.project_name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <div className="text-sm text-gray-600">
                    {task.created_by_name || task.created_by_username}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Members */}
          <div className="card">
            <div className="card-body">
              <MemberAssignment
                members={assignedMembers}
                assignedMembers={assignedMembers}
                onMemberToggle={handleMemberToggle}
                availableUsers={availableUsers}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
