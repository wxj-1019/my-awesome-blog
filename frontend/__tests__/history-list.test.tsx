import { fireEvent, render, screen } from '@testing-library/react';
import HistoryList from '@/components/tools/image-gen/HistoryList';
import type { GenHistoryEntry } from '@/lib/image-gen-history';

const entry: GenHistoryEntry = {
  id: 'e1',
  createdAt: Date.now() - 60_000,
  kind: 'image',
  prompt: '月光下的静谧湖泊',
  size: '1:1',
  count: 1,
  images: ['https://cdn.example.com/a.png'],
  videoUrl: null,
};

const videoEntry: GenHistoryEntry = {
  id: 'e2',
  createdAt: Date.now(),
  kind: 'video',
  prompt: '海鸥飞过灯塔',
  images: [],
  videoUrl: 'https://cdn.example.com/clip.mp4',
};

describe('HistoryList · 画布历史列表', () => {
  it('空历史显示空态提示', () => {
    render(<HistoryList entries={[]} onRestore={jest.fn()} onDelete={jest.fn()} onClear={jest.fn()} />);
    expect(screen.getByText('还没有生成记录')).toBeInTheDocument();
  });

  it('渲染条目：图片缩略图 + 提示词 + 类型/张数 + 时间', () => {
    render(<HistoryList entries={[entry]} onRestore={jest.fn()} onDelete={jest.fn()} onClear={jest.fn()} />);
    expect(screen.getByRole('img', { name: '' })).toBeInTheDocument(); // 缩略图
    expect(screen.getByText('月光下的静谧湖泊')).toBeInTheDocument();
    expect(screen.getByText('1 张')).toBeInTheDocument();
    expect(screen.getByText('1 分钟前')).toBeInTheDocument();
  });

  it('视频条目显示视频标识与播放图标占位', () => {
    render(<HistoryList entries={[videoEntry]} onRestore={jest.fn()} onDelete={jest.fn()} onClear={jest.fn()} />);
    expect(screen.getByText('视频')).toBeInTheDocument();
  });

  it('点击条目触发恢复回调', () => {
    const onRestore = jest.fn();
    render(<HistoryList entries={[entry]} onRestore={onRestore} onDelete={jest.fn()} onClear={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /恢复记录/ }));
    expect(onRestore).toHaveBeenCalledWith(entry);
  });

  it('删除与清空触发对应回调', () => {
    const onDelete = jest.fn();
    const onClear = jest.fn();
    render(<HistoryList entries={[entry]} onRestore={jest.fn()} onDelete={onDelete} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: '删除' }));
    expect(onDelete).toHaveBeenCalledWith('e1');
    fireEvent.click(screen.getByRole('button', { name: '清空' }));
    expect(onClear).toHaveBeenCalled();
  });
});
