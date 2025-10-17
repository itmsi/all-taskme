import { useState, useEffect, useMemo } from 'react'
import { Plus, CheckSquare, Filter, Search, Edit, Trash2 } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import SkeletonLoader from '../components/SkeletonLoader'
import TaskModal from '../components/TaskModal'
import SimpleKanbanBoard from '../components/SimpleKanbanBoard'
import { useDebounce } from '../hooks/useDebounce'
import { useApiCache } from '../hooks/useApiCache'
import { projectsAPI, tasksAPI } from '../services/api'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [viewMode, setViewMode] = useState('kanban') // kanban or list
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [projectStatuses, setProjectStatuses] = useState({}) // projectId -> statuses
  
  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Use cached API calls
  const { data: projects, loading: projectsLoading, refresh: refreshProjects } = useApiCache(
    'user-projects',
    () => projectsAPI.getUserProjects().then(res => res.data.data || []),
    []
  )

  // Fetch tasks and statuses for all projects
  useEffect(() => {
    const fetchAllTasks = async () => {
      if (!projects || projects.length === 0) return

      try {
        setLoading(true)
        
        // Batch all API calls
        const promises = projects.map(async (project) => {
          try {
            const [tasksResponse, statusesResponse] = await Promise.all([
              tasksAPI.getProjectTasks(project.id),
              tasksAPI.getTaskStatuses(project.id)
            ])
            
            const projectTasks = tasksResponse.data.data || []
            const projectStatuses = statusesResponse.data.data || [] // Backend returns data, not statuses
            
            return {
              project,
              tasks: projectTasks.map(task => ({
                ...task,
                project_name: project.name,
                project_id: project.id
              })),
              statuses: projectStatuses
            }
          } catch (error) {
            console.error(`Error fetching data for project ${project.id}:`, error)
            return { project, tasks: [], statuses: [] }
          }
        })

        const results = await Promise.all(promises)
        
        // Combine all tasks
        const allTasks = results.flatMap(result => result.tasks)
        
        // Combine all statuses by project
        const statusesMap = {}
        results.forEach(result => {
          statusesMap[result.project.id] = result.statuses
        })
        
        setProjectStatuses(statusesMap)
        setTasks(allTasks)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllTasks()
  }, [projects])

  const handleCreateTask = () => {
    setSelectedTask(null)
    setIsModalOpen(true)
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    // Refresh projects cache and tasks
    refreshProjects()
    // The useEffect will automatically refetch tasks when projects change
  }

  const handleTaskMove = async (taskId, newStatusId, newStatusName) => {
    try {
      // Optimistically update the UI
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status_id: newStatusId, status_name: newStatusName }
            : task
        )
      )

      // Call API to update status
      await tasksAPI.updateTaskStatusKanban(taskId, newStatusId)
      
      console.log(`Task ${taskId} moved to status ${newStatusName}`)
    } catch (error) {
      console.error('Error moving task:', error)
      
      // Revert optimistic update on error
      // In a real app, you might want to show a toast notification
      refreshProjects()
    }
  }

  const handleTaskReorder = async (projectId, reorderedTasks) => {
    try {
      // Prepare tasks with new positions
      const tasksWithPositions = reorderedTasks.map((task, index) => ({
        id: task.id,
        position: index
      }))

      // Call API to update order
      await tasksAPI.updateTaskOrder(projectId, tasksWithPositions)
      
      console.log(`Tasks reordered in project ${projectId}`)
    } catch (error) {
      console.error('Error reordering tasks:', error)
      
      // Revert on error
      refreshProjects()
    }
  }

  // Filter tasks based on debounced search term
  const filteredTasks = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return tasks
    
    return tasks.filter(task => 
      task.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      task.project_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
  }, [tasks, debouncedSearchTerm])

  if (projectsLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <SkeletonLoader type="kanban" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tugas</h1>
            <p className="mt-2 text-gray-600">
              Kelola dan pantau tugas dalam proyek Anda.
            </p>
          </div>
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Tugas
          </Button>
        </div>
        <SkeletonLoader type="kanban" />
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
        <Button onClick={handleCreateTask}>
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

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada tugas</h3>
          <p className="text-gray-500 mb-6">
            Buat tugas pertama Anda untuk mulai mengorganisir pekerjaan.
          </p>
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Tugas Pertama
          </Button>
        </div>
      ) : (
        <div>
          {viewMode === 'kanban' ? (
            <SimpleKanbanBoard
              projects={projects}
              tasks={filteredTasks}
              statuses={projectStatuses}
              onEditTask={handleEditTask}
              onTaskMove={handleTaskMove}
              loading={loading}
            />
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
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

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
