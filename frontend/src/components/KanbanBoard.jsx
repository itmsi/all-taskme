import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Edit, GripVertical } from 'lucide-react'

// Sortable Task Item Component
function SortableTaskItem({ task, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight">{task.title}</h4>
        <div className="flex items-center space-x-1 ml-2">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task)
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

// Sortable Status Column Component
function SortableStatusColumn({ status, tasks, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 rounded-lg p-4 min-h-[400px] flex flex-col"
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
      
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 flex-1">
          {tasks.map((task) => (
            <SortableTaskItem
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
              Tidak ada tugas
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// Main Kanban Board Component
export default function KanbanBoard({ 
  projects, 
  tasks, 
  statuses, 
  onEditTask, 
  onTaskMove,
  loading = false 
}) {
  const [activeId, setActiveId] = useState(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    // Check if task is being moved to a different status column
    const activeTask = tasks.find(task => task.id === active.id)
    const overColumn = over.id

    if (activeTask && overColumn !== activeTask.status_id) {
      // Find the status by ID
      const newStatus = Object.values(statuses).flat().find(status => status.id === overColumn)
      if (newStatus) {
        onTaskMove(activeTask.id, newStatus.id, newStatus.name)
      }
    }

    setActiveId(null)
  }

  const handleDragOver = (event) => {
    // This is where we can handle drag over events if needed
  }

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="space-y-6">
        {Object.entries(statuses).map(([projectId, projectStatuses]) => {
          const projectTasks = tasks.filter(task => task.project_id === projectId)
          const projectName = projectTasks.length > 0 ? projectTasks[0].project_name : 'Unknown Project'
          
          // Get all unique statuses across all projects for the header
          const allStatuses = Object.values(statuses).flat()
          const uniqueStatuses = allStatuses.filter((status, index, self) => 
            index === self.findIndex(s => s.id === status.id)
          )
          
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
                    <SortableStatusColumn
                      key={status.id}
                      status={status}
                      tasks={statusTasks}
                      onEdit={onEditTask}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="bg-white rounded-lg p-3 shadow-lg border border-gray-200 opacity-90">
            <h4 className="font-medium text-gray-900 text-sm">
              {tasks.find(task => task.id === activeId)?.title || 'Task'}
            </h4>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
