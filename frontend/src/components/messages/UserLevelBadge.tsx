'use client';
import { motion } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { Crown, Zap, Star, Trophy, Flame } from 'lucide-react';
interface UserLevelBadgeProps {
  level?: number;
  username?: string;
  showProgress?: boolean;
  progress?: number;
  achievements?: string[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
}
const UserLevelBadge = ({
  level: propLevel,
  username: _username,
  showProgress = true,
  progress = 0,
  achievements = [],
  size = 'md'
}: UserLevelBadgeProps) => {
  const level = (typeof propLevel === 'number' && !isNaN(propLevel)) ? propLevel : 1;
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };
  const iconSize = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  const getLevelIcon = (lvl: number) => {
    if (lvl >= 50) {return <Crown className={iconSize[size]} />;}
    if (lvl >= 30) {return <Trophy className={iconSize[size]} />;}
    if (lvl >= 20) {return <Star className={iconSize[size]} />;}
    if (lvl >= 10) {return <Zap className={iconSize[size]} />;}
    return <Flame className={iconSize[size]} />;
  };
  const getLevelColor = (lvl: number) => {
    if (lvl >= 50) {return 'from-yellow-400 via-orange-500 to-red-500';}
    if (lvl >= 30) {return 'from-purple-400 via-pink-500 to-red-400';}
    if (lvl >= 20) {return 'from-blue-400 via-cyan-500 to-blue-400';}
    if (lvl >= 10) {return 'from-green-400 via-emerald-500 to-teal-400';}
    return 'from-gray-400 via-slate-500 to-gray-400';
  };
  const pulseBoxShadow = [
    '0 0 0 0px rgba(0,217,255,0)',
    '0 0 0 4px rgba(0,217,255,0)',
    '0 0 0 0px rgba(0,217,255,0)'
  ];
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={cn(
          "relative flex items-center gap-1.5 rounded-full border-2 font-bold text-white will-change-transform",
          sizeClasses[size],
          "bg-gradient-to-r",
          getLevelColor(level),
          "shadow-lg",
          "transition-all duration-300"
        )}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.05 }}
      >
        {getLevelIcon(level)}
        <span>Lv.{level}</span>
        {showProgress && progress > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full will-change-transform"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              background: `radial-gradient(circle, transparent 0%, rgba(255,255,255,0.2) ${100 - progress * 0.8}%, transparent 100%)`
            }}
          />
        )}
      </motion.div>
      {showProgress && progress > 0 && (
        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-tech-cyan to-tech-lightcyan"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
      {achievements.length > 0 && (
        <div className="flex gap-1">
          {achievements.slice(0, 3).map((achievement, index) => (
            <motion.div
              key={achievement}
              className="relative"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="w-4 h-4 bg-tech-cyan/20 rounded-full flex items-center justify-center border border-tech-cyan/40">
                <Star className="w-2.5 h-2.5 text-tech-cyan" fill="currentColor" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ boxShadow: pulseBoxShadow }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
export default UserLevelBadge;