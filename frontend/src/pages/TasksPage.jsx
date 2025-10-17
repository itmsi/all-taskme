import { useState } from 'react'
import { Plus, CheckSquare, Filter, Search } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'

export default function TasksPage() {
  const [tasks] = useState([])
  const [viewMode, setViewMode] = useState('kanban') // kanban or list
  const [searchTerm, setSearchTerm] = useState('')

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
              {/* Kanban columns will be implemented here */}
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">To Do</h3>
                <div className="space-y-3">
                  {/* Task cards will be rendered here */}
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">In Progress</h3>
                <div className="space-y-3">
                  {/* Task cards will be rendered here */}
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Review</h3>
                <div className="space-y-3">
                  {/* Task cards will be rendered here */}
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Done</h3>
                <div className="space-y-3">
                  {/* Task cards will be rendered here */}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="space-y-4">
                  {/* Task list will be rendered here */}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
