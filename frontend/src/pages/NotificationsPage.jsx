import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import Button from '../components/Button'
import { notificationsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getNotifications()
      setNotifications(response.data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Gagal mengambil notifikasi')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount()
      setUnreadCount(response.data.unread_count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const markAsRead = async (notificationId, isRead) => {
    try {
      await notificationsAPI.markAsRead(notificationId, isRead)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: isRead }
            : notif
        )
      )
      if (isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
        toast.success('Notifikasi ditandai sebagai dibaca')
      } else {
        setUnreadCount(prev => prev + 1)
        toast.success('Notifikasi ditandai sebagai belum dibaca')
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Gagal mengubah status notifikasi')
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      )
      setUnreadCount(0)
      toast.success('Semua notifikasi ditandai sebagai dibaca')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Gagal menandai semua notifikasi')
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId)
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      toast.success('Notifikasi dihapus')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Gagal menghapus notifikasi')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return '📋'
      case 'task_completed':
        return '✅'
      case 'project_updated':
        return '📁'
      case 'team_invitation':
        return '👥'
      case 'deadline_reminder':
        return '⏰'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'task_assigned':
        return 'bg-blue-100 text-blue-800'
      case 'task_completed':
        return 'bg-green-100 text-green-800'
      case 'project_updated':
        return 'bg-purple-100 text-purple-800'
      case 'team_invitation':
        return 'bg-yellow-100 text-yellow-800'
      case 'deadline_reminder':
        return 'bg-red-100 text-red-800'
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifikasi</h1>
          <p className="mt-2 text-gray-600">
            Kelola dan pantau semua notifikasi Anda.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="secondary">
            <CheckCheck className="h-4 w-4 mr-2" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <div className="mb-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <Bell className="h-4 w-4 mr-1" />
            {unreadCount} notifikasi belum dibaca
          </div>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada notifikasi</h3>
          <p className="text-gray-500">
            Anda akan menerima notifikasi di sini ketika ada aktivitas baru.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card ${!notification.is_read ? 'border-l-4 border-l-primary-600' : ''}`}
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getNotificationColor(notification.type)}`}>
                          {notification.type.replace('_', ' ')}
                        </span>
                        {!notification.is_read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            Baru
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.is_read ? (
                      <button
                        onClick={() => markAsRead(notification.id, true)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Tandai sebagai dibaca"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => markAsRead(notification.id, false)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Tandai sebagai belum dibaca"
                      >
                        <Bell className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Hapus notifikasi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
