'use client'

import { FileImage } from 'lucide-react'

export default function PortfoliosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">作品集管理</h1>
        <p className="text-gray-500 mt-1">管理作品集</p>
      </div>

      <div className="bg-white rounded-xl p-12 shadow-sm text-center">
        <FileImage className="w-16 h-16 mx-auto text-gray-300" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">作品集管理</h2>
        <p className="mt-2 text-gray-500">该功能正在开发中...</p>
      </div>
    </div>
  )
}
