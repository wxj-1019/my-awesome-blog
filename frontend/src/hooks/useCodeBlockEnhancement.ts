'use client';

import { useEffect, RefObject } from 'react';

export function useCodeBlockEnhancement(contentRef: RefObject<HTMLDivElement>) {
  useEffect(() => {
    if (!contentRef.current) {return;}

    const content = contentRef.current;
    const timeouts: NodeJS.Timeout[] = [];
    const handlers: Array<{ element: HTMLElement; type: string; fn: EventListener }> = [];

    const processCodeBlocks = () => {
      const codeBlocks = content.querySelectorAll('pre code');

      codeBlocks.forEach((codeBlock) => {
        const pre = codeBlock.parentElement;
        if (!pre || pre.parentElement?.classList.contains('code-enhanced')) {return;}

        const language = Array.from(codeBlock.classList)
          .find(cls => cls.startsWith('language-'))
          ?.replace('language-', '') || 'text';

        const wrapper = document.createElement('div');
        wrapper.className = 'relative my-6 rounded-lg overflow-hidden bg-muted code-enhanced';

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between px-4 py-2 border-b border-gray-700/50';

        const leftContent = document.createElement('div');
        leftContent.className = 'flex items-center gap-2';

        const terminalIcon = document.createElement('svg');
        terminalIcon.setAttribute('width', '16');
        terminalIcon.setAttribute('height', '16');
        terminalIcon.setAttribute('viewBox', '0 0 24 24');
        terminalIcon.setAttribute('fill', 'none');
        terminalIcon.setAttribute('stroke', 'currentColor');
        terminalIcon.setAttribute('stroke-width', '2');
        terminalIcon.className = 'text-gray-400';
        terminalIcon.innerHTML = '<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>';

        const languageLabel = document.createElement('span');
        languageLabel.className = 'text-xs font-mono px-2 py-0.5 rounded text-gray-300';
        languageLabel.textContent = language;

        leftContent.appendChild(terminalIcon);
        leftContent.appendChild(languageLabel);

        const copyButton = document.createElement('button');
        // 过渡类写在 JS 生成的 class 里 Tailwind 扫不到，改用内联 style 保证颜色过渡生效
        copyButton.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 cursor-pointer';
        copyButton.style.transition = 'colors 0.22s ease';
        copyButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>复制代码</span>
        `;

        const clickHandler = async () => {
          const code = codeBlock.textContent || '';
          try {
            await navigator.clipboard.writeText(code);
            copyButton.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-400">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span class="text-green-400">已复制</span>
            `;

            const timeout = setTimeout(() => {
              copyButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>复制代码</span>
              `;
            }, 2000);
            timeouts.push(timeout);
          } catch (err) {
            console.error('复制失败:', err);
          }
        };

        copyButton.addEventListener('click', clickHandler);
        handlers.push({ element: copyButton, type: 'click', fn: clickHandler as EventListener });

        header.appendChild(leftContent);
        header.appendChild(copyButton);

        const codeContainer = document.createElement('div');
        codeContainer.className = 'overflow-x-auto';

        const newPre = document.createElement('pre');
        newPre.className = 'p-4 text-gray-300';
        newPre.appendChild(codeBlock.cloneNode(true));

        codeContainer.appendChild(newPre);

        wrapper.appendChild(header);
        wrapper.appendChild(codeContainer);

        const preParent = pre.parentElement;
        if (preParent) {
          preParent.replaceChild(wrapper, pre);
        }
      });
    };

    processCodeBlocks();

    return () => {
      timeouts.forEach(clearTimeout);
      handlers.forEach(({ element, type, fn }) => {
        element.removeEventListener(type, fn);
      });
    };
  }, [contentRef]);
}
