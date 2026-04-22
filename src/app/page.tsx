'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Trophy, PartyPopper, Heart } from 'lucide-react'

interface Person {
  id: string
  name: string
  photo: string
  heLligat: boolean
}

const INITIAL_PEOPLE: Person[] = [
  { id: 'ian', name: 'Ian', photo: '/photos/ian.png', heLligat: false },
  { id: 'putraskito', name: 'Putraskito', photo: '/photos/putraskito.png', heLligat: false },
  { id: 'pol', name: 'Pol', photo: '/photos/pol.png', heLligat: false },
  { id: 'rui', name: 'Rui', photo: '/photos/rui.png', heLligat: false },
  { id: 'clone', name: 'Clone', photo: '/photos/clone.png', heLligat: false },
  { id: 'dani', name: 'Dani', photo: '/photos/dani.png', heLligat: false },
  { id: 'max', name: 'Max', photo: '/photos/max.png', heLligat: false },
  { id: 'debig', name: 'Debig', photo: '/photos/debig.png', heLligat: false },
  { id: 'baldo', name: 'Baldo', photo: '/photos/baldo.png', heLligat: false },
  { id: 'roki', name: 'Roki', photo: '/photos/roki.png', heLligat: false },
]

const STORAGE_KEY = 'objetciu-liarse-state'

function loadState(): Person[] {
  if (typeof window === 'undefined') return INITIAL_PEOPLE
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Person[]
      return INITIAL_PEOPLE.map((p) => {
        const savedPerson = parsed.find((s) => s.id === p.id)
        return { ...p, heLligat: savedPerson?.heLligat ?? false }
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

export default function Home() {
  const [people, setPeople] = useState<Person[]>(() => {
    if (typeof window === 'undefined') return INITIAL_PEOPLE
    return loadState()
  })

  useEffect(() => {
    saveState(people)
  }, [people])

  const toggleLligat = (id: string) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, heLligat: !p.heLligat } : p))
    )
  }

  const lligatCount = people.filter((p) => p.heLligat).length
  const totalCount = people.length
  const allLligat = lligatCount === totalCount

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-200/20 dark:bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-yellow-200/20 dark:bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-rose-200/15 dark:bg-rose-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-rose-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
              Objetciu liar-se amb una aquest estiu
            </h1>
            <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>

          {/* Scoreboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-full shadow-lg border border-orange-100 dark:border-gray-700"
          >
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
          </motion.div>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-4 pb-8 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
        >
          {/* Left side - People with photos */}
          <div className="lg:col-span-3">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-orange-100 dark:border-gray-800 shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Els Candidates</h2>
                </div>
                <Separator className="mb-4 bg-orange-100 dark:bg-gray-700" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {people.map((person, index) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.4 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleLligat(person.id)}
                      className={`cursor-pointer relative group rounded-2xl overflow-hidden transition-all duration-300 ${
                        person.heLligat
                          ? 'ring-3 ring-green-400 dark:ring-green-500 shadow-lg shadow-green-200/50 dark:shadow-green-500/20'
                          : 'ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-orange-300 dark:hover:ring-orange-600'
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* He lligat badge */}
                        <AnimatePresence>
                          {person.heLligat && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg"
                            >
                              <span className="text-xs font-bold">✓</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Heart animation on lligat */}
                        <AnimatePresence>
                          {person.heLligat && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0, y: 0 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="absolute top-2 left-2"
                            >
                              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Name label */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                          <p className={`text-sm font-bold text-white truncate ${person.heLligat ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : ''}`}>
                            {person.name}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Checklist */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-orange-100 dark:border-gray-800 shadow-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">He lligat:</h2>
                </div>
                <Separator className="mb-4 bg-orange-100 dark:bg-gray-700" />

                <div className="space-y-1">
                  {people.map((person, index) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.3 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer ${
                        person.heLligat
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'hover:bg-orange-50 dark:hover:bg-gray-800/50 border border-transparent'
                      }`}
                      onClick={() => toggleLligat(person.id)}
                    >
                      <div className={`relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-all duration-300 ${
                        person.heLligat
                          ? 'ring-green-400 dark:ring-green-500'
                          : 'ring-gray-200 dark:ring-gray-600'
                      }`}>
                        <img
                          src={person.photo}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className={`flex-1 font-semibold text-base transition-colors duration-300 ${
                        person.heLligat
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {person.name}
                      </span>
                      <Checkbox
                        checked={person.heLligat}
                        onCheckedChange={() => toggleLligat(person.id)}
                        className={`w-6 h-6 transition-all duration-300 ${
                          person.heLligat
                            ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span>Progres</span>
                    <span>{Math.round((lligatCount / totalCount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(lligatCount / totalCount) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Celebration message */}
                <AnimatePresence>
                  {allLligat && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-800 text-center"
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
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-4 px-4 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-600">
          Objectiu liar-se amb una aquest estiu &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
