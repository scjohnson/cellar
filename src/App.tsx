import React, { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from './lib/supabaseClient'
import CellarGrid from './components/CellarGrid'
import WineDetail from './components/WineDetail'
import TastingLog from './components/TastingLog'
import CellarDashboard from './components/CellarDashboard'
import { Wine as WineIcon, Activity, Star, LogOut, Lock, Mail, Loader2 } from 'lucide-react'

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

type Tab = 'cellar' | 'tastings' | 'dashboard'

function MainLayout() {
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Navigation states
  const [currentTab, setCurrentTab] = useState<Tab>('cellar')
  const [selectedWineId, setSelectedWineId] = useState<string | null>(null)

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
      setCurrentTab('cellar')
      setSelectedWineId(null)
    }
  }

  // Loading Screen
  if (authLoading) {
    return (
      <div className="flex-1 bg-[#0c0a09] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-10 h-10 text-rose-550 animate-spin" />
        <p className="text-stone-400 text-xs font-semibold uppercase tracking-wider">
          Initializing Wine Tracker...
        </p>
      </div>
    )
  }

  // Login Screen
  if (!session) {
    return (
      <div className="flex-1 bg-[#0c0a09] flex items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-sm bg-[#131110] border border-stone-850/80 rounded-2xl p-6.5 shadow-2xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-rose-950/20 border border-rose-900/40 text-rose-450 mb-1">
              <WineIcon className="h-7 w-7" />
            </div>
            <h1 className="text-stone-100 font-extrabold text-2xl tracking-tight font-serif">
              Stephen & Jennifer
            </h1>
            <p className="text-stone-500 text-xs tracking-wider uppercase font-semibold">
              Private Wine Cellar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-3 text-xs text-rose-350 font-medium">
                {loginError}
              </div>
            )}

            <div className="space-y-3.5">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-stone-500" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-stone-900/60 border border-stone-800 rounded-lg pl-9.5 pr-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-700 transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-stone-500" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-stone-900/60 border border-stone-800 rounded-lg pl-9.5 pr-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-700 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-rose-900 hover:bg-rose-800 active:scale-[0.98] disabled:opacity-50 text-stone-100 text-sm font-bold py-2.5 px-4 rounded-lg border border-rose-850 shadow transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging in...</span>
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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0c0a09] relative">
      {/* Detail view takes up the whole layout when selected */}
      {selectedWineId ? (
        <WineDetail wineId={selectedWineId} onBack={() => setSelectedWineId(null)} />
      ) : (
        <>
          {/* Main content display based on selected tab */}
          <div className="flex-1 flex flex-col min-h-0 pb-16">
            {currentTab === 'cellar' && (
              <CellarGrid onSelectWine={(id) => setSelectedWineId(id)} />
            )}
            {currentTab === 'tastings' && (
              <TastingLog onSelectWine={(id) => setSelectedWineId(id)} />
            )}
            {currentTab === 'dashboard' && (
              <div className="flex-1 flex flex-col min-h-0">
                <CellarDashboard onSelectWine={(id) => setSelectedWineId(id)} />
                {/* Logout row at the bottom of the dashboard */}
                <div className="p-4 border-t border-stone-850 bg-stone-900/20 flex justify-center">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 hover:bg-rose-950/20 hover:text-rose-400 border border-stone-800 hover:border-rose-900/40 text-stone-400 text-xs font-semibold transition-all duration-150"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Bar - Bottom Sticky */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#131110]/95 backdrop-blur-md border-t border-stone-850 flex items-center justify-around px-4 z-20">
            <button
              onClick={() => setCurrentTab('cellar')}
              className={`flex flex-col items-center gap-1 py-1 transition-all ${
                currentTab === 'cellar' ? 'text-rose-450 scale-105' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <WineIcon className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-wide uppercase">Cellar</span>
            </button>

            <button
              onClick={() => setCurrentTab('tastings')}
              className={`flex flex-col items-center gap-1 py-1 transition-all ${
                currentTab === 'tastings' ? 'text-rose-455 scale-105' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <Star className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-wide uppercase">Tastings</span>
            </button>

            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex flex-col items-center gap-1 py-1 transition-all ${
                currentTab === 'dashboard' ? 'text-rose-455 scale-105' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <Activity className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-wide uppercase">Stats</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout />
    </QueryClientProvider>
  )
}
