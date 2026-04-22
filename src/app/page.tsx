'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Flame, Trophy, Heart, RotateCcw, Star, Zap, Crown, Sparkles,
  Moon, Sun, Share2, Clock, ChevronUp, Users, Hash,
  ArrowUp, ArrowDown, RefreshCw, X, Trash2, TrendingUp, MapPin, Calendar, Award,
  Volume2, VolumeX, Target, Timer, Swords, Gauge, Undo2, Search,
} from 'lucide-react'

/* ─── Types ─── */
interface Candidate { id: string; name: string; nickname: string; photo: string; lligatCount: number; order: number }
interface ActivityEntry { id: string; personId: string; personName: string; action: string; value: number; createdAt: string }
interface LigueEntry { id: string; personId: string; personName: string; nom: string; edat: string; ubi: string; rating: number; createdAt: string }
interface LastAction { type: 'increment' | 'decrement'; personId: string; personName: string; prevCount: number }

const EXEMPT_IDS = new Set(['elrey'])
const IMG_POS: Record<string, string> = { putraskito: 'center 30%', pol: 'center 15%' }
const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'Primera Sang', emoji: '🩸', desc: 'Primera lligada', min: 1 },
  { id: 'hat_trick', name: 'Hat Trick', emoji: '🎩', desc: '3 lligades', min: 3 },
  { id: 'machine', name: 'Màquina', emoji: '🤖', desc: '5 lligades', min: 5 },
  { id: 'double_digits', name: 'Dobles Dígits', emoji: '🔥', desc: '10 lligades', min: 10 },
  { id: 'legend', name: 'Llegenda', emoji: '👑', desc: '20 lligades', min: 20 },
  { id: 'god', name: 'Déu', emoji: '⚡', desc: '50 lligades', min: 50 },
]

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'ara mateix'; const m = Math.floor(s / 60)
  if (m < 60) return `fa ${m}min`; const h = Math.floor(m / 60)
  if (h < 24) return `fa ${h}h`; return `fa ${Math.floor(h / 24)}d`
}

function getMotivation(t: number): string {
  if (t === 0) return 'A veure qui obra el marcador... 🤷'
  if (t === 1) return 'Primera lligada! 💪'
  if (t <= 5) return "S'està escalfant! 🔥"
  if (t <= 10) return 'Això va en seriu! 🏃'
  if (t <= 20) return 'Quina vetllada! 🎉'
  if (t <= 30) return 'En flames! 🔥🔥🔥'
  return 'LEGENDARI! 👑🏆🎊'
}

