'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from '@/lib/framer-motion'
import { Plus, Edit, Trash2, Users as UsersIcon, Sparkles, Shield } from 'lucide-react'
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
interface User {
  id: string
  username: string
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  avatar: string
  created_at: string
}
export default function UsersPage() {
  const { success, error } = useToast();
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({ 
    open: false, 
    user: null 
  })
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    is_superuser: false
  })
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminApi.users.list()
      setUsers(validateArrayData<User>(data))
    } catch (err) {
      console.error('Failed to fetch users:', err)
      error('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }, [error])
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        await adminApi.users.update(editingUser.id, {
          full_name: formData.full_name,
          is_superuser: formData.is_superuser
        })
        success('用户已更新')
      } else {
        await adminApi.users.create(formData)
        success('用户已创建')
      }
      
      setShowModal(false)
      setEditingUser(null)
      setFormData({ username: '', email: '', full_name: '', password: '', is_superuser: false })
      fetchUsers()
    } catch (err) {
      console.error('Failed to save user:', err)
      error('保存用户失败，请重试')
    }
  }
  const deleteUser = async () => {
    if (!deleteDialog.user) {return}
    
    try {
      await adminApi.users.delete(deleteDialog.user.id)
      success('用户已删除')
      fetchUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
      error('删除用户失败，请重试')
    } finally {
      setDeleteDialog({ open: false, user: null })
    }
  }
  const toggleUserStatus = async (user: User) => {
    try {
      await adminApi.users.toggleStatus(user.id, !user.is_active)
      success(user.is_active ? '用户已禁用' : '用户已启用')
      fetchUsers()
    } catch (err) {
      console.error('Failed to toggle user status:', err)
      error('更新用户状态失败，请重试')
    }
  }
  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name || '',
      password: '',
      is_superuser: user.is_superuser
    })
    setShowModal(true)
  }
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCardAdmin className="p-6" variant="primary">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-tech-cyan/30 to-tech-sky/30"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <UsersIcon className="w-6 h-6 text-tech-cyan" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  用户管理
                </h1>
                <p className="text-foreground/60 mt-0.5">管理系统用户</p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => {
                  setEditingUser(null)
                  setFormData({ username: '', email: '', full_name: '', password: '', is_superuser: false })
                  setShowModal(true)
                }}
                variant="primary"
                leftIcon={Plus}
              >
                新建用户
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
            placeholder="搜索用户名、邮箱或姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={UsersIcon}
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
          ) : filteredUsers.length === 0 ? (
            <div className="p-12">
              <EmptyState
                variant="search"
                title={searchQuery ? '未找到匹配的用户' : '暂无用户'}
                description={searchQuery ? '尝试其他搜索关键词' : '开始创建您的第一个用户'}
                action={{
                  label: '创建第一个用户',
                  onClick: () => setShowModal(true),
                  icon: Plus
                }}
                icon={UsersIcon}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-glass-border/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">用户</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">邮箱</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">角色</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">注册时间</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-foreground/50 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/20">
                  <AnimatePresence>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-glass/10 transition-colors duration-200 group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <motion.div
                              className="w-10 h-10 rounded-full bg-gradient-to-br from-tech-cyan to-tech-sky flex items-center justify-center text-white dark:text-gray-100 font-medium shadow-lg shadow-tech-cyan/30"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              {user.avatar ? (
                                <Image src={user.avatar} alt="" width={40} height={40} className="rounded-full object-cover" />
                              ) : (
                                user.username.charAt(0).toUpperCase()
                              )}
                            </motion.div>
                            <div>
                              <p className="font-medium text-foreground font-semibold">{user.full_name || user.username}</p>
                              <p className="text-sm text-foreground/50">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/70">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <motion.button
                            onClick={() => toggleUserStatus(user)}
                            className={cn(
                              "px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200",
                              user.is_active 
                                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                                : "bg-gray-500/20 text-gray-400 dark:text-gray-500 dark:text-gray-400 border border-gray-500/30"
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {user.is_active ? '正常' : '禁用'}
                          </motion.button>
                        </td>
                        <td className="px-6 py-4">
                          {user.is_superuser ? (
                            <motion.span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full"
                              whileHover={{ scale: 1.05 }}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              管理员
                            </motion.span>
                          ) : (
                            <span className="text-sm text-foreground/50">普通用户</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/50">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <motion.button
                              onClick={() => openEditModal(user)}
                              className="p-2 text-foreground/40 hover:text-tech-cyan hover:bg-tech-cyan/10 rounded-lg transition-colors duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title="编辑"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => setDeleteDialog({ open: true, user })}
                              className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
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
                    {editingUser ? '编辑用户' : '新建用户'}
                  </h2>
                </div>
                <motion.button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-foreground/40 hover:text-foreground hover:bg-glass/20 rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  label="用户名"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingUser}
                  placeholder="请输入用户名"
                  required
                />
                
                <FormInput
                  label="邮箱"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUser}
                  placeholder="请输入邮箱"
                  required
                />
                
                <FormInput
                  label="姓名"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="请输入姓名"
                />
                
                {!editingUser && (
                  <FormInput
                    label="密码"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="请输入密码"
                    required={!editingUser}
                  />
                )}
                
                <div className="flex items-center gap-3 p-3 bg-glass/10 rounded-xl border border-glass-border/30">
                  <motion.input
                    type="checkbox"
                    id="is_superuser"
                    checked={formData.is_superuser}
                    onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                    className="w-5 h-5 rounded border-glass-border/50 text-tech-cyan focus:ring-tech-cyan/50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                  <label htmlFor="is_superuser" className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <Shield className="w-4 h-4 text-tech-cyan" />
                    超级管理员
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
                    {editingUser ? '保存' : '创建'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
        onConfirm={deleteUser}
        title="确认删除用户"
        description={`确定要删除用户「${deleteDialog.user?.username}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}