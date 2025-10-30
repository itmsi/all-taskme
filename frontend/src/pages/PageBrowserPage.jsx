import { useState } from 'react'
import PageSidebarTree from '../components/PageSidebarTree'
import { pagesAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function PageBrowserPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const doSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await pagesAPI.search(q)
      setResults(res.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-4 xl:col-span-3 bg-white border rounded h-[calc(100vh-200px)] overflow-hidden">
        <PageSidebarTree />
      </div>
      <div className="col-span-12 lg:col-span-8 xl:col-span-9">
        <form onSubmit={doSearch} className="flex items-center gap-2 mb-4">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Cari halaman (judul/konten)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm" disabled={loading}>
            {loading ? 'Mencari…' : 'Cari'}
          </button>
        </form>

        {results.length > 0 ? (
          <div className="bg-white border rounded">
            <ul>
              {results.map((r) => (
                <li key={r.id} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/page/${r.slug}`)}>
                  <div className="text-sm font-medium text-gray-900">{r.title}</div>
                  <div className="text-xs text-gray-500">/{r.slug}</div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="h-[calc(100vh-260px)] flex items-center justify-center text-gray-500">
            Masukkan kata kunci untuk mencari, atau pilih dari sidebar.
          </div>
        )}
      </div>
    </div>
  )
}


