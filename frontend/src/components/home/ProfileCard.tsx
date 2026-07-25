'use client'

import { useEffect, useState, useRef } from 'react'
import { Mail, Instagram, Github, Twitter, User } from 'lucide-react'
import { useTheme } from '@/context/theme-context'
import { getAdminUserApi } from '@/lib/api/auth'

export default function ProfileCard() {
  const { resolvedTheme } = useTheme()
  const [userAvatar, setUserAvatar] = useState<string | null>('https://my-awesome-blog.oss-cn-hangzhou.aliyuncs.com/avatars/user_d1a70b43-2b9b-4dd7-b995-22d4f5c5f129/db999ca2-4eff-456a-a08e-1770bb5f5798_avatar1.jpg')
  const [userName, setUserName] = useState('Hello World ！')
  const [userBio, setUserBio] = useState('Welcome to my awesome blog!')
  const [mounted, setMounted] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    setUserName('Hello World ！')
    setUserBio('Welcome to my awesome blog!')
    setUserAvatar('https://my-awesome-blog.oss-cn-hangzhou.aliyuncs.com/avatars/user_d1a70b43-2b9b-4dd7-b995-22d4f5c5f129/db999ca2-4eff-456a-a08e-1770bb5f5798_avatar1.jpg')
  }, [])

  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        const adminData = await getAdminUserApi()
        if (adminData) {
          setUserName(adminData.fullName || adminData.username || 'Hello World ！')
          setUserBio(adminData.bio || 'Welcome to my awesome blog!')
          if (adminData.avatar) {
            setUserAvatar(adminData.avatar)
          }
        }
      } catch {
        // 使用默认值（已经在初始化时设置）
      }
    }

    // 尝试从API获取数据，但失败不影响显示
    void fetchAdminUser()
  }, [])

  if (!mounted) {return null}

  void resolvedTheme

  return (
    <div className="relative w-full flex justify-center">
      <div
        ref={cardRef}
        className="group relative w-[280px] h-[280px] bg-background rounded-[32px] p-[3px] overflow-hidden shadow-glass transition-transform duration-[480ms] ease-out hover:-translate-y-1"
      >
        <button className="mail absolute right-8 top-[1.4rem] bg-transparent border-none z-10 transition-transform duration-300 ease-out hover:scale-105 hover:-translate-y-0.5">
          <Mail className="w-6 h-6 stroke-tech-cyan dark:stroke-tech-cyan stroke-[3px] transition-colors duration-300 ease-out hover:stroke-tech-lightcyan dark:hover:stroke-tech-lightcyan" />
        </button>

        {/* 头像层：hover 不再做尺寸/圆角/边框突变，仅内部图片轻微缩放（transform） */}
        <div className="profile-pic absolute inset-[3px] rounded-[29px] z-[1] overflow-hidden">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt="用户头像"
              className="w-full h-full object-cover object-top transition-transform duration-[480ms] ease-out group-hover:scale-[1.08]"
              onError={() => setUserAvatar(null)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-tech-cyan to-tech-deepblue dark:from-tech-cyan dark:to-tech-darkblue flex items-center justify-center transition-transform duration-[480ms] ease-out group-hover:scale-[1.05]">
            <User className="w-12 h-12 text-white transition-transform duration-300 ease-out group-hover:scale-105" />
          </div>
          )}
        </div>

        {/* 底部面板：固定高度，默认 translate-y 下移只露一条，hover 滑回（纯 transform 动画） */}
        <div className="bottom absolute bottom-[3px] left-[3px] right-[3px] top-[20%] bg-tech-deepblue dark:bg-card rounded-[29px] z-[2] overflow-hidden translate-y-[75%] transition-transform duration-[480ms] ease-out group-hover:translate-y-0">
          <div className="content absolute bottom-0 left-6 right-6 h-[160px] transition-transform duration-300 ease-out group-hover:translate-y-[-4px]">
            <span className="name block text-[1.2rem] text-white dark:text-foreground font-bold transition-transform duration-300 ease-out group-hover:translate-y-[-2px]">
              {userName}
            </span>
            <span className="about-me block text-[0.9rem] text-white/80 dark:text-muted-foreground mt-4">
              {userBio}
            </span>
          </div>

          <div className="bottom-bottom absolute bottom-4 left-6 right-6 flex items-center justify-between">
            <div className="social-links-container flex gap-4">
              <Instagram className="w-5 h-5 fill-white/90 dark:fill-foreground/90 transition-[fill,transform] duration-300 ease-out cursor-pointer hover:fill-tech-lightcyan hover:scale-105 hover:-translate-y-0.5" />
              <Twitter className="w-5 h-5 fill-white/90 dark:fill-foreground/90 transition-[fill,transform] duration-300 ease-out cursor-pointer hover:fill-tech-lightcyan hover:scale-105 hover:-translate-y-0.5" />
              <Github className="w-5 h-5 fill-white/90 dark:fill-foreground/90 transition-[fill,transform] duration-300 ease-out cursor-pointer hover:fill-tech-lightcyan hover:scale-105 hover:-translate-y-0.5" />
            </div>

            <button className="button bg-white dark:bg-card text-tech-cyan border-none rounded-[20px] text-[0.6rem] px-2 py-[0.25rem] shadow-sm transition-[background-color,color,transform] duration-300 ease-out cursor-pointer hover:bg-tech-lightcyan hover:text-white hover:scale-105 hover:-translate-y-0.5">
              Contact Me
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
