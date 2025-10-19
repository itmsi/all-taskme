import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
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
  Trash2,
  Eye,
  Grid3X3
} from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import ImagePreviewModal from '../components/ImagePreviewModal'
import RichTextEditor from '../components/RichTextEditor'
import { tasksAPI, usersAPI } from '../services/api'
import { useSocket } from '../contexts/SocketContext'

// File Upload Component
function FileUpload({ taskId, attachments, onUpload, onDelete }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [imageLoadingStates, setImageLoadingStates] = useState({})
  const [imageUrls, setImageUrls] = useState({})

  const getImageUrl = async (attachmentId) => {
    if (imageUrls[attachmentId]) {
      return imageUrls[attachmentId]
    }

    try {
      const response = await tasksAPI.previewAttachment(taskId, attachmentId)
      const blob = response.data
      const url = URL.createObjectURL(blob)
      setImageUrls(prev => ({ ...prev, [attachmentId]: url }))
      return url
    } catch (error) {
      console.error('Error loading image:', error)
      throw error
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('attachments', file)
      })

      await onUpload(formData)
      // Clear input
      fileInputRef.current.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      alert('Gagal upload file. Silakan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-green-600" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-600" />
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-600" />
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileText className="h-4 w-4 text-green-600" />
    } else {
      return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const handleDownload = async (attachment) => {
    try {
      const response = await tasksAPI.downloadAttachment(taskId, attachment.id)
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.original_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Gagal download file. Silakan coba lagi.')
    }
  }

  const isImage = (mimeType) => mimeType.startsWith('image/')

  const imageAttachments = useMemo(() => {
    return attachments.filter(attachment => isImage(attachment.mime_type))
  }, [attachments])

  const imagesForModal = useMemo(() => {
    const images = imageAttachments.map(img => ({
      url: imageUrls[img.id] || `/api/tasks/${taskId}/attachments/${img.id}/preview`,
      name: img.original_name
    }))
    console.log('Images for modal:', images)
    return images
  }, [imageAttachments, taskId, imageUrls])

  const handleImagePreview = useCallback((attachment) => {
    const index = imageAttachments.findIndex(img => img.id === attachment.id)
    setCurrentImageIndex(index)
    setPreviewModalOpen(true)
  }, [imageAttachments])

  const handleClosePreview = () => {
    setPreviewModalOpen(false)
  }

  const handleImageIndexChange = (index) => {
    setCurrentImageIndex(index)
  }

  const handleImageLoad = async (attachmentId) => {
    try {
      console.log('Loading image for attachment:', attachmentId)
      setImageLoadingStates(prev => ({ ...prev, [attachmentId]: 'loading' }))
      await getImageUrl(attachmentId)
      console.log('Image loaded successfully for attachment:', attachmentId)
      setImageLoadingStates(prev => ({ ...prev, [attachmentId]: 'loaded' }))
    } catch (error) {
      console.error('Image load error for attachment:', attachmentId, error)
      setImageLoadingStates(prev => ({ ...prev, [attachmentId]: 'error' }))
    }
  }

  const handleImageError = (attachmentId) => {
    console.error('Image load error for attachment:', attachmentId)
    setImageLoadingStates(prev => ({ ...prev, [attachmentId]: 'error' }))
  }

  const handleImagePreviewWithIndex = useCallback((attachment, index) => {
    setCurrentImageIndex(index)
    setPreviewModalOpen(true)
  }, [])

  // Load images when attachments change
  useEffect(() => {
    imageAttachments.forEach(attachment => {
      if (!imageUrls[attachment.id] && imageLoadingStates[attachment.id] !== 'loading') {
        handleImageLoad(attachment.id)
      }
    })
  }, [imageAttachments, imageUrls, imageLoadingStates])

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [imageUrls])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900">File Attachments</h4>
            {attachments.length > 0 && (
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <span>{attachments.length} files</span>
                {imageAttachments.length > 0 && (
                  <span>{imageAttachments.length} images</span>
                )}
                <span>
                  {formatFileSize(attachments.reduce((total, att) => total + att.file_size, 0))} total
                </span>
              </div>
            )}
          </div>
          {attachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="List View"
              >
                <FileText className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Plus className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading...' : 'Add File'}
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip"
      />

      {attachments.length > 0 && (
        <>
          {viewMode === 'list' ? (
            <>
              <div className="space-y-3">
                {attachments.map((attachment) => (
                <div key={attachment.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getFileIcon(attachment.mime_type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.original_name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                        <p className="text-xs text-gray-400">
                          Uploaded by {attachment.uploaded_by_name || attachment.uploaded_by_username}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(attachment.uploaded_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isImage(attachment.mime_type) && (
                        <button
                          onClick={() => handleImagePreview(attachment)}
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Preview Image"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(attachment.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Image Thumbnail */}
                  {isImage(attachment.mime_type) && (
                    <div className="mt-3">
                      <div className="relative">
                        {imageLoadingStates[attachment.id] !== 'loaded' && imageLoadingStates[attachment.id] !== 'error' && (
                          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                        <img
                          src={imageUrls[attachment.id] || ''}
                          alt={attachment.original_name}
                          className={`max-w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity ${
                            imageLoadingStates[attachment.id] === 'loaded' ? 'opacity-100' : 'opacity-0'
                          }`}
                          onClick={() => handleImagePreview(attachment)}
                          onLoad={() => {
                            console.log('Image loaded:', attachment.id)
                          }}
                          onError={(e) => {
                            console.error('Image error:', attachment.id, e)
                            handleImageError(attachment.id)
                          }}
                        />
                        {imageLoadingStates[attachment.id] === 'error' && (
                          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <Image className="h-6 w-6 mx-auto mb-1" />
                              <p className="text-xs">Failed to load</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </div>
              <ImageGallery 
                imageAttachments={imageAttachments}
                taskId={taskId}
                imageLoadingStates={imageLoadingStates}
                imageUrls={imageUrls}
                onImageLoad={handleImageLoad}
                onImageError={handleImageError}
                onImagePreview={handleImagePreviewWithIndex}
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {isImage(attachment.mime_type) ? (
                      <div className="relative group">
                        {imageLoadingStates[attachment.id] !== 'loaded' && imageLoadingStates[attachment.id] !== 'error' && (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                        <img
                          src={imageUrls[attachment.id] || ''}
                          alt={attachment.original_name}
                          className={`w-full h-32 object-cover cursor-pointer hover:opacity-80 transition-opacity ${
                            imageLoadingStates[attachment.id] === 'loaded' ? 'opacity-100' : 'opacity-0'
                          }`}
                          onClick={() => handleImagePreview(attachment)}
                          onLoad={() => handleImageLoad(attachment.id)}
                          onError={() => handleImageError(attachment.id)}
                        />
                        {imageLoadingStates[attachment.id] === 'error' && (
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <Image className="h-6 w-6 mx-auto mb-1" />
                              <p className="text-xs">Failed to load</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleImagePreview(attachment)
                              }}
                              className="p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100"
                              title="Preview"
                            >
                              <Eye className="h-4 w-4 text-gray-700" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(attachment)
                              }}
                              className="p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100"
                              title="Download"
                            >
                              <Download className="h-4 w-4 text-gray-700" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(attachment.id)
                              }}
                              className="p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 text-center">
                        <div className="p-2 bg-gray-100 rounded-lg mx-auto mb-2 w-fit">
                          {getFileIcon(attachment.mime_type)}
                        </div>
                        <p className="text-xs font-medium text-gray-900 truncate">{attachment.original_name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                      </div>
                    )}
                    
                    {/* File Info */}
                    <div className="p-2 bg-gray-50">
                      <p className="text-xs font-medium text-gray-900 truncate" title={attachment.original_name}>
                        {attachment.original_name}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                      {!isImage(attachment.mime_type) && (
                        <div className="flex justify-center space-x-1 mt-2">
                          <button
                            onClick={() => handleDownload(attachment)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Download"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onDelete(attachment.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
              ))}
              </div>
              <ImageGallery 
                imageAttachments={imageAttachments}
                taskId={taskId}
                imageLoadingStates={imageLoadingStates}
                imageUrls={imageUrls}
                onImageLoad={handleImageLoad}
                onImageError={handleImageError}
                onImagePreview={handleImagePreviewWithIndex}
              />
            </>
          )}
        </>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={previewModalOpen}
        onClose={handleClosePreview}
        images={imagesForModal}
        currentIndex={currentImageIndex}
        onIndexChange={handleImageIndexChange}
      />
    </div>
  )
}

// Image Gallery Component
const ImageGallery = memo(function ImageGallery({ 
  imageAttachments, 
  taskId, 
  imageLoadingStates,
  imageUrls,
  onImageLoad, 
  onImageError, 
  onImagePreview 
}) {
  if (imageAttachments.length === 0) return null

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-medium text-gray-700">Image Gallery ({imageAttachments.length})</h5>
        <button
          onClick={() => onImagePreview(imageAttachments[0], 0)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          View All
        </button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {imageAttachments.slice(0, 8).map((attachment, index) => (
          <div
            key={attachment.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => onImagePreview(attachment, index)}
          >
            {imageLoadingStates[attachment.id] !== 'loaded' && imageLoadingStates[attachment.id] !== 'error' && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
            <img
              src={imageUrls[attachment.id] || ''}
              alt={attachment.original_name}
              className={`w-full h-full object-cover hover:scale-105 transition-transform duration-200 ${
                imageLoadingStates[attachment.id] === 'loaded' ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => onImageLoad(attachment.id)}
              onError={() => onImageError(attachment.id)}
            />
            {imageLoadingStates[attachment.id] === 'error' && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Image className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-xs">Failed</p>
                </div>
              </div>
            )}
            {index === 7 && imageAttachments.length > 8 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  +{imageAttachments.length - 8}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})

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
  const [attachments, setAttachments] = useState([])
  const [assignedMembers, setAssignedMembers] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setLoading(true)
        
        const [taskResponse, usersResponse, commentsResponse, attachmentsResponse] = await Promise.all([
          tasksAPI.getTaskById(id),
          usersAPI.getUsers(),
          tasksAPI.getTaskComments(id),
          tasksAPI.getTaskAttachments(id)
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
        setAvailableUsers(usersResponse.data.users || [])
        setMessages(commentsResponse.data.data.comments || [])
        setAttachments(attachmentsResponse.data.data || [])
        
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
      // Show user-friendly error message
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`)
      } else {
        alert('Terjadi kesalahan saat mengupdate task. Silakan coba lagi.')
      }
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
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`)
      } else {
        alert('Terjadi kesalahan saat mengupdate member. Silakan coba lagi.')
      }
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

  const handleUploadAttachment = async (formData) => {
    try {
      const response = await tasksAPI.uploadAttachments(id, formData)
      const newAttachments = response.data.data
      
      setAttachments(prev => [...newAttachments, ...prev])
    } catch (error) {
      console.error('Error uploading attachment:', error)
      throw error
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await tasksAPI.deleteAttachment(id, attachmentId)
      setAttachments(prev => prev.filter(att => att.id !== attachmentId))
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert('Gagal menghapus file. Silakan coba lagi.')
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
                <RichTextEditor
                  value={editedTask.description || ''}
                  onChange={(value) => setEditedTask(prev => ({ ...prev, description: value }))}
                  placeholder="Tulis deskripsi task..."
                  height="300px"
                />
              ) : (
                <div className="prose max-w-none">
                  <RichTextEditor
                    value={task.description || ''}
                    readOnly={true}
                    height="auto"
                    placeholder="No description provided."
                  />
                </div>
              )}
            </div>
          </div>

          {/* File Attachments */}
          <div className="card">
            <div className="card-body">
              <FileUpload
                taskId={id}
                attachments={attachments}
                onUpload={handleUploadAttachment}
                onDelete={handleDeleteAttachment}
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
