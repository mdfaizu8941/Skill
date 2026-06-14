export const getTheme = () => localStorage.getItem('sgip_theme') || 'light'

export const setTheme = (theme) => {
  localStorage.setItem('sgip_theme', theme)
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const toggleTheme = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark')

export const initTheme = () => setTheme(getTheme())