const dk = (c: string) => c ? `dark:bg-stone-${c}` : ''

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [ligues, setLigues] = useState<LigueEntry[]>([])
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [darkMode, setDarkMode] = useState(() => typeof window !== 'undefined' && localStorage.getItem('objetciu-dark-mode') === 'true')
  const [showTimeline, setShowTimeline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareText, setShareText] = useState('')
  const [showLigueForm, setShowLigueForm] = useState<string | null>(null)
  const [ligueNom, setLigueNom] = useState('')
  const [ligueEdat, setLigueEdat] = useState('')
  const [ligueUbi, setLigueUbi] = useState('')
  const [ligueRating, setLigueRating] = useState(0)
  const [showLigueHistory, setShowLigueHistory] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(() => typeof window === 'undefined' || localStorage.getItem('objetciu-sound') !== 'false')
  const [rankChanges, setRankChanges] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [ligueHintId, setLigueHintId] = useState<string | null>(null)
  const [hasLastAction, setHasLastAction] = useState(false)
  const prevRanks = useRef<Record<string, number>>({})
  const toastId = useRef(0)
  const prevTopId = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastActionRef = useRef<LastAction | null>(null)
  const ligueHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [c, a, l] = await Promise.all([fetch('/api/candidates'), fetch('/api/activity'), fetch('/api/ligues')])
      setCandidates(await c.json()); setActivity(await a.json()); setLigues(await l.json())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const iv = setInterval(fetchData, 10000); return () => clearInterval(iv) }, [fetchData])
  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); localStorage.setItem('objetciu-dark-mode', String(darkMode)) }, [darkMode])
  useEffect(() => { localStorage.setItem('objetciu-sound', String(soundEnabled)) }, [soundEnabled])
  useEffect(() => { audioRef.current = new Audio('/sounds/ding.mp3'); audioRef.current.volume = 0.3; return () => { audioRef.current = null } }, [])

  const playDing = useCallback(() => { if (soundEnabled && audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}) } }, [soundEnabled])
  const addToast = useCallback((msg: string, type = 'info') => { const id = ++toastId.current; setToasts(p => [...p, { id, message: msg, type }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000) }, [])

  useEffect(() => {
    const top = [...candidates].filter(c => !EXEMPT_IDS.has(c.id)).sort((a, b) => b.lligatCount - a.lligatCount)[0]
    if (top && top.lligatCount > 0 && prevTopId.current !== null && prevTopId.current !== top.id) {
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000); addToast(`${top.name} és el nou líder! 👑`, 'warning')
    }
    if (top && top.lligatCount > 0) prevTopId.current = top.id
  }, [candidates, addToast])

  useEffect(() => {
    const nr: Record<string, number> = {}
    ;[...candidates].filter(c => !EXEMPT_IDS.has(c.id)).sort((a, b) => b.lligatCount - a.lligatCount || a.order - b.order).forEach((c, i) => { nr[c.id] = i })
    const ch: Record<string, number> = {}
    if (Object.keys(prevRanks.current).length > 0) { for (const [id, r] of Object.entries(nr)) { const o = prevRanks.current[id]; if (o !== undefined && o !== r) ch[id] = o - r } }
    if (Object.keys(ch).length > 0) { setRankChanges(ch); setTimeout(() => setRankChanges({}), 5000) }
    prevRanks.current = nr
  }, [candidates])

  const increment = useCallback((id: string) => {
    let nc = 0; let pn = ''; let prev = 0
    setCandidates(p => { const c = p.find(x => x.id === id); if (!c) return p; nc = c.lligatCount + 1; pn = c.name; prev = c.lligatCount; return p.map(x => x.id === id ? { ...x, lligatCount: nc } : x) })
    fetch(`/api/candidates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lligatCount: nc }) }).then(() => fetch('/api/activity').then(r => r.json()).then(setActivity))
    addToast(`${pn} +1! 💪`, 'success'); playDing()
    lastActionRef.current = { type: 'increment', personId: id, personName: pn, prevCount: prev }; setHasLastAction(true)
    setLigueHintId(id)
    if (ligueHintTimer.current) clearTimeout(ligueHintTimer.current)
    ligueHintTimer.current = setTimeout(() => setLigueHintId(null), 10000)
  }, [addToast, playDing])

  const decrement = useCallback((id: string) => {
    let nc = 0; let pn = ''; let prev = 0
    setCandidates(p => { const c = p.find(x => x.id === id); if (!c || c.lligatCount <= 0) return p; nc = c.lligatCount - 1; pn = c.name; prev = c.lligatCount; return p.map(x => x.id === id ? { ...x, lligatCount: nc } : x) })
    if (nc > 0 || prev > 0) {
      fetch(`/api/candidates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lligatCount: nc }) }).then(() => fetch('/api/activity').then(r => r.json()).then(setActivity))
      lastActionRef.current = { type: 'decrement', personId: id, personName: pn, prevCount: prev }; setHasLastAction(true)
    }
  }, [])

  const undoLast = useCallback(() => {
    const la = lastActionRef.current; if (!la) return
    setCandidates(p => p.map(c => c.id === la.personId ? { ...c, lligatCount: la.prevCount } : c))
    fetch(`/api/candidates/${la.personId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lligatCount: la.prevCount }) }).then(() => fetchData())
    addToast(`Desfés: ${la.personName} → ${la.prevCount}`, 'info')
    lastActionRef.current = null; setHasLastAction(false)
  }, [fetchData, addToast])

  const updateCount = useCallback(async (id: string, val: number) => {
    if (val < 0) val = 0; setCandidates(p => p.map(c => c.id === id ? { ...c, lligatCount: val } : c))
    await fetch(`/api/candidates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lligatCount: val }) }); fetchData()
  }, [fetchData])

  const handleInputSubmit = useCallback((id: string) => {
    const val = parseInt(editValue, 10); if (!isNaN(val) && val >= 0) { updateCount(id, val); const c = candidates.find(x => x.id === id); if (c) addToast(`${c.name}: ${val}`, 'success') }; setEditingId(null); setEditValue('')
  }, [editValue, updateCount, candidates, addToast])

  const resetAll = useCallback(async () => {
    setShowResetConfirm(false); setCandidates(p => p.map(c => ({ ...c, lligatCount: 0 })))
    await Promise.all(candidates.map(c => fetch(`/api/candidates/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lligatCount: 0 }) })))
    await fetch('/api/activity', { method: 'DELETE' }) // Bug fix: clear stale activity logs
    setActivity([]); lastActionRef.current = null; setHasLastAction(false)
    addToast('Reiniciat!', 'info')
  }, [candidates, addToast])

  const shareSummary = useCallback(() => {
    const ne = candidates.filter(c => !EXEMPT_IDS.has(c.id)).sort((a, b) => b.lligatCount - a.lligatCount)
    const lines = ne.map((c, i) => `${i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '} ${c.name}: ${c.lligatCount}`).join('\n')
    const total = ne.reduce((s, c) => s + c.lligatCount, 0)
    const text = `🔥 LIGUES ESTIU 🔥\n\n${lines}\n\nTotal: ${total}\n${new Date().toLocaleString('ca-ES')}`
    navigator.clipboard.writeText(text).then(() => addToast('Copiat!', 'success')).catch(() => { setShareText(text); setShowShareModal(true) })
  }, [candidates, addToast])

  const submitLigueDetails = useCallback(async () => {
    if (!showLigueForm) return; const c = candidates.find(x => x.id === showLigueForm); if (!c) return
    await fetch('/api/ligues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personId: c.id, personName: c.name, nom: ligueNom, edat: ligueEdat, ubi: ligueUbi, rating: ligueRating }) })
    setLigues(await (await fetch('/api/ligues')).json()); addToast('Guardat! 📝', 'success')
    setShowLigueForm(null); setLigueNom(''); setLigueEdat(''); setLigueUbi(''); setLigueRating(0)
  }, [showLigueForm, candidates, ligueNom, ligueEdat, ligueUbi, ligueRating, addToast])

  const deleteLigue = useCallback(async (id: string) => {
    await fetch(`/api/ligues?id=${id}`, { method: 'DELETE' }); setLigues(await (await fetch('/api/ligues')).json()); addToast('Eliminada', 'info')
  }, [addToast])

  const skipLigue = useCallback(() => { setShowLigueForm(null); setLigueNom(''); setLigueEdat(''); setLigueUbi(''); setLigueRating(0) }, [])
  const openLigueForm = (id: string) => { setLigueHintId(null); setShowLigueForm(id); setLigueNom(''); setLigueEdat(''); setLigueUbi(''); setLigueRating(0) }

  // Derived
  const sorted = useMemo(() => [...candidates].sort((a, b) => { const ae = EXEMPT_IDS.has(a.id) ? 1 : 0; const be = EXEMPT_IDS.has(b.id) ? 1 : 0; if (ae !== be) return ae - be; return b.lligatCount - a.lligatCount || a.order - b.order }), [candidates])
  const nonExempt = useMemo(() => candidates.filter(c => !EXEMPT_IDS.has(c.id)), [candidates])
  const totalLligues = useMemo(() => nonExempt.reduce((s, c) => s + c.lligatCount, 0), [nonExempt])
  const avgLligues = nonExempt.length > 0 ? (totalLligues / nonExempt.length).toFixed(1) : '0'
  const topCandidate = sorted.find(c => !EXEMPT_IDS.has(c.id))
  const activeCount = nonExempt.filter(c => c.lligatCount > 0).length
  const lastActTime = activity.length > 0 ? timeAgo(activity[0].createdAt) : null
  const getAvgRating = (pid: string) => { const pl = ligues.filter(l => l.personId === pid && l.rating > 0); return pl.length === 0 ? 0 : pl.reduce((s, l) => s + l.rating, 0) / pl.length }
  const getStreak = (pid: string) => { const pa = activity.filter(a => a.personId === pid).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); let s = 0; for (const e of pa) { if (e.action === 'increment') s++; else break } return s }

  const rivalries = useMemo(() => {
    const s = nonExempt.filter(c => c.lligatCount > 0).sort((a, b) => b.lligatCount - a.lligatCount)
    const pairs: { a: Candidate; b: Candidate; diff: number }[] = []
    for (let i = 0; i < s.length - 1; i++) pairs.push({ a: s[i], b: s[i + 1], diff: s[i].lligatCount - s[i + 1].lligatCount })
    return pairs.filter(p => p.diff <= 2 && p.diff > 0).slice(0, 3)
  }, [nonExempt])

  const locationStats = useMemo(() => {
    const withUbi = ligues.filter(l => l.ubi.trim() !== '')
    const uniqueLocations = new Set(withUbi.map(l => l.ubi.trim().toLowerCase()))
    const counts: Record<string, number> = {}
    withUbi.forEach(l => { const k = l.ubi.trim(); if (k) counts[k] = (counts[k] || 0) + 1 })
    return { unique: uniqueLocations.size, top3: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3) }
  }, [ligues])

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates
    const q = searchQuery.toLowerCase()
    return candidates.filter(c => c.name.toLowerCase().includes(q) || c.nickname.toLowerCase().includes(q))
  }, [candidates, searchQuery])

  const [summerDays, setSummerDays] = useState('')
  useEffect(() => { const end = new Date('2026-09-22'); const u = () => { const d = Math.floor((end.getTime() - Date.now()) / 86400000); const h = Math.floor(((end.getTime() - Date.now()) % 86400000) / 3600000); setSummerDays(`${d}d ${h}h`) }; u(); const iv = setInterval(u, 60000); return () => clearInterval(iv) }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950"><div className="w-10 h-10 animate-spin"><Flame className="w-10 h-10 text-orange-500" /></div></div>

  const hdrBtn = "bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm border-orange-200 dark:border-stone-700 gap-1"

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`min-h-screen flex flex-col relative transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'}`}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${darkMode ? 'bg-orange-500/5' : 'bg-orange-200/20'}`} />
          <div className={`absolute top-1/3 -left-20 w-72 h-72 rounded-full blur-3xl ${darkMode ? 'bg-yellow-500/5' : 'bg-yellow-200/20'}`} />
          <div className={`absolute -bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl ${darkMode ? 'bg-rose-500/5' : 'bg-rose-200/15'}`} />
        </div>

        {/* Enhanced Confetti */}
        {showConfetti && <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">{Array.from({ length: 40 }).map((_, i) => <div key={i} className="absolute animate-confetti" style={{ left: `${Math.random()*100}%`, top: '-10px', width: 8+Math.random()*6, height: 8+Math.random()*6, backgroundColor: ['#f97316','#ef4444','#ec4899','#eab308','#22c55e'][i%5], borderRadius: Math.random()>0.5?'50%':'2px', '--confetti-delay': `${Math.random()*1.5}s`, '--confetti-duration': `${2.5+Math.random()*2}s` } as React.CSSProperties} />)}</div>}

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">{toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-right ${t.type==='success'?'bg-green-500/90 text-white':t.type==='warning'?'bg-amber-500/90 text-white':'bg-orange-500/90 text-white'}`}>
            {t.type==='success'?<Star className="w-4 h-4"/>:t.type==='warning'?<Trophy className="w-4 h-4"/>:<Zap className="w-4 h-4"/>} {t.message}
          </div>
        ))}</div>

        {/* HEADER */}
        <header className="relative z-10 pt-5 sm:pt-7 pb-3 px-4">
          <div className="text-center max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1.5">
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 animate-pulse" />
              <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-rose-500 to-pink-500 bg-clip-text text-transparent tracking-tight">Qui lliga més aquest estiu?</h1>
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-stone-400 mb-3 italic">&ldquo;El que compta és el nombre&rdquo; 🔥</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <div className={`inline-flex items-center gap-2 px-4 py-2 backdrop-blur-md rounded-full shadow-lg border relative overflow-hidden ${darkMode?'bg-stone-800/70 border-stone-700':'bg-white/70 border-orange-100'}`}>
                <Trophy className="w-5 h-5 text-amber-500" /><span className="font-extrabold text-lg">{totalLligues}</span><span className="text-sm text-gray-500">lligues</span>
                <div className="absolute inset-0 animate-shimmer-sweep pointer-events-none" />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-orange-500 font-medium"><Timer className="w-3 h-3" />Estiu: {summerDays}</div>
              <div className="flex items-center gap-1.5">
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={undoLast} disabled={!hasLastAction} aria-label="Desfer última acció" className={hdrBtn}><Undo2 className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent>Desfer</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={shareSummary} aria-label="Compartir resum" className={hdrBtn}><Share2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Compartir</span></Button></TooltipTrigger><TooltipContent>Compartir</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setShowTimeline(!showTimeline)} aria-label="Mostrar activitat" className={`${hdrBtn} ${showTimeline?'bg-orange-100 dark:bg-orange-900/30':''}`}><Clock className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent>Activitat</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode?'Mode clar':'Mode fosc'} className={hdrBtn}>{darkMode?<Sun className="w-3.5 h-3.5"/>:<Moon className="w-3.5 h-3.5"/>}</Button></TooltipTrigger><TooltipContent>{darkMode?'Clar':'Fosc'}</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setShowResetConfirm(true)} aria-label="Reiniciar comptadors" className={`${hdrBtn} hover:bg-red-50`}><RotateCcw className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent>Reiniciar</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setSoundEnabled(!soundEnabled)} aria-label={soundEnabled?'Silenciar so':'Activar so'} className={hdrBtn}>{soundEnabled?<Volume2 className="w-3.5 h-3.5"/>:<VolumeX className="w-3.5 h-3.5"/>}</Button></TooltipTrigger><TooltipContent>{soundEnabled?'Silenciar':'So'}</TooltipContent></Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* TIMELINE */}
        {showTimeline && activity.length > 0 && (
          <div className="relative z-10 px-4 max-w-7xl mx-auto w-full">
            <Card className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-orange-100/80 dark:border-stone-800/80 shadow-lg overflow-hidden mb-4">
              <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400" />
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-cyan-500" /><h3 className="text-sm font-bold text-gray-700 dark:text-stone-300">Activitat</h3><span className="text-[10px] text-gray-400">{activity.length}</span><Button variant="ghost" size="sm" onClick={() => setShowTimeline(false)} aria-label="Tancar" className="ml-auto h-6 w-6 p-0"><ChevronUp className="w-3.5 h-3.5" /></Button></div>
                <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1">{activity.slice(0, 30).map(e => (
                  <div key={e.id} className={`flex items-center gap-2 text-xs py-1 px-2 rounded-lg ${e.action==='increment'?'bg-green-50/60 dark:bg-green-900/15 text-green-700 dark:text-green-400':'bg-red-50/60 dark:bg-red-900/15 text-red-600 dark:text-red-400'}`}>
                    {e.action==='increment'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>}
                    <span className="font-medium">{e.personName}</span><span>{e.action==='increment'?'+1':'-1'}</span><span className="text-[10px]">→ {e.value}</span><span className="ml-auto text-[10px] opacity-60">{timeAgo(e.createdAt)}</span>
                  </div>
                ))}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MAIN */}
        <main className="relative z-10 flex-1 px-3 sm:px-4 pb-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            {/* LEFT: Candidates */}
            <div className="lg:col-span-5">
              <Card className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-orange-100/80 dark:border-stone-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500" />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3"><Heart className="w-5 h-5 text-rose-500" /><h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-stone-200">Els Candidates</h2><span className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">{candidates.length}</span></div>
                  <Separator className="mb-3 bg-orange-100 dark:bg-stone-700" />
                  <div className="relative mb-3"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" /><Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cercar per nom..." className="h-8 pl-8 text-xs bg-white/50 dark:bg-stone-800/50 border-orange-100 dark:border-stone-700" />{searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Netejar cerca" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {filteredCandidates.map((person, idx) => {
                      const rank = sorted.findIndex(s => s.id === person.id)
                      const isExempt = EXEMPT_IDS.has(person.id)
                      const streak = getStreak(person.id); const avgR = getAvgRating(person.id)
                      const achs = ACHIEVEMENTS.filter(a => person.lligatCount >= a.min)
                      return (
                        <div key={person.id} className={`relative group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 candidate-card-hover animate-card-entrance ${isExempt?'ring-2 ring-purple-400/60 dark:ring-purple-500/40 pulse-glow-purple':rank===0&&person.lligatCount>0?'ring-2 ring-amber-400 dark:ring-amber-500 shadow-lg shadow-amber-200/40 dark:shadow-amber-500/20 pulse-glow-amber':person.lligatCount>0?'ring-2 ring-green-400/60 dark:ring-green-500/40 shadow-md':'ring-1 ring-gray-200/80 dark:ring-stone-700/80'}`} style={{ animationDelay: `${idx*50}ms` }}>
                          <div className="aspect-square relative">
                            <img src={person.photo} alt={person.name} style={IMG_POS[person.id]?{objectPosition:IMG_POS[person.id]}:undefined} className={`w-full h-full object-cover transition-all duration-500 ${isExempt?'brightness-75 grayscale-[30%]':rank===0&&person.lligatCount>0?'brightness-110 saturate-150':person.lligatCount>0?'brightness-105 saturate-120':'brightness-90'}`} />
                            {isExempt && <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold shadow-lg bg-purple-500/90 text-white">🏳️‍🌈 EXEMPT</div>}
                            {person.lligatCount > 0 && !isExempt && <div className={`absolute top-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${rank===0?'bg-amber-400 text-amber-900':rank===1?'bg-gray-300 text-gray-700':rank===2?'bg-orange-400 text-orange-900':'bg-black/50 text-white'}`}>{rank+1}</div>}
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                              {streak>=2 && <div className={`flex items-center justify-center rounded-full text-[8px] font-black shadow-lg ${streak>=5?'w-6 h-6 bg-gradient-to-br from-red-500 to-orange-600 text-white':'w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 text-white'}`}>🔥</div>}
                              <div className={`px-2 py-0.5 rounded-full text-sm font-extrabold shadow-lg ${person.lligatCount>0?'bg-green-500 text-white':'bg-black/40 text-white/70'}`}>{person.lligatCount}</div>
                            </div>
                            {rank===0&&person.lligatCount>0&&!isExempt && <Crown className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-6 h-6 text-amber-400 drop-shadow-lg" />}
                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                              <p className="text-xs sm:text-sm font-bold text-white truncate">{person.name} {isExempt&&<span className="text-[8px] text-purple-300">(exempt)</span>}</p>
                              <p className="text-[9px] text-white/60 truncate">{person.nickname}</p>
                              {achs.length>0 && <div className="flex items-center gap-0.5 mt-0.5 flex-wrap">{achs.map(a => <Tooltip key={a.id}><TooltipTrigger asChild><span className="text-[10px]">{a.emoji}</span></TooltipTrigger><TooltipContent side="bottom" className="text-xs"><strong>{a.name}</strong>: {a.desc}</TooltipContent></Tooltip>)}</div>}
                              {avgR>0 && <p className="text-[8px] text-amber-300/80 flex items-center gap-0.5 mt-0.5"><Star className="w-2.5 h-2.5" /> {avgR.toFixed(1)}</p>}
                              <div className="flex items-center gap-1 mt-1">
                                <button onClick={e => { e.stopPropagation(); decrement(person.id) }} aria-label={`Disminuir ${person.name}`} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${person.lligatCount>0?'bg-red-500/80 hover:bg-red-600 text-white':'bg-white/20 text-white/40'}`}>−</button>
                                <button onClick={e => { e.stopPropagation(); setEditingId(person.id); setEditValue(String(person.lligatCount)) }} className="flex-1 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold">{person.lligatCount} lligat{person.lligatCount!==1?'s':''}</button>
                                <button onClick={e => { e.stopPropagation(); increment(person.id) }} aria-label={`Incrementar ${person.name}`} className="w-8 h-8 rounded-full bg-green-500/80 hover:bg-green-600 text-white text-xs font-bold flex items-center justify-center">+</button>
                              </div>
                              {ligueHintId===person.id && (
                                <button onClick={e => { e.stopPropagation(); openLigueForm(person.id) }} className="animate-hint-fade mt-1 w-full h-6 rounded-full bg-pink-500/80 hover:bg-pink-600 text-white text-[10px] font-bold flex items-center justify-center gap-1">💋 Afegir detalls</button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MIDDLE: Leaderboard */}
            <div className="lg:col-span-4">
              <Card className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-orange-100/80 dark:border-stone-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3"><Crown className="w-5 h-5 text-amber-500" /><h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-stone-200">Classificació</h2><span className="ml-auto text-[10px] text-gray-400 flex items-center gap-1"><RefreshCw className="w-3 h-3" />auto</span></div>
                  <Separator className="mb-3 bg-orange-100 dark:bg-stone-700" />
                  {nonExempt.every(c => c.lligatCount===0) ? (
                    <div className="text-center py-8"><Sparkles className="w-8 h-8 text-gray-300 dark:text-stone-600 mx-auto mb-2 animate-bounce" /><p className="text-sm text-gray-400 italic">Encara ningú ha lligat...</p><p className="text-xs text-gray-300 mt-1">Sigues el primer! 💪</p></div>
                  ) : (
                    <div className="space-y-2 max-h-[560px] overflow-y-auto custom-scrollbar">{sorted.map((person, index) => {
                      const maxCount = sorted.filter(c => !EXEMPT_IDS.has(c.id))[0]?.lligatCount || 1
                      const barWidth = maxCount>0?(person.lligatCount/maxCount)*100:0
                      const avgR = getAvgRating(person.id); const pLigues = ligues.filter(l => l.personId===person.id)
                      const rc = rankChanges[person.id]||0; const isExempt = EXEMPT_IDS.has(person.id)
                      const stripe = !isExempt&&index===0?'rank-stripe-gold':!isExempt&&index===1?'rank-stripe-silver':!isExempt&&index===2?'rank-stripe-bronze':''
                      return (
                        <div key={person.id} className={`relative flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-300 animate-card-entrance ${stripe} ${isExempt?'bg-purple-50/60 dark:bg-purple-900/15 border border-purple-200/40 dark:border-purple-800/30':index===0?'bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50':index===1?'bg-gray-50/80 dark:bg-stone-800/30 border border-gray-200/50 dark:border-stone-700/50':index===2?'bg-orange-50/80 dark:bg-orange-900/15 border border-orange-200/50 dark:border-orange-800/50':'border border-transparent hover:bg-orange-50/30 dark:hover:bg-stone-800/20'}`} style={{ animationDelay: `${index*40}ms` }}>
                          <div className="flex flex-col items-center w-8 flex-shrink-0">
                            <span className="text-lg">{isExempt?'🏳️':index===0?'👑':index===1?'🥈':index===2?'🥉':index+1}</span>
                            {rc!==0&&!isExempt && (<span className={`text-[9px] font-bold flex items-center gap-0.5 animate-rank-bounce ${rc>0?'text-green-500':'text-red-500'}`}>{rc>0?(<ArrowUp className="w-2.5 h-2.5"/>):(<ArrowDown className="w-2.5 h-2.5"/>)}{Math.abs(rc)}</span>)}
                          </div>
                          <div className={`relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${index===0&&!isExempt?'ring-2 ring-amber-400':'ring-1 ring-gray-200 dark:ring-stone-700'}`}>
                            <img src={person.photo} alt={person.name} style={IMG_POS[person.id]?{objectPosition:IMG_POS[person.id]}:undefined} className={`w-full h-full object-cover ${isExempt?'grayscale-[30%] opacity-70':''}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5"><p className={`text-sm font-bold truncate ${isExempt?'text-purple-500 dark:text-purple-400':'text-gray-700 dark:text-stone-300'}`}>{person.name}</p><p className="text-[10px] text-gray-400">{person.nickname}</p></div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {pLigues.length>0 && <button onClick={() => setShowLigueHistory(person.id)} aria-label={`Historial de ${person.name}`} className="text-[9px] text-orange-500 hover:underline">📖 {pLigues.length}</button>}
                              {avgR>0 && <span className="text-[9px] text-amber-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{avgR.toFixed(1)}</span>}
                            </div>
                            {person.lligatCount>0&&!isExempt && <div className="mt-1 h-1.5 w-full bg-gray-200/60 dark:bg-stone-700/40 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400 transition-all duration-700 relative" style={{ width: `${barWidth}%` }}><div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" /></div></div>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => decrement(person.id)} aria-label={`Disminuir ${person.name}`} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${person.lligatCount>0?'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200':'bg-gray-100 dark:bg-stone-800 text-gray-300'}`}>−</button>
                            <span className="w-8 text-center text-lg font-extrabold text-gray-800 dark:text-stone-200">{person.lligatCount}</span>
                            <button onClick={() => increment(person.id)} aria-label={`Incrementar ${person.name}`} className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 flex items-center justify-center text-xs font-bold">+</button>
                          </div>
                        </div>
                      )
                    })}</div>
                  )}
                  {editingId && (
                    <div className="mt-3 p-3 bg-orange-50/80 dark:bg-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                      <p className="text-xs text-gray-600 dark:text-stone-400 mb-2">Editar <strong>{candidates.find(c => c.id===editingId)?.name}</strong>:</p>
                      <div className="flex items-center gap-2"><Input type="number" min="0" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key==='Enter') handleInputSubmit(editingId!) }} className="h-8 text-center font-bold" autoFocus /><Button size="sm" onClick={() => handleInputSubmit(editingId!)} className="bg-green-500 hover:bg-green-600 text-white">✓</Button><Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditValue('') }}>✕</Button></div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Rivalries */}
              {rivalries.length>0 && (
                <Card className="mt-4 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-orange-100/80 dark:border-stone-800/80 shadow-xl overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2"><Swords className="w-4 h-4 text-red-500" /><h3 className="text-sm font-bold text-gray-700 dark:text-stone-300">Rivalitats</h3></div>
                    <div className="space-y-1.5">{rivalries.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-100/30 dark:border-red-800/20">
                        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-stone-700"><img src={r.a.photo} alt={r.a.name} style={IMG_POS[r.a.id]?{objectPosition:IMG_POS[r.a.id]}:undefined} className="w-full h-full object-cover" /></div>
                        <span className="font-bold text-gray-700 dark:text-stone-300">{r.a.name}</span><span className="text-red-500 font-extrabold">⚔️</span>
                        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-stone-700"><img src={r.b.photo} alt={r.b.name} style={IMG_POS[r.b.id]?{objectPosition:IMG_POS[r.b.id]}:undefined} className="w-full h-full object-cover" /></div>
                        <span className="font-bold text-gray-700 dark:text-stone-300">{r.b.name}</span><span className="ml-auto text-[10px] text-red-500 font-bold">-{r.diff}</span>
                      </div>
                    ))}</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT: Stats */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-orange-100/80 dark:border-stone-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400" />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3"><Zap className="w-5 h-5 text-rose-500" /><h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-stone-200">Estadístiques</h2></div>
                  <Separator className="mb-3 bg-orange-100 dark:bg-stone-700" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-xl p-2.5 text-center border border-orange-100/50 dark:border-orange-800/30"><p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{totalLligues}</p><p className="text-[10px] text-gray-500">Total</p></div>
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/10 rounded-xl p-2.5 text-center border border-rose-100/50 dark:border-rose-800/30"><p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{avgLligues}</p><p className="text-[10px] text-gray-500">Mitjana</p></div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl p-2.5 text-center border border-green-100/50 dark:border-green-800/30"><p className="text-2xl font-extrabold text-green-600 dark:text-green-400">{activeCount}</p><p className="text-[10px] text-gray-500">Actius</p></div>
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 rounded-xl p-2.5 text-center border border-amber-100/50 dark:border-amber-800/30"><p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 truncate">{topCandidate&&topCandidate.lligatCount>0?topCandidate.name:'—'}</p><p className="text-[10px] text-gray-500">Líder</p></div>
                  </div>
                  {/* Speed */}
                  {(() => { const ri = activity.filter(a => a.action==='increment'&&Date.now()-new Date(a.createdAt).getTime()<86400000).length; if (ri===0&&totalLligues===0) return null; const sp = Math.min(ri/5*100, 100); return (
                    <div className="mt-3 p-2 rounded-lg bg-gradient-to-r from-cyan-50/50 to-blue-50/50 dark:from-cyan-900/10 dark:to-blue-900/10 border border-cyan-100/30 dark:border-cyan-800/20">
                      <div className="flex items-center gap-1.5 mb-1"><Gauge className="w-3 h-3 text-cyan-500" /><span className="text-[10px] font-bold text-gray-500 dark:text-stone-400">Ritme avui</span></div>
                      <div className="h-2 bg-gray-200/60 dark:bg-stone-700/40 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700" style={{ width: `${sp}%` }} /></div>
                      <p className="text-[9px] text-gray-400 mt-0.5">{ri} lligades/24h {sp>=80?'🚀':sp>=40?'🔥':'💤'}</p>
                    </div>
                  )})()}
                  {/* Location Stats */}
                  {locationStats.unique>0 && (
                    <div className="mt-3 p-2 rounded-lg bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-900/10 dark:to-cyan-900/10 border border-teal-100/30 dark:border-teal-800/20">
                      <div className="flex items-center gap-1.5 mb-1"><MapPin className="w-3 h-3 text-teal-500" /><span className="text-[10px] font-bold text-gray-500 dark:text-stone-400">📍 Ubicacions</span></div>
                      <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{locationStats.unique}</p>
                      {locationStats.top3.length>0 && <div className="mt-1 space-y-0.5">{locationStats.top3.map(([loc, cnt]) => <div key={loc} className="flex items-center justify-between text-[9px]"><span className="text-gray-600 dark:text-stone-400 truncate">{loc}</span><span className="font-bold text-teal-500 ml-1">{cnt}×</span></div>)}</div>}
                    </div>
                  )}
                  {/* Top Rating */}
                  {ligues.length>0 && (<div className="mt-3"><div className="flex items-center gap-1.5 mb-2"><Award className="w-3.5 h-3.5 text-amber-500" /><p className="text-[11px] font-bold text-gray-500">Top Valoració</p></div><div className="space-y-1">{candidates.filter(c => getAvgRating(c.id)>0).sort((a, b) => getAvgRating(b.id)-getAvgRating(a.id)).slice(0, 3).map((c, i) => (<div key={c.id} className="flex items-center gap-2 text-[10px] px-2 py-1 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/30 dark:border-amber-800/20"><span>{i===0?'🥇':i===1?'🥈':'🥉'}</span><span className="font-semibold text-gray-700 dark:text-stone-300">{c.name}</span><div className="ml-auto flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /><span className="font-bold text-amber-600 dark:text-amber-400">{getAvgRating(c.id).toFixed(1)}</span></div></div>))}</div></div>)}
                  {/* Achievements */}
                  {candidates.some(c => ACHIEVEMENTS.some(a => c.lligatCount>=a.min)) && (<div className="mt-3"><div className="flex items-center gap-1.5 mb-2"><Target className="w-3.5 h-3.5 text-orange-500" /><p className="text-[11px] font-bold text-gray-500">Fites</p></div><div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">{candidates.filter(c => ACHIEVEMENTS.some(a => c.lligatCount>=a.min)).map(c => (<div key={c.id} className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded-lg bg-gradient-to-r from-orange-50/50 to-rose-50/50 dark:from-orange-900/10 dark:to-rose-900/10 border border-orange-100/30 dark:border-orange-800/20"><div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-stone-700 flex-shrink-0"><img src={c.photo} alt={c.name} style={IMG_POS[c.id]?{objectPosition:IMG_POS[c.id]}:undefined} className="w-full h-full object-cover" /></div><span className="font-semibold text-gray-700 dark:text-stone-300 truncate">{c.name}</span><div className="ml-auto flex items-center gap-0.5">{ACHIEVEMENTS.filter(a => c.lligatCount>=a.min).map(a => <Tooltip key={a.id}><TooltipTrigger asChild><span className="text-xs">{a.emoji}</span></TooltipTrigger><TooltipContent side="left" className="text-xs"><strong>{a.name}</strong>: {a.desc}</TooltipContent></Tooltip>)}</div></div>))}</div></div>)}
                  {/* Podium - Enhanced with proportional height bars */}
                  {(() => { const t3 = sorted.filter(c => c.lligatCount>0&&!EXEMPT_IDS.has(c.id)).slice(0, 3); if (t3.length<2) return null; const maxC = t3[0]?.lligatCount||1; return (
                    <div className="mt-4 p-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-100/30 dark:border-amber-800/20">
                      <p className="text-[11px] font-bold text-gray-500 mb-2 text-center">🏆 PODIUM</p>
                      <div className="flex items-end justify-center gap-1.5">
                        {[t3[1], t3[0], t3[2]].filter(Boolean).map((p, i) => { const is1st = i===1; const is2nd = i===0; const barH = Math.max(Math.round((p!.lligatCount/maxC)*64), 20); return p ? (
                          <div key={p.id} className="text-center flex-1">
                            {is1st && <Crown className="w-5 h-5 text-amber-400 mx-auto mb-0.5" />}
                            <div className={`relative ${is1st?'w-11 h-11':'w-9 h-9'} mx-auto rounded-full overflow-hidden ring-2 ${is1st?'ring-amber-400':is2nd?'ring-gray-300':'ring-orange-300'} mb-1`}><img src={p.photo} alt={p.name} style={IMG_POS[p.id]?{objectPosition:IMG_POS[p.id]}:undefined} className="w-full h-full object-cover" /></div>
                            <p className={`text-[9px] font-bold truncate ${is1st?'text-amber-700 dark:text-amber-400':'text-gray-600 dark:text-stone-400'}`}>{p.name}</p>
                            <div className={`mt-0.5 rounded text-[10px] font-bold py-0.5 ${is1st?'bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-400':is2nd?'bg-gray-200 dark:bg-stone-700 text-gray-600':'bg-orange-200 dark:bg-orange-800/50 text-orange-700 dark:text-orange-400'}`}>{p.lligatCount}</div>
                            <div className={`rounded-t mt-1 transition-all duration-700 ${is1st?'bg-amber-300/50 dark:bg-amber-700/40':is2nd?'bg-gray-300/50 dark:bg-stone-600/40':'bg-orange-300/50 dark:bg-orange-700/40'}`} style={{ height: `${barH}px` }} />
                            <span className="text-xs">{is1st?'👑':is2nd?'🥈':'🥉'}</span>
                          </div>
                        ) : <div key={i} className="flex-1" /> }) }
                      </div>
                    </div>
                  )})()}
                  <div className="mt-3 p-2.5 bg-gradient-to-r from-orange-50/50 to-rose-50/50 dark:from-orange-900/10 dark:to-rose-900/10 rounded-xl border border-orange-100/30 dark:border-orange-800/20">
                    <p className="text-[11px] text-center text-gray-500 dark:text-stone-400 italic">{getMotivation(totalLligues)}</p>
                  </div>
                </CardContent>
              </Card>
              {/* Rules */}
              <Card className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-orange-100/80 dark:border-stone-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400" />
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-stone-300 mb-2 flex items-center gap-1.5"><Hash className="w-4 h-4 text-cyan-500" /> Com funciona?</h3>
                  <div className="space-y-1.5 text-[11px] text-gray-500 dark:text-stone-400">
                    <p>+ Suma <strong>+1</strong> cada vegada que lliguis</p>
                    <p>− Resta si t&apos;has equivocat</p>
                    <p>↩️ Desfés l&apos;última acció</p>
                    <p>🔍 Cerca per nom o àlies</p>
                    <p>🏆 El qui tingui més va primer</p>
                    <p>📊 Es guarda automàticament</p>
                    <p>🔄 S&apos;actualitza cada 10s</p>
                    <p>📋 Comparteix la classificació!</p>
                    <p>💋 Detalls de cada lligada</p>
                    <p>⭐ Valora (1-10)</p>
                    <p>🏅 Desbloqueja fites!</p>
                    <p>⚔️ Rivalitats en directe</p>
                    <div className="mt-2 pt-2 border-t border-purple-200/50 dark:border-purple-800/30">
                      <p className="text-purple-600 dark:text-purple-400 font-bold">🏳️‍🌈 ElRey</p>
                      <p className="text-purple-500/80 dark:text-purple-400/70 mt-0.5"><strong>Exempt</strong> - GAY, lliga massa. Però pot sumar!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* LIGUE FORM MODAL */}
        {showLigueForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={skipLigue}>
            <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
              <Card className="bg-white dark:bg-stone-900 shadow-2xl border-2 border-orange-200 dark:border-orange-800 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-orange-400"><img src={candidates.find(c => c.id===showLigueForm)?.photo||''} alt="" className="w-full h-full object-cover" /></div><div><h3 className="font-bold text-gray-800 dark:text-stone-200 text-sm">Detalls 💋</h3><p className="text-[10px] text-gray-500">{candidates.find(c => c.id===showLigueForm)?.name}</p></div></div>
                    <button onClick={skipLigue} aria-label="Tancar" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-3">
                    <div><label className="text-xs font-semibold text-gray-600 dark:text-stone-400 flex items-center gap-1.5 mb-1"><Heart className="w-3 h-3 text-rose-400" /> Nom</label><Input value={ligueNom} onChange={e => setLigueNom(e.target.value)} placeholder="Nom (opcional)" className="h-9 text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-600 dark:text-stone-400 flex items-center gap-1.5 mb-1"><Users className="w-3 h-3 text-amber-400" /> Edat</label><Input value={ligueEdat} onChange={e => setLigueEdat(e.target.value)} placeholder="Edat (opcional)" className="h-9 text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-600 dark:text-stone-400 flex items-center gap-1.5 mb-1"><MapPin className="w-3 h-3 text-cyan-400" /> Ubicació</label><Input value={ligueUbi} onChange={e => setLigueUbi(e.target.value)} placeholder="On? (opcional)" className="h-9 text-sm" /></div>
                    <div><label className="text-xs font-semibold text-gray-600 dark:text-stone-400 flex items-center gap-1.5 mb-2"><Star className="w-3 h-3 text-amber-400" /> Valoració</label>
                      <div className="flex items-center gap-1 flex-wrap">{Array.from({ length: 10 }, (_, i) => i+1).map(v => (<button key={v} onClick={() => setLigueRating(v===ligueRating?0:v)} aria-label={`Valoració ${v}`} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all rating-btn-hover ${v<=ligueRating?'bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-md':'bg-gray-100 dark:bg-stone-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-stone-700'}`}>{v}</button>))}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4"><Button onClick={submitLigueDetails} className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold">Guardar 💾</Button><Button variant="ghost" onClick={skipLigue}>Saltar</Button></div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* LIGUE HISTORY MODAL */}
        {showLigueHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLigueHistory(null)}>
            <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <Card className="bg-white dark:bg-stone-900 shadow-2xl border-2 border-orange-200 dark:border-orange-800 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-cyan-400 to-emerald-400" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-orange-400"><img src={candidates.find(c => c.id===showLigueHistory)?.photo||''} alt="" className="w-full h-full object-cover" /></div><div><h3 className="font-bold text-gray-800 dark:text-stone-200">Historial 📖</h3><p className="text-[10px] text-gray-400">{ligues.filter(l => l.personId===showLigueHistory).length} lligades</p></div></div>
                    <button onClick={() => setShowLigueHistory(null)} aria-label="Tancar historial" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  {ligues.filter(l => l.personId===showLigueHistory).length===0 ? <p className="text-sm text-gray-400 italic text-center py-4">Sense detalls... 😴</p> : (
                    <div className="space-y-2">{ligues.filter(l => l.personId===showLigueHistory).map(ligue => (
                      <div key={ligue.id} className="p-3 rounded-xl bg-gradient-to-r from-orange-50/50 to-rose-50/50 dark:from-orange-900/10 dark:to-rose-900/10 border border-orange-100/50 dark:border-orange-800/30 relative group">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {ligue.nom && <div><span className="text-gray-400 flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" /> Nom:</span><p className="font-semibold text-gray-700 dark:text-stone-300">{ligue.nom}</p></div>}
                          {ligue.edat && <div><span className="text-gray-400 flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> Edat:</span><p className="font-semibold text-gray-700 dark:text-stone-300">{ligue.edat}</p></div>}
                          {ligue.ubi && <div><span className="text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> Ubi:</span><p className="font-semibold text-gray-700 dark:text-stone-300">{ligue.ubi}</p></div>}
                          {ligue.rating>0 && <div><span className="text-gray-400 flex items-center gap-0.5"><Star className="w-2.5 h-2.5" /> Val:</span><div className="flex items-center gap-1">{Array.from({ length: 10 }, (_, i) => <span key={i} className={`text-[10px] ${i<ligue.rating?'text-amber-400':'text-gray-300'}`}>★</span>)}<span className="font-bold text-amber-500">{ligue.rating}/10</span></div></div>}
                        </div>
                        <div className="flex items-center justify-between mt-1"><p className="text-[10px] text-gray-400 flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> {timeAgo(ligue.createdAt)}</p><button onClick={() => deleteLigue(ligue.id)} aria-label="Eliminar lligada" className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button></div>
                      </div>
                    ))}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* SHARE MODAL */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
            <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
              <Card className="bg-white dark:bg-stone-900 shadow-2xl border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-400" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-gray-800 dark:text-stone-200">Compartir</h3><button onClick={() => setShowShareModal(false)} aria-label="Tancar" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
                  <textarea readOnly value={shareText} className="w-full h-40 p-3 text-xs bg-gray-50 dark:bg-stone-800 border border-gray-200 dark:border-stone-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  <div className="flex gap-2 mt-3"><Button onClick={() => { navigator.clipboard.writeText(shareText); addToast('Copiat!', 'success'); setShowShareModal(false) }} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold">Copiar 📋</Button><Button variant="ghost" onClick={() => setShowShareModal(false)}>Tancar</Button></div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* RESET DIALOG */}
        <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><RotateCcw className="w-5 h-5 text-red-500" />Reiniciar tots els comptadors?</DialogTitle><DialogDescription>Això posarà tots els comptadors a 0 i esborrarà l&apos;historial d&apos;activitat.</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="ghost" onClick={() => setShowResetConfirm(false)}>Cancel·lar</Button><Button variant="destructive" onClick={resetAll} className="gap-1"><RotateCcw className="w-3.5 h-3.5" />Reiniciar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* FOOTER - Bug fix: check for both null AND empty string */}
        <footer className="relative z-10 mt-auto py-3 px-4 text-center border-t border-orange-100/30 dark:border-stone-800/30 bg-white/30 dark:bg-stone-900/30 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 dark:text-stone-600">
            <span>🔥 Qui lliga més? &copy; {new Date().getFullYear()}</span>
            {lastActTime && lastActTime !== '' && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Última: {lastActTime}</span>}
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
