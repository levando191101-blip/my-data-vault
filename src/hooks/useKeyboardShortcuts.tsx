import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl || event.metaKey === shortcut.ctrl;
        const shiftMatch = shortcut.shift === undefined || event.shiftKey === shortcut.shift;
        const altMatch = shortcut.alt === undefined || event.altKey === shortcut.alt;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Global keyboard shortcuts hook
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      action: () => navigate('/search'),
      description: '打开搜索',
    },
    {
      key: 'u',
      ctrl: true,
      action: () => navigate('/upload'),
      description: '打开上传',
    },
    {
      key: 'h',
      ctrl: true,
      action: () => navigate('/'),
      description: '返回首页',
    },
    {
      key: 'm',
      ctrl: true,
      action: () => navigate('/materials'),
      description: '我的资料',
    },
    {
      key: 't',
      ctrl: true,
      action: () => navigate('/trash'),
      description: '回收站',
    },
    {
      key: ',',
      ctrl: true,
      action: () => navigate('/settings'),
      description: '设置',
    },
  ]);
}

// Shortcut help component
export function ShortcutHelp() {
  const shortcuts = [
    { keys: ['Ctrl', 'K'], description: '打开搜索' },
    { keys: ['Ctrl', 'U'], description: '打开上传' },
    { keys: ['Ctrl', 'H'], description: '返回首页' },
    { keys: ['Ctrl', 'M'], description: '我的资料' },
    { keys: ['Ctrl', 'T'], description: '回收站' },
    { keys: ['Ctrl', ','], description: '设置' },
    { keys: ['Esc'], description: '关闭对话框' },
  ];

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">键盘快捷键</h3>
      <div className="grid gap-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{shortcut.description}</span>
            <div className="flex gap-1">
              {shortcut.keys.map((key, i) => (
                <kbd
                  key={i}
                  className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

