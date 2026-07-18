import React from 'react';
import { Button } from '@/components/ui/Button';
import { expectNoA11yViolations } from '@/test-utils/a11y';

describe('Button 无障碍', () => {
  it('默认按钮应无严重可访问性违规', async () => {
    await expectNoA11yViolations(<Button>点击我</Button>);
  });

  it('禁用按钮应无严重可访问性违规', async () => {
    await expectNoA11yViolations(<Button disabled>禁用</Button>);
  });

  it('玻璃变体按钮应无严重可访问性违规', async () => {
    await expectNoA11yViolations(<Button variant="glass">玻璃按钮</Button>);
  });
});
