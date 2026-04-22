'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Trophy, PartyPopper, Heart, RotateCcw,
  Star, Zap, TrendingUp, Crown, Sparkles, Target,
  Moon, Sun, Share2, Clock, CheckCheck, X as XIcon,
  Volume2, VolumeX, ChevronDown, ChevronUp, Timer
} from 'lucide-react'

/* ─── Types ─── */
interface Person {
  id: string
  name: string
  photo: string
  nickname: string
  heLligat: boolean
  lligatAt: number | null
}

interface ActivityEntry {
  id: string
  personId: string
  personName: string
  action: 'lligat' | 'desfer'
  timestamp: number
}

/* ─── Constants ─── */
const INITIAL_PEOPLE: Person[] = [
  { id: 'ian', name: 'Ian', photo: '/photos/ian.png', nickname: 'El Conqueridor', heLligat: false, lligatAt: null },
  { id: 'putraskito', name: 'Putraskito', photo: '/photos/putraskito.png', nickname: 'El Temerari', heLligat: false, lligatAt: null },
  { id: 'pol', name: 'Pol', photo: '/photos/pol.png', nickname: 'El Romantico', heLligat: false, lligatAt: null },
  { id: 'rui', name: 'Rui', photo: '/photos/rui.png', nickname: 'El Foc', heLligat: false, lligatAt: null },
  { id: 'clone', name: 'Clone', photo: '/photos/clone.png', nickname: 'El Doble', heLligat: false, lligatAt: null },
  { id: 'dani', name: 'Dani', photo: '/photos/dani.png', nickname: 'El Suau', heLligat: false, lligatAt: null },
  { id: 'max', name: 'Max', photo: '/photos/max.png', nickname: 'El Max', heLligat: false, lligatAt: null },
  { id: 'debig', name: 'Debig', photo: '/photos/debig.png', nickname: 'El Gran', heLligat: false, lligatAt: null },
  { id: 'baldo', name: 'Baldo', photo: '/photos/baldo.png', nickname: 'El Valent', heLligat: false, lligatAt: null },
  { id: 'roki', name: 'Roki', photo: '/photos/roki.png', nickname: 'El Roca', heLligat: false, lligatAt: null },
]

const STORAGE_KEY = 'objetciu-liarse-state-v3'
const ACTIVITY_KEY = 'objetciu-activity-v1'

/* ─── State persistence ─── */
function loadState(): Person[] {
  if (typeof window === 'undefined') return INITIAL_PEOPLE
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Person[]
      return INITIAL_PEOPLE.map((p) => {
        const s = parsed.find((x) => x.id === p.id)
        return { ...p, heLligat: s?.heLligat ?? false, lligatAt: s?.lligatAt ?? null }
      })
    }
  } catch { /* ignore */ }
  return INITIAL_PEOPLE
}

function saveState(people: Person[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(people)) } catch { /* ignore */ }
}

function loadActivity(): ActivityEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(ACTIVITY_KEY)
    if (saved) return JSON.parse(saved) as ActivityEntry[]
  } catch { /* ignore */ }
  return []
}

function saveActivity(entries: ActivityEntry[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(entries.slice(0, 50))) } catch { /* ignore */ }
}

