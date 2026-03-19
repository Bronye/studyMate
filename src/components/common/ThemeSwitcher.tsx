import { useThemeStore, ThemeName, themeNames, themeDescriptions } from '../../stores/themeStore';

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();
  
  const themes: ThemeName[] = ['arcade', 'minimal', 'cyberpunk', 'nature', 'pastel', 'cyberspace', 'rpg'];
  
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold" style={{ color: 'var(--theme-text-secondary)' }}>
        App Theme
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {themes.map((themeName) => (
          <button
            key={themeName}
            onClick={() => setTheme(themeName)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
              theme === themeName
                ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10'
                : 'border-[var(--theme-border-subtle)] hover:border-[var(--theme-border)]'
            }`}
            style={{
              backgroundColor: theme === themeName 
                ? 'color-mix(in srgb, var(--theme-primary) 10%, transparent)'
                : 'transparent',
              borderColor: theme === themeName 
                ? 'var(--theme-primary)' 
                : 'var(--theme-border-subtle)',
            }}
          >
            <span 
              className="block font-semibold text-sm"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {themeNames[themeName]}
            </span>
            <span 
              className="block text-xs mt-1"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              {themeDescriptions[themeName]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
