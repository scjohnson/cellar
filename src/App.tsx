import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import CellarGrid from './components/CellarGrid'
import WineDetail from './components/WineDetail'
import TastingLog from './components/TastingLog'
import CellarDashboard from './components/CellarDashboard'
import Longevity from './components/Longevity'
import { Wine as WineIcon, Activity, Star, LogOut, Lock, Mail, Loader2, Calendar } from 'lucide-react'

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function NavigationItems({ isMobile = false, onNavigate = () => {} }: { isMobile?: boolean, onNavigate?: () => void }) {
  const activeClass = isMobile
    ? "flex flex-col items-center gap-1 py-1 text-burgundy scale-105 font-bold transition-all"
    : "relative px-4 py-2 text-burgundy font-serif font-bold border-b-2 border-burgundy transition-all"

  const inactiveClass = isMobile
    ? "flex flex-col items-center gap-1 py-1 text-warm-muted hover:text-charcoal transition-all"
    : "relative px-4 py-2 text-warm-muted hover:text-charcoal font-serif transition-all"

  if (isMobile) {
    return (
      <>
        <NavLink to="/" onClick={onNavigate} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Activity className="h-5 w-5" />
          <span className="text-[10px] tracking-wider uppercase font-sans">Overview</span>
        </NavLink>
        <NavLink to="/cellar" onClick={onNavigate} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <WineIcon className="h-5 w-5" />
          <span className="text-[10px] tracking-wider uppercase font-sans">Cellar</span>
        </NavLink>
        <NavLink to="/longevity" onClick={onNavigate} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Calendar className="h-5 w-5" />
          <span className="text-[10px] tracking-wider uppercase font-sans">Longevity</span>
        </NavLink>
        <NavLink to="/tastings" onClick={onNavigate} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Star className="h-5 w-5" />
          <span className="text-[10px] tracking-wider uppercase font-sans">Tastings</span>
        </NavLink>
      </>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <NavLink to="/" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        Overview
      </NavLink>
      <NavLink to="/cellar" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        My Cellar
      </NavLink>
      <NavLink to="/longevity" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        Longevity
      </NavLink>
      <NavLink to="/tastings" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
        Tasting Log
      </NavLink>
    </div>
  )
}

function MainLayout() {
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const navigate = useNavigate()

  // Listen to Supabase Auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLoginError(error.message)
      }
    } catch (err: any) {
      setLoginError('An unexpected error occurred. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await supabase.auth.signOut()
      queryClient.clear()
      navigate('/')
    }
  }

  // Loading Screen
  if (authLoading) {
    return (
      <div className="flex-1 bg-cream flex flex-col items-center justify-center p-8 space-y-4 min-h-screen">
        <Loader2 className="w-10 h-10 text-burgundy animate-spin" />
        <p className="text-warm-muted text-xs font-semibold uppercase tracking-wider font-sans">
          Opening Cellar Gates...
        </p>
      </div>
    )
  }

  // Login Screen
  if (!session) {
    return (
      <div className="flex-1 bg-cream flex items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-sm bg-white border border-warm-border rounded-xl p-8 shadow-md space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-burgundy-light text-burgundy border border-burgundy/10 mb-1">
              <WineIcon className="h-8 w-8" />
            </div>
            <h1 className="text-burgundy font-serif font-black text-2xl tracking-tight">
              Stephen & Jennifer
            </h1>
            <p className="text-gold font-sans text-xs tracking-wider uppercase font-semibold">
              Private Wine Cellar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-medium">
                {loginError}
              </div>
            )}

            <div className="space-y-3.5">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-warm-muted" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-cream border border-warm-border rounded-md pl-9.5 pr-4 py-2.5 text-sm text-charcoal placeholder-warm-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-warm-muted" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-cream border border-warm-border rounded-md pl-9.5 pr-4 py-2.5 text-sm text-charcoal placeholder-warm-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-burgundy hover:bg-burgundy-hover active:scale-[0.98] disabled:opacity-50 text-white font-serif text-sm font-bold py-2.5 px-4 rounded-md shadow-sm transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Entering Cellar...</span>
                </>
              ) : (
                <span>Access Cellar</span>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Logged-in application layout
  return (
    <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-cream relative font-sans text-charcoal">
      {/* Desktop Top Header Bar (md+) */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-warm-border shadow-sm z-30 shrink-0">
        <div className="flex flex-col">
          <span className="text-burgundy font-serif font-black text-xl tracking-tight leading-none">
            Stephen & Jennifer
          </span>
          <span className="text-gold font-sans text-[10px] tracking-wider uppercase font-semibold mt-0.5">
            Private Cellar & Tasting Log
          </span>
        </div>

        {/* Central Nav Links */}
        <nav className="flex items-center">
          <NavigationItems />
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-warm-border text-warm-muted hover:text-burgundy hover:border-burgundy/20 hover:bg-burgundy-light/30 text-xs font-semibold transition-all duration-150 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </button>
      </header>

      {/* Mobile Top Header (under md) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-warm-border z-30 shrink-0">
        <div className="flex flex-col">
          <span className="text-burgundy font-serif font-bold text-base tracking-tight leading-none">
            Stephen & Jennifer
          </span>
          <span className="text-gold font-sans text-[9px] tracking-wider uppercase font-medium mt-0.5">
            Private Cellar
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-1 rounded text-warm-muted hover:text-burgundy hover:bg-burgundy-light/40 transition-colors cursor-pointer"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Main content display based on routes */}
      <div className="flex-1 flex flex-col min-h-0 pb-16 md:pb-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<CellarDashboard />} />
          <Route path="/cellar" element={<CellarGrid />} />
          <Route path="/longevity" element={<Longevity />} />
          <Route path="/tastings" element={<TastingLog />} />
          <Route path="/wine/:id" element={<WineDetail />} />
        </Routes>
      </div>

      {/* Mobile Navigation Bar - Bottom Sticky (under md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-warm-border flex items-center justify-around px-4 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <NavigationItems isMobile={true} />
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
