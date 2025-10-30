import { useEffect, useState } from 'react'
import { pagesAPI } from '../services/api'
import { useRef } from 'react'
import Button from './Button'

export default function PageEditor({ pageId }) {
  const fileInputRef = useRef(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newEmbedUrl, setNewEmbedUrl] = useState('')
  const [newTodoText, setNewTodoText] = useState('')

  const loadBlocks = async () => {
    try {
      setLoading(true)
      const res = await pagesAPI.getBlocks(pageId)
      setBlocks(res.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pageId) loadBlocks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId])

  const addTextBlock = async () => {
    const text = newText.trim()
    if (!text) return
    await pagesAPI.createBlock(pageId, { type: 'text', content: { text } })
    setNewText('')
    loadBlocks()
  }

  const addImageBlock = async () => {
    const url = newImageUrl.trim()
    if (!url) return
    await pagesAPI.createBlock(pageId, { type: 'image', content: { url, alt: '' } })
    setNewImageUrl('')
    loadBlocks()
  }

  const addEmbedBlock = async () => {
    const url = newEmbedUrl.trim()
    if (!url) return
    await pagesAPI.createBlock(pageId, { type: 'embed', content: { url } })
    setNewEmbedUrl('')
    loadBlocks()
  }

  const addTodoBlock = async () => {
    const text = newTodoText.trim()
    if (!text) return
    await pagesAPI.createBlock(pageId, { type: 'todo', content: { items: [{ text, checked: false }] } })
    setNewTodoText('')
    loadBlocks()
  }

  const uploadImageBlock = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    await pagesAPI.uploadBlockImage(pageId, fd)
    if (fileInputRef.current) fileInputRef.current.value = ''
    loadBlocks()
  }

  const updateText = async (blockId, text) => {
    await pagesAPI.updateBlock(blockId, { content: { text } })
    loadBlocks()
  }

  const updateImage = async (blockId, content) => {
    await pagesAPI.updateBlock(blockId, { content })
    loadBlocks()
  }

  const updateEmbed = async (blockId, url) => {
    await pagesAPI.updateBlock(blockId, { content: { url } })
    loadBlocks()
  }

  const updateTodoItems = async (blockId, items) => {
    await pagesAPI.updateBlock(blockId, { content: { items } })
    loadBlocks()
  }

  const removeBlock = async (blockId) => {
    await pagesAPI.deleteBlock(blockId)
    loadBlocks()
  }

  if (loading) return <div className="text-sm text-gray-500">Memuat konten…</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Tulis teks lalu klik Tambah Teks"
          />
          <Button size="sm" onClick={addTextBlock}>Tambah Teks</Button>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Tempel URL gambar lalu klik Tambah Gambar"
          />
          <Button size="sm" onClick={addImageBlock}>Tambah Gambar</Button>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="flex-1 border rounded px-3 py-2 text-sm"
            onChange={uploadImageBlock}
          />
          <span className="text-xs text-gray-500">Upload Gambar</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            value={newEmbedUrl}
            onChange={(e) => setNewEmbedUrl(e.target.value)}
            placeholder="Tempel URL untuk embed (YouTube, dsb.)"
          />
          <Button size="sm" onClick={addEmbedBlock}>Tambah Embed</Button>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Tulis item checklist lalu klik Tambah Todo"
          />
          <Button size="sm" onClick={addTodoBlock}>Tambah Todo</Button>
        </div>
      </div>

      {blocks.length === 0 && (
        <div className="text-sm text-gray-500">Belum ada blok. Tambahkan blok teks pertama Anda.</div>
      )}

      <BlockList blocks={blocks} setBlocks={setBlocks} onReorder={async (newOrder) => {
        await pagesAPI.reorderBlocks(pageId, newOrder)
        loadBlocks()
      }}>
        {blocks.map((b) => (
          <div key={b.id} data-block-id={b.id} className="bg-white border rounded p-3">
            {b.type === 'text' && (
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                defaultValue={b.content?.text || ''}
                onBlur={(e) => updateText(b.id, e.target.value)}
                rows={3}
              />
            )}

            {b.type === 'image' && (
              <div className="space-y-2">
                <img src={b.content?.url} alt={b.content?.alt || ''} className="max-h-64 rounded border" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    className="border rounded px-3 py-2 text-sm"
                    defaultValue={b.content?.url || ''}
                    placeholder="Image URL"
                    onBlur={(e) => updateImage(b.id, { ...b.content, url: e.target.value })}
                  />
                  <input
                    className="border rounded px-3 py-2 text-sm"
                    defaultValue={b.content?.alt || ''}
                    placeholder="Alt text"
                    onBlur={(e) => updateImage(b.id, { ...b.content, alt: e.target.value })}
                  />
                </div>
              </div>
            )}

            {b.type === 'embed' && (
              <div className="space-y-2">
                <EmbedPreview url={b.content?.url} />
                <input
                  className="border rounded px-3 py-2 text-sm w-full"
                  defaultValue={b.content?.url || ''}
                  placeholder="Embed URL"
                  onBlur={(e) => updateEmbed(b.id, e.target.value)}
                />
              </div>
            )}

            {b.type === 'todo' && (
              <div className="space-y-2">
                <ChecklistProgress items={Array.isArray(b.content?.items) ? b.content.items : []} />
                <TodoEditor block={b} onChange={(items) => updateTodoItems(b.id, items)} />
              </div>
            )}

            {!(b.type === 'text' || b.type === 'image' || b.type === 'embed' || b.type === 'todo') && (
              <pre className="text-xs text-gray-500">{JSON.stringify(b.content, null, 2)}</pre>
            )}

            <div className="text-right mt-2">
              <button className="text-xs text-red-600" onClick={() => removeBlock(b.id)}>Hapus</button>
            </div>
          </div>
        ))}
      </BlockList>
    </div>
  )
}

