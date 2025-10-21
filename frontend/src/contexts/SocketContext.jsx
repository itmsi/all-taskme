import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9561/api'
      // For production, use the API domain directly for socket.io
      const socketUrl = apiUrl.includes('api-taskme.motorsights.com') 
        ? 'https://api-taskme.motorsights.com'
        : apiUrl.replace('/api', '') || 'http://localhost:9561'
      
      console.log('Connecting to socket:', socketUrl)
      const newSocket = io(socketUrl, {
        auth: {
          token
        },
        transports: ['polling', 'websocket']
      })

      newSocket.on('connect', () => {
        setIsConnected(true)
        console.log('Socket connected:', newSocket.id)
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
        console.log('Socket disconnected')
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [user, token])

  // Join user's notification room when connected
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('join_notifications')
    }
  }, [socket, isConnected])

  const joinTaskRoom = (taskId) => {
    if (socket && isConnected) {
      socket.emit('join_task', taskId)
    }
  }

  const leaveTaskRoom = (taskId) => {
    if (socket && isConnected) {
      socket.emit('leave_task', taskId)
    }
  }

  const sendMessage = (taskId, message) => {
    if (socket && isConnected) {
      socket.emit('send_message', { taskId, message })
    }
  }

  const sendTaskAssignment = (taskId, assignedUserId) => {
    if (socket && isConnected) {
      socket.emit('task_assigned', { taskId, assignedUserId })
    }
  }

  const onNewMessage = (callback) => {
    if (socket) {
      socket.on('new_message', callback)
      return () => socket.off('new_message', callback)
    }
  }

  const onNotification = (callback) => {
    if (socket) {
      socket.on('notification', callback)
      return () => socket.off('notification', callback)
    }
  }

  const onJoinedTask = (callback) => {
    if (socket) {
      socket.on('joined_task', callback)
      return () => socket.off('joined_task', callback)
    }
  }

  const onLeftTask = (callback) => {
    if (socket) {
      socket.on('left_task', callback)
      return () => socket.off('left_task', callback)
    }
  }

  const onJoinedNotifications = (callback) => {
    if (socket) {
      socket.on('joined_notifications', callback)
      return () => socket.off('joined_notifications', callback)
    }
  }

  const onError = (callback) => {
    if (socket) {
      socket.on('error', callback)
      return () => socket.off('error', callback)
    }
  }

  const value = {
    socket,
    isConnected,
    joinTaskRoom,
    leaveTaskRoom,
    sendMessage,
    sendTaskAssignment,
    onNewMessage,
    onNotification,
    onJoinedTask,
    onLeftTask,
    onJoinedNotifications,
    onError
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
