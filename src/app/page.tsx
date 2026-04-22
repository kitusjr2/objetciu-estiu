'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Trophy, PartyPopper, Heart, RotateCcw,
  Star, Zap, Crown, Sparkles,
  Moon, Sun, Share2, Clock,
  ChevronUp, TrendingUp, Medal, Users, Hash,
  ArrowUp, ArrowDown, Minus, RefreshCw
} from 'lucide-react'

/* ─── Types ─── */
interface Candidate {
  id: string
  name: string
  nickname: string
  photo: string
  lligatCount: number
  order: number
}

interface ActivityEntry {
  id: string
  personId: string
  personName: string
  action: string
  value: number
  createdAt: string
}

/* ─── Exempt participants (ElRey is GAY and lliga molt, would humiliate everyone) ─── */
const EXEMPT_IDS = new Set(['elrey'])

/* ─── Confetti ─── */
function Confetti() {
  const colors = ['#f97316', '#ef4444', '#ec4899', '#eab308', '#22c55e', '#8b5cf6', '#06b6d4']
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 100 }).map((_, i) => {
        const color = colors[i % colors.length]
        const left = Math.random() * 100
        const delay = Math.random() * 2
        const duration = 2.5 + Math.random() * 3
        const size = 6 + Math.random() * 10
        const isCircle = Math.random() > 0.5
        return (
          <motion.div
            key={i}
            initial={{ y: -30, x: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 60 : 1000,
              x: (Math.random() - 0.5) * 400,
              rotate: 360 + Math.random() * 720,
              opacity: 0,
            }}
            transition={{ duration, delay, ease: 'easeIn' }}
            style={{
              position: 'absolute', left: `${left}%`, top: -30,
              width: size, height: isCircle ? size : size * 0.4,
              backgroundColor: color, borderRadius: isCircle ? '50%' : '2px',
            }}
          />
        )
      })}
    </div>
  )
}

/* ─── Floating particles ─── */
function FloatingParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 20 }).map((_, i) => {
        const size = 2 + Math.random() * 7
        const left = Math.random() * 100
        const delay = Math.random() * 15
        const duration = 20 + Math.random() * 25
        const colors = ['bg-orange-300/15', 'bg-rose-300/10', 'bg-amber-300/15', 'bg-yellow-300/10']
        return (
          <motion.div
            key={i}
            className={`absolute rounded-full ${colors[i % colors.length]}`}
            style={{ width: size, height: size, left: `${left}%` }}
            animate={{ y: ['-10vh', '110vh'], x: [0, (Math.random() - 0.5) * 100] }}
            transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
          />
        )
      })}
    </div>
  )
}

/* ─── Toast notifications ─── */
interface ToastData {
  id: number
  message: string
  type: 'success' | 'info' | 'warning'
}

