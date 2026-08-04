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
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import { validateArrayData } from '@/utils/data-validation'
import { useToast } from '@/components/admin/Toast'
import DataTable, { type Column } from '@/components/ui/DataTable'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '确认操作',
    description: '',
    onConfirm: () => {},
  })
  const { success, error } = useToast()
  const pageSize = 12

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * pageSize
      
      const data = await adminApi.images.list({
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
    if (!files || files.length === 0) {return}

    setUploading(true)

    try {
      await Promise.all(
        Array.from(files).map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          await adminApi.images.upload(formData)
        })
      )

      fetchImages()
      success('图片上传成功')
    } catch (uploadError) {
      console.error('Failed to upload images:', uploadError)
      error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除图片',
      description: '确定要删除这张图片吗？此操作不可恢复。',
      onConfirm: async () => {
        try {
          await adminApi.images.delete(id)
          fetchImages()
        } catch (deleteError) {
          console.error('Failed to delete image:', deleteError)
          error('删除失败，请重试')
        }
      },
    })
  }

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {return '0 Bytes'}
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalPages = Math.ceil(total / pageSize)

  /* DataTable 列定义（list 视图）：单元格内容与原手写表格一致，
     顺带把裸调色板色收敛为语义 token（info / success / primary / destructive） */
  const imageColumns: Column<ImageItem>[] = [
    {
      key: 'thumbnail_url',
      title: '图片',
      width: 80,
      render: (_v, image) => (
        <div
          className="relative w-12 h-12 rounded-lg bg-foreground/5 overflow-hidden cursor-pointer"
          onClick={() => setSelectedImage(image)}
        >
          <Image
            src={image.thumbnail_url || image.url}
            alt={image.original_filename}
            width={48}
            height={48}
            className="object-cover"
          />
        </div>
      ),
    },
    {
      key: 'original_filename',
      title: '文件名',
      render: (_v, image) => (
        <>
          <p className="font-medium text-foreground">{image.original_filename}</p>
          <p className="text-sm text-muted-foreground">{image.mime_type}</p>
        </>
      ),
    },
    {
      key: 'width',
      title: '尺寸',
      cellClassName: 'text-muted-foreground',
      render: (_v, image) => <>{image.width} × {image.height}</>,
    },
    {
      key: 'file_size',
      title: '大小',
      cellClassName: 'text-muted-foreground',
      render: (_v, image) => <>{formatFileSize(image.file_size)}</>,
    },
    {
      key: 'used_in_articles',
      title: '引用',
      render: (_v, image) => (image.used_in_articles ? (
        <span className="px-2 py-0.5 text-xs bg-info/15 text-info rounded-full">
          {image.used_in_articles} 篇文章
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">未使用</span>
      )),
    },
    {
      key: 'actions',
      title: '操作',
      cellClassName: 'text-right',
      render: (_v, image) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => copyUrl(image.url, image.id)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-foreground/5 rounded-lg transition-colors"
            title="复制链接"
          >
            {copiedId === image.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setSelectedImage(image)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="查看"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteImage(image.id)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">图片管理</h1>
          <p className="text-muted-foreground mt-1">管理媒体图片和文件</p>
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-tech-cyan text-foreground rounded-lg hover:bg-tech-cyan/90 transition-colors cursor-pointer">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索图片..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tech-cyan/50"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'grid' 
                  ? "bg-tech-cyan text-foreground" 
                  : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
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
                  ? "bg-tech-cyan text-foreground" 
                  : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
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
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">暂无图片</p>
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
                className="group relative aspect-square rounded-xl overflow-hidden bg-foreground/5 cursor-pointer hover:shadow-lg transition-colors"
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  src={image.thumbnail_url || image.url}
                  alt={image.original_filename}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyUrl(image.url, image.id)
                      }}
                      className="p-2 bg-white rounded-lg text-foreground hover:text-tech-cyan transition-colors"
                      title="复制链接"
                    >
                      {copiedId === image.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteImage(image.id)
                      }}
                      className="p-2 bg-white rounded-lg text-foreground hover:text-destructive transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {image.used_in_articles ? (
                  <div className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-tech-cyan text-foreground rounded-full">
                    {image.used_in_articles} 篇
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          /* list 视图改用 DataTable 基座。
             pagination={false} —— 分页条在 grid/list 两个视图之外共用，
             交给 DataTable 会出现两套分页。toolbar={false} —— 本页已有自己的搜索框。 */
          <DataTable<ImageItem>
            data={images}
            keyField="id"
            toolbar={false}
            pagination={false}
            columns={imageColumns}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              共 {total} 张图片，第 {currentPage}/{totalPages} 页
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/5 transition-colors"
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="danger"
      />

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
                className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-8rem)]">
              <Image
                src={selectedImage.url}
                alt={selectedImage.original_filename}
                width={selectedImage.width}
                height={selectedImage.height}
                className="max-w-full h-auto mx-auto rounded-lg"
              />
            </div>
            <div className="p-4 border-t bg-foreground/5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">尺寸</p>
                  <p className="font-medium">{selectedImage.width} × {selectedImage.height}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">大小</p>
                  <p className="font-medium">{formatFileSize(selectedImage.file_size)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">格式</p>
                  <p className="font-medium">{selectedImage.mime_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">上传时间</p>
                  <p className="font-medium">
                    {new Date(selectedImage.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => copyUrl(selectedImage.url, selectedImage.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-tech-cyan text-foreground rounded-lg hover:bg-tech-cyan/90 transition-colors"
                >
                  {copiedId === selectedImage.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedId === selectedImage.id ? '已复制' : '复制链接'}
                </button>
                <button
                  onClick={() => {
                    deleteImage(selectedImage.id)
                    setSelectedImage(null)
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-destructive text-foreground rounded-lg hover:bg-destructive transition-colors"
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
