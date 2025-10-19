import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { api } from '../services/api'

const AuthContext = createContext()

// Check if we have cached user data
const getCachedUserData = () => {
  try {
    const cached = localStorage.getItem('userData')
    if (cached) {
      const { user, timestamp } = JSON.parse(cached)
      // Cache valid for 1 hour
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return user
      }
    }
  } catch (error) {
    console.error('Error parsing cached user data:', error)
  }
  return null
}

const initialState = {
  user: getCachedUserData(),
  token: localStorage.getItem('token'),
  loading: !!localStorage.getItem('token') && !getCachedUserData(), // Only loading if we have token but no cached user
  error: null
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'AUTH_SUCCESS':
      // Cache user data
      try {
        localStorage.setItem('userData', JSON.stringify({
          user: action.payload.user,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.error('Error caching user data:', error)
      }
      
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      }
    case 'AUTH_ERROR':
      // Clear cached user data on error
      try {
        localStorage.removeItem('userData')
      } catch (error) {
        console.error('Error clearing cached user data:', error)
      }
      
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      }
    case 'LOGOUT':
      // Clear cached user data on logout
      try {
        localStorage.removeItem('userData')
      } catch (error) {
        console.error('Error clearing cached user data:', error)
      }
      
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const hasCheckedAuth = useRef(false) // Prevent duplicate auth checks

  // Set token in axios headers
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
      localStorage.setItem('token', state.token)
    } else {
      delete api.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
    }
  }, [state.token])

  // Check if user is logged in on app start - only run once
  useEffect(() => {
    // Prevent duplicate auth checks from StrictMode
    if (hasCheckedAuth.current) return
    hasCheckedAuth.current = true

    const checkAuth = async () => {
      if (state.token) {
        try {
          dispatch({ type: 'AUTH_START' })
          const response = await api.get('/auth/me')
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data.user,
              token: state.token
            }
          })
        } catch (error) {
          dispatch({ type: 'AUTH_ERROR', payload: 'Token tidak valid' })
        }
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: null })
      }
    }

    // Only check auth if we haven't loaded yet and have a token
    if (state.loading && state.token) {
      checkAuth()
    } else if (!state.token) {
      dispatch({ type: 'AUTH_ERROR', payload: null })
    }
  }, []) // Empty dependency array - only run once on mount

  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await api.post('/auth/login', credentials)
      const { token, user } = response.data
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login gagal'
      dispatch({ type: 'AUTH_ERROR', payload: message })
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await api.post('/auth/register', userData)
      const { token, user } = response.data
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registrasi gagal'
      dispatch({ type: 'AUTH_ERROR', payload: message })
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      if (state.token) {
        await api.post('/auth/logout')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      dispatch({ type: 'LOGOUT' })
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData)
      dispatch({ type: 'UPDATE_USER', payload: response.data.user })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Update profil gagal'
      return { success: false, error: message }
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await api.put('/auth/change-password', passwordData)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Ganti password gagal'
      return { success: false, error: message }
    }
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
