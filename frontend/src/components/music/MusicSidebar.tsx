'use client';
import { Music, Radio, Video, Mic2, Heart, HardDrive, Download, ListMusic, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Playlist } from '@/types/music';
interface MusicSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  playlists: Playlist[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}
export default function MusicSidebar({ activeSection, onSectionChange, playlists, isCollapsed = false, onToggleCollapse }: MusicSidebarProps) {
  const navItems = [
    { id: 'discover', icon: Music, label: '发现音乐' },
    { id: 'fm', icon: Radio, label: '私人FM' },
    { id: 'video', icon: Video, label: '视频' },
    { id: 'radio', icon: Mic2, label: '电台' },
  ];
  const myMusicItems = [
    { id: 'liked', icon: Heart, label: '我喜欢的音乐' },
    { id: 'local', icon: HardDrive, label: '本地音乐' },
    { id: 'download', icon: Download, label: '下载管理' },
  ];
  return (
    <aside className={cn(
      'hidden md:flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
      'bg-[#1a1a2e]/95 backdrop-blur-2xl',
      'border-r border-white/5',
      'shadow-lg shadow-black/20 z-20',
      isCollapsed ? 'w-20' : 'w-64'
    )}>
      <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-hide">
        <button
          onClick={onToggleCollapse}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors duration-300 mb-6",
            isCollapsed ? "mx-auto" : "ml-auto"
          )}
          aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-white/60" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-white/60" aria-hidden="true" />
          )}
        </button>
        {!isCollapsed && (
          <>
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-white/40 mb-3 px-3 uppercase tracking-wider">发现</h3>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300',
                      'w-full text-left',
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'hover:bg-white/5 text-white/70'
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-all duration-300 group-active:scale-95",
                      activeSection === item.id ? "text-white" : "text-white/50 group-hover:text-white"
                    )} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-white/40 mb-3 px-3 uppercase tracking-wider">我的音乐</h3>
              <nav className="flex flex-col gap-1">
                {myMusicItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300',
                      'w-full text-left',
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'hover:bg-white/5 text-white/70'
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-all duration-300 group-active:scale-95",
                      activeSection === item.id ? "text-white" : "text-white/50 group-hover:text-white"
                    )} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white/40 mb-3 px-3 uppercase tracking-wider">创建的歌单</h3>
              <nav className="flex flex-col gap-1">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => onSectionChange(playlist.id)}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300',
                      'w-full text-left',
                      activeSection === playlist.id
                        ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'hover:bg-white/5 text-white/70'
                    )}
                  >
                    <ListMusic className={cn(
                      "w-5 h-5 transition-all duration-300 group-active:scale-95",
                      activeSection === playlist.id ? "text-white" : "text-white/50 group-hover:text-white"
                    )} />
                    <span className="text-sm font-medium truncate">{playlist.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </>
        )}
        {isCollapsed && (
          <nav className="flex flex-col gap-4 items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300',
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'hover:bg-white/5 text-white/50'
                )}
                title={item.label}
                aria-label={item.label}
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
              </button>
            ))}
            <div className="w-8 h-[1px] bg-black/5 dark:bg-white/5 my-2" />
            {myMusicItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200',
                  activeSection === item.id 
                    ? 'bg-[#fa2d2f] text-white shadow-md shadow-[#fa2d2f]/20' 
                    : 'hover:bg-black/5 dark:hover:bg-white/10 text-black/60 dark:text-white/60'
                )}
                title={item.label}
                aria-label={item.label}
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
              </button>
            ))}
            <div className="w-8 h-[1px] bg-black/5 dark:bg-white/5 my-2" />
            <button
               onClick={() => {}}
               className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black/60 dark:text-white/60 transition-all duration-200"
               title="歌单"
               aria-label="歌单"
            >
              <ListMusic className="w-5 h-5" aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
    </aside>
  );
}