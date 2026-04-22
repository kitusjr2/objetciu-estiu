'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Trophy, PartyPopper, Heart, RotateCcw,
  Star, Zap, TrendingUp, Crown, Sparkles, Target
} from 'lucide-react'

interface Person {
  id: string
  name: string
  photo: string
  nickname: string
  heLligat: boolean
  lligatAt: number | null
}

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

const STORAGE_KEY = 'objetciu-liarse-state-v2'

function loadState(): Person[] {
  if (typeof window === 'undefined') return INITIAL_PEOPLE
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Person[]
      return INITIAL_PEOPLE.map((p) => {
        const savedPerson = parsed.find((s) => s.id === p.id)
        return {
          ...p,
          heLligat: savedPerson?.heLligat ?? false,
          lligatAt: savedPerson?.lligatAt ?? null,
        }
      })
    }
  } catch {
    // ignore
  }
  return INITIAL_PEOPLE
}

function saveState(people: Person[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
  } catch {
    // ignore
  }
}

/* ─── Confetti particle component ─── */
function Confetti() {
  const colors = ['#f97316', '#ef4444', '#ec4899', '#eab308', '#22c55e', '#8b5cf6', '#06b6d4']
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => {
        const color = colors[i % colors.length]
        const left = Math.random() * 100
        const delay = Math.random() * 2
        const duration = 2 + Math.random() * 3
        const size = 6 + Math.random() * 8
        const isCircle = Math.random() > 0.5
        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: window.innerHeight + 50,
              x: (Math.random() - 0.5) * 200,
              rotate: 360 + Math.random() * 720,
              opacity: 0,
            }}
            transition={{
              duration,
              delay,
              ease: 'easeIn',
            }}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: -20,
              width: size,
              height: isCircle ? size : size * 0.4,
              backgroundColor: color,
              borderRadius: isCircle ? '50%' : '2px',
            }}
          />
        )
      })}
    </div>
  )
}

/* ─── Floating particle background ─── */
function FloatingParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 20 }).map((_, i) => {
        const size = 3 + Math.random() * 6
        const left = Math.random() * 100
        const delay = Math.random() * 10
        const duration = 15 + Math.random() * 20
        const colors = ['bg-orange-300/30', 'bg-rose-300/20', 'bg-amber-300/25', 'bg-yellow-300/20']
        return (
          <motion.div
            key={i}
            className={`absolute rounded-full ${colors[i % colors.length]}`}
            style={{ width: size, height: size, left: `${left}%` }}
            animate={{
              y: ['-10vh', '110vh'],
              x: [0, (Math.random() - 0.5) * 100],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )
      })}
    </div>
  )
}

