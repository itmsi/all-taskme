import { useState, useEffect } from 'react'
import { Users, FolderOpen, CheckSquare, TrendingUp } from 'lucide-react'
import { teamsAPI, projectsAPI, analyticsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function DashboardPage() {
  const [stats, setStats] = useState([
    {
      name: 'Total Tim',
      value: '0',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Proyek',
      value: '0',
      icon: FolderOpen,
      color: 'bg-green-500'
    },
    {
      name: 'Total Tugas',
      value: '0',
      icon: CheckSquare,
      color: 'bg-yellow-500'
    },
    {
      name: 'Progress',
      value: '0%',
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch teams, projects, and dashboard analytics in parallel
        const [teamsResponse, projectsResponse, analyticsResponse] = await Promise.all([
          teamsAPI.getUserTeams(),
          projectsAPI.getUserProjects(),
          analyticsAPI.getDashboardAnalytics()
        ])

        const teams = teamsResponse.data.teams || []
        const projects = projectsResponse.data.data || []
        const analytics = analyticsResponse.data.data || {}
        
        // Calculate average progress from projects
        const totalProgress = projects.reduce((sum, project) => sum + (project.progress || 0), 0)
        const avgProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0

        setStats([
          {
            name: 'Total Tim',
            value: teams.length.toString(),
            icon: Users,
            color: 'bg-blue-500'
          },
          {
            name: 'Total Proyek',
            value: projects.length.toString(),
            icon: FolderOpen,
            color: 'bg-green-500'
          },
          {
            name: 'Total Tugas',
            value: analytics.task_overview?.total_tasks_assigned?.toString() || '0',
            icon: CheckSquare,
            color: 'bg-yellow-500'
          },
          {
            name: 'Progress',
            value: `${avgProgress}%`,
            icon: TrendingUp,
            color: 'bg-purple-500'
          }
        ])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Selamat datang di TaskMe! Kelola proyek dan tugas tim Anda dengan mudah.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Aksi Cepat</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium">Buat Tim Baru</p>
                    <p className="text-sm text-gray-500">Kelola anggota dan proyek tim</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <FolderOpen className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium">Buat Proyek Baru</p>
                    <p className="text-sm text-gray-500">Mulai proyek baru dengan tim Anda</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Aktivitas Terbaru</h3>
          </div>
          <div className="card-body">
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada aktivitas</p>
              <p className="text-sm text-gray-400">Mulai buat tim dan proyek untuk melihat aktivitas di sini</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
