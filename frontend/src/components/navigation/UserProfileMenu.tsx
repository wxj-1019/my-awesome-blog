import { 
  User, UserCircle, LayoutDashboard, FileText, Settings, LogOut,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import Image from 'next/image';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { useState, useEffect } from 'react';
import { getCurrentUserApi } from '@/lib/api/auth';

interface UserProfileMenuProps {
  mounted: boolean;
}

/** 在线状态脉冲动画（纯 CSS，替代 framer-motion） */
function OnlinePulse() {
  return (
    <span
      className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 z-20 shadow-sm shadow-green-500/30 animate-pulse-glow"
    />
  );
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ mounted }) => {
  const { themedClasses } = useThemedClasses();
  const [isOpen, setIsOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUserApi();
      if (user && user.avatar) {
        setUserAvatar(user.avatar);
      }
      setIsLoggedIn(!!user);
    };
    fetchUser();
  }, []);

  const onlineStatus = mounted && isLoggedIn ? Math.random() > 0.5 : false;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {/* 纯 CSS hover/active 缩放，替代 framer-motion whileHover/whileTap */}
        <div className="hover:scale-[1.08] active:scale-95 transition-transform duration-200">
          <Button
            variant="glass"
            size="sm"
            className="flex items-center justify-center text-foreground p-2 w-9 h-9 hover:bg-tech-cyan/20 transition-all duration-200 relative overflow-hidden"
            aria-label="用户菜单"
          >
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt="用户头像"
                width={20}
                height={20}
                className="h-5 w-5 rounded-full object-cover relative z-10"
                onError={() => {
                  setUserAvatar(null);
                }}
              />
            ) : (
              <User className="h-5 w-5 text-foreground relative z-10" />
            )}
            {onlineStatus && <OnlinePulse />}
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={`w-60 ${themedClasses.dropdownBgClass} ${themedClasses.dropdownShadowClass} z-[200] p-2`}
        sideOffset={8}
      >
        {/* 纯 CSS 出现动画，替代 AnimatePresence + motion.div */}
        <div className="space-y-1 animate-fade-in-up">
          <DropdownMenuLabel 
            className="text-xs font-semibold py-3 px-3 tracking-wide text-muted-foreground"
          >
            我的账户
          </DropdownMenuLabel>
          <DropdownMenuSeparator className={`my-1 ${themedClasses.separatorClass}`} />
          
          <DropdownMenuItem 
            className={`group cursor-pointer py-2.5 px-3 rounded-lg ${themedClasses.dropdownItemClass}`}
            onClick={() => {
              setIsOpen(false);
              if (typeof window !== 'undefined') {
                window.location.href = '/profile';
              }
            }}
          >
            <div className="flex items-center w-full">
              <UserCircle className="h-4 w-4 mr-3 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
              <span className={`${themedClasses.textColorClass}`}>个人资料</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className={`group cursor-pointer py-2.5 px-3 rounded-lg ${themedClasses.dropdownItemClass}`}>
            <div className="flex items-center w-full">
              <LayoutDashboard className="h-4 w-4 mr-3 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
              <span className={`${themedClasses.textColorClass}`}>仪表板</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem className={`group cursor-pointer py-2.5 px-3 rounded-lg ${themedClasses.dropdownItemClass}`}>
            <div className="flex items-center w-full">
              <FileText className="h-4 w-4 mr-3 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
              <span className={`${themedClasses.textColorClass}`}>文章管理</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className={`my-1 ${themedClasses.separatorClass}`} />

          <DropdownMenuItem 
            className={`group cursor-pointer py-2.5 px-3 rounded-lg ${themedClasses.dropdownItemClass}`}
            onClick={() => {
              setIsOpen(false);
              if (typeof window !== 'undefined') {
                window.location.href = '/admin';
              }
            }}
          >
            <div className="flex items-center w-full">
              <FolderOpen className="h-4 w-4 mr-3 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
              <span className={`${themedClasses.textColorClass}`}>后台管理系统</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className={`my-1 ${themedClasses.separatorClass}`} />

          <DropdownMenuItem className={`group cursor-pointer py-2.5 px-3 rounded-lg ${themedClasses.dropdownItemClass}`}>
            <div className="flex items-center w-full">
              <Settings className="h-4 w-4 mr-3 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
              <span className={`${themedClasses.textColorClass}`}>设置</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className={`my-1 ${themedClasses.separatorClass}`} />
          
          <DropdownMenuItem
            className="group cursor-pointer py-2.5 px-3 rounded-lg focus:bg-destructive/15 hover:bg-destructive/15 transition-all duration-200"
          >
            <div className="flex items-center w-full">
              <LogOut className="h-4 w-4 mr-3 text-destructive group-hover:scale-110 transition-transform duration-200" />
              <span className="text-foreground group-hover:text-destructive transition-colors duration-200">退出登录</span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileMenu;
