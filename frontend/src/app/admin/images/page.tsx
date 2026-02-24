'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  Upload, 
  Trash2, 
  Image as ImageIcon,
  Search,
  Grid3X3,
  List,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import { validateArrayData } from '@/utils/data-validation'

interface ImageItem {
  id: string
  filename: string
  original_filename: string
  file_size: number
  width: number
  height: number
  mime_type: string
  url: string
  thumbnail_url?: string
  created_at: string
  used_in_articles?: number
}

export default function ImagesPage() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const pageSize = 12

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * pageSize
      
      const data: any = await adminApi.images.list({
        skip,
        limit: pageSize
      })
      
      let filteredImages = validateArrayData<ImageItem>(data)
      
      if (searchQuery) {
        filteredImages = filteredImages.filter((img: ImageItem) => 
          img.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      setImages(filteredImages)
      setTotal(filteredImages.length)
    } catch (error) {
      console.error('Failed to fetch images:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    
    try {
      Array.from(files).forEach(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        await adminApi.images.upload(formData)
      })
      
      fetchImages()
      alert('图片上传成功')
    } catch (error) {
      console.error('Failed to upload images:', error)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (id: string) => {
    if (!confirm('确定要删除这张图片吗？此操作不可恢复。')) return
    
    try {
      await adminApi.images.delete(id)
      fetchImages()
    } catch (error) {
      console.error('Failed to delete image:', error)
      alert('删除失败，请重试')
    }
  }

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">图片管理</h1>
          <p className="text-gray-500 mt-1">管理媒体图片和文件</p>
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-tech-cyan text-white rounded-lg hover:bg-tech-cyan/90 transition-colors cursor-pointer">
          <Upload className="w-5 h-5" />
          {uploading ? '上传中...' : '上传图片'}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索图片..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-cyan/50"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'grid' 
                  ? "bg-tech-cyan text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              title="网格视图"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'list' 
                  ? "bg-tech-cyan text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              title="列表视图"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Images Grid/List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-cyan" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-300" />
            <p className="mt-4 text-gray-400">暂无图片</p>
            <label className="inline-block mt-4 text-tech-cyan hover:underline cursor-pointer">
              上传第一张图片
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image) => (
              <div 
                key={image.id} 
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.thumbnail_url || image.url}
                  alt={image.original_filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyUrl(image.url, image.id)
                      }}
                      className="p-2 bg-white rounded-lg text-gray-700 hover:text-tech-cyan transition-colors"
                      title="复制链接"
                    >
                      {copiedId === image.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteImage(image.id)
                      }}
                      className="p-2 bg-white rounded-lg text-gray-700 hover:text-red-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {image.used_in_articles ? (
                  <div className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-tech-cyan text-white rounded-full">
                    {image.used_in_articles} 篇
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">图片</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">文件名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">尺寸</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">大小</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">引用</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {images.map((image) => (
                  <tr key={image.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div 
                        className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image.thumbnail_url || image.url}
                          alt={image.original_filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{image.original_filename}</p>
                      <p className="text-sm text-gray-400">{image.mime_type}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {image.width} × {image.height}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatFileSize(image.file_size)}
                    </td>
                    <td className="px-4 py-3">
                      {image.used_in_articles ? (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {image.used_in_articles} 篇文章
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">未使用</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => copyUrl(image.url, image.id)}
                          className="p-2 text-gray-400 hover:text-tech-cyan hover:bg-gray-100 rounded-lg transition-colors"
                          title="复制链接"
                        >
                          {copiedId === image.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setSelectedImage(image)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteImage(image.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              共 {total} 张图片，第 {currentPage}/{totalPages} 页
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80"
            onClick={() => setSelectedImage(null)}
          />
          <div className="relative bg-white rounded-xl overflow-hidden max-w-4xl max-h-[90vh] w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium truncate pr-4">{selectedImage.original_filename}</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-8rem)]">
              <img
                src={selectedImage.url}
                alt={selectedImage.original_filename}
                className="max-w-full h-auto mx-auto rounded-lg"
              />
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">尺寸</p>
                  <p className="font-medium">{selectedImage.width} × {selectedImage.height}</p>
                </div>
                <div>
                  <p className="text-gray-500">大小</p>
                  <p className="font-medium">{formatFileSize(selectedImage.file_size)}</p>
                </div>
                <div>
                  <p className="text-gray-500">格式</p>
                  <p className="font-medium">{selectedImage.mime_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">上传时间</p>
                  <p className="font-medium">
                    {new Date(selectedImage.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => copyUrl(selectedImage.url, selectedImage.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-tech-cyan text-white rounded-lg hover:bg-tech-cyan/90 transition-colors"
                >
                  {copiedId === selectedImage.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedId === selectedImage.id ? '已复制' : '复制链接'}
                </button>
                <button
                  onClick={() => {
                    deleteImage(selectedImage.id)
                    setSelectedImage(null)
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