/* ─── Toast notification ─── */
interface ToastData {
  id: number
  message: string
  type: 'success' | 'info'
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
            className={`px-4 py-3 rounded-xl shadow-xl backdrop-blur-md border text-sm font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-green-500/90 text-white border-green-400/50'
                : 'bg-orange-500/90 text-white border-orange-400/50'
            }`}
          >
            {toast.type === 'success' ? (
              <Star className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default function Home() {
  const [people, setPeople] = useState<Person[]>(() => {
    if (typeof window === 'undefined') return INITIAL_PEOPLE
    return loadState()
  })
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const toastId = useRef(0)
  const hasLoaded = useRef(typeof window !== 'undefined')

  // Save state changes whenever people changes
  useEffect(() => {
    saveState(people)
  }, [people])

  const addToast = useCallback((message: string, type: 'success' | 'info' = 'info') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 6000)
  }, [])

  const toggleLligat = useCallback((id: string) => {
    setPeople((prev) => {
      const person = prev.find((p) => p.id === id)
      const newHeLligat = !person?.heLligat
      const next = prev.map((p) =>
        p.id === id
          ? { ...p, heLligat: newHeLligat, lligatAt: newHeLligat ? Date.now() : null }
          : p
      )
      // Check if all are now lligat (celebrate!)
      if (newHeLligat && next.every((p) => p.heLligat)) {
        setTimeout(() => triggerConfetti(), 50)
      }
      return next
    })
  }, [triggerConfetti])

  const resetAll = useCallback(() => {
    setPeople(INITIAL_PEOPLE)
    addToast('Tots reiniciats!', 'info')
  }, [addToast])

  const lligatCount = people.filter((p) => p.heLligat).length
  const totalCount = people.length
  const allLligat = lligatCount === totalCount

  // Leaderboard: sorted by who lligat first
  const leaderboard = [...people]
    .filter((p) => p.heLligat)
    .sort((a, b) => (a.lligatAt ?? Infinity) - (b.lligatAt ?? Infinity))

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative">
      <FloatingParticles />
      {showConfetti && <Confetti />}
      <ToastContainer toasts={toasts} />

      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-200/20 dark:bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-yellow-200/20 dark:bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-rose-200/15 dark:bg-rose-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-6 sm:pt-8 pb-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 animate-pulse" />
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-rose-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
              Objetciu liar-se amb una aquest estiu
            </h1>
            <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 animate-pulse" />
          </div>

          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-3 italic">
            &ldquo;Qui no ho intenta, no ho aconsegueix&rdquo;
          </p>

          {/* Scoreboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-full shadow-lg border border-orange-100 dark:border-gray-700">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {lligatCount} / {totalCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">han lligat</span>
              <AnimatePresence>
                {allLligat && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="ml-1"
                  >
                    <PartyPopper className="w-5 h-5 text-green-500" />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={resetAll}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-orange-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </Button>
          </motion.div>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-3 sm:px-4 pb-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6"
        >
          {/* Left side - People with photos */}
          <div className="lg:col-span-5">
            <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
              {/* Card top gradient bar */}
              <div className="h-1.5 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500" />
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Els Candidates</h2>
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {totalCount} persones
                  </span>
                </div>
                <Separator className="mb-4 bg-orange-100 dark:bg-gray-700" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {people.map((person, index) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * index, duration: 0.4 }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleLligat(person.id)}
                      className={`cursor-pointer relative group rounded-2xl overflow-hidden transition-all duration-300 ${
                        person.heLligat
                          ? 'ring-3 ring-green-400 dark:ring-green-500 shadow-lg shadow-green-200/50 dark:shadow-green-500/20'
                          : 'ring-1 ring-gray-200/80 dark:ring-gray-700/80 hover:ring-orange-300 dark:hover:ring-orange-600'
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
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Hover hint */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                              person.heLligat
                                ? 'bg-red-500/80 text-white'
                                : 'bg-green-500/80 text-white'
                            }`}
                          >
                            {person.heLligat ? 'Desfer ✕' : 'Lligat! ✓'}
                          </motion.div>
                        </div>

                        {/* He lligat badge */}
                        <AnimatePresence>
                          {person.heLligat && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg shadow-green-500/40"
                            >
                              <span className="text-xs font-bold">✓</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Heart animation on lligat */}
                        <AnimatePresence>
                          {person.heLligat && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="absolute top-2 left-2"
                            >
                              <Heart className="w-5 h-5 text-rose-500 fill-rose-500 drop-shadow-lg" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Name & nickname label */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                          <p className={`text-sm font-bold text-white truncate ${person.heLligat ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : ''}`}>
                            {person.name}
                          </p>
                          {person.heLligat && (
                            <motion.p
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-[10px] text-green-300 truncate font-medium"
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

          {/* Middle - Checklist */}
          <div className="lg:col-span-4">
            <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">He lligat:</h2>
                </div>
                <Separator className="mb-4 bg-orange-100 dark:bg-gray-700" />

                <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                  {people.map((person, index) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.3 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer group/row ${
                        person.heLligat
                          ? 'bg-green-50/80 dark:bg-green-900/20 border border-green-200/60 dark:border-green-800/60'
                          : 'hover:bg-orange-50/50 dark:hover:bg-gray-800/30 border border-transparent'
                      }`}
                      onClick={() => toggleLligat(person.id)}
                    >
                      <div className={`relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-offset-2 ring-offset-orange-50 dark:ring-offset-gray-900 transition-all duration-300 ${
                        person.heLligat
                          ? 'ring-green-400 dark:ring-green-500'
                          : 'ring-gray-200 dark:ring-gray-600 group-hover/row:ring-orange-300 dark:group-hover/row:ring-orange-600'
                      }`}>
                        <img
                          src={person.photo}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`block font-semibold text-base transition-colors duration-300 ${
                          person.heLligat
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {person.name}
                        </span>
                        {person.heLligat && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="block text-[11px] text-green-500/80 dark:text-green-500/60 font-medium"
                          >
                            {person.nickname}
                          </motion.span>
                        )}
                      </div>
                      <Checkbox
                        checked={person.heLligat}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleLligat(person.id)}
                        className={`w-6 h-6 transition-all duration-300 flex-shrink-0 ${
                          person.heLligat
                            ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Progres
                    </span>
                    <span className="font-bold">{Math.round((lligatCount / totalCount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200/80 dark:bg-gray-700/80 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${(lligatCount / totalCount) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>
                </div>

                {/* Celebration message */}
                <AnimatePresence>
                  {allLligat && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 bg-gradient-to-r from-green-100/80 to-emerald-100/80 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/60 dark:border-green-800/60 text-center backdrop-blur-sm"
                    >
                      <PartyPopper className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-700 dark:text-green-400 font-bold text-lg">
                        Tots han lligat! 🎉
                      </p>
                      <p className="text-green-600 dark:text-green-500 text-sm">
                        Objectiu complert! Mission accomplished!
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Leaderboard & Stats */}
          <div className="lg:col-span-3">
            {/* Leaderboard */}
            <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden mb-4 sm:mb-6">
              <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Classificació</h2>
                </div>
                <Separator className="mb-3 bg-orange-100 dark:bg-gray-700" />

                {leaderboard.length === 0 ? (
                  <div className="text-center py-6">
                    <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      Encara ningú ha lligat...
                    </p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                      Sigues el primer!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {leaderboard.map((person, index) => (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className={`flex items-center gap-2.5 p-2 rounded-lg ${
                          index === 0
                            ? 'bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50'
                            : index === 1
                            ? 'bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50'
                            : index === 2
                            ? 'bg-orange-50/80 dark:bg-orange-900/15 border border-orange-200/50 dark:border-orange-800/50'
                            : 'bg-transparent'
                        }`}
                      >
                        <span className="text-lg w-8 text-center flex-shrink-0">
                          {getRankEmoji(index)}
                        </span>
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700">
                          <img
                            src={person.photo}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                            {person.name}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                            {person.nickname}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats card */}
            <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-orange-100/80 dark:border-gray-800/80 shadow-xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400" />
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Estadístiques</h2>
                </div>
                <Separator className="mb-3 bg-orange-100 dark:bg-gray-700" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-xl p-3 text-center border border-orange-100/50 dark:border-orange-800/30">
                    <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{lligatCount}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Han lligat</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/10 rounded-xl p-3 text-center border border-rose-100/50 dark:border-rose-800/30">
                    <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{totalCount - lligatCount}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Pendents</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl p-3 text-center border border-green-100/50 dark:border-green-800/30">
                    <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">
                      {Math.round((lligatCount / totalCount) * 100)}%
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Èxit</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 rounded-xl p-3 text-center border border-amber-100/50 dark:border-amber-800/30">
                    <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                      {leaderboard.length > 0 ? (
                        <span className="text-base">🏆 {leaderboard[0].name}</span>
                      ) : (
                        '—'
                      )}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Primer</p>
                  </div>
                </div>

                {/* Motivational message */}
                <div className="mt-4 p-3 bg-gradient-to-r from-orange-50/50 to-rose-50/50 dark:from-orange-900/10 dark:to-rose-900/10 rounded-xl border border-orange-100/30 dark:border-orange-800/20">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 italic">
                    {lligatCount === 0 && 'Algú ha de ser el primer... 🤷'}
                    {lligatCount === 1 && 'Ja hi ha un valent! Qui serà el segon? 💪'}
                    {lligatCount === 2 && 'Es comença a moure el personal! 🔥'}
                    {lligatCount >= 3 && lligatCount < 5 && 'Això s\'escalfa! Continuem! 🌡️'}
                    {lligatCount >= 5 && lligatCount < 7 && 'Més de la meitat ja! A per totes! 🏃'}
                    {lligatCount >= 7 && lligatCount < 10 && 'Ja quasi estan tots! L\'últim esforç! 🎯'}
                    {lligatCount === 10 && 'OBJECTIU COMPLERT! 🏆🎉🎊'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-4 px-4 text-center border-t border-orange-100/30 dark:border-gray-800/30 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
        <p className="text-sm text-gray-400 dark:text-gray-600">
          🔥 Objectiu liar-se amb una aquest estiu &copy; {new Date().getFullYear()} 🔥
        </p>
      </footer>
    </div>
  )
}