/* ─── Confetti ─── */
function Confetti() {
  const colors = ['#f97316', '#ef4444', '#ec4899', '#eab308', '#22c55e', '#8b5cf6', '#06b6d4']
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 80 }).map((_, i) => {
        const color = colors[i % colors.length]
        const left = Math.random() * 100
        const delay = Math.random() * 2.5
        const duration = 2 + Math.random() * 3
        const size = 5 + Math.random() * 10
        const isCircle = Math.random() > 0.5
        return (
          <motion.div
            key={i}
            initial={{ y: -30, x: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 60 : 1000,
              x: (Math.random() - 0.5) * 300,
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
      {Array.from({ length: 25 }).map((_, i) => {
        const size = 2 + Math.random() * 8
        const left = Math.random() * 100
        const delay = Math.random() * 12
        const duration = 18 + Math.random() * 25
        const colors = ['bg-orange-300/20', 'bg-rose-300/15', 'bg-amber-300/20', 'bg-yellow-300/15', 'bg-pink-300/10']
        return (
          <motion.div
            key={i}
            className={`absolute rounded-full ${colors[i % colors.length]}`}
            style={{ width: size, height: size, left: `${left}%` }}
            animate={{ y: ['-10vh', '110vh'], x: [0, (Math.random() - 0.5) * 120] }}
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
function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
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
  const [people, setPeople] = useState<Person[]>(() => {
    if (typeof window === 'undefined') return INITIAL_PEOPLE
    return loadState()
  })
  const [activity, setActivity] = useState<ActivityEntry[]>(() => {
    if (typeof window === 'undefined') return []
    return loadActivity()
  })
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('objetciu-dark-mode') === 'true'
  })
  const [showTimeline, setShowTimeline] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const toastId = useRef(0)

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('objetciu-dark-mode', String(darkMode))
  }, [darkMode])

  // Save state changes
  useEffect(() => { saveState(people) }, [people])
  useEffect(() => { saveActivity(activity) }, [activity])

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== id)) }, 3000)
  }, [])

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 6000)
  }, [])

  const toggleLligat = useCallback((id: string) => {
    setPeople((prev) => {
      const person = prev.find((p) => p.id === id)
      if (!person) return prev
      const newHeLligat = !person.heLligat
      const next = prev.map((p) =>
        p.id === id ? { ...p, heLligat: newHeLligat, lligatAt: newHeLligat ? Date.now() : null } : p
      )
      // Add activity entry
      const entry: ActivityEntry = {
        id: `${id}-${Date.now()}`,
        personId: id,
        personName: person.name,
        action: newHeLligat ? 'lligat' : 'desfer',
        timestamp: Date.now(),
      }
      setActivity((prev) => [entry, ...prev].slice(0, 50))

      // Check all complete
      if (newHeLligat && next.every((p) => p.heLligat)) {
        setTimeout(() => triggerConfetti(), 50)
        setTimeout(() => addToast('Tots han lligat! 🎉', 'warning'), 200)
      } else if (newHeLligat) {
        setTimeout(() => addToast(`${person.name} ha lligat! 💪`, 'success'), 100)
      }

      return next
    })
  }, [triggerConfetti, addToast])

  const resetAll = useCallback(() => {
    setPeople(INITIAL_PEOPLE)
    setActivity([])
    addToast('Tots reiniciats!', 'info')
  }, [addToast])

  const selectAll = useCallback(() => {
    setPeople((prev) => prev.map((p) => ({ ...p, heLligat: true, lligatAt: p.lligatAt ?? Date.now() })))
    triggerConfetti()
    addToast('Tots marcats!', 'warning')
  }, [triggerConfetti, addToast])

  const deselectAll = useCallback(() => {
    setPeople((prev) => prev.map((p) => ({ ...p, heLligat: false, lligatAt: null })))
    addToast('Tots desmarcats!', 'info')
  }, [addToast])

  const shareSummary = useCallback(() => {
    const lligats = people.filter((p) => p.heLligat).map((p) => p.name).join(', ')
    const pendents = people.filter((p) => !p.heLligat).map((p) => p.name).join(', ')
    const count = people.filter((p) => p.heLligat).length
    const text = `🔥 Objetciu liar-se amb una aquest estiu 🔥\n\n✅ Han lligat (${count}): ${lligats || 'Ningú encara...'}\n⏳ Pendents (${10 - count}): ${pendents || 'Cap!'}\n\n📊 Progres: ${count}/10 (${Math.round((count / 10) * 100)}%)`
    navigator.clipboard.writeText(text).then(() => {
      addToast('Resum copiat al porta-retalls!', 'success')
    }).catch(() => {
      addToast('No s\'ha pogut copiar', 'info')
    })
  }, [people, addToast])

  const lligatCount = people.filter((p) => p.heLligat).length
  const totalCount = people.length
  const allLligat = lligatCount === totalCount
  const noneLligat = lligatCount === 0

  const leaderboard = [...people]
    .filter((p) => p.heLligat)
    .sort((a, b) => (a.lligatAt ?? Infinity) - (b.lligatAt ?? Infinity))

  const getRankEmoji = (i: number) => {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `#${i + 1}`
  }

  const getMotivation = () => {
    if (lligatCount === 0) return { text: 'Algú ha de ser el primer... 🤷', level: 0 }
    if (lligatCount === 1) return { text: 'Ja hi ha un valent! Qui serà el segon? 💪', level: 1 }
    if (lligatCount === 2) return { text: 'Es comença a moure el personal! 🔥', level: 2 }
    if (lligatCount <= 4) return { text: 'Això s\'escalfa! Continuem! 🌡️', level: 3 }
    if (lligatCount <= 6) return { text: 'Més de la meitat ja! A per totes! 🏃', level: 4 }
    if (lligatCount <= 8) return { text: 'Ja quasi estan tots! L\'últim esforç! 🎯', level: 5 }
    if (lligatCount === 9) return { text: 'Falta UN! Qui serà l\'últim? 😱', level: 6 }
    return { text: 'OBJECTIU COMPLERT! 🏆🎉🎊', level: 7 }
  }

  const motivation = getMotivation()

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`min-h-screen flex flex-col relative transition-colors duration-500 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
          : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'
      }`}>
        <FloatingParticles />
        {showConfetti && <Confetti />}
        <ToastContainer toasts={toasts} />

        {/* Background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl transition-colors duration-700 ${
            darkMode ? 'bg-orange-500/5' : 'bg-orange-200/20'
          }`} />
          <div className={`absolute top-1/3 -left-20 w-72 h-72 rounded-full blur-3xl transition-colors duration-700 ${
            darkMode ? 'bg-yellow-500/5' : 'bg-yellow-200/20'
          }`} />
          <div className={`absolute -bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl transition-colors duration-700 ${
            darkMode ? 'bg-rose-500/5' : 'bg-rose-200/15'
          }`} />
        </div>

        {/* ─── Header ─── */}
        <header className="relative z-10 pt-5 sm:pt-8 pb-3 px-4">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Title */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1.5">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </motion.div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-rose-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
                Objetciu liar-se amb una aquest estiu
              </h1>
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </motion.div>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 italic">
              &ldquo;Qui no ho intenta, no ho aconsegueix&rdquo;
            </p>

            {/* Controls row */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
            >
              {/* Score badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 backdrop-blur-md rounded-full shadow-lg border transition-colors duration-500 ${
                darkMode
                  ? 'bg-gray-800/70 border-gray-700'
                  : 'bg-white/70 border-orange-100'
              }`}>
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {lligatCount} / {totalCount}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">han lligat</span>
                <AnimatePresence>
                  {allLligat && (
                    <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}>
                      <PartyPopper className="w-5 h-5 text-green-500" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={shareSummary}
                      className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-orange-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 gap-1">
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Compartir</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Compartir resum</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setShowTimeline(!showTimeline)}
                      className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-orange-200 dark:border-gray-700 gap-1 transition-colors ${
                        showTimeline ? 'bg-orange-100 dark:bg-orange-900/30' : 'hover:bg-orange-50 dark:hover:bg-gray-700'
                      } text-gray-600 dark:text-gray-300`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Activitat</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Veure activitat</TooltipContent>
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
                  <TooltipContent>Reiniciar tot</TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          </motion.div>
        </header>

        {/* ─── Activity Timeline (collapsible) ─── */}
        <AnimatePresence>
          {showTimeline && activity.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative z-10 px-4 max-w-7xl mx-auto w-full overflow-hidden"
            >
              <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400" />
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-cyan-500" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Registre d&apos;Activitat</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowTimeline(false)} className="ml-auto h-6 w-6 p-0">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                    {activity.slice(0, 20).map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-2 text-xs py-1 px-2 rounded-lg ${
                          entry.action === 'lligat'
                            ? 'bg-green-50/60 dark:bg-green-900/15 text-green-700 dark:text-green-400'
                            : 'bg-red-50/60 dark:bg-red-900/15 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {entry.action === 'lligat' ? <Heart className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                        <span className="font-medium">{entry.personName}</span>
                        <span>{entry.action === 'lligat' ? 'ha lligat' : 's\'ha desfet'}</span>
                        <span className="ml-auto text-[10px] opacity-60">{timeAgo(entry.timestamp)}</span>
                      </motion.div>
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
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mt-4"
          >
            {/* ─── Left: Candidates Grid ─── */}
            <div className="lg:col-span-5">
              <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500" />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">Els Candidates</h2>
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {totalCount} persones
                    </span>
                  </div>
                  <Separator className="mb-3 bg-orange-100 dark:bg-gray-700" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {people.map((person, index) => (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 * index, duration: 0.4 }}
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => toggleLligat(person.id)}
                        className={`cursor-pointer relative group rounded-2xl overflow-hidden transition-all duration-300 ${
                          person.heLligat
                            ? 'ring-2 ring-green-400 dark:ring-green-500 shadow-lg shadow-green-200/40 dark:shadow-green-500/20'
                            : 'ring-1 ring-gray-200/80 dark:ring-gray-700/80 hover:ring-orange-300 dark:hover:ring-orange-600 hover:shadow-md'
                        }`}
                      >
                        <div className="aspect-square relative">
                          <img
                            src={person.photo}
                            alt={person.name}
                            className={`w-full h-full object-cover transition-all duration-500 ${
                              person.heLligat ? 'brightness-110 saturate-150' : 'brightness-95 group-hover:brightness-100'
                            }`}
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Hover action hint */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm transition-colors ${
                              person.heLligat ? 'bg-red-500/80 text-white' : 'bg-green-500/80 text-white'
                            }`}>
                              {person.heLligat ? 'Desfer ✕' : 'Lligat! ✓'}
                            </div>
                          </div>

                          {/* Lligat badge */}
                          <AnimatePresence>
                            {person.heLligat && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                className="absolute top-1.5 right-1.5 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-green-500/40"
                              >
                                <span className="text-[10px] font-bold">✓</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Heart */}
                          <AnimatePresence>
                            {person.heLligat && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="absolute top-1.5 left-1.5"
                              >
                                <Heart className="w-4 h-4 text-rose-500 fill-rose-500 drop-shadow-lg" />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Name */}
                          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            <p className={`text-xs sm:text-sm font-bold text-white truncate ${person.heLligat ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : ''}`}>
                              {person.name}
                            </p>
                            {person.heLligat && (
                              <motion.p
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[9px] text-green-300 truncate font-medium"
                              >
                                {person.nickname}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Middle: Checklist ─── */}
            <div className="lg:col-span-4">
              <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">He lligat:</h2>
                  </div>
                  <Separator className="mb-3 bg-orange-100 dark:bg-gray-700" />

                  {/* Bulk actions */}
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant="ghost" size="sm"
                      onClick={selectAll}
                      disabled={allLligat}
                      className="h-7 text-[11px] text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 gap-1 px-2"
                    >
                      <CheckCheck className="w-3 h-3" /> Tots
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      onClick={deselectAll}
                      disabled={noneLligat}
                      className="h-7 text-[11px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1 px-2"
                    >
                      <XIcon className="w-3 h-3" /> Cap
                    </Button>
                    <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">
                      {lligatCount} de {totalCount}
                    </span>
                  </div>

                  {/* People checklist */}
                  <div className="space-y-1 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
                    {people.map((person, index) => (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * index, duration: 0.3 }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-300 cursor-pointer group/row ${
                          person.heLligat
                            ? 'bg-green-50/80 dark:bg-green-900/20 border border-green-200/60 dark:border-green-800/60'
                            : 'hover:bg-orange-50/50 dark:hover:bg-gray-800/30 border border-transparent'
                        }`}
                        onClick={() => toggleLligat(person.id)}
                      >
                        <div className={`relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-offset-1.5 transition-all duration-300 ${
                          person.heLligat
                            ? 'ring-green-400 dark:ring-green-500 ring-offset-green-50 dark:ring-offset-gray-900'
                            : 'ring-gray-200 dark:ring-gray-600 group-hover/row:ring-orange-300 dark:group-hover/row:ring-orange-600 ring-offset-orange-50 dark:ring-offset-gray-900'
                        }`}>
                          <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`block font-semibold text-sm transition-colors duration-300 ${
                            person.heLligat ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {person.name}
                          </span>
                          {person.heLligat && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="block text-[10px] text-green-500/80 dark:text-green-500/60 font-medium"
                            >
                              {person.nickname} · {person.lligatAt ? timeAgo(person.lligatAt) : ''}
                            </motion.span>
                          )}
                        </div>
                        <Checkbox
                          checked={person.heLligat}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => toggleLligat(person.id)}
                          className={`w-5 h-5 transition-all duration-300 flex-shrink-0 ${
                            person.heLligat
                              ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Progres
                      </span>
                      <span className="font-bold">{Math.round((lligatCount / totalCount) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200/80 dark:bg-gray-700/80 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${(lligatCount / totalCount) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Celebration */}
                  <AnimatePresence>
                    {allLligat && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 p-3 bg-gradient-to-r from-green-100/80 to-emerald-100/80 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/60 dark:border-green-800/60 text-center backdrop-blur-sm"
                      >
                        <PartyPopper className="w-7 h-7 text-green-600 mx-auto mb-1" />
                        <p className="text-green-700 dark:text-green-400 font-bold">Tots han lligat! 🎉</p>
                        <p className="text-green-600 dark:text-green-500 text-xs">Objectiu complert!</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            {/* ─── Right: Leaderboard + Stats ─── */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-5">
              {/* Leaderboard */}
              <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">Classificació</h2>
                  </div>
                  <Separator className="mb-3 bg-orange-100 dark:bg-gray-700" />

                  {leaderboard.length === 0 ? (
                    <div className="text-center py-5">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-7 h-7 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      </motion.div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">Encara ningú ha lligat...</p>
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">Sigues el primer!</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[260px] overflow-y-auto custom-scrollbar">
                      {leaderboard.map((person, index) => (
                        <motion.div
                          key={person.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.04 * index }}
                          className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                            index === 0
                              ? 'bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50'
                              : index === 1
                              ? 'bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50'
                              : index === 2
                              ? 'bg-orange-50/80 dark:bg-orange-900/15 border border-orange-200/50 dark:border-orange-800/50'
                              : ''
                          }`}
                        >
                          <span className="text-base w-7 text-center flex-shrink-0">{getRankEmoji(index)}</span>
                          <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700">
                            <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{person.name}</p>
                            <p className="text-[9px] text-gray-400 dark:text-gray-500 truncate">{person.nickname}</p>
                          </div>
                          {person.lligatAt && (
                            <span className="text-[9px] text-gray-400 dark:text-gray-600 flex-shrink-0">
                              {timeAgo(person.lligatAt)}
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
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
                      <p className="text-xl font-extrabold text-orange-600 dark:text-orange-400">{lligatCount}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Han lligat</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/10 rounded-xl p-2.5 text-center border border-rose-100/50 dark:border-rose-800/30">
                      <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{totalCount - lligatCount}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Pendents</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl p-2.5 text-center border border-green-100/50 dark:border-green-800/30">
                      <p className="text-xl font-extrabold text-green-600 dark:text-green-400">
                        {Math.round((lligatCount / totalCount) * 100)}%
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Èxit</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 rounded-xl p-2.5 text-center border border-amber-100/50 dark:border-amber-800/30">
                      <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                        {leaderboard.length > 0 ? leaderboard[0].name : '—'}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Primer</p>
                    </div>
                  </div>

                  {/* Motivational */}
                  <motion.div
                    key={motivation.level}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 p-2.5 rounded-xl border text-center transition-colors duration-500 ${
                      motivation.level >= 7
                        ? 'bg-gradient-to-r from-green-50/60 to-emerald-50/60 dark:from-green-900/15 dark:to-emerald-900/15 border-green-200/40 dark:border-green-800/30'
                        : motivation.level >= 4
                        ? 'bg-gradient-to-r from-orange-50/50 to-rose-50/50 dark:from-orange-900/10 dark:to-rose-900/10 border-orange-100/30 dark:border-orange-800/20'
                        : 'bg-gradient-to-r from-gray-50/50 to-orange-50/30 dark:from-gray-900/10 dark:to-orange-900/5 border-gray-100/30 dark:border-gray-800/20'
                    }`}
                  >
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">{motivation.text}</p>
                  </motion.div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </main>

        {/* ─── Footer ─── */}
        <footer className="relative z-10 mt-auto py-3 px-4 text-center border-t border-orange-100/30 dark:border-gray-800/30 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            🔥 Objectiu liar-se amb una aquest estiu &copy; {new Date().getFullYear()} 🔥
          </p>
        </footer>
      </div>
    </TooltipProvider>
  )
}
