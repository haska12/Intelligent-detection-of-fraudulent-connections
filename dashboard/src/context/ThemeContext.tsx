import { createContext, useContext, useEffect, useState } from 'react'
type Theme = 'dark' | 'light'
interface Ctx { theme: Theme; toggle: () => void; isDark: boolean }
const ThemeCtx = createContext<Ctx>({ theme: 'dark', toggle: () => {}, isDark: true })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('dxc-theme') as Theme) ?? 'dark')
  useEffect(() => {
    document.body.classList.remove('dark', 'light')
    document.body.classList.add(theme)
    localStorage.setItem('dxc-theme', theme)
  }, [theme])
  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark'), isDark: theme === 'dark' }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
