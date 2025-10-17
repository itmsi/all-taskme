import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Users, CheckSquare, Clock, AlertTriangle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { analyticsAPI, projectsAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get all projects
        const projectsResponse = await projectsAPI.getUserProjects()
        const projectsData = projectsResponse.data.data || []
        setProjects(projectsData)
        
        // If user is admin or has projects, get analytics for first project
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0].id)
          const analyticsResponse = await analyticsAPI.getProjectAnalytics(projectsData[0].id)
          setAnalytics(analyticsResponse.data.data)
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleProjectChange = async (projectId) => {
    try {
      setLoading(true)
      setSelectedProject(projectId)
      const response = await analyticsAPI.getProjectAnalytics(projectId)
      setAnalytics(response.data.data)
    } catch (error) {
      console.error('Error fetching project analytics:', error)
    } finally {
      setLoading(false)
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

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data analytics</h3>
          <p className="text-gray-500">Pilih proyek untuk melihat analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Analisis performa dan progress proyek Anda.
        </p>
      </div>

      {/* Project Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Proyek
        </label>
        <select
          value={selectedProject}
          onChange={(e) => handleProjectChange(e.target.value)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tugas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.task_statistics?.total_tasks || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tugas Selesai</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.task_statistics?.completed_tasks || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tugas Terlambat</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.task_statistics?.overdue_tasks || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Jam</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.task_statistics?.total_actual_hours || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Distribusi Status</h3>
          </div>
          <div className="card-body">
            {analytics.status_distribution && analytics.status_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.status_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status_name, count }) => `${status_name}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.status_distribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${props.payload.status_name}: ${value}`,
                      'Jumlah'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>Tidak ada data status untuk ditampilkan</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Distribusi Prioritas</h3>
          </div>
          <div className="card-body">
            {analytics.priority_distribution && analytics.priority_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.priority_distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="priority" 
                    tickFormatter={(value) => {
                      const priorityMap = {
                        'urgent': 'Urgent',
                        'high': 'High',
                        'medium': 'Medium',
                        'low': 'Low'
                      }
                      return priorityMap[value] || value
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, 'Jumlah']}
                    labelFormatter={(label) => {
                      const priorityMap = {
                        'urgent': 'Urgent',
                        'high': 'High',
                        'medium': 'Medium',
                        'low': 'Low'
                      }
                      return `Prioritas: ${priorityMap[label] || label}`
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>Tidak ada data prioritas untuk ditampilkan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collaborator Activity */}
      <div className="mt-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Aktivitas Kolaborator</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tugas Diberikan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tugas Selesai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Jam
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(analytics.collaborator_activity || []).map((collaborator) => (
                    <tr key={collaborator.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {collaborator.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {collaborator.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{collaborator.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {collaborator.tasks_assigned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {collaborator.tasks_completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {collaborator.total_hours_worked}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
