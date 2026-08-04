import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectionRevisionPreview from '@/components/admin/writing/SelectionRevisionPreview';

// SelectionRevisionPreview 是纯展示组件，无需 mock admin-api / framer-motion。

beforeEach(() => {
  jest.clearAllMocks();
});

test('does not mutate the article until apply is clicked', async () => {
  const user = userEvent.setup();
  const apply = jest.fn();
  render(
    <SelectionRevisionPreview
      originalText="旧段落"
      replacementText="新段落"
      revisionId="r1"
      conflict={false}
      onApply={apply}
      onDiscard={jest.fn()}
    />
  );
  expect(apply).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '应用替换' }));
  expect(apply).toHaveBeenCalledTimes(1);
});

test('blocks apply when content hash changed', () => {
  render(
    <SelectionRevisionPreview
      originalText="旧"
      replacementText="新"
      revisionId="r1"
      conflict={true}
      onApply={jest.fn()}
      onDiscard={jest.fn()}
    />
  );
  expect(screen.getByRole('button', { name: '重新选择段落' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '应用替换' })).not.toBeInTheDocument();
});

test('discard calls onDiscard', async () => {
  const user = userEvent.setup();
  const discard = jest.fn();
  render(
    <SelectionRevisionPreview
      originalText="旧"
      replacementText="新"
      revisionId="r1"
      conflict={false}
      onApply={jest.fn()}
      onDiscard={discard}
    />
  );
  await user.click(screen.getByRole('button', { name: '放弃' }));
  expect(discard).toHaveBeenCalledTimes(1);
});

test('conflict view discard button calls onDiscard', async () => {
  const user = userEvent.setup();
  const discard = jest.fn();
  render(
    <SelectionRevisionPreview
      originalText="旧"
      replacementText="新"
      revisionId="r1"
      conflict={true}
      onApply={jest.fn()}
      onDiscard={discard}
    />
  );
  await user.click(screen.getByRole('button', { name: '重新选择段落' }));
  expect(discard).toHaveBeenCalledTimes(1);
});

test('renders both original and replacement text with preserved whitespace wrapping', () => {
  render(
    <SelectionRevisionPreview
      originalText={'第一行\n第二行'}
      replacementText={'新第一行\n新第二行'}
      revisionId="r1"
      conflict={false}
      onApply={jest.fn()}
      onDiscard={jest.fn()}
    />
  );
  // 两段文本都要渲染；RTL 默认折叠空白，关闭后才能匹配 \n
  expect(screen.getByText('第一行\n第二行', { collapseWhitespace: false })).toBeInTheDocument();
  expect(screen.getByText('新第一行\n新第二行', { collapseWhitespace: false })).toBeInTheDocument();
});

test('shows warning message when conflict', () => {
  render(
    <SelectionRevisionPreview
      originalText="旧"
      replacementText="新"
      revisionId="r1"
      conflict={true}
      onApply={jest.fn()}
      onDiscard={jest.fn()}
    />
  );
  expect(screen.getByText('正文已变化，无法应用此修改')).toBeInTheDocument();
});

test('apply button is disabled when revisionId is null', () => {
  render(
    <SelectionRevisionPreview
      originalText="旧"
      replacementText="新"
      revisionId={null}
      conflict={false}
      onApply={jest.fn()}
      onDiscard={jest.fn()}
    />
  );
  expect(screen.getByRole('button', { name: '应用替换' })).toBeDisabled();
});
