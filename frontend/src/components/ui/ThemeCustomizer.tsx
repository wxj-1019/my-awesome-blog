'use client';

import { useState } from 'react';
import { Sun, Moon, Monitor, Palette, Type, Palette as PaletteIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/context/theme-context';
import { useToast } from '@/components/ui/use-toast';
import GlassCard from '@/components/ui/GlassCard';

export default function ThemeCustomizer() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('appearance');

  return (
    <GlassCard className="w-full max-w-xs p-0 overflow-hidden border-border shadow-lg transition-all duration-300 hover:shadow-xl">
      {/* 顶部标签导航 */}
      <div className="flex border-b border-glass-border bg-glass/50 backdrop-blur-xl p-1">
        {['appearance', 'typography', 'colors'].map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 px-3 text-sm font-medium capitalize transition-colors duration-200 ${
              activeTab === tab
                ? 'text-tech-cyan bg-glass rounded-md'
                : 'text-foreground/70 hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'appearance' ? <Monitor className="w-4 h-4 inline mr-1" /> : ''}
            {tab === 'typography' ? <Type className="w-4 h-4 inline mr-1" /> : ''}
            {tab === 'colors' ? <PaletteIcon className="w-4 h-4 inline mr-1" /> : ''}
            {tab}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'appearance' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-tech-cyan" />
              主题外观
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                className="flex flex-col items-center justify-center py-3"
                onClick={() => setTheme('light')}
              >
                <Sun className="w-4 h-4 mb-1" />
                <span className="text-xs">浅色</span>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                className="flex flex-col items-center justify-center py-3"
                onClick={() => setTheme('dark')}
              >
                <Moon className="w-4 h-4 mb-1" />
                <span className="text-xs">深色</span>
              </Button>
              <Button
                variant={theme === 'auto' ? 'default' : 'outline'}
                size="sm"
                className="flex flex-col items-center justify-center py-3"
                onClick={() => setTheme('auto')}
              >
                <Monitor className="w-4 h-4 mb-1" />
                <span className="text-xs">跟随系统</span>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-tech-cyan" />
              字体设置
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">字体大小</span>
                <select className="bg-glass border border-glass-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan">
                  <option>默认</option>
                  <option>小号</option>
                  <option>大号</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">行间距</span>
                <select className="bg-glass border border-glass-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-tech-cyan">
                  <option>正常</option>
                  <option>宽松</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <PaletteIcon className="w-4 h-4 text-tech-cyan" />
              颜色主题
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-foreground">
                <span>强调色</span>
                <div className="flex space-x-1">
                  {['cyan', 'blue', 'green', 'purple'].map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full bg-${color}-500 border-2 ${
                        color === 'cyan' ? 'border-tech-cyan' : 'border-transparent'
                      }`}
                      aria-label={`${color} 颜色`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground">
                <span>背景透明度</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">低</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="70"
                    className="w-24 accent-tech-cyan"
                  />
                  <span className="text-xs text-muted-foreground">高</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 底部操作按钮 */}
        <div className="mt-4 pt-4 border-t border-glass-border flex space-x-2">
          <Button
            variant="outline"
            className="flex-1 text-foreground hover:bg-glass/50 border-border"
            onClick={() => {
              // 重置为默认设置
              setTheme('auto');
            }}
          >
            重置
          </Button>
          <Button
            className="flex-1 bg-tech-cyan hover:bg-tech-cyan/90 text-white"
            onClick={() => {
              // 保存设置
              toast({ description: '主题设置已保存！' });
            }}
          >
            保存
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}