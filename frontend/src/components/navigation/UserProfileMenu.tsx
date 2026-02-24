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
import { cn } from '@/lib/utils';
import { useThemedClasses } from '@/hooks/useThemedClasses';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getCurrentUserApi } from '@/lib/api/auth';

interface UserProfileMenuProps {
  mounted: boolean;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ mounted }) => {
  const { themedClasses, isDark } = useThemedClasses();
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

  const menuItemVariants = {
    hidden: { opacity: 0, x: -10, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: i * 0.06,
        duration: 0.25
      }
    })
  };

  const onlineStatus = mounted && isLoggedIn ? Math.random() > 0.5 : false;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="glass"
            size="sm"
            className="flex items-center justify-center text-foreground p-2 w-9 h-9 hover:bg-tech-cyan/20 transition-all duration-200 relative overflow-hidden"
            aria-label="用户菜单"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="User Avatar"
                className="h-5 w-5 rounded-full object-cover relative z-10"
                onError={(e) => {
                  setUserAvatar(null);
                }}
              />
            ) : (
              <User className="h-5 w-5 text-foreground relative z-10" />
            )}
            {onlineStatus && (
              <motion.div
                className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 z-20 shadow-sm shadow-green-500/30"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [1, 0.8, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={`w-60 ${themedClasses.dropdownBgClass} ${themedClasses.dropdownShadowClass} z-[200] p-2`}
        sideOffset={8}
      >
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-1"
          >
            <DropdownMenuLabel 
              className={`text-xs font-semibold py-3 px-3 tracking-wide ${mounted && isDark ? 'text-foreground/70' : 'text-gray-500'}`}
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
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={menuItemVariants}
                className="flex items-center w-full"
              >
                <UserCircle className="h-4 w-4 mr-3 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
                <span className={`${themedClasses.textColorClass}`}>个人资料</span>
              </motion.div>
            </DropdownMenuItem>
            
            <DropdownMenuItem className={`group cursor-pointer py-2.5 px-3 rounded-lg ${themedClasses.dropdownItemClass}`}>
              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={menuItemVariants}
                className="flex items-center w-full"
              >
                <LayoutDashboard className="h-4 w-4 mr-3 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
                <span className={`${themedClasses.textColorClass}`}>仪表板</span>
              </motion.div>
            </DropdownMenuItem>
            
            <DropdownMenuItem className={`group cursor-pointer py-2.5 px-3 rounded-lg ${themedClasses.dropdownItemClass}`}>
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={menuItemVariants}
                className="flex items-center w-full"
              >
                <FileText className="h-4 w-4 mr-3 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
                <span className={`${themedClasses.textColorClass}`}>文章管理</span>
              </motion.div>
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
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={menuItemVariants}
                className="flex items-center w-full"
              >
                <FolderOpen className="h-4 w-4 mr-3 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
                <span className={`${themedClasses.textColorClass}`}>后台管理系统</span>
              </motion.div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className={`my-1 ${themedClasses.separatorClass}`} />

            <DropdownMenuItem className={`group cursor-pointer py-2.5 px-3 rounded-lg ${themedClasses.dropdownItemClass}`}>
              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={menuItemVariants}
                className="flex items-center w-full"
              >
                <Settings className="h-4 w-4 mr-3 text-tech-cyan group-hover:scale-110 transition-transform duration-200" />
                <span className={`${themedClasses.textColorClass}`}>设置</span>
              </motion.div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className={`my-1 ${themedClasses.separatorClass}`} />
            
            <DropdownMenuItem
              className={`group cursor-pointer py-2.5 px-3 rounded-lg ${
                mounted && isDark
                  ? 'focus:bg-red-500/15 hover:bg-red-500/20 transition-all duration-200'
                  : 'focus:bg-red-50 hover:bg-red-50 transition-all duration-200'
              }`}
            >
              <motion.div
                custom={5}
                initial="hidden"
                animate="visible"
                variants={menuItemVariants}
                className="flex items-center w-full"
              >
                <LogOut className={`h-4 w-4 mr-3 ${
                  mounted && isDark ? 'text-red-400' : 'text-red-500'
                } group-hover:scale-110 transition-transform duration-200 group-hover:text-red-600`} />
                <span className={`${
                  mounted && isDark ? 'text-foreground/80' : 'text-gray-800'
                } group-hover:text-red-600 transition-colors duration-200`}>退出登录</span>
              </motion.div>
            </DropdownMenuItem>
          </motion.div>
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileMenu;
