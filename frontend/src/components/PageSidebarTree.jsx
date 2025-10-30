import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, MoreVertical, Folder } from 'lucide-react'
import Button from './Button'
import { pagesAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

function TreeNode({ node, level = 0, onCreateChild, onRename, onDelete, onMove }) {
  const [expanded, setExpanded] = useState(level === 0)
  const [dragOver, setDragOver] = useState(false)
  const navigate = useNavigate()
  const hasChildren = (node.children || []).length > 0

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/x-page-id', node.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    const draggedId = e.dataTransfer.getData('application/x-page-id')
    if (!draggedId || draggedId === node.id) return
    onMove(draggedId, node.id)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer ${dragOver ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`}>
        <button
          className="mr-1 text-gray-500"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="w-4 inline-block" />}
        </button>
        <Folder size={16} className="text-blue-500 mr-2" />
        <span className="text-sm text-gray-800 flex-1" onClick={() => navigate(`/page/${node.slug}`)}>
          {node.title}
        </span>
        <div className="flex items-center gap-1">
          <button title="Tambah subpage" onClick={() => onCreateChild(node)} className="p-1 hover:bg-gray-200 rounded">
            <Plus size={14} className="text-gray-600" />
          </button>
          <button title="Opsi" onClick={() => onRename(node)} className="p-1 hover:bg-gray-200 rounded">
            <MoreVertical size={14} className="text-gray-600" />
          </button>
          <button title="Hapus" onClick={() => onDelete(node)} className="p-1 hover:bg-gray-200 rounded text-red-600">
            ✕
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div className="ml-4">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} level={level + 1} onCreateChild={onCreateChild} onRename={onRename} onDelete={onDelete} onMove={onMove} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PageSidebarTree() {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTree = async () => {
    try {
      setLoading(true)
      const res = await pagesAPI.getTree()
      setTree(res.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async (draggedId, newParentId) => {
    if (!draggedId) return
    await pagesAPI.update(draggedId, { parent_page_id: newParentId })
    fetchTree()
  }

  const handleDropToRoot = async (e) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('application/x-page-id')
    if (!draggedId) return
    await pagesAPI.update(draggedId, { parent_page_id: null })
    fetchTree()
  }

  useEffect(() => {
    fetchTree()
  }, [])

  const handleCreateRoot = async () => {
    const title = prompt('Judul halaman baru')
    if (!title) return
    await pagesAPI.create({ title })
    fetchTree()
  }

  const handleCreateChild = async (node) => {
    const title = prompt(`Judul subpage di dalam "${node.title}"`)
    if (!title) return
    await pagesAPI.create({ title, parent_page_id: node.id })
    fetchTree()
  }

  const handleRename = async (node) => {
    const title = prompt('Ganti judul', node.title)
    if (!title || title === node.title) return
    await pagesAPI.update(node.id, { title })
    fetchTree()
  }

  const handleDelete = async (node) => {
    if (!confirm(`Hapus halaman "${node.title}"? Subpage juga akan ikut terhapus.`)) return
    await pagesAPI.remove(node.id)
    fetchTree()
  }

  if (loading) {
    return (
      <div className="p-3 text-sm text-gray-500">Memuat halaman…</div>
    )
  }

  return (
    <div className="h-full flex flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropToRoot}
    >
      <div className="flex items-center justify-between px-2 py-2 border-b bg-white">
        <div className="text-sm font-medium text-gray-800">Pages</div>
        <Button size="sm" onClick={handleCreateRoot}>
          <Plus size={14} className="mr-1" /> Baru
        </Button>
      </div>
      <div className="p-2 overflow-auto">
        {tree.length === 0 ? (
          <div className="text-sm text-gray-500">Belum ada halaman. Klik "Baru" untuk membuat.</div>
        ) : (
          tree.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              onCreateChild={handleCreateChild}
              onRename={handleRename}
              onDelete={handleDelete}
              onMove={handleMove}
            />
          ))
        )}
      </div>
    </div>
  )
}


