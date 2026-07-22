'use client';

import { useState } from 'react';
import { motion } from '@/lib/framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import MusicSidebar from '@/components/music/MusicSidebar';
import HeroBanner from '@/components/music/HeroBanner';
import PlaylistScroll from '@/components/music/PlaylistScroll';
import Section from '@/components/music/Section';
import SongList from '@/components/music/SongList';
import ArtistScroll from '@/components/music/ArtistScroll';
import PlayerBar from '@/components/music/PlayerBar';
import MobileNav from '@/components/music/MobileNav';

import type { Song, PlayMode } from '@/types/music';
import { mockPlaylists, mockBanners, mockArtists, mockSongs } from '@/mock/music';

export default function MusicHallPageContent() {
  const [activeSection, setActiveSection] = useState('discover');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(240);
  const [volume, setVolume] = useState(0.7);
  const [playMode, setPlayMode] = useState<PlayMode>('list');
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  // 减少动画偏好：入场 variants 回退为瞬时呈现终态
  const reducedMotion = useReducedMotion();

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleNext = () => {

  };

  const handlePrevious = () => {

  };

  const handleSeek = (newProgress: number) => {
    setProgress(newProgress);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleModeChange = () => {
    const modes: PlayMode[] = ['list', 'random', 'single'];
    const currentIndex = modes.indexOf(playMode);
    setPlayMode(modes[(currentIndex + 1) % modes.length]);
  };

  const handleSongClick = (song: Song) => {
    setCurrentSong(song);
    setProgress(0);
    setDuration(song.duration);
    setIsPlaying(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: reducedMotion
        ? { duration: 0 }
        : {
            staggerChildren: 0.15,
            delayChildren: 0.1,
          },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reducedMotion
        ? { duration: 0 }
        : {
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1] as const,
          },
    },
  };

  return (
    <motion.div 
      className="flex h-screen pt-16 overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <MusicSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        playlists={mockPlaylists}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="flex-1 overflow-y-auto pb-22 md:pb-22 scrollbar-hide">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
          <motion.section className="mb-8" variants={sectionVariants}>
            <HeroBanner
              banners={mockBanners}
              autoPlay={true}
              interval={5000}
              showArrows={true}
              showIndicators={true}
            />
          </motion.section>

          <motion.section className="mb-12" variants={sectionVariants}>
            <Section
              title="推荐歌单"
              moreLink="/music/playlists"
              moreText="查看全部"
            >
              <PlaylistScroll
                playlists={mockPlaylists}
                size="medium"
                showPlayCount={true}
                onPlaylistClick={() => {}}
              />
            </Section>
          </motion.section>

          <motion.section className="mb-12" variants={sectionVariants}>
            <Section
              title="最新音乐"
            >
              <SongList
                songs={mockSongs}
                showHeader={true}
                showAlbum={false}
                showDuration={true}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onSongClick={handleSongClick}
                onSongDoubleClick={handleSongClick}
              />
            </Section>
          </motion.section>

          <motion.section className="mb-12" variants={sectionVariants}>
            <Section
              title="热门歌手"
              moreLink="/music/artists"
              moreText="查看全部"
            >
              <ArtistScroll
                artists={mockArtists}
                size="medium"
                onArtistClick={() => {}}
              />
            </Section>
          </motion.section>
        </div>
      </main>

      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        playMode={playMode}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onModeChange={handleModeChange}
        onShowPlaylist={() => {}}
        isExpanded={isPlayerExpanded}
        onToggleExpand={() => setIsPlayerExpanded(!isPlayerExpanded)}
      />

      <MobileNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </motion.div>
  );
}
