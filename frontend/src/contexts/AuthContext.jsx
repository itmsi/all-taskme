import { createContext, useContext, useReducer, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
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
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      }
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      }
    case 'LOGOUT':
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

  // Check if user is logged in on app start
  useEffect(() => {
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

    checkAuth()
  }, [])

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
