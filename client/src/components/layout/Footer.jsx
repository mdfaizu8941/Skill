export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 transition-colors duration-200">
      <span>SGIP v1.0.0</span>
      <a
        href="mailto:mohdarsh.developer@gmail.com"
        className="hover:text-slate-300 transition-colors"
      >
        Need help?
      </a>
    </footer>
  )
}
