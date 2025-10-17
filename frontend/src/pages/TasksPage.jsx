import { useState, useEffect } from 'react'
import { Plus, CheckSquare, Filter, Search } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import { projectsAPI, tasksAPI } from '../services/api'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [viewMode, setViewMode] = useState('kanban') // kanban or list
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        setLoading(true)
        
        // First get all projects
        const projectsResponse = await projectsAPI.getUserProjects()
        const projects = projectsResponse.data.data || []
        
        // Then get all tasks from all projects
        const allTasks = []
        for (const project of projects) {
          try {
            const tasksResponse = await tasksAPI.getProjectTasks(project.id)
            const projectTasks = tasksResponse.data.data || []
            
            // Add project info to each task
            const tasksWithProject = projectTasks.map(task => ({
              ...task,
              project_name: project.name,
              project_id: project.id
            }))
            
            allTasks.push(...tasksWithProject)
          } catch (error) {
            console.error(`Error fetching tasks for project ${project.id}:`, error)
          }
        }
        
        setTasks(allTasks)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllTasks()
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tugas</h1>
          <p className="mt-2 text-gray-600">
            Kelola dan pantau tugas dalam proyek Anda.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Buat Tugas
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari tugas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada tugas</h3>
          <p className="text-gray-500 mb-6">
            Buat tugas pertama Anda untuk mulai mengorganisir pekerjaan.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Buat Tugas Pertama
          </Button>
        </div>
      ) : (
        <div>
          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Group tasks by status */}
              {['To Do', 'In Progress', 'Review', 'Done'].map((status) => {
                const statusTasks = tasks.filter(task => {
                  const statusName = task.status_name || 'To Do'
                  return statusName === status
                })
                
                return (
                  <div key={status} className="bg-gray-100 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">{status}</h3>
                    <div className="space-y-3">
                      {statusTasks.map((task) => (
                        <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{task.title}</h4>
                          <p className="text-xs text-gray-500 mb-2">{task.project_name}</p>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority || 'low'}
                            </span>
                            {task.due_date && (
                              <span>{new Date(task.due_date).toLocaleDateString('id-ID')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-500">{task.project_name}</p>
                        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority || 'low'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {task.status_name || 'To Do'}
                        </span>
                        {task.due_date && (
                          <span className="text-sm text-gray-400">
                            {new Date(task.due_date).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