function TodoEditor({ block, onChange }) {
  const items = Array.isArray(block.content?.items) ? block.content.items : []

  const toggle = (idx) => {
    const next = items.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it)
    onChange(next)
  }

  const editText = (idx, text) => {
    const next = items.map((it, i) => i === idx ? { ...it, text } : it)
    onChange(next)
  }

  const add = () => {
    const next = [...items, { text: 'Item baru', checked: false }]
    onChange(next)
  }

  const remove = (idx) => {
    const next = items.filter((_, i) => i !== idx)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <div className="text-sm text-gray-500">Belum ada item.</div>
      )}
      <ul className="space-y-1">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <input type="checkbox" checked={!!it.checked} onChange={() => toggle(idx)} />
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              defaultValue={it.text}
              onBlur={(e) => editText(idx, e.target.value)}
            />
            <button className="text-xs text-red-600" onClick={() => remove(idx)}>Hapus</button>
          </li>
        ))}
      </ul>
      <div>
        <button className="text-xs text-blue-600" onClick={add}>+ Tambah item</button>
      </div>
    </div>
  )
}

function ChecklistProgress({ items }) {
  const total = Array.isArray(items) ? items.length : 0
  const done = Array.isArray(items) ? items.filter(it => it.checked).length : 0
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-xs text-gray-600">
        <span>Checklist</span>
        <span>{done}/{total} ({percent}%)</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded">
        <div className="h-2 bg-green-500 rounded" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function EmbedPreview({ url }) {
  if (!url) return null
  const yt = parseYouTube(url)
  if (yt) {
    const src = `https://www.youtube.com/embed/${yt}`
    return (
      <div className="aspect-video w-full">
        <iframe className="w-full h-full rounded" src={src} title="YouTube video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      </div>
    )
  }
  // TODO: bisa ditambah provider lain (Twitter, Vimeo, dsb.)
  return (
    <a className="text-blue-600 text-sm break-all" href={url} target="_blank" rel="noreferrer">{url}</a>
  )
}

function parseYouTube(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v')
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.replace('/', '')
    }
  } catch {}
  return null
}

function BlockList({ blocks, setBlocks, onReorder, children }) {
  const handleDragStart = (e) => {
    const target = e.target.closest('[data-block-id]')
    if (!target) return
    e.dataTransfer.setData('text/block-id', target.getAttribute('data-block-id'))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/block-id')
    const dropTarget = e.target.closest('[data-block-id]')
    if (!draggedId || !dropTarget) return
    const dropId = dropTarget.getAttribute('data-block-id')
    if (draggedId === dropId) return
    const current = [...blocks]
    const draggedIdx = current.findIndex(b => b.id === draggedId)
    const dropIdx = current.findIndex(b => b.id === dropId)
    if (draggedIdx === -1 || dropIdx === -1) return
    const [moved] = current.splice(draggedIdx, 1)
    current.splice(dropIdx, 0, moved)
    setBlocks(current)
    await onReorder(current.map(b => b.id))
  }

  return (
    <div className="space-y-3" onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}>
      {children}
    </div>
  )
}


