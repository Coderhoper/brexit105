import React, { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import POS from './pages/POS'
import Purchases from './pages/Purchases'
import StockMovements from './pages/StockMovements'
import Workers from './pages/Workers'
import Expenses from './pages/Expenses'
import Salaries from './pages/Salaries'
import Reports from './pages/Reports'
import SalesHistory from './pages/SalesHistory'
import Receipts from './pages/Receipts'
import Customers from './pages/Customers'
import Settings from './pages/Settings'
import AuditLogs from './pages/AuditLogs'
import ProtectedRoute from './components/ProtectedRoute'
import { getStoredUser } from './api'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/pos', label: 'POS' },
  { to: '/sales-history', label: 'Sales History' },
  { to: '/receipts', label: 'Receipts' },
  { to: '/customers', label: 'Customers' },
  { to: '/reports', label: 'Reports' },
  { to: '/purchases', label: 'Purchases', ownerOnly: true },
  { to: '/stock-movements', label: 'Stock', ownerOnly: true },
  { to: '/workers', label: 'Workers', ownerOnly: true },
  { to: '/expenses', label: 'Expenses', ownerOnly: true },
  { to: '/salaries', label: 'Salaries', ownerOnly: true },
  { to: '/settings', label: 'Settings', ownerOnly: true },
  { to: '/audit-logs', label: 'Audit Logs', ownerOnly: true }
]

const navItem = ({ to, label }) => (
  <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
    {label}
  </NavLink>
)

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [user, setUser] = useState(() => getStoredUser())

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser())
    syncUser()
    window.addEventListener('session:updated', syncUser)
    return () => window.removeEventListener('session:updated', syncUser)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('session:updated'))
    window.location.href = '/login'
  }

  const isOwner = user?.role === 'owner'

  return (
    <div className="app-shell min-h-screen bg-slate-100 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-bold text-white">D</div>
            <div>
              <div className="text-lg font-bold tracking-tight">Danlu POS</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Inventory & operations</div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navLinks
              .filter((link) => !link.ownerOnly || isOwner)
              .map((link) => (
                <React.Fragment key={link.to}>{navItem(link)}</React.Fragment>
              ))}
          </nav>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setDarkMode((value) => !value)} className="btn btn-ghost">
              {darkMode ? 'Light' : 'Dark'}
            </button>
            {isOwner && (
              <div className="hidden rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 sm:inline-flex">
                Admin
              </div>
            )}
            <button onClick={handleLogout} className="hidden btn btn-danger sm:inline-flex">
              Logout
            </button>
            <button type="button" onClick={() => setMenuOpen((value) => !value)} className="btn btn-ghost md:hidden" aria-label="Toggle menu">
              ☰
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks
                .filter((link) => !link.ownerOnly || isOwner)
                .map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `rounded-xl px-3 py-2 text-sm font-medium ${
                        isActive ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              <button onClick={handleLogout} className="mt-2 btn btn-danger w-full">
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="container py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
          <Route path="/sales-history" element={<ProtectedRoute><SalesHistory /></ProtectedRoute>} />
          <Route path="/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
          <Route path="/stock-movements" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />
          <Route path="/workers" element={<ProtectedRoute><Workers /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/salaries" element={<ProtectedRoute><Salaries /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}