function ToastContainer({ toasts }: { toasts: ToastData[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-sm font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-green-500/90 text-white border-green-400/50'
                : toast.type === 'warning'
                ? 'bg-amber-500/90 text-white border-amber-400/50'
                : 'bg-orange-500/90 text-white border-orange-400/50'
            }`}
          >
            {toast.type === 'success' ? <Star className="w-4 h-4" /> : toast.type === 'warning' ? <Trophy className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ─── Utility ─── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'ara mateix'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `fa ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `fa ${hours}h`
  const days = Math.floor(hours / 24)
  return `fa ${days}d`
}

/* ─── Main Component ─── */
export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('objetciu-dark-mode') === 'true'
  })
  const [showTimeline, setShowTimeline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const toastId = useRef(0)
  const prevTopId = useRef<string | null>(null)

  // Image position adjustments (shift image down to show face)
  const imagePositionOverrides: Record<string, string> = {
    putraskito: 'center 30%',
  }

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      const [candRes, actRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/activity'),
      ])
      const candData = await candRes.json()
      const actData = await actRes.json()
      setCandidates(candData)
      setActivity(actData)
    } catch {
      // fallback: keep current state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh every 10 seconds (so friends see each other's changes)
  useEffect(() => {
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Dark mode
  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode) }, [darkMode])
  useEffect(() => { localStorage.setItem('objetciu-dark-mode', String(darkMode)) }, [darkMode])

  // Confetti when someone takes the #1 spot
  useEffect(() => {
    const sorted = [...candidates].sort((a, b) => b.lligatCount - a.lligatCount)
    if (sorted.length > 0 && sorted[0].lligatCount > 0) {
      const newTopId = sorted[0].id
      if (prevTopId.current !== null && prevTopId.current !== newTopId && sorted[0].lligatCount > 0) {
        // New person took #1!
        triggerConfetti()
        addToast(`${sorted[0].name} és el nou líder! 👑`, 'warning')
      }
      prevTopId.current = newTopId
    }
  }, [candidates])

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== id)) }, 3000)
  }, [])

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 6000)
  }, [])

  const updateCount = useCallback(async (id: string, newCount: number) => {
    if (newCount < 0) newCount = 0
    // Optimistic update
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, lligatCount: newCount } : c))

    try {
      await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lligatCount: newCount }),
      })
      // Refresh activity
      const actRes = await fetch('/api/activity')
      setActivity(await actRes.json())
    } catch {
      addToast('Error guardant', 'info')
      fetchData() // rollback
    }
  }, [fetchData, addToast])

  const increment = useCallback((id: string) => {
    setCandidates((prev) => {
      const c = prev.find((c) => c.id === id)
      if (!c) return prev
      const newCount = c.lligatCount + 1
      // Fire and forget API update
      fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lligatCount: newCount }),
      }).then(() => {
        fetch('/api/activity').then(r => r.json()).then(setActivity)
      })
      addToast(`${c.name} +1! 💪`, 'success')
      return prev.map((p) => p.id === id ? { ...p, lligatCount: newCount } : p)
    })
  }, [addToast])

  const decrement = useCallback((id: string) => {
    setCandidates((prev) => {
      const c = prev.find((c) => c.id === id)
      if (!c || c.lligatCount <= 0) return prev
      const newCount = c.lligatCount - 1
      fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lligatCount: newCount }),
      }).then(() => {
        fetch('/api/activity').then(r => r.json()).then(setActivity)
      })
      return prev.map((p) => p.id === id ? { ...p, lligatCount: newCount } : p)
    })
  }, [])

  const handleInputSubmit = useCallback((id: string) => {
    const val = parseInt(editValue, 10)
    if (!isNaN(val) && val >= 0) {
      updateCount(id, val)
      const c = candidates.find((c) => c.id === id)
      if (c) addToast(`${c.name}: ${val} lligat${val !== 1 ? 's' : ''}`, 'success')
    }
    setEditingId(null)
    setEditValue('')
  }, [editValue, updateCount, candidates, addToast])

  const resetAll = useCallback(async () => {
    // Optimistic
    setCandidates((prev) => prev.map((c) => ({ ...c, lligatCount: 0 })))
    try {
      await Promise.all(candidates.map((c) =>
        fetch(`/api/candidates/${c.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lligatCount: 0 }),
        })
      ))
      addToast('Tot reiniciat!', 'info')
      fetchData()
    } catch {
      fetchData()
    }
  }, [candidates, fetchData, addToast])

  const shareSummary = useCallback(() => {
    const nonExempt = candidates.filter((c) => !EXEMPT_IDS.has(c.id))
    const shareSorted = [...nonExempt].sort((a, b) => b.lligatCount - a.lligatCount)
    const lines = shareSorted.map((c, i) => {
      const medal = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '
      return `${medal} ${c.name}: ${c.lligatCount}`
    }).join('\n')
    const total = nonExempt.reduce((s, c) => s + c.lligatCount, 0)
    const exempt = candidates.filter((c) => EXEMPT_IDS.has(c.id))
    const exemptLine = exempt.length > 0 ? `\n\n🏳️‍🌈 Exempt${exempt.length > 1 ? 's' : ''}: ${exempt.map((c) => c.name).join(', ')} (no participen, lliguen massa)` : ''
    const text = `🔥 CLASSIFICACIÓ LIGUES ESTIU 🔥\n\n${lines}\n\n📊 Total del grup: ${total} lligues${exemptLine}\n\nActualitzat: ${new Date().toLocaleString('ca-ES')}`
    navigator.clipboard.writeText(text).then(() => {
      addToast('Classificació copiada!', 'success')
    }).catch(() => {
      addToast('No s\'ha pogut copiar', 'info')
    })
  }, [candidates, addToast])

  // Derived data (exempt participants go to bottom of leaderboard, don't compete for rank)
  const sorted = [...candidates].sort((a, b) => {
    // Exempt participants always go last
    const aExempt = EXEMPT_IDS.has(a.id) ? 1 : 0
    const bExempt = EXEMPT_IDS.has(b.id) ? 1 : 0
    if (aExempt !== bExempt) return aExempt - bExempt
    return b.lligatCount - a.lligatCount || a.order - b.order
  })
  const totalLligues = candidates.filter((c) => !EXEMPT_IDS.has(c.id)).reduce((s, c) => s + c.lligatCount, 0)
  const nonExemptCandidates = candidates.filter((c) => !EXEMPT_IDS.has(c.id))
  const avgLligues = nonExemptCandidates.length > 0 ? (totalLligues / nonExemptCandidates.length).toFixed(1) : '0'
  const topCandidate = sorted.find((c) => !EXEMPT_IDS.has(c.id))
  const activeCount = nonExemptCandidates.filter((c) => c.lligatCount > 0).length

  const getRankDisplay = (i: number, isExempt?: boolean) => {
    if (isExempt) return '🏳️'
    if (i === 0) return '👑'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `${i + 1}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10"
        >
          <Flame className="w-10 h-10 text-orange-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`min-h-screen flex flex-col relative transition-colors duration-500 ${
        darkMode ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'
      }`}>
        <FloatingParticles />
        {showConfetti && <Confetti />}
        <ToastContainer toasts={toasts} />

        {/* Background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl transition-colors duration-700 ${darkMode ? 'bg-orange-500/5' : 'bg-orange-200/20'}`} />
          <div className={`absolute top-1/3 -left-20 w-72 h-72 rounded-full blur-3xl transition-colors duration-700 ${darkMode ? 'bg-yellow-500/5' : 'bg-yellow-200/20'}`} />
          <div className={`absolute -bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl transition-colors duration-700 ${darkMode ? 'bg-rose-500/5' : 'bg-rose-200/15'}`} />
        </div>

        {/* ─── Header ─── */}
        <header className="relative z-10 pt-5 sm:pt-7 pb-3 px-4">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center max-w-5xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1.5">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </motion.div>
              <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-rose-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
                Qui lliga més aquest estiu?
              </h1>
              <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </motion.div>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 italic">
              &ldquo;El que compta és el nombre&rdquo; 🔥
            </p>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
            >
              {/* Total badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 backdrop-blur-md rounded-full shadow-lg border transition-colors duration-500 ${
                darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/70 border-orange-100'
              }`}>
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{totalLligues}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">lligues totals</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={shareSummary}
                      className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-orange-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 gap-1">
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Compartir</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Compartir classificació</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setShowTimeline(!showTimeline)}
                      className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-orange-200 dark:border-gray-700 gap-1 transition-colors ${
                        showTimeline ? 'bg-orange-100 dark:bg-orange-900/30' : 'hover:bg-orange-50 dark:hover:bg-gray-700'
                      } text-gray-600 dark:text-gray-300`}>
                      <Clock className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Activitat recent</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)}
                      className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-orange-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 gap-1">
                      {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{darkMode ? 'Mode clar' : 'Mode fosc'}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={resetAll}
                      className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-orange-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 gap-1">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reiniciar tot a 0</TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          </motion.div>
        </header>

        {/* ─── Activity Timeline ─── */}
        <AnimatePresence>
          {showTimeline && activity.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative z-10 px-4 max-w-7xl mx-auto w-full overflow-hidden"
            >
              <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-lg overflow-hidden mb-4">
                <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400" />
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Activitat Recent</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowTimeline(false)} className="ml-auto h-6 w-6 p-0">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1">
                    {activity.slice(0, 20).map((entry) => (
                      <div key={entry.id} className={`flex items-center gap-2 text-xs py-1 px-2 rounded-lg ${
                        entry.action === 'increment'
                          ? 'bg-green-50/60 dark:bg-green-900/15 text-green-700 dark:text-green-400'
                          : 'bg-red-50/60 dark:bg-red-900/15 text-red-600 dark:text-red-400'
                      }`}>
                        {entry.action === 'increment' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        <span className="font-medium">{entry.personName}</span>
                        <span>{entry.action === 'increment' ? '+1' : '-1'}</span>
                        <span className="text-[10px]">→ {entry.value}</span>
                        <span className="ml-auto text-[10px] opacity-60">{timeAgo(entry.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Main Content ─── */}
        <main className="relative z-10 flex-1 px-3 sm:px-4 pb-8 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5"
          >
            {/* ─── Left: Candidates with counters ─── */}
            <div className="lg:col-span-5">
              <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500" />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">Els Candidates</h2>
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {candidates.length} persones
                    </span>
                  </div>
                  <Separator className="mb-3 bg-orange-100 dark:bg-gray-700" />

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {candidates.map((person, index) => {
                      const rank = sorted.findIndex((s) => s.id === person.id)
                      const isExempt = EXEMPT_IDS.has(person.id)
                      return (
                        <motion.div
                          key={person.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.06 * index, duration: 0.4 }}
                          whileHover={{ scale: 1.03, y: -2 }}
                          className={`relative group rounded-2xl overflow-hidden transition-all duration-300 ${
                            isExempt ? 'ring-2 ring-purple-400/60 dark:ring-purple-500/40 shadow-md shadow-purple-200/20 dark:shadow-purple-500/10' :
                            rank === 0 && person.lligatCount > 0
                              ? 'ring-2 ring-amber-400 dark:ring-amber-500 shadow-lg shadow-amber-200/40 dark:shadow-amber-500/20'
                              : person.lligatCount > 0
                              ? 'ring-2 ring-green-400/60 dark:ring-green-500/40 shadow-md'
                              : 'ring-1 ring-gray-200/80 dark:ring-gray-700/80'
                          }`}
                        >
                          <div className="aspect-square relative">
                            <img
                              src={person.photo}
                              alt={person.name}
                              style={imagePositionOverrides[person.id] ? { objectPosition: imagePositionOverrides[person.id] } : undefined}
                              className={`w-full h-full object-cover transition-all duration-500 ${
                                EXEMPT_IDS.has(person.id) ? 'brightness-75 grayscale-[30%]' :
                                rank === 0 && person.lligatCount > 0 ? 'brightness-110 saturate-150' : person.lligatCount > 0 ? 'brightness-105 saturate-120' : 'brightness-90'
                              }`}
                            />

                            {/* Exempt badge */}
                            {EXEMPT_IDS.has(person.id) && (
                              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold shadow-lg bg-purple-500/90 text-white flex items-center gap-0.5">
                                🏳️‍🌈 EXEMPT
                              </div>
                            )}

                            {/* Rank badge */}
                            {person.lligatCount > 0 && !EXEMPT_IDS.has(person.id) && (
                              <div className={`absolute top-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                                rank === 0 ? 'bg-amber-400 text-amber-900' : rank === 1 ? 'bg-gray-300 text-gray-700' : rank === 2 ? 'bg-orange-400 text-orange-900' : 'bg-black/50 text-white'
                              }`}>
                                {rank + 1}
                              </div>
                            )}

                            {/* Count display */}
                            <div className="absolute top-1.5 right-1.5">
                              <motion.div
                                key={person.lligatCount}
                                initial={{ scale: 1.4 }}
                                animate={{ scale: 1 }}
                                className={`px-2 py-0.5 rounded-full text-sm font-extrabold shadow-lg ${
                                  person.lligatCount > 0
                                    ? 'bg-green-500 text-white'
                                    : 'bg-black/40 text-white/70'
                                }`}>
                                {person.lligatCount}
                              </motion.div>
                            </div>

                            {/* Bottom overlay with name + counter */}
                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                              <p className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1">
                                {person.name}
                                {EXEMPT_IDS.has(person.id) && <span className="text-[8px] text-purple-300 font-normal">(exempt)</span>}
                              </p>
                              {/* Inline counter buttons */}
                              {EXEMPT_IDS.has(person.id) ? (
                                <div className="flex items-center justify-center mt-1">
                                  <span className="text-[10px] text-purple-300/80 italic">🏳️‍🌈 No participa (liga massa)</span>
                                </div>
                              ) : (
                              <div className="flex items-center gap-1 mt-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); decrement(person.id) }}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                    person.lligatCount > 0
                                      ? 'bg-red-500/80 hover:bg-red-600 text-white'
                                      : 'bg-white/20 text-white/40 cursor-not-allowed'
                                  }`}
                                >
                                  −
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingId(person.id); setEditValue(String(person.lligatCount)) }}
                                  className="flex-1 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors flex items-center justify-center"
                                >
                                  {person.lligatCount} lligat{person.lligatCount !== 1 ? 's' : ''}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); increment(person.id) }}
                                  className="w-6 h-6 rounded-full bg-green-500/80 hover:bg-green-600 text-white text-xs font-bold transition-colors flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                              )}
                            </div>

                            {/* Crown for #1 */}
                            <AnimatePresence>
                              {rank === 0 && person.lligatCount > 0 && (
                                <motion.div
                                  initial={{ y: -20, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: -20, opacity: 0 }}
                                  className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1"
                                >
                                  <Crown className="w-6 h-6 text-amber-400 drop-shadow-lg" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Middle: Leaderboard ─── */}
            <div className="lg:col-span-4">
              <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">Classificació</h2>
                    <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> auto-refresh
                    </span>
                  </div>
                  <Separator className="mb-3 bg-orange-100 dark:bg-gray-700" />

                  {sorted.filter((c) => !EXEMPT_IDS.has(c.id)).every((c) => c.lligatCount === 0) ? (
                    <div className="text-center py-8">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      </motion.div>
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">Encara ningú ha lligat...</p>
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Sigues el primer! Suma +1 💪</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[560px] overflow-y-auto custom-scrollbar">
                      {sorted.map((person, index) => {
                        const nonExemptSorted = sorted.filter((c) => !EXEMPT_IDS.has(c.id))
                        const maxCount = nonExemptSorted[0]?.lligatCount || 1
                        const barWidth = maxCount > 0 ? (person.lligatCount / maxCount) * 100 : 0
                        return (
                          <motion.div
                            key={person.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.03 * index }}
                            className={`relative flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-500 ${
                              EXEMPT_IDS.has(person.id)
                                ? 'bg-purple-50/60 dark:bg-purple-900/15 border border-purple-200/40 dark:border-purple-800/30'
                                : index === 0
                                ? 'bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50'
                                : index === 1
                                ? 'bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50'
                                : index === 2
                                ? 'bg-orange-50/80 dark:bg-orange-900/15 border border-orange-200/50 dark:border-orange-800/50'
                                : 'border border-transparent hover:bg-orange-50/30 dark:hover:bg-gray-800/20'
                            }`}
                          >
                            {/* Rank */}
                            <span className="text-lg w-8 text-center flex-shrink-0">{getRankDisplay(index, EXEMPT_IDS.has(person.id))}</span>

                            {/* Photo */}
                            <div className={`relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${
                              index === 0 ? 'ring-2 ring-amber-400' : 'ring-1 ring-gray-200 dark:ring-gray-700'
                            }`}>
                              <img src={person.photo} alt={person.name}
                                style={imagePositionOverrides[person.id] ? { objectPosition: imagePositionOverrides[person.id] } : undefined}
                                className={`w-full h-full object-cover ${EXEMPT_IDS.has(person.id) ? 'grayscale-[30%] opacity-70' : ''}`}
                              />
                            </div>

                            {/* Name + bar */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-1.5">
                                <p className={`text-sm font-bold truncate ${EXEMPT_IDS.has(person.id) ? 'text-purple-500 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>{person.name}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{person.nickname}</p>
                                {EXEMPT_IDS.has(person.id) && <span className="text-[9px] text-purple-400 dark:text-purple-500 font-medium">🏳️‍🌈 EXEMPT</span>}
                              </div>
                              {/* Progress bar */}
                              {person.lligatCount > 0 && !EXEMPT_IDS.has(person.id) && (
                                <div className="mt-1 h-1.5 w-full bg-gray-200/60 dark:bg-gray-700/40 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barWidth}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Count + buttons */}
                            {EXEMPT_IDS.has(person.id) ? (
                              <span className="text-[10px] text-purple-400 dark:text-purple-500 italic flex-shrink-0">No participa</span>
                            ) : (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => decrement(person.id)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                  person.lligatCount > 0
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                }`}
                              >
                                −
                              </button>
                              <motion.span
                                key={person.lligatCount}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="w-8 text-center text-lg font-extrabold text-gray-800 dark:text-gray-200"
                              >
                                {person.lligatCount}
                              </motion.span>
                              <button
                                onClick={() => increment(person.id)}
                                className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center justify-center text-xs font-bold transition-colors"
                              >
                                +
                              </button>
                            </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  )}

                  {/* Direct number input */}
                  <AnimatePresence>
                    {editingId && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-3 p-3 bg-orange-50/80 dark:bg-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50"
                      >
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Editar comptador de <strong>{candidates.find((c) => c.id === editingId)?.name}</strong>:
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleInputSubmit(editingId!) }}
                            className="h-8 text-center font-bold"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleInputSubmit(editingId!)} className="bg-green-500 hover:bg-green-600 text-white">
                            ✓
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditValue('') }}>
                            ✕
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* ─── Right: Stats ─── */}
            <div className="lg:col-span-3 space-y-4">
              {/* Group Stats */}
              <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400" />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-rose-500" />
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">Estadístiques</h2>
                  </div>
                  <Separator className="mb-3 bg-orange-100 dark:bg-gray-700" />

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-xl p-2.5 text-center border border-orange-100/50 dark:border-orange-800/30">
                      <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{totalLligues}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Total lligues</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/10 rounded-xl p-2.5 text-center border border-rose-100/50 dark:border-rose-800/30">
                      <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{avgLligues}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Mitjana</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl p-2.5 text-center border border-green-100/50 dark:border-green-800/30">
                      <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">{activeCount}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Actius</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 rounded-xl p-2.5 text-center border border-amber-100/50 dark:border-amber-800/30">
                      <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 truncate">
                        {topCandidate && topCandidate.lligatCount > 0 ? topCandidate.name : '—'}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Líder</p>
                    </div>
                  </div>

                  {/* Leader podium */}
                  {sorted.filter((c) => c.lligatCount > 0).length >= 2 && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-100/30 dark:border-amber-800/20">
                      <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 text-center">PodIUM</p>
                      <div className="flex items-end justify-center gap-1.5">
                        {/* 2nd place */}
                        {sorted[1] && sorted[1].lligatCount > 0 && (
                          <div className="text-center flex-1">
                            <div className="relative w-9 h-9 mx-auto rounded-full overflow-hidden ring-2 ring-gray-300 dark:ring-gray-600 mb-1">
                              <img src={sorted[1].photo} alt={sorted[1].name} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[9px] font-bold text-gray-600 dark:text-gray-400 truncate">{sorted[1].name}</p>
                            <div className="mt-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-bold text-gray-600 dark:text-gray-400 py-0.5">
                              {sorted[1].lligatCount}
                            </div>
                            <div className="h-12 bg-gray-200/50 dark:bg-gray-700/50 rounded-t mt-1" />
                            <span className="text-xs">🥈</span>
                          </div>
                        )}
                        {/* 1st place */}
                        {sorted[0] && sorted[0].lligatCount > 0 && (
                          <div className="text-center flex-1">
                            <Crown className="w-5 h-5 text-amber-400 mx-auto mb-0.5" />
                            <div className="relative w-11 h-11 mx-auto rounded-full overflow-hidden ring-2 ring-amber-400 mb-1">
                              <img src={sorted[0].photo} alt={sorted[0].name} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 truncate">{sorted[0].name}</p>
                            <div className="mt-0.5 bg-amber-200 dark:bg-amber-800/50 rounded text-[11px] font-bold text-amber-700 dark:text-amber-400 py-0.5">
                              {sorted[0].lligatCount}
                            </div>
                            <div className="h-16 bg-amber-200/50 dark:bg-amber-800/30 rounded-t mt-1" />
                            <span className="text-sm">👑</span>
                          </div>
                        )}
                        {/* 3rd place */}
                        {sorted[2] && sorted[2].lligatCount > 0 && (
                          <div className="text-center flex-1">
                            <div className="relative w-9 h-9 mx-auto rounded-full overflow-hidden ring-2 ring-orange-300 dark:ring-orange-700 mb-1">
                              <img src={sorted[2].photo} alt={sorted[2].name} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[9px] font-bold text-gray-600 dark:text-gray-400 truncate">{sorted[2].name}</p>
                            <div className="mt-0.5 bg-orange-200 dark:bg-orange-800/50 rounded text-[10px] font-bold text-orange-700 dark:text-orange-400 py-0.5">
                              {sorted[2].lligatCount}
                            </div>
                            <div className="h-8 bg-orange-200/50 dark:bg-orange-800/30 rounded-t mt-1" />
                            <span className="text-xs">🥉</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Motivation */}
                  <motion.div
                    key={totalLligues}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-2.5 bg-gradient-to-r from-orange-50/50 to-rose-50/50 dark:from-orange-900/10 dark:to-rose-900/10 rounded-xl border border-orange-100/30 dark:border-orange-800/20"
                  >
                    <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 italic">
                      {totalLligues === 0 && 'A veure qui obra el marcador... 🤷'}
                      {totalLligues === 1 && 'Primera lligada del grup! 💪'}
                      {totalLligues >= 2 && totalLligues <= 5 && 'S\'està escalfant l\'ambient! 🔥'}
                      {totalLligues >= 6 && totalLligues <= 10 && 'Això va en seriu! El grup no para! 🏃'}
                      {totalLligues >= 11 && totalLligues <= 20 && 'Quina vetllada! Seguim així! 🎉'}
                      {totalLligues >= 21 && totalLligues <= 30 && 'El grup està en flames! 🔥🔥🔥'}
                      {totalLligues >= 31 && 'LEGENDARI! Aquest estiu és èpic! 👑🏆🎊'}
                    </p>
                  </motion.div>
                </CardContent>
              </Card>

              {/* Quick Rules */}
              <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400" />
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-cyan-500" /> Com funciona?
                  </h3>
                  <div className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <p>+ Suma <strong>+1</strong> cada vegada que lliguis</p>
                    <p>− Resta si t&apos;has equivocat</p>
                    <p>🏆 El qui tingui més va primer</p>
                    <p>📊 Es guarda automàticament</p>
                    <p>🔄 S&apos;actualitza cada 10 segons</p>
                    <p>📋 Comparteix la classificació!</p>
                    <div className="mt-2 pt-2 border-t border-purple-200/50 dark:border-purple-800/30">
                      <p className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                        🏳️‍🌈 Regla especial: ElRey
                      </p>
                      <p className="text-purple-500/80 dark:text-purple-400/70 mt-0.5">
                        ElRey queda <strong>exempt</strong> del joc. És GAY i lliga massa, ens humiliaria a la resta. 🫡
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </main>

        {/* ─── Footer ─── */}
        <footer className="relative z-10 mt-auto py-3 px-4 text-center border-t border-orange-100/30 dark:border-gray-800/30 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            🔥 Qui lliga més aquest estiu? &copy; {new Date().getFullYear()} 🔥
          </p>
        </footer>
      </div>
    </TooltipProvider>
  )
}
