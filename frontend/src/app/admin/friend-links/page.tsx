'use client'

import { useEffect, useState, useCallback } from 'react'

import { motion, AnimatePresence } from '@/lib/framer-motion'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Link2,
  ExternalLink,
  Sparkles,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/admin-api-client'
import { validateArrayData } from '@/utils/data-validation'
import Button from '@/components/admin/Button'
import FormInput from '@/components/admin/FormInput'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/admin/Toast'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import GlassCardAdmin from '@/components/ui/GlassCardAdmin'

interface FriendLink {
  id: string
  name: string
  url: string
  description: string
  avatar?: string
  sort_order: number
  is_active: boolean
  click_count: number
  created_at: string
}

export default function FriendLinksPage() {
  const { success, error } = useToast()
  const [links, setLinks] = useState<FriendLink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLink, setEditingLink] = useState<FriendLink | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; link: FriendLink | null }>({ 
    open: false, 
    link: null 
  })
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    avatar: '',
    is_active: true
  })

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminApi.friendLinks.list()
      
      let filteredLinks = validateArrayData<FriendLink>(data)
      
      if (searchQuery) {
        filteredLinks = filteredLinks.filter((link: FriendLink) => 
          link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.url.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      filteredLinks.sort((a: FriendLink, b: FriendLink) => a.sort_order - b.sort_order)
      
      setLinks(filteredLinks)
    } catch (err) {
      console.error('Failed to fetch friend links:', err)
      error('加载友情链接列表失败')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, error])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingLink) {
        await adminApi.friendLinks.update(editingLink.id, {
          ...formData,
          sort_order: editingLink.sort_order
        })
        success('友链已更新')
      } else {
        await adminApi.friendLinks.create({
          ...formData,
          sort_order: links.length + 1
        })
        success('友链已添加')
      }
      
      setShowModal(false)
      setEditingLink(null)
      setFormData({ name: '', url: '', description: '', avatar: '', is_active: true })
      fetchLinks()
    } catch (err) {
      console.error('Failed to save friend link:', err)
      error('保存失败，请重试')
    }
  }

  const deleteLink = async () => {
    if (!deleteDialog.link) {return}
    
    try {
      await adminApi.friendLinks.delete(deleteDialog.link.id)
      success('友链已删除')
      fetchLinks()
    } catch (err) {
      console.error('Failed to delete friend link:', err)
      error('删除失败，请重试')
    } finally {
      setDeleteDialog({ open: false, link: null })
    }
  }

  const toggleActive = async (link: FriendLink) => {
    try {
      await adminApi.friendLinks.toggleStatus(link.id, !link.is_active)
      success(link.is_active ? '友链已隐藏' : '友链已显示')
      fetchLinks()
    } catch (err) {
      console.error('Failed to toggle active:', err)
      error('操作失败，请重试')
    }
  }

  const moveLink = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === links.length - 1)
    ) {return}

    const newLinks = [...links]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    const temp = newLinks[index].sort_order
    newLinks[index].sort_order = newLinks[targetIndex].sort_order
    newLinks[targetIndex].sort_order = temp
    
    ;[newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]]
    
    setLinks(newLinks)
  }

  const openEditModal = (link: FriendLink) => {
    setEditingLink(link)
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description || '',
      avatar: link.avatar || '',
      is_active: link.is_active
    })
    setShowModal(true)
  }

  const activeCount = links.filter(l => l.is_active).length
  const totalClicks = links.reduce((sum, l) => sum + l.click_count, 0)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCardAdmin className="p-6" variant="primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Link2 className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  友链管理
                </h1>
                <p className="text-foreground/60 mt-0.5 flex items-center gap-2">
                  管理友情链接
                  <motion.span 
                    className="px-2.5 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                  >
                    {activeCount} 个活跃
                  </motion.span>
                  <motion.span 
                    className="px-2.5 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
                  >
                    {totalClicks} 次点击
                  </motion.span>
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => {
                  setEditingLink(null)
                  setFormData({ name: '', url: '', description: '', avatar: '', is_active: true })
                  setShowModal(true)
                }}
                variant="primary"
                leftIcon={Plus}
              >
                添加友链
              </Button>
            </motion.div>
          </div>
        </GlassCardAdmin>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GlassCardAdmin className="p-4" variant="secondary">
          <FormInput
            type="text"
            placeholder="搜索友链名称、描述或URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Link2}
          />
        </GlassCardAdmin>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCardAdmin className="overflow-hidden">
          {loading ? (
            <div className="p-12">
              <LoadingState message="加载中..." size="md" variant="dots" />
            </div>
          ) : links.length === 0 ? (
            <div className="p-12">
              <EmptyState
                variant="create"
                title="暂无友链"
                description="开始添加您的第一个友情链接"
                action={{
                  label: '添加第一个友链',
                  onClick: () => setShowModal(true),
                  icon: Plus
                }}
                icon={Link2}
              />
            </div>
          ) : (
            <div className="divide-y divide-glass-border/20">
              <AnimatePresence>
                {links.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-4 p-4 hover:bg-glass/10 transition-colors duration-200 group",
                      !link.is_active && "opacity-60"
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <motion.button
                        onClick={() => moveLink(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-foreground/40 hover:text-foreground disabled:opacity-30 transition-all"
                        whileHover={{ scale: index === 0 ? 1 : 1.1 }}
                        whileTap={{ scale: index === 0 ? 1 : 0.9 }}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => moveLink(index, 'down')}
                        disabled={index === links.length - 1}
                        className="p-1 text-foreground/40 hover:text-foreground disabled:opacity-30 transition-all"
                        whileHover={{ scale: index === links.length - 1 ? 1 : 1.1 }}
                        whileTap={{ scale: index === links.length - 1 ? 1 : 0.9 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.button>
                    </div>

                    <motion.div
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-tech-cyan to-tech-sky flex items-center justify-center text-white dark:text-gray-100 font-medium flex-shrink-0 overflow-hidden shadow-lg shadow-tech-cyan/30"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.avatar ? (
                        <>
                          {/* 友链头像由用户任意提供，域名不可控，因此保留 <img> */}
                          <img src={link.avatar} alt={link.name} className="w-full h-full object-cover" />
                        </>
                      ) : (
                        link.name.charAt(0).toUpperCase()
                      )}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground font-semibold">{link.name}</h3>
                        <motion.span
                          className={cn(
                            "px-2.5 py-0.5 text-xs font-medium rounded-full border",
                            link.is_active 
                              ? "bg-green-500/20 text-green-400 border-green-500/30" 
                              : "bg-gray-500/20 text-gray-400 dark:text-gray-500 dark:text-gray-400 border-gray-500/30"
                          )}
                          whileHover={{ scale: 1.05 }}
                        >
                          {link.is_active ? '显示中' : '已隐藏'}
                        </motion.span>
                      </div>
                      <p className="text-sm text-foreground/50 truncate">{link.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <motion.a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-tech-cyan hover:text-tech-lightcyan transition-colors flex items-center gap-1.5"
                          whileHover={{ x: 2 }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {link.url}
                        </motion.a>
                        <span className="text-xs text-foreground/40">
                          {link.click_count} 次点击
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <motion.button
                        onClick={() => toggleActive(link)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          link.is_active 
                            ? "text-green-400 hover:bg-green-500/20" 
                            : "text-foreground/40 hover:text-green-400 hover:bg-green-500/20"
                        )}
                        title={link.is_active ? '隐藏' : '显示'}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {link.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </motion.button>
                      <motion.button
                        onClick={() => openEditModal(link)}
                        className="p-2 text-foreground/40 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-all"
                        title="编辑"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => setDeleteDialog({ open: true, link })}
                        className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="删除"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </GlassCardAdmin>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />
            
            <motion.div
              className="relative bg-background/95 backdrop-blur-xl border border-glass-border/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-2 rounded-lg bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5 text-tech-cyan" />
                  </motion.div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {editingLink ? '编辑友链' : '添加友链'}
                  </h2>
                </div>
                <motion.button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-foreground/40 hover:text-foreground hover:bg-glass/20 rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  label="网站名称"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入网站名称"
                  required
                />
                
                <FormInput
                  label="网站链接"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="简短描述这个网站..."
                    className="w-full px-4 py-3 bg-glass/20 border border-glass-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-tech-cyan/50 focus:border-transparent transition-all duration-200 text-foreground placeholder:text-foreground/30 resize-none"
                  />
                </div>
                
                <FormInput
                  label="头像链接"
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://example.com/avatar.png"
                />
                
                <div className="flex items-center gap-3 p-3 bg-glass/10 rounded-xl border border-glass-border/30">
                  <motion.input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-glass-border/50 text-tech-cyan focus:ring-tech-cyan/50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                  <label htmlFor="is_active" className="text-sm text-foreground cursor-pointer">
                    立即显示
                  </label>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-glass-border/30">
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    variant="ghost"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    {editingLink ? '保存' : '添加'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, link: null })}
        onConfirm={deleteLink}
        title="确认删除友链"
        description={`确定要删除友链「${deleteDialog.link?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
