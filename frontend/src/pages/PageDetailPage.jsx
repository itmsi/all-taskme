import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { pagesAPI } from '../services/api'
import PageSidebarTree from '../components/PageSidebarTree'
import PageEditor from '../components/PageEditor'
import Button from '../components/Button'

export default function PageDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await pagesAPI.getBySlug(slug)
        setPage(res.data.data)
      } catch (e) {
        navigate('/pages')
      } finally {
        setLoading(false)
      }
    }
    if (slug) load()
  }, [slug, navigate])

  if (loading) return <div className="p-6 text-sm text-gray-500">Memuat halaman…</div>
  if (!page) return null

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-4 xl:col-span-3 bg-white border rounded h-[calc(100vh-200px)] overflow-hidden">
        <PageSidebarTree />
      </div>
      <div className="col-span-12 lg:col-span-8 xl:col-span-9 bg-white border rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">{page.title}</h1>
          <div className="text-xs text-gray-400">/{page.slug}</div>
        </div>
        <PageEditor pageId={page.id} />
      </div>
    </div>
  )
}


