import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, GripVertical } from 'lucide-react'

// Task Item Component
function TaskItem({ task, onEdit }) {
  const navigate = useNavigate()
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', JSON.stringify({
      taskId: task.id,
      taskData: task
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={`bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-gray-100 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight">{task.title}</h4>
        <div className="flex items-center space-x-1 ml-2">
          <div className="p-1 text-gray-300 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-3 w-3" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/tasks/${task.id}`)
            }}
            className="p-1 text-gray-400 hover:text-blue-600"
          >
            <Edit className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {task.priority || 'low'}
        </span>
        
        <div className="flex items-center space-x-2 text-gray-400">
          {task.due_date && (
            <span className="text-xs">
              {new Date(task.due_date).toLocaleDateString('id-ID')}
            </span>
          )}
          {task.estimated_hours && (
            <span className="text-xs">
              {task.estimated_hours}h
            </span>
          )}
        </div>
      </div>

      {/* Project indicator */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <span className="text-xs text-blue-600 font-medium">{task.project_name}</span>
      </div>
    </div>
  )
}

// Status Column Component
function StatusColumn({ status, tasks, onEdit, onTaskMove }) {
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      const { taskId, taskData } = data
      
      // Check if task is being moved to a different status
      if (taskData.status_id !== status.id) {
        onTaskMove(taskId, status.id, status.name)
      }
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }

  return (
    <div
      className={`bg-gray-50 rounded-lg p-4 min-h-[400px] flex flex-col transition-colors ${
        dragOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center mb-4">
        <div
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: status.color }}
        />
        <h4 className="font-medium text-gray-900 text-sm flex-1">{status.name}</h4>
        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div className="space-y-3 flex-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onEdit={onEdit}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">📋</span>
            </div>
            {dragOver ? 'Lepaskan di sini' : 'Tidak ada tugas'}
          </div>
        )}
      </div>
    </div>
  )
}

// Main Simple Kanban Board Component
export default function SimpleKanbanBoard({ 
  projects, 
  tasks, 
  statuses, 
  onEditTask, 
  onTaskMove,
  loading = false 
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-3 h-20"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Check if we have data to render
  if (!statuses || Object.keys(statuses).length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada status</h3>
          <p className="text-gray-500">
            Buat proyek dan status terlebih dahulu untuk melihat kanban board.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(statuses).map(([projectId, projectStatuses]) => {
        const projectTasks = tasks.filter(task => task.project_id === projectId)
        const projectName = projectTasks.length > 0 ? projectTasks[0].project_name : 'Unknown Project'
        
        return (
          <div key={projectId} className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">{projectName}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {projectStatuses.map((status) => {
                const statusTasks = projectTasks.filter(task => {
                  const statusName = task.status_name || status.name
                  return statusName === status.name
                })
                
                return (
                  <StatusColumn
                    key={status.id}
                    status={status}
                    tasks={statusTasks}
                    onEdit={onEditTask}
                    onTaskMove={onTaskMove}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
