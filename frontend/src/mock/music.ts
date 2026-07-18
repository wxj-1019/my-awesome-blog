import type { Playlist, Banner, Artist, Song } from '@/types/music';

export const mockPlaylists: Playlist[] = [
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

export const mockBanners: Banner[] = [
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

export const mockArtists: Artist[] = [
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

export const mockSongs: Song[] = [
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
