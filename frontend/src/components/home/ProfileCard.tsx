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
  const [onlineUsers, setOnlineUsers] = useState(42)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    setUserName('Hello World ！')
    setUserBio('Welcome to my awesome blog!')
    setUserAvatar('https://my-awesome-blog.oss-cn-hangzhou.aliyuncs.com/avatars/user_d1a70b43-2b9b-4dd7-b995-22d4f5c5f129/db999ca2-4eff-456a-a08e-1770bb5f5798_avatar1.jpg')
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        const adminData = await getAdminUserApi()
        console.log('获取到的admin用户数据:', adminData)
        if (adminData) {
          setUserName(adminData.fullName || adminData.username || 'Hello World ！')
          setUserBio(adminData.bio || 'Welcome to my awesome blog!')
          if (adminData.avatar) {
            setUserAvatar(adminData.avatar)
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminUser()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers((prev) => Math.max(30, Math.min(60, prev + Math.floor(Math.random() * 5) - 2)))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'

  return (
    <div className="relative w-full flex justify-center">
      <div
        ref={cardRef}
        className="group relative w-[280px] h-[280px] bg-background rounded-[32px] p-[3px] shadow-[0_70px_30px_-50px_rgba(6,182,212,0.19)] dark:shadow-[0_70px_30px_-50px_rgba(16,185,129,0.19)] transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:rounded-tl-[55px] hover:shadow-[0_70px_30px_-50px_rgba(6,182,212,0.3)] dark:hover:shadow-[0_70px_30px_-50px_rgba(16,185,129,0.3)]"
      >
        <button className="mail absolute right-8 top-[1.4rem] bg-transparent border-none z-10 transition-all duration-300 ease-out hover:scale-110 hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer">
          <Mail className="w-6 h-6 stroke-tech-cyan dark:stroke-tech-cyan stroke-[3px] transition-all duration-300 ease-out hover:stroke-tech-lightcyan dark:hover:stroke-tech-lightcyan" />
        </button>

        <div className="profile-pic absolute inset-[3px] rounded-[29px] z-[1] border-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:w-[100px] group-hover:h-[100px] group-hover:top-[10px] group-hover:left-[10px] group-hover:rounded-full group-hover:z-[3] group-hover:border-[7px] group-hover:border-tech-cyan group-hover:shadow-[0_5px_5px_0px_rgba(6,182,212,0.3)] dark:group-hover:shadow-[0_5px_5px_0px_rgba(16,185,129,0.3)]">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt="用户头像"
              className="w-full h-full object-cover object-top transition-transform duration-500 ease-in-out group-hover:scale-[2.5] group-hover:object-[0px_25px] delay-100"
              onError={() => setUserAvatar(null)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-tech-cyan to-tech-deepblue dark:from-tech-cyan dark:to-[#064e3b] flex items-center justify-center transition-all duration-500 ease-in-out group-hover:scale-[1.1]">
              <User className="w-12 h-12 text-white transition-transform duration-300 ease-out group-hover:scale-110" />
            </div>
          )}
        </div>

        <div className="bottom absolute bottom-[3px] left-[3px] right-[3px] bg-tech-deepblue dark:bg-card top-[80%] rounded-[29px] z-[2] shadow-[inset_0_5px_5px_0px_rgba(6,182,212,0.2)] dark:shadow-[inset_0_5px_5px_0px_rgba(16,185,129,0.2)] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.645,0.045,0.355,1)] group-hover:top-[20%] group-hover:rounded-[80px_29px_29px_29px] delay-150">
          <div className="content absolute bottom-0 left-6 right-6 h-[160px] transition-all duration-300 ease-out group-hover:-translate-y-2 delay-200">
            <span className="name block text-[1.2rem] text-white dark:text-foreground font-bold transition-all duration-300 ease-out group-hover:-translate-y-1">
              {userName}
            </span>
            <span className="about-me block text-[0.9rem] text-white/80 dark:text-muted-foreground mt-4 transition-opacity duration-300 ease-out group-hover:opacity-100 delay-250">
              {userBio}
            </span>
          </div>

          <div className="bottom-bottom absolute bottom-4 left-6 right-6 flex items-center justify-between transition-all duration-300 ease-out group-hover:-translate-y-0.5 delay-300">
            <div className="social-links-container flex gap-4">
              <Instagram className="w-5 h-5 fill-white/90 dark:fill-foreground/90 drop-shadow-[0_5px_5px_rgba(6,182,212,0.2)] dark:drop-shadow-[0_5px_5px_rgba(16,185,129,0.2)] transition-all duration-300 ease-bounce cursor-pointer hover:fill-tech-lightcyan hover:scale-125 hover:-translate-y-1" />
              <Twitter className="w-5 h-5 fill-white/90 dark:fill-foreground/90 drop-shadow-[0_5px_5px_rgba(6,182,212,0.2)] dark:drop-shadow-[0_5px_5px_rgba(16,185,129,0.2)] transition-all duration-300 ease-bounce cursor-pointer hover:fill-tech-lightcyan hover:scale-125 hover:-translate-y-1" />
              <Github className="w-5 h-5 fill-white/90 dark:fill-foreground/90 drop-shadow-[0_5px_5px_rgba(6,182,212,0.2)] dark:drop-shadow-[0_5px_5px_rgba(16,185,129,0.2)] transition-all duration-300 ease-bounce cursor-pointer hover:fill-tech-lightcyan hover:scale-125 hover:-translate-y-1" />
            </div>

            <button className="button bg-white dark:bg-card text-tech-cyan border-none rounded-[20px] text-[0.6rem] px-2 py-1 shadow-[0_5px_5px_0px_rgba(6,182,212,0.2)] dark:shadow-[0_5px_5px_0px_rgba(16,185,129,0.2)] transition-all duration-300 ease-out cursor-pointer hover:bg-tech-lightcyan hover:text-white hover:scale-110 hover:shadow-[0_8px_8px_0px_rgba(6,182,212,0.3)] dark:hover:shadow-[0_8px_8px_0px_rgba(16,185,129,0.3)] hover:-translate-y-1">
              Contact Me
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
