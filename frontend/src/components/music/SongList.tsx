'use client';

import SongRow from './SongRow';
import type { Song } from '@/types/music';
import { Music } from 'lucide-react';

interface SongListProps {
  songs: Song[];
  showHeader?: boolean;
  showAlbum?: boolean;
  showDuration?: boolean;
  currentSong?: Song;
  isPlaying?: boolean;
  onSongClick?: (song: Song) => void;
  onSongDoubleClick?: (song: Song) => void;
}

export default function SongList({ 
  songs, 
  showHeader = true,
  showAlbum = false,
  showDuration = true,
  currentSong,
  isPlaying = false,
  onSongClick,
  onSongDoubleClick
}: SongListProps) {
  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex items-center h-10 px-4 border-b border-white/5 mx-2">
          <div className="w-8 flex-shrink-0">
            <span className="text-xs font-medium text-white/40">
              #
            </span>
          </div>
          {showAlbum && (
            <div className="w-10 flex-shrink-0 mr-4">
              <span className="text-xs font-medium text-white/40">
                封面
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0 mr-4">
            <span className="text-xs font-medium text-white/40">
              歌曲标题
            </span>
          </div>
          {showAlbum && !showAlbum && (
            <div className="w-40 flex-shrink-0 hidden md:block">
              <span className="text-xs font-medium text-white/40">
                专辑
              </span>
            </div>
          )}
          <div className="w-24 flex-shrink-0 text-right pr-4">
             <span className="text-xs font-medium text-white/40">
               时长
             </span>
          </div>
        </div>
      )}

      <div className="flex flex-col py-2">
        {songs.map((song, index) => (
          <SongRow
            key={song.id}
            song={song}
            index={index}
            isPlaying={isPlaying && currentSong?.id === song.id}
            currentSong={currentSong}
            showAlbum={showAlbum}
            showDuration={showDuration}
            onSongClick={onSongClick}
            onDoubleClick={onSongDoubleClick}
          />
        ))}
      </div>

      {songs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Music className="w-16 h-16 text-white/20 mb-4" />
          <p className="text-sm text-white/40">
            暂无歌曲
          </p>
        </div>
      )}
    </div>
  );
}
