'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Flame, Trophy, Heart, RotateCcw, Star, Zap, Crown, Sparkles,
  Moon, Sun, Share2, Clock, ChevronUp, Users,
  ArrowUp, ArrowDown, RefreshCw, X, Trash2, TrendingUp, MapPin, Calendar, Award,
  Volume2, VolumeX, Target, Timer, Swords, Gauge, Undo2, Search,
  PartyPopper, Activity, Eye, MessageCircle, BarChart3, Medal, Pencil, Wine,
  Camera, ImageIcon,
} from 'lucide-react'

/* ─── Types ─── */
interface Candidate { id: string; name: string; nickname: string; photo: string; lligatCount: number; order: number }
interface ActivityEntry { id: string; personId: string; personName: string; action: string; value: number; createdAt: string }
interface LigueEntry { id: string; personId: string; personName: string; nom: string; edat: string; ubi: string; rating: number; photoData: string; createdAt: string }
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

const MOTIVATIONAL_QUOTES = [
  "La nit és jove i tu també 🌙",
  "Qui no arrisca no lliga 💃",
  "Aquest estiu és TEU 🔥",
  "La sort ajuda els atrevits 🎲",
  "Cada lligada compta 📊",
  "El veritable campió no es rendeix mai 💪",
  "Avui pot ser EL dia 🌟",
  "Fes que compti! 🥂",
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

// Activity heatmap: returns array of last 7 days with counts
function getActivityHeatmap(activity: ActivityEntry[]): { day: string; count: number; label: string }[] {
  const days = ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']
  const result: { day: string; count: number; label: string }[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const dayEnd = dayStart + 86400000
    const count = activity.filter(a => a.action === 'increment' && new Date(a.createdAt).getTime() >= dayStart && new Date(a.createdAt).getTime() < dayEnd).length
    const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1
    result.push({ day: days[dayIdx], count, label: i === 0 ? 'Avui' : i === 1 ? 'Ahir' : `fa ${i}d` })
  }
  return result
}

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [ligues, setLigues] = useState<LigueEntry[]>([])
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [darkMode, setDarkMode] = useState(() => { if (typeof window === 'undefined') return false; const stored = localStorage.getItem('objetciu-dark-mode'); if (stored !== null) return stored === 'true'; return window.matchMedia('(prefers-color-scheme: dark)').matches })
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
  const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid')
  const [showProfileModal, setShowProfileModal] = useState<string | null>(null) // kept for backward compat
  const [versusIds, setVersusIds] = useState<[string, string] | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)])
  const [editingLigueId, setEditingLigueId] = useState<string | null>(null)
  const [editLigueNom, setEditLigueNom] = useState('')
  const [editLigueEdat, setEditLigueEdat] = useState('')
  const [editLigueUbi, setEditLigueUbi] = useState('')
  const [editLigueRating, setEditLigueRating] = useState(0)
  const [counterBump, setCounterBump] = useState(false)
  const [footerTime, setFooterTime] = useState('')
  const [nightMode, setNightMode] = useState(false)
  const [newActivityCount, setNewActivityCount] = useState(0)
  const [liguePhoto, setLiguePhoto] = useState('')
  const [liguePhotoPreview, setLiguePhotoPreview] = useState('')
  const [activeSection, setActiveSection] = useState<'stats' | 'feed'>('stats')
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)
  const [pendingIncrement, setPendingIncrement] = useState<{ personId: string; personName: string; newCount: number; prevCount: number } | null>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [feedFilterId, setFeedFilterId] = useState<string | null>(null)
  const [ligueFormError, setLigueFormError] = useState('')
  const lastActivityLen = useRef(0)
  const prevRanks = useRef<Record<string, number>>({})
  const toastId = useRef(0)
  const prevTopId = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastActionRef = useRef<LastAction | null>(null)
  const ligueHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevTotalRef = useRef(0)
  const toastOutIds = useRef<Set<number>>(new Set())
  const fetchData = useCallback(async () => {
    try {
      const [c, a, l] = await Promise.all([fetch('/api/candidates'), fetch('/api/activity'), fetch('/api/ligues')])
      const cd = await c.json(); const ad = await a.json(); const ld = await l.json()
      // Check for API errors - but be resilient, partial data is OK
      const errors: string[] = []
      if (cd?.error) errors.push(`Candidates: ${cd.error} — ${cd.detail || ''}`)
      if (ad?.error) errors.push(`Activity: ${ad.error} — ${ad.detail || ''}`)
      if (ld?.error) errors.push(`Ligues: ${ld.error} — ${ld.detail || ''}`)
      // Set whatever data we got (even if partial)
      if (Array.isArray(cd)) setCandidates(cd)
      if (Array.isArray(ad)) setActivity(ad)
      if (Array.isArray(ld)) setLigues(ld)
      // Show error only if ALL three failed, or if candidates failed
      if (errors.length > 0 && (!Array.isArray(cd) || errors.length >= 2)) {
        setDbError(errors.join(' | '))
      } else {
        setDbError(null)
      }
      // Detect new activity from other users
      if (Array.isArray(ad) && lastActivityLen.current > 0 && ad.length > lastActivityLen.current) {
        setNewActivityCount(p => p + (ad.length - lastActivityLen.current))
      }
      if (Array.isArray(ad)) lastActivityLen.current = ad.length
    } catch (err: any) { setDbError(err?.message || 'Network error') } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const iv = setInterval(fetchData, 10000); return () => clearInterval(iv) }, [fetchData])
  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode || nightMode); localStorage.setItem('objetciu-dark-mode', String(darkMode)) }, [darkMode, nightMode])
  useEffect(() => { localStorage.setItem('objetciu-sound', String(soundEnabled)) }, [soundEnabled])
  useEffect(() => { audioRef.current = new Audio('/sounds/ding.mp3'); audioRef.current.volume = 0.3; return () => { audioRef.current = null } }, [])

  const playDing = useCallback(() => { if (soundEnabled && audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}) } }, [soundEnabled])
  const addToast = useCallback((msg: string, type = 'info') => { const id = ++toastId.current; setToasts(p => [...p, { id, message: msg, type }]); setTimeout(() => { toastOutIds.current.add(id); setToasts(p => p.map(t => t.id === id ? { ...t, type: t.type + ' out' } : t)); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 300) }, 2700) }, [])
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
    // Set pending increment and open mandatory ligue form
    setPendingIncrement({ personId: id, personName: pn, newCount: nc, prevCount: prev })
    setShowLigueForm(id)
    setLigueNom(''); setLigueEdat(''); setLigueUbi(''); setLigueRating(0); setLiguePhoto(''); setLiguePhotoPreview(''); setLigueFormError('')
    playDing()
  }, [playDing])
  const confirmIncrement = useCallback(async () => {
    if (!pendingIncrement) return
    const { personId, personName, newCount, prevCount } = pendingIncrement
    // Validate required fields
    if (!ligueNom.trim() || !ligueEdat.trim() || !ligueUbi.trim() || ligueRating === 0) {
      setLigueFormError('Tots els camps són obligatoris (excepte la foto)')
      return
    }
    setLigueFormError('')
    // Save count to API
    await fetch(`/api/candidates/${personId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lligatCount: newCount }) })
    const actData = await (await fetch('/api/activity')).json(); if (Array.isArray(actData)) setActivity(actData)
    // Save ligue details
    await fetch('/api/ligues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personId, personName, nom: ligueNom, edat: ligueEdat, ubi: ligueUbi, rating: ligueRating, photoData: liguePhoto }) })
    const ligData = await (await fetch('/api/ligues')).json(); if (Array.isArray(ligData)) setLigues(ligData)
    addToast(`${personName} +1! 💪`, 'success')
    // Check achievement
    const newAchievement = ACHIEVEMENTS.find(a => a.min === newCount)
    if (newAchievement) {
      addToast(`${personName} ha desbloquejat "${newAchievement.name}" ${newAchievement.emoji}!`, 'warning')
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 5000)
    }
    lastActionRef.current = { type: 'increment', personId, personName, prevCount }; setHasLastAction(true)
    setPendingIncrement(null)
    setShowLigueForm(null); setLigueNom(''); setLigueEdat(''); setLigueUbi(''); setLigueRating(0); setLiguePhoto(''); setLiguePhotoPreview('')
  }, [pendingIncrement, ligueNom, ligueEdat, ligueUbi, ligueRating, liguePhoto, addToast, playDing])
  const cancelIncrement = useCallback(() => {
    if (!pendingIncrement) return
    const { personId, prevCount } = pendingIncrement
    setCandidates(p => p.map(c => c.id === personId ? { ...c, lligatCount: prevCount } : c))
    setPendingIncrement(null)
    setShowLigueForm(null); setLigueNom(''); setLigueEdat(''); setLigueUbi(''); setLigueRating(0); setLiguePhoto(''); setLiguePhotoPreview(''); setLigueFormError('')
    addToast('Desfés', 'info')
  }, [pendingIncrement, addToast])
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
    await fetch('/api/activity', { method: 'DELETE' })
    await fetch('/api/ligues', { method: 'DELETE' })
    setActivity([]); setLigues([]); lastActionRef.current = null; setHasLastAction(false)
    addToast('Reiniciat! Tot esborrat 🗑️', 'info')
  }, [candidates, addToast])
  const shareSummary = useCallback(() => {
    const ne = candidates.filter(c => !EXEMPT_IDS.has(c.id)).sort((a, b) => b.lligatCount - a.lligatCount)
    const total = ne.reduce((s, c) => s + c.lligatCount, 0)
    const lines = ne.map((c, i) => `${i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '} ${c.name}: ${c.lligatCount}${getAvgRating(c.id) > 0 ? ` ⭐${getAvgRating(c.id).toFixed(1)}` : ''}`).join('\n')
    const active = ne.filter(c => c.lligatCount > 0).length
    const text = `🔥 LIGUES ESTIU 🔥\n\n${lines}\n\n📊 Total: ${total} | Mitjana: ${(total/ne.length).toFixed(1)} | Actius: ${active}/${ne.length}\n${getMotivation(total)}\n\n${new Date().toLocaleString('ca-ES')}`
    navigator.clipboard.writeText(text).then(() => addToast('Copiat!', 'success')).catch(() => { setShareText(text); setShowShareModal(true) })
  }, [candidates, addToast])
  const submitLigueDetails = useCallback(async () => {
    if (!showLigueForm) return; const c = candidates.find(x => x.id === showLigueForm); if (!c) return
    // If there's a pending increment, use confirmIncrement instead
    if (pendingIncrement) { await confirmIncrement(); return }
    await fetch('/api/ligues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personId: c.id, personName: c.name, nom: ligueNom, edat: ligueEdat, ubi: ligueUbi, rating: ligueRating, photoData: liguePhoto }) })
    const ligData = await (await fetch('/api/ligues')).json(); if (Array.isArray(ligData)) setLigues(ligData)
    addToast('Guardat! 📝', 'success')
    setShowLigueForm(null); setLigueNom(''); setLigueEdat(''); setLigueUbi(''); setLigueRating(0); setLiguePhoto(''); setLiguePhotoPreview(''); setLigueFormError('')
  }, [showLigueForm, candidates, ligueNom, ligueEdat, ligueUbi, ligueRating, liguePhoto, addToast, pendingIncrement, confirmIncrement])
  const deleteLigue = useCallback(async (id: string) => {
    await fetch(`/api/ligues?id=${id}`, { method: 'DELETE' }); setLigues(await (await fetch('/api/ligues')).json()); addToast('Lligada eliminada 🗑️', 'info'); setDeleteConfirmId(null)
  }, [addToast])
  const saveLigueEdit = useCallback(async () => {
    if (!editingLigueId) return
    await fetch('/api/ligues', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingLigueId, nom: editLigueNom, edat: editLigueEdat, ubi: editLigueUbi, rating: editLigueRating }) })
    setLigues(await (await fetch('/api/ligues')).json()); addToast('Editat! ✏️', 'success'); setEditingLigueId(null); setEditLigueNom(''); setEditLigueEdat(''); setEditLigueUbi(''); setEditLigueRating(0)
  }, [editingLigueId, editLigueNom, editLigueEdat, editLigueUbi, editLigueRating, addToast])
  const startLigueEdit = (l: LigueEntry) => { setEditingLigueId(l.id); setEditLigueNom(l.nom); setEditLigueEdat(l.edat); setEditLigueUbi(l.ubi); setEditLigueRating(l.rating) }
  const skipLigue = useCallback(() => { if (pendingIncrement) { cancelIncrement(); return }; setShowLigueForm(null); setLigueNom(''); setLigueEdat(''); setLigueUbi(''); setLigueRating(0); setLiguePhoto(''); setLiguePhotoPreview(''); setLigueFormError('') }, [pendingIncrement, cancelIncrement])
  const openLigueForm = (id: string) => { setLigueHintId(null); setShowLigueForm(id); setLigueNom(''); setLigueEdat(''); setLigueUbi(''); setLigueRating(0); setLiguePhoto(''); setLiguePhotoPreview(''); setPendingIncrement(null); setLigueFormError('') }
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Use createImageBitmap with imageOrientation to respect EXIF orientation (fixes selfie mirror issue)
    if (typeof createImageBitmap === 'function') {
      createImageBitmap(file, { imageOrientation: 'from-image' }).then(bitmap => {
        const canvas = document.createElement('canvas')
        let w = bitmap.width, h = bitmap.height
        const maxW = 800
        if (w > maxW) { h = (h * maxW) / w; w = maxW }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0, w, h)
        bitmap.close()
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        setLiguePhoto(dataUrl)
        setLiguePhotoPreview(dataUrl)
      }).catch(() => {
        // Fallback: try the old method if createImageBitmap fails
        processImageFallback(file)
      })
    } else {
      processImageFallback(file)
    }
  }
  const processImageFallback = (file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        const maxW = 800
        if (w > maxW) { h = (h * maxW) / w; w = maxW }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        setLiguePhoto(dataUrl)
        setLiguePhotoPreview(dataUrl)
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }
  // Derived
  const sorted = useMemo(() => [...candidates].sort((a, b) => { const ae = EXEMPT_IDS.has(a.id) ? 1 : 0; const be = EXEMPT_IDS.has(b.id) ? 1 : 0; if (ae !== be) return ae - be; return b.lligatCount - a.lligatCount || a.order - b.order }), [candidates])
  const nonExempt = useMemo(() => candidates.filter(c => !EXEMPT_IDS.has(c.id)), [candidates])
  const totalLligues = useMemo(() => nonExempt.reduce((s, c) => s + c.lligatCount, 0), [nonExempt])
  const avgLligues = nonExempt.length > 0 ? (totalLligues / nonExempt.length).toFixed(1) : '0'
  const topCandidate = sorted.find(c => !EXEMPT_IDS.has(c.id))
  const activeCount = nonExempt.filter(c => c.lligatCount > 0).length
  const lastActTime = activity.length > 0 ? timeAgo(activity[0].createdAt) : null
  // Set of candidate IDs that currently have lligatCount > 0 — used to filter stats
  const activeCandidateIds = useMemo(() => new Set(candidates.filter(c => c.lligatCount > 0).map(c => c.id)), [candidates])
  const getAvgRating = (pid: string) => { if (!activeCandidateIds.has(pid)) return 0; const pl = ligues.filter(l => l.personId === pid && l.rating > 0); return pl.length === 0 ? 0 : pl.reduce((s, l) => s + l.rating, 0) / pl.length }
  const getStreak = (pid: string) => { const pa = activity.filter(a => a.personId === pid).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); let s = 0; for (const e of pa) { if (e.action === 'increment') s++; else break } return s }
  const isCaliente = (pid: string) => { const h = Date.now() - 3600000; return activity.some(a => a.personId === pid && a.action === 'increment' && new Date(a.createdAt).getTime() > h) }
  const rivalries = useMemo(() => {
    const s = nonExempt.filter(c => c.lligatCount > 0).sort((a, b) => b.lligatCount - a.lligatCount)
    const pairs: { a: Candidate; b: Candidate; diff: number }[] = []
    for (let i = 0; i < s.length - 1; i++) pairs.push({ a: s[i], b: s[i + 1], diff: s[i].lligatCount - s[i + 1].lligatCount })
    return pairs.filter(p => p.diff <= 2 && p.diff > 0).slice(0, 3)
  }, [nonExempt])

  const locationStats = useMemo(() => {
    const withUbi = ligues.filter(l => l.ubi.trim() !== '' && activeCandidateIds.has(l.personId))
    const uniqueLocations = new Set(withUbi.map(l => l.ubi.trim().toLowerCase()))
    const counts: Record<string, number> = {}
    withUbi.forEach(l => { const k = l.ubi.trim(); if (k) counts[k] = (counts[k] || 0) + 1 })
    return { unique: uniqueLocations.size, top3: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3) }
  }, [ligues, activeCandidateIds])

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates
    const q = searchQuery.toLowerCase()
    return candidates.filter(c => c.name.toLowerCase().includes(q) || c.nickname.toLowerCase().includes(q))
  }, [candidates, searchQuery])

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const now = Date.now()
    const weekAgo = now - 7 * 86400000
    const weekActivity = activity.filter(a => a.action === 'increment' && new Date(a.createdAt).getTime() > weekAgo && activeCandidateIds.has(a.personId))
    const perPerson: Record<string, number> = {}
    weekActivity.forEach(a => { perPerson[a.personId] = (perPerson[a.personId] || 0) + 1 })
    const sorted = Object.entries(perPerson).sort((a, b) => b[1] - a[1])
    return { total: weekActivity.length, top: sorted[0] ? { id: sorted[0][0], count: sorted[0][1] } : null }
  }, [activity, activeCandidateIds])

  const heatmap = useMemo(() => getActivityHeatmap(activity.filter(a => activeCandidateIds.has(a.personId))), [activity, activeCandidateIds])

  const recentLigues = useMemo(() => {
    return ligues.filter(l => (l.nom || l.ubi || l.rating > 0) && activeCandidateIds.has(l.personId)).slice(0, 5)
  }, [ligues, activeCandidateIds])

  // Today's stats
  const todayStats = useMemo(() => {
    const n = new Date(), ds = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(), de = ds + 86400000
    const ta = activity.filter(a => a.action === 'increment' && new Date(a.createdAt).getTime() >= ds && new Date(a.createdAt).getTime() < de && activeCandidateIds.has(a.personId))
    const tl = ligues.filter(l => new Date(l.createdAt).getTime() >= ds && new Date(l.createdAt).getTime() < de && activeCandidateIds.has(l.personId))
    const pp: Record<string, number> = {}; ta.forEach(a => { pp[a.personId] = (pp[a.personId] || 0) + 1 })
    const s = Object.entries(pp).sort((a, b) => b[1] - a[1])
    const ar = tl.some(l => l.rating > 0) ? tl.filter(l => l.rating > 0).reduce((sum, l) => sum + l.rating, 0) / tl.filter(l => l.rating > 0).length : 0
    return { total: ta.length, top: s[0] ? { id: s[0][0], count: s[0][1] } : null, avgRating: ar }
  }, [activity, ligues, activeCandidateIds])

  const [summerDays, setSummerDays] = useState('')
  useEffect(() => { const end = new Date('2026-09-22'); const u = () => { const d = Math.floor((end.getTime() - Date.now()) / 86400000); const h = Math.floor(((end.getTime() - Date.now()) % 86400000) / 3600000); setSummerDays(`${d}d ${h}h`) }; u(); const iv = setInterval(u, 60000); return () => clearInterval(iv) }, [])

  // Hall of Fame records
  const hallOfFame = useMemo(() => {
    const inc = activity.filter(a => a.action === 'increment' && activeCandidateIds.has(a.personId))
    // Most lligues in a single day
    const dayCounts: Record<string, number> = {}
    inc.forEach(a => { const d = new Date(a.createdAt).toISOString().slice(0, 10); dayCounts[d] = (dayCounts[d] || 0) + 1 })
    const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]
    // Longest streak ever (across all activity sorted by time per person)
    let maxStreak = 0; let streakHolder = ''
    candidates.filter(c => activeCandidateIds.has(c.id)).forEach(c => { const pa = activity.filter(a => a.personId === c.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); let s = 0; for (const e of pa) { if (e.action === 'increment') s++; else break } if (s > maxStreak) { maxStreak = s; streakHolder = c.name } })
    // Highest rating ever
    const eligibleLigues = ligues.filter(l => activeCandidateIds.has(l.personId))
    const topRating = eligibleLigues.length > 0 ? eligibleLigues.reduce((b, l) => l.rating > (b?.rating || 0) ? l : b, eligibleLigues[0]) : null
    return { bestDay: bestDay ? { date: bestDay[0], count: bestDay[1] } : null, maxStreak, streakHolder, topRating }
  }, [activity, candidates, ligues, activeCandidateIds])

  // Counter bump effect
  useEffect(() => { if (prevTotalRef.current > 0 && totalLligues !== prevTotalRef.current) { setCounterBump(true); setTimeout(() => setCounterBump(false), 300) } prevTotalRef.current = totalLligues }, [totalLligues])

  // Footer time
  useEffect(() => { const u = () => setFooterTime(new Date().toLocaleString('ca-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })); u(); const iv = setInterval(u, 60000); return () => clearInterval(iv) }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => { const tag = (e.target as HTMLElement)?.tagName; const ce = (e.target as HTMLElement)?.contentEditable; if (tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||ce==='true') return; if ((e.ctrlKey||e.metaKey)&&e.key==='z') { e.preventDefault(); undoLast() } else if (e.key==='d'||e.key==='D') setDarkMode(p=>!p); else if (e.key==='s'||e.key==='S') setSoundEnabled(p=>!p); else if (e.key==='?') addToast('⌨️ D=fosc, S=so, Ctrl+Z=desfer, ?=ajuda','info') }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [undoLast, addToast])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-14 h-14 animate-spin"><Flame className="w-14 h-14 text-orange-500" /></div>
          <div className="absolute inset-0 animate-ping opacity-20"><Flame className="w-14 h-14 text-orange-500" /></div>
        </div>
        <p className="text-sm text-gray-400 dark:text-stone-500 animate-pulse">Carregant...</p>
      </div>
    </div>
  )

  const hdrBtn = "bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm border-orange-200 dark:border-stone-700 gap-1 hover:bg-white/80 dark:hover:bg-stone-700/60 transition-all duration-200"

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`min-h-screen flex flex-col relative transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'}`}>
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-float-slow ${darkMode ? 'bg-orange-500/5' : 'bg-orange-200/20'}`} />
          <div className={`absolute top-1/3 -left-20 w-72 h-72 rounded-full blur-3xl animate-float-medium ${darkMode ? 'bg-yellow-500/5' : 'bg-yellow-200/20'}`} />
          <div className={`absolute -bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl animate-float-fast ${darkMode ? 'bg-rose-500/5' : 'bg-rose-200/15'}`} />
        </div>

        {/* Confetti */}
        {showConfetti && <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">{Array.from({ length: 50 }).map((_, i) => <div key={i} className="absolute animate-confetti" style={{ left: `${Math.random()*100}%`, top: '-10px', width: 8+Math.random()*8, height: 8+Math.random()*8, backgroundColor: ['#f97316','#ef4444','#ec4899','#eab308','#22c55e','#a855f7','#06b6d4'][i%7], borderRadius: Math.random()>0.5?'50%':'2px', '--confetti-delay': `${Math.random()*1.5}s`, '--confetti-duration': `${2.5+Math.random()*2}s` } as React.CSSProperties} />)}</div>}

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">{toasts.map(t => {
          const isOut = t.type.endsWith(' out'); const baseType = t.type.replace(' out', '')
          return (
          <div key={t.id} className={`px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium flex items-center gap-2 backdrop-blur-md border border-white/20 ${isOut?'animate-toast-out':'animate-in fade-in slide-in-from-right'} ${baseType==='success'?'bg-green-500/90 text-white':baseType==='warning'?'bg-amber-500/90 text-white':'bg-orange-500/90 text-white'}`}>
            {baseType==='success'?<Star className="w-4 h-4"/>:baseType==='warning'?<Trophy className="w-4 h-4"/>:<Zap className="w-4 h-4"/>} {t.message}
          </div>)
        })}</div>

        {/* HEADER */}
        <header className="relative z-10 pt-4 sm:pt-6 pb-3 px-4">
          <div className="text-center max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1">
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 animate-pulse" />
              <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-600 via-rose-500 to-pink-500 bg-clip-text text-transparent tracking-tight">Qui lliga més aquest estiu?</h1>
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 animate-pulse" />
              <span className="relative flex h-2.5 w-2.5 ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" /></span>
            </div>
            <p className="text-sm text-gray-400 dark:text-stone-500 mb-2 italic">&ldquo;{quote}&rdquo;</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {/* Total badge with sparkle */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 backdrop-blur-md rounded-2xl shadow-lg border relative overflow-hidden ${darkMode?'bg-stone-800/70 border-stone-700':'bg-white/70 border-orange-100'}`}>
                <Trophy className="w-5 h-5 text-amber-500" /><span className={`font-extrabold text-lg ${counterBump?'animate-counter-bump':''}`}>{totalLligues}</span><span className="text-sm text-gray-500">lligues</span>
                <div className="absolute inset-0 animate-shimmer-sweep pointer-events-none" />
                {totalLligues > 0 && Array.from({length:5}).map((_,i) => <span key={i} className="absolute animate-badge-sparkle pointer-events-none text-[10px]" style={{'--sparkle-x':`${15+Math.random()*70}%`,'--sparkle-y':`${15+Math.random()*70}%`,'--sparkle-delay':`${i*0.4}s`} as React.CSSProperties}>✦</span>)}
              </div>
              {/* Summer countdown */}
              <div className="flex items-center gap-1 text-sm text-orange-500 font-medium bg-orange-50/50 dark:bg-orange-900/10 px-2 py-1 rounded-full">
                <Timer className="w-3.5 h-3.5" />Estiu: {summerDays}
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={undoLast} disabled={!hasLastAction} aria-label="Desfer última acció" className={hdrBtn}><Undo2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>Desfer</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={shareSummary} aria-label="Compartir resum" className={hdrBtn}><Share2 className="w-4 h-4" /><span className="hidden sm:inline">Compartir</span></Button></TooltipTrigger><TooltipContent>Compartir</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => { setShowTimeline(!showTimeline); setNewActivityCount(0) }} aria-label="Mostrar activitat" className={`relative ${hdrBtn} ${showTimeline?'bg-orange-100 dark:bg-orange-900/30':''}`}><Activity className="w-4 h-4" />{newActivityCount>0&&<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">{newActivityCount>9?'9+':newActivityCount}</span>}</Button></TooltipTrigger><TooltipContent>Activitat{newActivityCount>0?` (${newActivityCount} noves)`:''}</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)} aria-label={darkMode?'Mode clar':'Mode fosc'} className={hdrBtn}>{darkMode?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}</Button></TooltipTrigger><TooltipContent>{darkMode?'Clar':'Fosc'}</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setNightMode(!nightMode)} aria-label={nightMode?'Mode normal':'Mode nit'} className={`${hdrBtn} ${nightMode?'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700':''}`}><Wine className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>{nightMode?'Mode normal':'Mode Nit 🍷'}</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setShowResetConfirm(true)} aria-label="Reiniciar comptadors" className={`${hdrBtn} hover:bg-red-50 dark:hover:bg-red-900/20`}><RotateCcw className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent>Reiniciar</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setSoundEnabled(!soundEnabled)} aria-label={soundEnabled?'Silenciar so':'Activar so'} className={hdrBtn}>{soundEnabled?<Volume2 className="w-4 h-4"/>:<VolumeX className="w-4 h-4"/>}</Button></TooltipTrigger><TooltipContent>{soundEnabled?'Silenciar':'So'}</TooltipContent></Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* DATABASE ERROR BANNER */}
        {dbError && (
          <div className="relative z-10 px-4 max-w-7xl mx-auto w-full mb-4">
            <div className="bg-red-500/90 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg backdrop-blur-md">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Error de connexió a la base de dades</p>
                <p className="text-xs opacity-80 mt-1 break-all">{dbError}</p>
                <p className="text-xs opacity-70 mt-1">Verifica les variables d'entorn a Vercel: TURSO_DATABASE_URL i TURSO_AUTH_TOKEN</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDbError(null)} className="text-white/80 hover:text-white hover:bg-white/20"><X className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* TIMELINE */}
        {showTimeline && activity.length > 0 && (
          <div className="relative z-10 px-4 max-w-7xl mx-auto w-full animate-in slide-in-from-top duration-300">
            <Card className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-orange-100/80 dark:border-stone-800/80 shadow-lg overflow-hidden mb-4">
              <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3"><Clock className="w-4 h-4 text-cyan-500" /><h3 className="text-base font-bold text-gray-700 dark:text-stone-300">Activitat</h3><Badge variant="secondary" className="text-[11px] h-5">{activity.length}</Badge><Button variant="ghost" size="sm" onClick={() => setShowTimeline(false)} aria-label="Tancar" className="ml-auto h-6 w-6 p-0"><ChevronUp className="w-3.5 h-3.5" /></Button></div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">{activity.slice(0, 30).map(e => (
                  <div key={e.id} className={`flex items-center gap-2 text-xs py-1 px-2 rounded-lg transition-colors ${e.action==='increment'?'bg-green-50/60 dark:bg-green-900/15 text-green-700 dark:text-green-400':'bg-red-50/60 dark:bg-red-900/15 text-red-600 dark:text-red-400'}`}>
                    {e.action==='increment'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>}
                    <span className="font-medium">{e.personName}</span><span>{e.action==='increment'?'+1':'-1'}</span><span className="text-xs">→ {e.value}</span><span className="ml-auto text-xs opacity-60">{timeAgo(e.createdAt)}</span>
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
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-stone-200">Els Candidates</h2>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">{candidates.length}</span>
                    {/* View toggle */}
                    <div className="flex items-center gap-0.5 ml-2 bg-gray-100 dark:bg-stone-800 rounded-lg p-0.5">
                      <button onClick={() => setActiveTab('grid')} className={`p-1.5 rounded text-xs transition-all ${activeTab==='grid'?'bg-white dark:bg-stone-700 shadow-sm text-orange-600 dark:text-orange-400':'text-gray-400'}`}>▦</button>
                      <button onClick={() => setActiveTab('list')} className={`p-1.5 rounded text-xs transition-all ${activeTab==='list'?'bg-white dark:bg-stone-700 shadow-sm text-orange-600 dark:text-orange-400':'text-gray-400'}`}>☰</button>
                    </div>
                  </div>
                  <Separator className="mb-4 bg-orange-100 dark:bg-stone-700" />
                  {/* Search */}
                  <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cercar per nom o àlies..." className="h-10 pl-9 text-sm bg-white/50 dark:bg-stone-800/50 border-orange-100 dark:border-stone-700 focus:border-orange-300 dark:focus:border-orange-700" />{searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Netejar cerca" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}</div>

                  {activeTab === 'grid' ? (
                    /* GRID VIEW */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      {filteredCandidates.map((person, idx) => {
                        const rank = sorted.findIndex(s => s.id === person.id)
                        const isExempt = EXEMPT_IDS.has(person.id)
                        const streak = getStreak(person.id); const avgR = getAvgRating(person.id)
                        const achs = ACHIEVEMENTS.filter(a => person.lligatCount >= a.min)
                        return (
                          <div key={person.id} className={`relative group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 candidate-card-hover animate-card-entrance ${isExempt?'ring-2 ring-purple-400/60 dark:ring-purple-500/40 pulse-glow-purple':rank===0&&person.lligatCount>0?'ring-2 ring-amber-400 dark:ring-amber-500 shadow-lg shadow-amber-200/40 dark:shadow-amber-500/20 pulse-glow-amber':person.lligatCount>0?'ring-2 ring-green-400/60 dark:ring-green-500/40 shadow-md':'ring-1 ring-gray-200/80 dark:ring-stone-700/80'}`} style={{ animationDelay: `${idx*50}ms` }}>
                            <div className="aspect-square relative cursor-pointer" onClick={() => setSelectedCandidateId(person.id)}>
                              <img src={person.photo} alt={person.name} style={IMG_POS[person.id]?{objectPosition:IMG_POS[person.id]}:undefined} className={`w-full h-full object-cover transition-all duration-500 ${isExempt?'brightness-75 grayscale-[30%]':rank===0&&person.lligatCount>0?'brightness-110 saturate-150':person.lligatCount>0?'brightness-105 saturate-120':'brightness-90'}`} />
                              {isExempt && <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-lg bg-purple-500/90 text-white backdrop-blur-sm">🏳️‍🌈 EXEMPT</div>}
                              {person.lligatCount > 0 && !isExempt && <div className={`absolute top-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${rank===0?'bg-amber-400 text-amber-900':rank===1?'bg-gray-300 text-gray-700':rank===2?'bg-orange-400 text-orange-900':'bg-black/50 text-white'}`}>{rank+1}</div>}
                              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                                {streak>=2 && <div className={`flex items-center justify-center rounded-full text-[10px] font-black shadow-lg ${streak>=5?'w-6 h-6 bg-gradient-to-br from-red-500 to-orange-600 text-white animate-bounce':'w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 text-white'}`}>🔥</div>}
                                <div className={`px-2 py-0.5 rounded-full text-sm font-extrabold shadow-lg ${person.lligatCount>0?'bg-green-500 text-white':'bg-black/40 text-white/70'}`}>{person.lligatCount}</div>
                              </div>
                              {rank===0&&person.lligatCount>0&&!isExempt && <Crown className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-6 h-6 text-amber-400 drop-shadow-lg" />}
                              {/* Profile peek icon */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                                <p className="text-sm sm:text-base font-bold text-white truncate">{person.name} {isExempt&&<span className="text-xs text-purple-300">(exempt)</span>}</p>
                                <p className="text-xs text-white/60 truncate">{person.nickname}</p>
                                {achs.length>0 && <div className="flex items-center gap-0.5 mt-0.5 flex-wrap">{achs.map(a => <Tooltip key={a.id}><TooltipTrigger asChild><span className="text-xs hover:scale-125 inline-block transition-transform">{a.emoji}</span></TooltipTrigger><TooltipContent side="bottom" className="text-xs"><strong>{a.name}</strong>: {a.desc}</TooltipContent></Tooltip>)}</div>}
                                {avgR>0 && <p className="text-xs text-amber-300/80 flex items-center gap-0.5 mt-0.5"><Star className="w-2.5 h-2.5" /> {avgR.toFixed(1)}</p>}
                                <div className="flex items-center gap-1 mt-1">
                                  <button onClick={e => { e.stopPropagation(); decrement(person.id) }} aria-label={`Disminuir ${person.name}`} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${person.lligatCount>0?'bg-red-500/80 hover:bg-red-600 text-white hover:scale-110':'bg-white/20 text-white/40'}`}>−</button>
                                  <button onClick={e => { e.stopPropagation(); setEditingId(person.id); setEditValue(String(person.lligatCount)) }} className="flex-1 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-bold transition-all duration-200">{person.lligatCount} lligat{person.lligatCount!==1?'s':''}</button>
                                  <button onClick={e => { e.stopPropagation(); increment(person.id) }} aria-label={`Incrementar ${person.name}`} className="w-10 h-10 rounded-full bg-green-500/80 hover:bg-green-600 text-white text-sm font-bold flex items-center justify-center transition-all duration-200 hover:scale-110">+</button>
                                </div>
                                {ligueHintId===person.id && (
                                  <button onClick={e => { e.stopPropagation(); openLigueForm(person.id) }} className="animate-hint-fade mt-1 w-full h-8 rounded-full bg-pink-500/80 hover:bg-pink-600 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all duration-200">💋 Afegir detalls</button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    /* LIST VIEW */
                    <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar">
                      {filteredCandidates.map((person, idx) => {
                        const rank = sorted.findIndex(s => s.id === person.id)
                        const isExempt = EXEMPT_IDS.has(person.id)
                        const streak = getStreak(person.id)
                        const achs = ACHIEVEMENTS.filter(a => person.lligatCount >= a.min)
                        return (
                          <div key={person.id} className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-orange-50/50 dark:hover:bg-stone-800/30 cursor-pointer ${isExempt?'bg-purple-50/40 dark:bg-purple-900/10':''}`} onClick={() => setSelectedCandidateId(person.id)}>
                            <div className={`relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ${rank===0&&person.lligatCount>0&&!isExempt?'ring-amber-400':'ring-gray-200 dark:ring-stone-700'}`}>
                              <img src={person.photo} alt={person.name} style={IMG_POS[person.id]?{objectPosition:IMG_POS[person.id]}:undefined} className={`w-full h-full object-cover ${isExempt?'grayscale-[30%] opacity-70':''}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-gray-800 dark:text-stone-200 truncate">{person.name}</span>
                                {isExempt && <Badge variant="secondary" className="text-[10px] h-5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">EXEMPT</Badge>}
                                <span className="text-xs text-gray-400 truncate">{person.nickname}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {streak>=2 && <span className="text-xs">🔥</span>}
                                {achs.length>0 && <span className="text-xs">{achs.map(a => a.emoji).join('')}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={e => { e.stopPropagation(); decrement(person.id) }} className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${person.lligatCount>0?'bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200':'bg-gray-100 dark:bg-stone-800 text-gray-300'}`}>−</button>
                              <span className="w-8 text-center text-base font-extrabold text-gray-800 dark:text-stone-200">{person.lligatCount}</span>
                              <button onClick={e => { e.stopPropagation(); increment(person.id) }} className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 flex items-center justify-center text-sm font-bold transition-all">+</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* MIDDLE: Leaderboard */}
            <div className="lg:col-span-4">
              <Card className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-orange-100/80 dark:border-stone-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400" />
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4"><Crown className="w-5 h-5 text-amber-500" /><h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-stone-200">Classificació</h2><span className="ml-auto text-xs text-gray-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" style={{animationDuration:'3s'}}/>auto</span></div>
                  <Separator className="mb-4 bg-orange-100 dark:bg-stone-700" />
                  {nonExempt.every(c => c.lligatCount===0) ? (
                    <div className="text-center py-10">
                      <div className="relative mx-auto w-24 h-24 mb-4">
                        <div className="absolute inset-0 rounded-full bg-orange-100 dark:bg-orange-900/20 animate-pulse" />
                        <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-orange-300 dark:text-orange-700 animate-bounce" />
                        <span className="absolute -top-1 -right-1 text-lg animate-float-slow">💫</span>
                        <span className="absolute -bottom-1 -left-1 text-sm animate-float-medium">✨</span>
                        <span className="absolute top-1/2 -right-2 text-xs animate-float-fast">⭐</span>
                      </div>
                      <p className="text-sm text-gray-400 italic">Encara ningú ha lligat...</p>
                      <p className="text-xs text-gray-300 mt-1">Sigues el primer! 💪</p>
                      <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-orange-400/60 animate-pulse"><Flame className="w-3 h-3" />La nit és jove</div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[650px] overflow-y-auto custom-scrollbar">{sorted.map((person, index) => {
                      const maxCount = sorted.filter(c => !EXEMPT_IDS.has(c.id))[0]?.lligatCount || 1
                      const barWidth = maxCount>0?(person.lligatCount/maxCount)*100:0
                      const avgR = getAvgRating(person.id); const pLigues = ligues.filter(l => l.personId===person.id)
                      const rc = rankChanges[person.id]||0; const isExempt = EXEMPT_IDS.has(person.id)
                      const stripe = !isExempt&&index===0?'rank-stripe-gold animate-gradient-border':!isExempt&&index===1?'rank-stripe-silver':!isExempt&&index===2?'rank-stripe-bronze':''
                      const barColor = !isExempt&&index===0?'#f59e0b':!isExempt&&index===1?'#9ca3af':!isExempt&&index===2?'#f97316':'#f97316'
                      return (
                        <div key={person.id} className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 animate-card-entrance hover:shadow-lg hover:shadow-orange-200/20 dark:hover:shadow-orange-500/5 hover:-translate-y-0.5 leaderboard-item ${stripe} ${isExempt?'bg-purple-50/60 dark:bg-purple-900/15 border border-purple-200/40 dark:border-purple-800/30':index===0?'bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50':index===1?'bg-gray-50/80 dark:bg-stone-800/30 border border-gray-200/50 dark:border-stone-700/50':index===2?'bg-orange-50/80 dark:bg-orange-900/15 border border-orange-200/50 dark:border-orange-800/50':'border border-transparent hover:bg-orange-50/30 dark:hover:bg-stone-800/20'}`} style={{ animationDelay: `${index*40}ms`, '--lb-bar-color': barColor } as React.CSSProperties}>
                          <div className="flex flex-col items-center w-8 flex-shrink-0">
                            <span className="text-xl">{isExempt?'🏳️':index===0?'👑':index===1?'🥈':index===2?'🥉':index+1}</span>
                            {rc!==0&&!isExempt && (<span className={`text-xs font-bold flex items-center gap-0.5 animate-rank-bounce ${rc>0?'text-green-500':'text-red-500'}`}>{rc>0?(<ArrowUp className="w-2.5 h-2.5"/>):(<ArrowDown className="w-2.5 h-2.5"/>)}{Math.abs(rc)}</span>)}
                          </div>
                          <div className={`relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ${index===0&&!isExempt?'ring-2 ring-amber-400 shadow-md shadow-amber-200/30':'ring-1 ring-gray-200 dark:ring-stone-700'}`}>
                            <img src={person.photo} alt={person.name} style={IMG_POS[person.id]?{objectPosition:IMG_POS[person.id]}:undefined} className={`w-full h-full object-cover ${isExempt?'grayscale-[30%] opacity-70':''}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5"><p className={`text-base font-bold truncate ${isExempt?'text-purple-500 dark:text-purple-400':'text-gray-700 dark:text-stone-300'}`}>{person.name}</p>{!isExempt&&isCaliente(person.id)&&<span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>}<p className="text-xs text-gray-400">{person.nickname}</p></div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {pLigues.length>0 && <button onClick={() => setShowLigueHistory(person.id)} aria-label={`Historial de ${person.name}`} className="text-xs text-orange-500 hover:underline flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" />{pLigues.length}</button>}
                              {avgR>0 && <span className="text-xs text-amber-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{avgR.toFixed(1)}</span>}
                            </div>
                            {person.lligatCount>0&&!isExempt && <div className="mt-1 h-1.5 w-full bg-gray-200/60 dark:bg-stone-700/40 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400 transition-all duration-700 relative" style={{ width: `${barWidth}%` }}><div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" /></div></div>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => decrement(person.id)} aria-label={`Disminuir ${person.name}`} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${person.lligatCount>0?'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 hover:scale-110':'bg-gray-100 dark:bg-stone-800 text-gray-300'}`}>−</button>
                            <span className="w-8 text-center text-xl font-extrabold text-gray-800 dark:text-stone-200">{person.lligatCount}</span>
                            <button onClick={() => increment(person.id)} aria-label={`Incrementar ${person.name}`} className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 flex items-center justify-center text-sm font-bold transition-all duration-200 hover:scale-110">+</button>
                          </div>
                        </div>
                      )
                    })}</div>
                  )}
                  {editingId && (
                    <div className="mt-3 p-3 bg-orange-50/80 dark:bg-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50 animate-in slide-in-from-bottom duration-200">
                      <p className="text-xs text-gray-600 dark:text-stone-400 mb-2">Editar <strong>{candidates.find(c => c.id===editingId)?.name}</strong>:</p>
                      <div className="flex items-center gap-2"><Input type="number" min="0" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key==='Enter') handleInputSubmit(editingId!) }} className="h-8 text-center font-bold" autoFocus /><Button size="sm" onClick={() => handleInputSubmit(editingId!)} className="bg-green-500 hover:bg-green-600 text-white">✓</Button><Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditValue('') }}>✕</Button></div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Rivalries */}
              {rivalries.length>0 && (
                <Card className="mt-4 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-orange-100/80 dark:border-stone-800/80 shadow-xl overflow-hidden animate-card-entrance">
                  <div className="h-1.5 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400" />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3"><Swords className="w-4 h-4 text-red-500" /><h3 className="text-base font-bold text-gray-700 dark:text-stone-300">Rivalitats</h3><Badge variant="secondary" className="text-[10px] h-5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">EN DIRECTE</Badge></div>
                    <div className="space-y-2.5">{rivalries.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-100/30 dark:border-red-800/20 transition-all hover:scale-[1.01]">
                        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-stone-700"><img src={r.a.photo} alt={r.a.name} style={IMG_POS[r.a.id]?{objectPosition:IMG_POS[r.a.id]}:undefined} className="w-full h-full object-cover" /></div>
                        <span className="font-bold text-gray-700 dark:text-stone-300">{r.a.name}</span><span className="text-red-500 font-extrabold">⚔️</span>
                        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-stone-700"><img src={r.b.photo} alt={r.b.name} style={IMG_POS[r.b.id]?{objectPosition:IMG_POS[r.b.id]}:undefined} className="w-full h-full object-cover" /></div>
                        <span className="font-bold text-gray-700 dark:text-stone-300">{r.b.name}</span><span className="ml-auto text-xs text-red-500 font-bold">-{r.diff}</span>
                      </div>
                    ))}</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT: Stats / Feed */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-md border-orange-100/80 dark:border-stone-800/80 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400" />
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-rose-500" />
                    {/* Section tabs */}
                    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-stone-800 rounded-lg p-0.5 flex-1">
                      <button onClick={() => setActiveSection('stats')} className={`flex-1 px-3 py-1.5 rounded text-sm font-bold transition-all ${activeSection==='stats'?'bg-white dark:bg-stone-700 shadow-sm text-orange-600 dark:text-orange-400':'text-gray-400'}`}>Estadístiques</button>
                      <button onClick={() => setActiveSection('feed')} className={`flex-1 px-3 py-1.5 rounded text-sm font-bold transition-all ${activeSection==='feed'?'bg-white dark:bg-stone-700 shadow-sm text-orange-600 dark:text-orange-400':'text-gray-400'}`}>Feed 📸</button>
                    </div>
                  </div>
                  <Separator className="mb-4 bg-orange-100 dark:bg-stone-700" />
                  {activeSection === 'stats' ? (
                  <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-xl p-3 text-center border border-orange-100/50 dark:border-orange-800/30 hover:shadow-md transition-shadow"><p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{totalLligues}</p><p className="text-sm text-gray-500">Total</p></div>
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/10 rounded-xl p-3 text-center border border-rose-100/50 dark:border-rose-800/30 hover:shadow-md transition-shadow"><p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{avgLligues}</p><p className="text-sm text-gray-500">Mitjana</p></div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl p-3 text-center border border-green-100/50 dark:border-green-800/30 hover:shadow-md transition-shadow"><p className="text-2xl font-extrabold text-green-600 dark:text-green-400">{activeCount}</p><p className="text-sm text-gray-500">Actius</p></div>
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 rounded-xl p-3 text-center border border-amber-100/50 dark:border-amber-800/30 hover:shadow-md transition-shadow"><p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 truncate">{topCandidate&&topCandidate.lligatCount>0?topCandidate.name:'—'}</p><p className="text-sm text-gray-500">Líder</p></div>
                  </div>
                  {/* Weekly stats */}
                  {weeklyStats.total > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10 border border-violet-100/30 dark:border-violet-800/20">
                      <div className="flex items-center gap-1.5 mb-1"><Calendar className="w-3 h-3 text-violet-500" /><span className="text-xs font-bold text-gray-500 dark:text-stone-400">Aquesta setmana</span></div>
                      <p className="text-sm font-extrabold text-violet-600 dark:text-violet-400">{weeklyStats.total} lligades</p>
                      {weeklyStats.top && (
                        <p className="text-xs text-gray-400 mt-0.5">👑 {candidates.find(c => c.id === weeklyStats.top!.id)?.name} ({weeklyStats.top.count})</p>
                      )}
                    </div>
                  )}
                  {/* Avui stats */}
                  {todayStats.total > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100/30 dark:border-emerald-800/20">
                      <div className="flex items-center gap-1.5 mb-1"><BarChart3 className="w-3 h-3 text-emerald-500" /><span className="text-xs font-bold text-gray-500 dark:text-stone-400">📊 Avui</span></div>
                      <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{todayStats.total} lligades</p>
                      {todayStats.top && <p className="text-xs text-gray-400 mt-0.5">👑 {candidates.find(c => c.id === todayStats.top!.id)?.name} ({todayStats.top.count})</p>}
                      {todayStats.avgRating > 0 && <p className="text-xs text-amber-500 mt-0.5">⭐ Mitjana: {todayStats.avgRating.toFixed(1)}/10</p>}
                    </div>
                  )}
                  {/* Speed */}
                  {(() => { const ri = activity.filter(a => a.action==='increment'&&Date.now()-new Date(a.createdAt).getTime()<86400000&&activeCandidateIds.has(a.personId)).length; if (ri===0&&totalLligues===0) return null; const sp = Math.min(ri/5*100, 100); return (
                    <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-cyan-50/50 to-blue-50/50 dark:from-cyan-900/10 dark:to-blue-900/10 border border-cyan-100/30 dark:border-cyan-800/20">
                      <div className="flex items-center gap-1.5 mb-1"><Gauge className="w-3 h-3 text-cyan-500" /><span className="text-xs font-bold text-gray-500 dark:text-stone-400">Ritme avui</span></div>
                      <div className="h-2 bg-gray-200/60 dark:bg-stone-700/40 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700" style={{ width: `${sp}%` }} /></div>
                      <p className="text-xs text-gray-400 mt-0.5">{ri} lligades/24h {sp>=80?'🚀':sp>=40?'🔥':'💤'}</p>
                    </div>
                  )})()}
                  {/* Location Stats */}
                  {locationStats.unique>0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-900/10 dark:to-cyan-900/10 border border-teal-100/30 dark:border-teal-800/20">
                      <div className="flex items-center gap-1.5 mb-1"><MapPin className="w-3 h-3 text-teal-500" /><span className="text-xs font-bold text-gray-500 dark:text-stone-400">📍 Ubicacions</span></div>
                      <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{locationStats.unique}</p>
                      {locationStats.top3.length>0 && <div className="mt-1 space-y-0.5">{locationStats.top3.map(([loc, cnt]) => <div key={loc} className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-stone-400 truncate">{loc}</span><span className="font-bold text-teal-500 ml-1">{cnt}×</span></div>)}</div>}
                    </div>
                  )}
                  {/* Top Rating */}
                  {ligues.length>0 && (<div className="mt-3"><div className="flex items-center gap-1.5 mb-2"><Award className="w-3.5 h-3.5 text-amber-500" /><p className="text-sm font-bold text-gray-500">Top Valoració</p></div><div className="space-y-1">{candidates.filter(c => c.lligatCount>0 && getAvgRating(c.id)>0).sort((a, b) => getAvgRating(b.id)-getAvgRating(a.id)).slice(0, 3).map((c, i) => (<div key={c.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/30 dark:border-amber-800/20 hover:shadow-sm transition-shadow"><span>{i===0?'🥇':i===1?'🥈':'🥉'}</span><span className="font-semibold text-gray-700 dark:text-stone-300">{c.name}</span><div className="ml-auto flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /><span className="font-bold text-amber-600 dark:text-amber-400">{getAvgRating(c.id).toFixed(1)}</span></div></div>))}</div></div>)}
                  {/* Achievements */}
                  {candidates.some(c => ACHIEVEMENTS.some(a => c.lligatCount>=a.min)) && (<div className="mt-3"><div className="flex items-center gap-1.5 mb-2"><Target className="w-3.5 h-3.5 text-orange-500" /><p className="text-sm font-bold text-gray-500">Fites</p></div><div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">{candidates.filter(c => ACHIEVEMENTS.some(a => c.lligatCount>=a.min)).map(c => (<div key={c.id} className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg bg-gradient-to-r from-orange-50/50 to-rose-50/50 dark:from-orange-900/10 dark:to-rose-900/10 border border-orange-100/30 dark:border-orange-800/20"><div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-stone-700 flex-shrink-0"><img src={c.photo} alt={c.name} style={IMG_POS[c.id]?{objectPosition:IMG_POS[c.id]}:undefined} className="w-full h-full object-cover" /></div><span className="font-semibold text-gray-700 dark:text-stone-300 truncate">{c.name}</span><div className="ml-auto flex items-center gap-0.5">{ACHIEVEMENTS.filter(a => c.lligatCount>=a.min).map(a => <Tooltip key={a.id}><TooltipTrigger asChild><span className="text-xs hover:scale-125 inline-block transition-transform">{a.emoji}</span></TooltipTrigger><TooltipContent side="left" className="text-xs"><strong>{a.name}</strong>: {a.desc}</TooltipContent></Tooltip>)}</div></div>))}</div></div>)}
                  {/* Podium */}
                  {(() => { const t3 = sorted.filter(c => c.lligatCount>0&&!EXEMPT_IDS.has(c.id)).slice(0, 3); if (t3.length<2) return null; const maxC = t3[0]?.lligatCount||1; return (
                    <div className="mt-4 p-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-100/30 dark:border-amber-800/20">
                      <p className="text-sm font-bold text-gray-500 mb-2 text-center flex items-center justify-center gap-1"><PartyPopper className="w-3.5 h-3.5 text-amber-500" /> PODIUM</p>
                      <div className="flex items-end justify-center gap-1.5">
                        {[t3[1], t3[0], t3[2]].filter(Boolean).map((p, i) => { const is1st = i===1; const is2nd = i===0; const barH = Math.max(Math.round((p!.lligatCount/maxC)*64), 20); return p ? (
                          <div key={p.id} className="text-center flex-1">
                            {is1st && <Crown className="w-5 h-5 text-amber-400 mx-auto mb-0.5" />}
                            <div className={`relative ${is1st?'w-11 h-11':'w-9 h-9'} mx-auto rounded-full overflow-hidden ring-2 ${is1st?'ring-amber-400 shadow-md shadow-amber-200/30':is2nd?'ring-gray-300':'ring-orange-300'} mb-1`}><img src={p.photo} alt={p.name} style={IMG_POS[p.id]?{objectPosition:IMG_POS[p.id]}:undefined} className="w-full h-full object-cover" /></div>
                            <p className={`text-xs font-bold truncate ${is1st?'text-amber-700 dark:text-amber-400':'text-gray-600 dark:text-stone-400'}`}>{p.name}</p>
                            <div className={`mt-0.5 rounded text-xs font-bold py-0.5 ${is1st?'bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-400':is2nd?'bg-gray-200 dark:bg-stone-700 text-gray-600':'bg-orange-200 dark:bg-orange-800/50 text-orange-700 dark:text-orange-400'}`}>{p.lligatCount}</div>
                            <div className={`rounded-t mt-1 transition-all duration-700 ${is1st?'bg-amber-300/50 dark:bg-amber-700/40':is2nd?'bg-gray-300/50 dark:bg-stone-600/40':'bg-orange-300/50 dark:bg-orange-700/40'}`} style={{ height: `${barH}px` }} />
                            <span className="text-xs">{is1st?'👑':is2nd?'🥈':'🥉'}</span>
                          </div>
                        ) : <div key={i} className="flex-1" /> }) }
                      </div>
                    </div>
                  )})()}
                  {/* Motivation */}
                  <div className="mt-3 p-2.5 bg-gradient-to-r from-orange-50/50 to-rose-50/50 dark:from-orange-900/10 dark:to-rose-900/10 rounded-xl border border-orange-100/30 dark:border-orange-800/20">
                    <p className="text-sm text-center text-gray-500 dark:text-stone-400 italic">{getMotivation(totalLligues)}</p>
                  </div>
                  {/* Activity Heatmap */}
                  {totalLligues > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-900/10 dark:to-violet-900/10 border border-indigo-100/30 dark:border-indigo-800/20">
                      <div className="flex items-center gap-1.5 mb-2"><BarChart3 className="w-3 h-3 text-indigo-500" /><span className="text-xs font-bold text-gray-500 dark:text-stone-400">Activitat 7 dies</span></div>
                      <div className="flex items-end gap-1.5">{heatmap.map((d, i) => {
                        const maxC = Math.max(...heatmap.map(h => h.count), 1)
                        const h = d.count > 0 ? Math.max(Math.round((d.count / maxC) * 28), 6) : 4
                        const opacity = d.count === 0 ? 0.15 : d.count / maxC
                        return (
                          <Tooltip key={i}><TooltipTrigger asChild><div className="flex-1 flex flex-col items-center gap-0.5">
                            <div className={`w-full rounded-sm transition-all duration-500 ${d.count > 0 ? 'bg-indigo-400 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-stone-700'}`} style={{ height: `${h}px`, opacity: d.count > 0 ? 0.5 + opacity * 0.5 : 1 }} />
                            <span className="text-[7px] text-gray-400">{d.day}</span>
                          </div></TooltipTrigger><TooltipContent side="bottom" className="text-xs">{d.label}: {d.count} lligades</TooltipContent></Tooltip>
                        )
                      })}</div>
                    </div>
                  )}
                  {/* Recent Ligues Feed */}
                  {recentLigues.length > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-pink-50/50 to-rose-50/50 dark:from-pink-900/10 dark:to-rose-900/10 border border-pink-100/30 dark:border-pink-800/20">
                      <div className="flex items-center gap-1.5 mb-2"><Medal className="w-3 h-3 text-pink-500" /><span className="text-xs font-bold text-gray-500 dark:text-stone-400">Últimes lligades</span></div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">{recentLigues.map(l => (
                        <div key={l.id} className="flex items-center gap-2 text-xs p-1.5 rounded-lg bg-white/50 dark:bg-stone-800/50 border border-pink-100/20 dark:border-pink-800/10 relative group">
                          <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-stone-700 flex-shrink-0"><img src={candidates.find(c => c.id === l.personId)?.photo || ''} alt="" className="w-full h-full object-cover" /></div>
                          <span className="font-semibold text-gray-700 dark:text-stone-300 truncate">{l.personName}</span>
                          {l.nom && <span className="text-gray-400 truncate">→ {l.nom}</span>}
                          {l.rating > 0 && <span className="text-amber-500 font-bold">{l.rating}⭐</span>}
                          <span className="text-gray-400 ml-auto flex-shrink-0">{timeAgo(l.createdAt)}</span>
                          {deleteConfirmId===l.id ? (
                            <div className="flex items-center gap-1 ml-1"><button onClick={() => deleteLigue(l.id)} className="px-1.5 py-0.5 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors">Sí</button><button onClick={() => setDeleteConfirmId(null)} className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-stone-700 text-gray-600 dark:text-gray-300 text-xs font-bold">No</button></div>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(l.id)} aria-label="Eliminar lligada" className="ml-0.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                          )}
                        </div>
                      ))}</div>
                    </div>
                  )}
                  {/* Hall of Fame */}
                  {(hallOfFame.bestDay || hallOfFame.maxStreak > 0 || hallOfFame.topRating) && (
                    <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-900/15 dark:to-yellow-900/10 border border-amber-100/30 dark:border-amber-800/20">
                      <div className="flex items-center gap-1.5 mb-2"><Crown className="w-3 h-3 text-amber-500" /><span className="text-xs font-bold text-gray-500 dark:text-stone-400">Saló de la Fama</span></div>
                      <div className="space-y-1.5">
                        {hallOfFame.bestDay && <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100/20 dark:border-amber-800/15"><span>📅</span><span className="text-gray-600 dark:text-stone-400">Millor dia:</span><span className="font-bold text-amber-600 dark:text-amber-400 ml-auto">{hallOfFame.bestDay.count} lligades</span></div>}
                        {hallOfFame.maxStreak > 0 && <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg bg-orange-50/60 dark:bg-orange-900/10 border border-orange-100/20 dark:border-orange-800/15"><span>🔥</span><span className="text-gray-600 dark:text-stone-400">Ratxa màxima: <strong>{hallOfFame.streakHolder}</strong></span><span className="font-bold text-orange-600 dark:text-orange-400 ml-auto">{hallOfFame.maxStreak}</span></div>}
                        {hallOfFame.topRating && hallOfFame.topRating.rating > 0 && <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg bg-rose-50/60 dark:bg-rose-900/10 border border-rose-100/20 dark:border-rose-800/15"><span>⭐</span><span className="text-gray-600 dark:text-stone-400">Valoració màxima: <strong>{hallOfFame.topRating.personName}</strong></span><span className="font-bold text-rose-600 dark:text-rose-400 ml-auto">{hallOfFame.topRating.rating}/10</span></div>}
                      </div>
                    </div>
                  )}
                  {/* Versus Mode */}
                  {nonExempt.length >= 2 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-100/30 dark:border-red-800/20">
                      <div className="flex items-center gap-1.5 mb-2"><Swords className="w-3 h-3 text-red-500" /><span className="text-xs font-bold text-gray-500 dark:text-stone-400">Versus</span></div>
                      {!versusIds ? (
                        <div className="flex gap-1.5">
                          <select className="flex-1 h-9 text-xs rounded-lg bg-white/60 dark:bg-stone-800/60 border border-orange-100 dark:border-stone-700 px-1" defaultValue="" onChange={e => { if (e.target.value) { const a = nonExempt.find(c => c.id !== e.target.value); if (a) setVersusIds([e.target.value, a.id]) } }}>
                            <option value="" disabled>Selecciona...</option>
                            {nonExempt.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      ) : (() => {
                        const a = candidates.find(c => c.id === versusIds[0]); const b = candidates.find(c => c.id === versusIds[1])
                        if (!a || !b) return null
                        const sA = { l: a.lligatCount, r: getAvgRating(a.id), st: getStreak(a.id), ac: ACHIEVEMENTS.filter(x => a.lligatCount >= x.min).length }
                        const sB = { l: b.lligatCount, r: getAvgRating(b.id), st: getStreak(b.id), ac: ACHIEVEMENTS.filter(x => b.lligatCount >= x.min).length }
                        const mx = { l: Math.max(sA.l, sB.l, 1), r: Math.max(sA.r, sB.r, 1), st: Math.max(sA.st, sB.st, 1), ac: Math.max(sA.ac, sB.ac, 1) }
                        return (
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="flex-1 text-xs font-bold text-gray-700 dark:text-stone-300 truncate text-right">{a.name}</span>
                              <span className="text-red-500 text-xs">⚔️</span>
                              <span className="flex-1 text-xs font-bold text-gray-700 dark:text-stone-300 truncate">{b.name}</span>
                            </div>
                            {[['Lligues',sA.l,sB.l,'l'],['Valoració',sA.r.toFixed(1),sB.r.toFixed(1),'r'],['Ratxa',sA.st,sB.st,'st'],['Fites',sA.ac,sB.ac,'ac']].map(([label,vA,vB,key]) => (
                              <div key={key as string} className="flex items-center gap-1 text-xs mb-1">
                                <span className={`w-6 text-right font-bold ${Number(vA)>Number(vB)?'text-green-600 dark:text-green-400':'text-gray-400'}`}>{vA}</span>
                                <div className="flex-1 flex gap-0.5 h-2">
                                  <div className="flex-1 flex justify-end"><div className="bg-orange-400 dark:bg-orange-500 rounded-l-full transition-all" style={{width:`${(Number(vA)/mx[key as keyof typeof mx])*100}%`}} /></div>
                                  <div className="flex-1"><div className="bg-rose-400 dark:bg-rose-500 rounded-r-full transition-all" style={{width:`${(Number(vB)/mx[key as keyof typeof mx])*100}%`}} /></div>
                                </div>
                                <span className={`w-6 font-bold ${Number(vB)>Number(vA)?'text-green-600 dark:text-green-400':'text-gray-400'}`}>{vB}</span>
                              </div>
                            ))}
                            <button onClick={() => setVersusIds(null)} className="text-xs text-gray-400 hover:text-gray-600 mt-1 underline">Canviar</button>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                  </>
                  ) : (
                  /* FEED SECTION - Photo Gallery with details */
                  (() => {
                    const allPhotoLigues = ligues.filter(l => l.photoData && l.photoData.trim() !== '' && activeCandidateIds.has(l.personId))
                    const photoLigues = feedFilterId ? allPhotoLigues.filter(l => l.personId === feedFilterId) : allPhotoLigues
                    const peopleWithPhotos = [...new Set(allPhotoLigues.map(l => l.personId))]
                    return (
                      <div>
                        {/* Candidate filter */}
                        {peopleWithPhotos.length > 1 && (
                          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
                            <button onClick={() => setFeedFilterId(null)} className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${!feedFilterId ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-stone-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-stone-700'}`}>Tots</button>
                            {peopleWithPhotos.map(pid => {
                              const person = candidates.find(c => c.id === pid)
                              if (!person) return null
                              return (
                                <button key={pid} onClick={() => setFeedFilterId(feedFilterId===pid?null:pid)} className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${feedFilterId===pid ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 ring-1 ring-orange-300 dark:ring-orange-700' : 'bg-gray-100 dark:bg-stone-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-stone-700'}`}>
                                  <div className="w-4 h-4 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-stone-700"><img src={person.photo} alt={person.name} className="w-full h-full object-cover" /></div>
                                  {person.name}
                                </button>
                              )
                            })}
                          </div>
                        )}
                        {photoLigues.length === 0 ? (
                          <div className="text-center py-10">
                            <div className="relative mx-auto w-20 h-20 mb-3">
                              <ImageIcon className="w-10 h-10 text-pink-300 dark:text-pink-700 mx-auto absolute inset-0 m-auto" />
                              <span className="absolute -top-1 -right-2 text-lg animate-float-slow">📸</span>
                              <span className="absolute -bottom-1 -left-2 text-sm animate-float-medium">🖼️</span>
                            </div>
                            <p className="text-sm text-gray-400 italic">Encara no hi ha fotos...</p>
                            <p className="text-xs text-gray-300 mt-1">Afegeix una foto de prova! 💋</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3 max-h-[560px] overflow-y-auto custom-scrollbar pr-1">
                            {photoLigues.map(l => {
                              const person = candidates.find(c => c.id === l.personId)
                              const dateStr = new Date(l.createdAt).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
                              const timeStr = new Date(l.createdAt).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
                              return (
                                <div key={l.id} className="rounded-xl overflow-hidden border border-pink-100/50 dark:border-pink-800/30 bg-white/50 dark:bg-stone-800/50 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => setLightboxPhoto(l.photoData)}>
                                  <div className="relative aspect-[4/3] overflow-hidden">
                                    <img src={l.photoData} alt={`Foto de ${l.personName}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                    {/* Rating badge */}
                                    {l.rating > 0 && (
                                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-xs font-bold backdrop-blur-sm shadow-lg">
                                        ⭐ {l.rating}/10
                                      </div>
                                    )}
                                    {/* Bottom overlay info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white/50 flex-shrink-0">
                                          <img src={person?.photo || ''} alt={l.personName} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-white truncate">{l.personName}</p>
                                          {l.nom && <p className="text-xs text-white/80 truncate">{l.nom}</p>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Details below photo */}
                                  <div className="p-2.5 space-y-1">
                                    {(l.ubi || l.edat) && (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {l.ubi && <span className="text-xs text-gray-500 dark:text-stone-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{l.ubi}</span>}
                                        {l.edat && <span className="text-xs text-gray-500 dark:text-stone-400 flex items-center gap-0.5"><Users className="w-3 h-3" />{l.edat} anys</span>}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-2.5 h-2.5 text-gray-400" />
                                      <span className="text-xs text-gray-400">{dateStr} · {timeStr}</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })()
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* NIGHT OUT MODE */}
        {nightMode && (
          <div className="fixed inset-0 z-40 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800/50">
              <div className="flex items-center gap-2"><Wine className="w-5 h-5 text-rose-400" /><h2 className="text-lg font-bold text-rose-400">Mode Nit 🍷</h2></div>
              <Button variant="outline" size="sm" onClick={() => setNightMode(false)} className="border-stone-700 text-stone-300 hover:bg-stone-800 gap-1">Tornar</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="max-w-md mx-auto space-y-3">
                <p className="text-center text-stone-400 text-sm mb-4">Toca per sumar ràpid 💪</p>
                {sorted.filter(c => !EXEMPT_IDS.has(c.id)).map(person => (
                  <div key={person.id} className="flex items-center gap-3 p-3 rounded-2xl bg-stone-800/60 border border-stone-700/50 transition-all hover:bg-stone-800/80">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-stone-600 flex-shrink-0">
                      <img src={person.photo} alt={person.name} style={IMG_POS[person.id]?{objectPosition:IMG_POS[person.id]}:undefined} className="w-full h-full object-cover" />
                      {isCaliente(person.id) && <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" /></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-200 truncate">{person.name}</p>
                      <p className="text-xs text-stone-500">{person.nickname}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-rose-400 min-w-[2rem] text-center">{person.lligatCount}</span>
                      <button onClick={() => increment(person.id)} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-green-500/20">+</button>
                    </div>
                  </div>
                ))}
                {/* Exempt section */}
                {sorted.filter(c => EXEMPT_IDS.has(c.id)).map(person => (
                  <div key={person.id} className="flex items-center gap-3 p-3 rounded-2xl bg-purple-900/20 border border-purple-700/30">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/50 flex-shrink-0"><img src={person.photo} alt={person.name} className="w-full h-full object-cover grayscale-[30%]" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-bold text-purple-400 truncate">{person.name} <span className="text-xs text-purple-500">(exempt)</span></p></div>
                    <div className="flex items-center gap-2"><span className="text-2xl font-extrabold text-purple-400 min-w-[2rem] text-center">{person.lligatCount}</span><button onClick={() => increment(person.id)} className="w-12 h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold flex items-center justify-center transition-all active:scale-95">+</button></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-stone-800/50 text-center"><p className="text-stone-600 text-xs">🍷 Mode Nit · Toca + per sumar · {totalLligues} lligues en total</p></div>
          </div>
        )}

        {/* CANDIDATE PROFILE VIEW - Full page when a candidate is selected */}
        {selectedCandidateId && (() => {
          const person = candidates.find(c => c.id === selectedCandidateId)
          if (!person) return null
          const pLigues = ligues.filter(l => l.personId === person.id)
          const pActivity = activity.filter(a => a.personId === person.id).slice(0, 15)
          const streak = getStreak(person.id)
          const avgR = getAvgRating(person.id)
          const achs = ACHIEVEMENTS.filter(a => person.lligatCount >= a.min)
          const rank = sorted.findIndex(s => s.id === person.id)
          const isExempt = EXEMPT_IDS.has(person.id)
          const photoLigues = pLigues.filter(l => l.photoData && l.photoData.trim() !== '')
          return (
            <div className="fixed inset-0 z-40 flex flex-col bg-white dark:bg-stone-950 animate-in slide-in-from-right duration-300 overflow-hidden">
              {/* Hero section */}
              <div className="relative h-48 sm:h-56 overflow-hidden flex-shrink-0">
                <img src={person.photo} alt={person.name} style={IMG_POS[person.id]?{objectPosition:IMG_POS[person.id]}:undefined} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                {/* Back button */}
                <button onClick={() => { setSelectedCandidateId(null); setDeleteConfirmId(null); setEditingLigueId(null) }} className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-sm font-medium hover:bg-black/60 transition-all">
                  <ArrowUp className="w-4 h-4 rotate-[-90deg]" /> Tornar
                </button>
                {/* Name overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-end gap-3">
                    <div className={`relative w-16 h-16 rounded-full overflow-hidden ring-3 ${rank===0&&!isExempt?'ring-amber-400':'ring-white/50'} shadow-xl flex-shrink-0`}>
                      <img src={person.photo} alt={person.name} style={IMG_POS[person.id]?{objectPosition:IMG_POS[person.id]}:undefined} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-extrabold text-white flex items-center gap-1.5">
                        {person.name}
                        {rank===0&&!isExempt&&person.lligatCount>0&&<Crown className="w-5 h-5 text-amber-400" />}
                      </h2>
                      <p className="text-sm text-white/70">@{person.nickname}</p>
                      {isExempt && <Badge variant="secondary" className="text-xs bg-purple-500/50 text-white mt-0.5">🏳️‍🌈 EXEMPT</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 max-w-2xl mx-auto w-full">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 text-center border border-orange-100/50 dark:border-orange-800/30">
                    <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{person.lligatCount}</p>
                    <p className="text-sm text-gray-500">Lligades</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 text-center border border-amber-100/50 dark:border-amber-800/30">
                    <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{avgR>0?avgR.toFixed(1):'—'}</p>
                    <p className="text-sm text-gray-500">Valoració</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-900/10 rounded-xl p-3 text-center border border-rose-100/50 dark:border-rose-800/30">
                    <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{streak>0?streak:'—'}</p>
                    <p className="text-sm text-gray-500">Ratxa 🔥</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3 text-center border border-purple-100/50 dark:border-purple-800/30">
                    <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">#{rank+1}</p>
                    <p className="text-sm text-gray-500">Posició</p>
                  </div>
                </div>

                {/* Achievements */}
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-stone-300 mb-2 flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-500" /> Fites desbloquejades</h3>
                  {achs.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">{achs.map(a => <Tooltip key={a.id}><TooltipTrigger asChild><span className="px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-full text-xs border border-orange-100/30 dark:border-orange-800/20 font-medium">{a.emoji} {a.name}</span></TooltipTrigger><TooltipContent side="bottom" className="text-xs">{a.desc}</TooltipContent></Tooltip>)}</div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Encara cap fita... Suma lligades! 💪</p>
                  )}
                  {(() => {
                    const nextAch = ACHIEVEMENTS.find(a => a.min > person.lligatCount)
                    if (!nextAch) return null
                    const prevMin = ACHIEVEMENTS.filter(a => a.min <= person.lligatCount).pop()?.min || 0
                    const progress = nextAch.min - prevMin > 0 ? ((person.lligatCount - prevMin) / (nextAch.min - prevMin)) * 100 : 0
                    return (
                      <div className="mt-2 p-2.5 rounded-lg bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100/30 dark:border-amber-800/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Següent: {nextAch.emoji} {nextAch.name}</span>
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{person.lligatCount}/{nextAch.min}</span>
                        </div>
                        <div className="h-2.5 bg-gray-200/60 dark:bg-stone-700/40 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Photo gallery */}
                {photoLigues.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-stone-300 mb-2 flex items-center gap-1.5"><Camera className="w-4 h-4 text-pink-500" /> Galeria de fotos ({photoLigues.length})</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {photoLigues.map(l => (
                        <div key={l.id} className="rounded-xl overflow-hidden border border-pink-100/50 dark:border-pink-800/30 bg-white/50 dark:bg-stone-800/50 cursor-pointer group" onClick={() => setLightboxPhoto(l.photoData)}>
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img src={l.photoData} alt={`Foto`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            {l.rating > 0 && <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white text-xs font-bold">⭐ {l.rating}</div>}
                            <div className="absolute bottom-1.5 left-1.5 right-1.5">
                              {l.nom && <p className="text-xs text-white font-medium truncate">{l.nom}</p>}
                              {l.ubi && <p className="text-xs text-white/70 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{l.ubi}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All ligues details */}
                {pLigues.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-stone-300 mb-2 flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-500" /> Totes les lligades ({pLigues.length})</h3>
                    <div className="space-y-2">
                      {pLigues.map(l => (
                        editingLigueId===l.id ? (
                          <div key={l.id} className="p-3 rounded-xl bg-orange-100/50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-800/40 text-xs space-y-2">
                            <div className="flex gap-1.5"><Input value={editLigueNom} onChange={e => setEditLigueNom(e.target.value)} placeholder="Nom" className="h-8 text-xs px-2" /><Input value={editLigueEdat} onChange={e => setEditLigueEdat(e.target.value)} placeholder="Edat" className="h-8 text-xs px-2 w-16" /><Input value={editLigueUbi} onChange={e => setEditLigueUbi(e.target.value)} placeholder="Ubi" className="h-8 text-xs px-2 flex-1" /></div>
                            <div className="flex items-center gap-1"><div className="flex gap-0.5">{[1,2,3,4,5,6,7,8,9,10].map(v=><button key={v} onClick={()=>setEditLigueRating(v===editLigueRating?0:v)} className={`w-7 h-7 rounded text-xs font-bold ${v<=editLigueRating?'bg-amber-400 text-white':'bg-gray-100 dark:bg-stone-700 text-gray-400'}`}>{v}</button>)}</div><div className="ml-auto flex gap-1"><Button size="sm" onClick={saveLigueEdit} className="h-8 text-sm px-2 bg-green-500 hover:bg-green-600 text-white">✓</Button><Button size="sm" variant="ghost" onClick={()=>setEditingLigueId(null)} className="h-8 text-sm px-2">✕</Button></div></div>
                          </div>
                        ) : (
                          <div key={l.id} className="p-3 rounded-xl bg-gradient-to-r from-orange-50/50 to-rose-50/50 dark:from-orange-900/10 dark:to-rose-900/10 border border-orange-100/50 dark:border-orange-800/30">
                            <div className="flex items-start gap-3">
                              {l.photoData && l.photoData.trim() !== '' && (
                                <img src={l.photoData} alt="Foto" className="w-14 h-14 object-cover rounded-lg border border-pink-200 dark:border-pink-800/50 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0" onClick={() => setLightboxPhoto(l.photoData)} />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {l.nom && <span className="text-sm text-gray-700 dark:text-stone-300 font-semibold">{l.nom}</span>}
                                  {l.edat && <span className="text-xs text-gray-400">{l.edat} anys</span>}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                  {l.ubi && <span className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{l.ubi}</span>}
                                  {l.rating > 0 && <span className="text-xs text-amber-500 font-bold">{l.rating}/10 ⭐</span>}
                                </div>
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {new Date(l.createdAt).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })} · {new Date(l.createdAt).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => startLigueEdit(l)} aria-label="Editar" className="text-gray-300 hover:text-orange-500 transition-colors p-1"><Pencil className="w-3.5 h-3.5" /></button>
                                {deleteConfirmId===l.id ? (
                                  <div className="flex items-center gap-1"><button onClick={() => deleteLigue(l.id)} className="px-1.5 py-0.5 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600">Sí</button><button onClick={() => setDeleteConfirmId(null)} className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-stone-700 text-xs font-bold">No</button></div>
                                ) : (
                                  <button onClick={() => setDeleteConfirmId(l.id)} aria-label="Eliminar" className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity */}
                {pActivity.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-stone-300 mb-2 flex items-center gap-1.5"><Activity className="w-4 h-4 text-green-500" /> Activitat recent</h3>
                    <div className="space-y-1">{pActivity.map(e => (
                      <div key={e.id} className={`flex items-center gap-2 text-xs py-1 px-2 rounded-lg ${e.action==='increment'?'bg-green-50/60 dark:bg-green-900/15 text-green-700 dark:text-green-400':'bg-red-50/60 dark:bg-red-900/15 text-red-600 dark:text-red-400'}`}>
                        {e.action==='increment'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>}
                        <span className="font-medium">{e.action==='increment'?'+1':'-1'}</span>
                        <span className="text-gray-400">→ {e.value}</span>
                        <span className="ml-auto text-xs text-gray-400">{timeAgo(e.createdAt)}</span>
                      </div>
                    ))}</div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-4 pb-6">
                  <Button onClick={() => increment(person.id)} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold gap-1.5 h-11">+1 Lligada 💪</Button>
                  <Button variant="outline" onClick={() => { setSelectedCandidateId(null); openLigueForm(person.id) }} className="gap-1.5 h-11">💋 Detalls</Button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* LIGUE FORM MODAL - Mandatory on increment */}
        {showLigueForm && (() => {
          const person = candidates.find(c => c.id === showLigueForm)
          if (!person) return null
          const isMandatory = !!pendingIncrement
          const canSave = isMandatory ? (ligueNom.trim() !== '' && ligueEdat.trim() !== '' && ligueUbi.trim() !== '' && ligueRating > 0) : true
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
              <div className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
                <Card className="bg-white/90 dark:bg-stone-900/90 shadow-2xl border border-white/30 dark:border-stone-700/50 backdrop-blur-2xl overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500" />
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-orange-400 shadow-lg">
                          <img src={person.photo} alt={person.name} style={IMG_POS[person.id]?{objectPosition:IMG_POS[person.id]}:undefined} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-stone-200 text-base">{isMandatory ? 'Nova lligada! 💋' : 'Detalls 💋'}</h3>
                          <p className="text-xs text-gray-500">{person.name} · {person.lligatCount} {person.lligatCount === 1 ? 'lligada' : 'lligades'}</p>
                        </div>
                      </div>
                      {!isMandatory && (
                        <button onClick={skipLigue} aria-label="Tancar" className="text-gray-400 hover:text-gray-600 dark:hover:text-stone-300 transition-colors"><X className="w-5 h-5" /></button>
                      )}
                    </div>

                    {isMandatory && (
                      <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-rose-50 dark:from-orange-900/20 dark:to-rose-900/20 border border-orange-200/50 dark:border-orange-800/30">
                        <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">⚠️ Omple tots els camps per guardar la lligada. La foto és opcional.</p>
                      </div>
                    )}

                    {/* Error message */}
                    {ligueFormError && (
                      <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 animate-in shake duration-300">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">{ligueFormError}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Nom */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                          <Heart className="w-4 h-4 text-rose-400" /> Nom {isMandatory && <span className="text-red-400">*</span>}
                        </label>
                        <Input value={ligueNom} onChange={e => { setLigueNom(e.target.value); setLigueFormError('') }} placeholder="Com es diu?" className={`h-11 text-sm ${isMandatory && !ligueNom.trim() && ligueFormError ? 'border-red-300 dark:border-red-700 focus:border-red-500' : ''}`} />
                      </div>
                      {/* Edat */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                          <Users className="w-4 h-4 text-amber-400" /> Edat {isMandatory && <span className="text-red-400">*</span>}
                        </label>
                        <Input value={ligueEdat} onChange={e => { setLigueEdat(e.target.value); setLigueFormError('') }} placeholder="Quants anys?" className={`h-11 text-sm ${isMandatory && !ligueEdat.trim() && ligueFormError ? 'border-red-300 dark:border-red-700 focus:border-red-500' : ''}`} />
                      </div>
                      {/* Ubicació */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-stone-300 flex items-center gap-1.5 mb-1.5">
                          <MapPin className="w-4 h-4 text-cyan-400" /> Ubicació {isMandatory && <span className="text-red-400">*</span>}
                        </label>
                        <Input value={ligueUbi} onChange={e => { setLigueUbi(e.target.value); setLigueFormError('') }} placeholder="On ha estat?" className={`h-11 text-sm ${isMandatory && !ligueUbi.trim() && ligueFormError ? 'border-red-300 dark:border-red-700 focus:border-red-500' : ''}`} />
                      </div>
                      {/* Valoració */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-stone-300 flex items-center gap-1.5 mb-2">
                          <Star className="w-4 h-4 text-amber-400" /> Valoració {isMandatory && <span className="text-red-400">*</span>}
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Array.from({ length: 10 }, (_, i) => i+1).map(v => (
                            <button key={v} onClick={() => { setLigueRating(v===ligueRating?0:v); setLigueFormError('') }} aria-label={`Valoració ${v}`} className={`w-9 h-9 rounded-lg text-sm font-bold transition-all rating-btn-hover ${v<=ligueRating?'bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-md scale-105':'bg-gray-100 dark:bg-stone-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-stone-700'}`}>{v}</button>
                          ))}
                        </div>
                        {ligueRating > 0 && <p className="text-xs text-amber-500 mt-1.5 font-medium">{ligueRating}/10 {ligueRating>=8?'🔥':ligueRating>=6?'👍':ligueRating>=4?'😐':'💀'}</p>}
                      </div>
                      {/* Photo upload */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-stone-300 flex items-center gap-1.5 mb-2">
                          <Camera className="w-4 h-4 text-pink-400" /> Foto prova 📸 <span className="text-xs font-normal text-gray-400">(opcional)</span>
                        </label>
                        {liguePhotoPreview ? (
                          <div className="relative inline-block">
                            <img src={liguePhotoPreview} alt="Vista prèvia" className="w-28 h-28 object-cover rounded-xl border-2 border-pink-200 dark:border-pink-800 shadow-md" />
                            <button onClick={() => { setLiguePhoto(''); setLiguePhotoPreview('') }} aria-label="Treure foto" className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <label className="flex items-center justify-center gap-2 flex-1 h-14 rounded-xl border-2 border-dashed border-pink-200 dark:border-pink-800/50 bg-pink-50/50 dark:bg-pink-900/10 cursor-pointer hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-all">
                              <Camera className="w-4 h-4 text-pink-400" />
                              <span className="text-sm text-pink-500 font-medium">Pujar foto</span>
                              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                            </label>
                            {isMandatory && (
                              <Button variant="outline" size="sm" onClick={() => { /* Allow saving without photo */ }} className="text-xs h-14 border-pink-200 dark:border-pink-800 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20">
                                <span className="text-center leading-tight">Afegir<br/>després</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-5">
                      {isMandatory ? (
                        <>
                          <Button onClick={cancelIncrement} variant="outline" className="flex-1 border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1">
                            <Undo2 className="w-4 h-4" /> Desfés
                          </Button>
                          <Button onClick={confirmIncrement} disabled={!canSave} className={`flex-1 font-bold gap-1 ${canSave ? 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white' : 'bg-gray-200 dark:bg-stone-800 text-gray-400 dark:text-stone-500 cursor-not-allowed'}`}>
                            Guardar 💾
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={submitLigueDetails} className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold gap-1">Guardar 💾</Button>
                          <Button variant="ghost" onClick={skipLigue}>Tancar</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        })()}

        {/* LIGUE HISTORY MODAL */}
        {showLigueHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl" onClick={() => { setShowLigueHistory(null); setDeleteConfirmId(null) }}>
            <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <Card className="bg-white/80 dark:bg-stone-900/80 shadow-2xl border border-white/30 dark:border-stone-700/50 backdrop-blur-2xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-cyan-400 to-emerald-400" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-orange-400"><img src={candidates.find(c => c.id===showLigueHistory)?.photo||''} alt="" className="w-full h-full object-cover" /></div><div><h3 className="font-bold text-gray-800 dark:text-stone-200">Historial 📖</h3><p className="text-xs text-gray-400">{ligues.filter(l => l.personId===showLigueHistory).length} lligades</p></div></div>
                    <button onClick={() => setShowLigueHistory(null)} aria-label="Tancar historial" className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  {ligues.filter(l => l.personId===showLigueHistory).length===0 ? <p className="text-sm text-gray-400 italic text-center py-4">Sense detalls... 😴</p> : (
                    <div className="space-y-2">{ligues.filter(l => l.personId===showLigueHistory).map(ligue => (
                      <div key={ligue.id} className="p-3 rounded-xl bg-gradient-to-r from-orange-50/50 to-rose-50/50 dark:from-orange-900/10 dark:to-rose-900/10 border border-orange-100/50 dark:border-orange-800/30 relative group transition-all hover:shadow-md">
                        {ligue.photoData && ligue.photoData.trim() !== '' && (
                          <div className="mb-2"><img src={ligue.photoData} alt={`Foto de ${ligue.personName}`} className="w-12 h-12 object-cover rounded-lg border border-pink-200 dark:border-pink-800/50 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightboxPhoto(ligue.photoData)} /></div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {ligue.nom && <div><span className="text-gray-400 flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" /> Nom:</span><p className="font-semibold text-gray-700 dark:text-stone-300">{ligue.nom}</p></div>}
                          {ligue.edat && <div><span className="text-gray-400 flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> Edat:</span><p className="font-semibold text-gray-700 dark:text-stone-300">{ligue.edat}</p></div>}
                          {ligue.ubi && <div><span className="text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> Ubi:</span><p className="font-semibold text-gray-700 dark:text-stone-300">{ligue.ubi}</p></div>}
                          {ligue.rating>0 && <div><span className="text-gray-400 flex items-center gap-0.5"><Star className="w-2.5 h-2.5" /> Val:</span><div className="flex items-center gap-1.5 mt-0.5"><div className="flex-1 h-1.5 bg-gray-200/60 dark:bg-stone-700/40 rounded-full overflow-hidden"><div className="h-full rounded-full rating-bar-fill" style={{width:`${ligue.rating*10}%`}} /></div><span className="font-bold text-amber-500 text-xs">{ligue.rating}/10</span></div></div>}
                        </div>
                        <div className="flex items-center justify-between mt-1"><p className="text-xs text-gray-400 flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {timeAgo(ligue.createdAt)}</p>{deleteConfirmId===ligue.id ? (
                          <div className="flex items-center gap-1"><span className="text-xs text-red-500">Eliminar?</span><button onClick={() => deleteLigue(ligue.id)} className="px-1.5 py-0.5 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600">Sí</button><button onClick={() => setDeleteConfirmId(null)} className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-stone-700 text-gray-600 dark:text-gray-300 text-xs font-bold">No</button></div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(ligue.id)} aria-label="Eliminar lligada" className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}</div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl" onClick={() => setShowShareModal(false)}>
            <div className="w-full max-w-md animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <Card className="bg-white/80 dark:bg-stone-900/80 shadow-2xl border border-white/30 dark:border-stone-700/50 backdrop-blur-2xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-400" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-gray-800 dark:text-stone-200">Compartir</h3><button onClick={() => setShowShareModal(false)} aria-label="Tancar" className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button></div>
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

        {/* LIGHTBOX */}
        {lightboxPhoto && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setLightboxPhoto(null)}>
            <button onClick={() => setLightboxPhoto(null)} aria-label="Tancar foto" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors z-10"><X className="w-5 h-5" /></button>
            <img src={lightboxPhoto} alt="Foto ampliada" className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()} />
          </div>
        )}

        {/* FOOTER */}
        <footer className="relative z-10 mt-auto py-3 px-4 border-t border-orange-100/30 dark:border-stone-800/30 footer-gradient backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-stone-500">
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />v2.0 · Fet amb 🔥</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{footerTime}</span>
            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />{ligues.length} detalls</span>
            <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />sync 10s</span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}
