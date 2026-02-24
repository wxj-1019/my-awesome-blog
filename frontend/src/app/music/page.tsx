'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import MusicSidebar from '@/components/music/MusicSidebar';
import HeroBanner from '@/components/music/HeroBanner';
import PlaylistScroll from '@/components/music/PlaylistScroll';
import Section from '@/components/music/Section';
import SongList from '@/components/music/SongList';
import ArtistScroll from '@/components/music/ArtistScroll';
import PlayerBar from '@/components/music/PlayerBar';
import MobileNav from '@/components/music/MobileNav';
import AnimatedSection from '@/components/music/AnimatedSection';
import type { Playlist, Song, Artist, Banner, PlayMode } from '@/types/music';

export default function MusicHallPage() {
  const [activeSection, setActiveSection] = useState('discover');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(240);
  const [volume, setVolume] = useState(0.7);
  const [playMode, setPlayMode] = useState<PlayMode>('list');
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleNext = () => {
    console.log('Next song');
  };

  const handlePrevious = () => {
    console.log('Previous song');
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

  const mockPlaylists: Playlist[] = [
    {
      id: '1',
      name: '今日推荐',
      coverImg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
      playCount: 12500,
      trackCount: 30,
      creator: '网易云音乐',
    },
    {
      id: '2',
      name: '流行热歌',
      coverImg: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      playCount: 8900,
      trackCount: 25,
      creator: '网易云音乐',
    },
    {
      id: '3',
      name: '华语经典',
      coverImg: 'https://images.unsplash.com/photo-1511379938547-c1f6944686fe?w=400&h=400&fit=crop',
      playCount: 15600,
      trackCount: 40,
      creator: '网易云音乐',
    },
    {
      id: '4',
      name: '欧美流行',
      coverImg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
      playCount: 9800,
      trackCount: 35,
      creator: '网易云音乐',
    },
    {
      id: '5',
      name: '日韩精选',
      coverImg: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
      playCount: 11200,
      trackCount: 28,
      creator: '网易云音乐',
    },
  ];

  const mockBanners: Banner[] = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop',
      title: '发现新音乐',
      subtitle: '每日推荐，为你精选',
      description: '探索最新热门音乐，发现你的专属歌单',
      type: 'playlist',
      targetId: '1',
      gradient: 'linear-gradient(90deg, rgba(250, 45, 47, 0.8) 0%, transparent 100%)',
      coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&h=400&fit=crop',
      title: '私人FM',
      subtitle: '懂你的音乐推荐',
      description: '基于你的喜好，智能推荐适合你的音乐',
      type: 'playlist',
      targetId: '2',
      gradient: 'linear-gradient(90deg, rgba(50, 173, 230, 0.8) 0%, transparent 100%)',
      coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=400&fit=crop',
      title: '热门歌手',
      subtitle: '关注你喜欢的艺人',
      description: '发现新晋歌手，追踪偶像动态',
      type: 'artist',
      targetId: '3',
      gradient: 'linear-gradient(90deg, rgba(52, 199, 89, 0.8) 0%, transparent 100%)',
      coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f6944686fe?w=400&h=400&fit=crop',
    },
  ];

  const mockArtists: Artist[] = [
    {
      id: '1',
      name: '周杰伦',
      avatar: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81c?w=200&h=200&fit=crop',
      fans: 12500000,
    },
    {
      id: '2',
      name: 'Taylor Swift',
      avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc3?w=200&h=200&fit=crop',
      fans: 89000000,
    },
    {
      id: '3',
      name: '林俊杰',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
      fans: 9800000,
    },
    {
      id: '4',
      name: 'Adele',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      fans: 67000000,
    },
    {
      id: '5',
      name: '邓紫棋',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop',
      fans: 11200000,
    },
  ];

  const mockSongs: Song[] = [
    {
      id: '1',
      name: '七里香',
      artists: [{ id: '1', name: '周杰伦', avatar: '' }],
      album: {
        id: '1',
        name: '范特西',
        coverImg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop',
        artist: { id: '1', name: '周杰伦', avatar: '' },
      },
      duration: 298,
      sq: true,
    },
    {
      id: '2',
      name: '青花瓷',
      artists: [{ id: '1', name: '周杰伦', avatar: '' }],
      album: {
        id: '1',
        name: '依然范特西',
        coverImg: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
        artist: { id: '1', name: '周杰伦', avatar: '' },
      },
      duration: 238,
      sq: true,
    },
    {
      id: '3',
      name: '夜曲',
      artists: [{ id: '1', name: '周杰伦', avatar: '' }],
      album: {
        id: '1',
        name: '叶惠美',
        coverImg: 'https://images.unsplash.com/photo-1511379938547-c1f6944686fe?w=200&h=200&fit=crop',
        artist: { id: '1', name: '周杰伦', avatar: '' },
      },
      duration: 256,
      sq: true,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
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
      transition: {
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
                onPlaylistClick={(playlist) => console.log('Click playlist:', playlist.name)}
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
                onArtistClick={(artist) => console.log('Click artist:', artist.name)}
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
        onShowPlaylist={() => console.log('Show playlist')}
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
