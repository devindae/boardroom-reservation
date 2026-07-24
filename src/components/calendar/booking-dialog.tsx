'use client'

import React, { useState, useEffect } from 'react'
import { Room, ReservationWithDetails } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { validateBooking } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2, AlertCircle, CalendarDays, Clock, MapPin, AlignLeft, Building2, Phone, User } from 'lucide-react'
import { toast } from 'sonner'

const DIVISIONS = [
  'Trading', 'Finance', 'EVO Pay', 'University',
  'Grab IT', 'IT', 'HR', 'Fintech - Issuance',
  'Fintech - Solutions', 'EMD', 'TSD'
]

interface BookingDialogProps {
  isOpen: boolean
  onClose: () => void
  rooms: Room[]
  initialValues?: {
    id?: string
    title?: string
    roomId?: string
    date?: string
    startTime?: string
    endTime?: string
    notes?: string
    userId?: string
    division?: string
    contact_number?: string
    organizerName?: string
  } | null
  onSave: () => void
  onDelete?: (id: string) => void
}

export function BookingDialog({
  isOpen,
  onClose,
  rooms,
  initialValues,
  onSave,
  onDelete,
}: BookingDialogProps) {
  const { profile, isAdmin } = useAuth()

  const [title, setTitle] = useState('')
  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [division, setDivision] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  const isEditMode = Boolean(initialValues?.id)
  const isOwner = initialValues?.userId ? initialValues.userId === profile?.id : true
  const canModify = isEditMode ? isOwner || isAdmin : true

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title || '')
      setRoomId(initialValues.roomId || (rooms[0]?.id ?? ''))
      setDate(initialValues.date || new Date().toISOString().split('T')[0])
      setStartTime(initialValues.startTime || '09:00')
      setEndTime(initialValues.endTime || '10:00')
      setNotes(initialValues.notes || '')
      setDivision((initialValues as any).division || '')
      setContactNumber((initialValues as any).contact_number || '')
    } else {
      setTitle('')
      setRoomId(rooms[0]?.id ?? '')
      setDate(new Date().toISOString().split('T')[0])
      setStartTime('09:00')
      setEndTime('10:00')
      setNotes('')
      setDivision('')
      setContactNumber('')
    }
    setErrorMessage('')
  }, [initialValues, rooms, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!title.trim()) { setErrorMessage('Please enter a meeting title.'); return }
    if (!division.trim()) { setErrorMessage('Please select your division.'); return }
    if (!contactNumber.trim()) { setErrorMessage('Please enter a contact number.'); return }
    if (!roomId) { setErrorMessage('Please select a meeting room.'); return }

    const startIso = `${date}T${startTime}:00`
    const endIso = `${date}T${endTime}:00`

    const validation = validateBooking(startIso, endIso)
    if (!validation.isValid) { setErrorMessage(validation.error || 'Invalid booking timeframe.'); return }

    setIsLoading(true)
    try {
      const payload = {
        room_id: roomId,
        title: title.trim(),
        notes: notes.trim(),
        division: division.trim(),
        contact_number: contactNumber.trim(),
        start_time: new Date(startIso).toISOString(),
        end_time: new Date(endIso).toISOString(),
      }
      const url = isEditMode ? `/api/reservations/${initialValues?.id}` : '/api/reservations'
      const method = isEditMode ? 'PUT' : 'POST'
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const resData = await response.json()
      if (!response.ok) {
        setErrorMessage(resData.error || 'Failed to save reservation.')
        toast.error(resData.error || 'Failed to save reservation.')
      } else {
        toast.success(isEditMode ? 'Reservation updated successfully!' : 'Room booked successfully!')
        onSave()
        onClose()
      }
    } catch {
      setErrorMessage('Network error while saving reservation.')
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!initialValues?.id || !onDelete) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reservations/${initialValues.id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Reservation deleted.')
        onDelete(initialValues.id)
        onClose()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Could not delete reservation.')
      }
    } catch {
      toast.error('Network error trying to delete reservation.')
    } finally {
      setIsLoading(false)
      setIsConfirmDeleteOpen(false)
    }
  }

  const userInitials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email ? profile.email.slice(0, 2).toUpperCase() : 'US'

  const selectedRoom = rooms.find((r) => r.id === roomId)

  // ─── Read-Only View ──────────────────────────────────────────────────────────
  if (!canModify && isEditMode) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[520px] p-0 border-0 shadow-2xl rounded-2xl overflow-hidden bg-card">
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] px-7 pt-7 pb-6">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.3),_transparent_70%)]" />
              <DialogHeader className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-white tracking-tight">
                        Meeting Details
                      </DialogTitle>
                      <p className="text-indigo-200 text-xs mt-0.5 font-medium">View booking information</p>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              {/* Title banner */}
              <div className="relative mt-5 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/15">
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1">Meeting</p>
                <p className="text-white font-bold text-lg leading-tight">{title}</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-7 py-6 space-y-5">
              {/* Room + Time row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Room</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{selectedRoom?.name || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedRoom?.location}</p>
                </div>
                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{date}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{startTime} – {endTime}</p>
                  </div>
                </div>
              </div>

              {/* Organizer */}
              <div className="flex items-center gap-3 p-4 bg-secondary/40 rounded-xl border border-border/50">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs border border-primary/20">
                    {initialValues?.organizerName?.[0]?.toUpperCase() || 'US'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Organizer</p>
                  <p className="text-sm font-bold text-foreground">{initialValues?.organizerName || 'Employee'}</p>
                </div>
              </div>

              {/* Division + Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Division</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{division || '—'}</p>
                </div>
                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{contactNumber || '—'}</p>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlignLeft className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notes</p>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 pb-6">
              <Button type="button" onClick={onClose} className="w-full h-11 rounded-xl font-semibold bg-secondary hover:bg-secondary/80 text-foreground">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // ─── Edit / Create Form ───────────────────────────────────────────────────────
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[540px] p-0 border-0 shadow-2xl rounded-2xl overflow-hidden bg-card">
          
          {/* Gradient Header */}
          <div className="relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] px-7 pt-7 pb-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.3),_transparent_70%)]" />
            <DialogHeader className="relative">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white tracking-tight">
                    {isEditMode ? 'Edit Reservation' : 'New Meeting Booking'}
                  </DialogTitle>
                  <p className="text-indigo-200 text-xs mt-0.5 font-medium">
                    {isEditMode ? 'Update your booking details' : 'Schedule a boardroom or meeting space'}
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-7 py-6 space-y-5 overflow-y-auto max-h-[65vh]">

              {/* Meeting Title — full width */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Meeting Title <span className="text-destructive normal-case tracking-normal font-medium">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Q3 Strategy Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!canModify || isLoading}
                  className="h-11 bg-secondary/40 border-border/60 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl transition-all font-medium"
                  required
                />
              </div>

              {/* Room — full width */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Room
                </Label>
                <Select value={roomId} onValueChange={(val) => val && setRoomId(val)} disabled={!canModify || isLoading}>
                  <SelectTrigger className="h-11 bg-secondary/40 border-border/60 text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium">
                    <SelectValue placeholder="Select a room">
                      {selectedRoom ? `${selectedRoom.name} · ${selectedRoom.location}` : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="rounded-lg font-medium">
                        {`${r.name} · ${r.location}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date + Start + End — 3 cols */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" /> Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={!canModify || isLoading}
                    className="h-11 px-3 bg-secondary/40 border-border/60 text-foreground rounded-xl focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all font-medium text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="startTime" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Start
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    step="900"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={!canModify || isLoading}
                    className="h-11 px-3 bg-secondary/40 border-border/60 text-foreground rounded-xl focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all font-medium text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endTime" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> End
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    step="900"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={!canModify || isLoading}
                    className="h-11 px-3 bg-secondary/40 border-border/60 text-foreground rounded-xl focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all font-medium text-sm"
                    required
                  />
                </div>
              </div>

              {/* Organizer chip */}
              <div className="flex items-center gap-3 px-4 py-3 bg-secondary/40 rounded-xl border border-border/50">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs border border-primary/20">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Organizer</p>
                  <p className="text-sm font-bold text-foreground truncate">{profile?.name || 'Current Employee'}</p>
                </div>
                <User className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </div>

              {/* Division + Contact — 2 cols */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Division <span className="text-destructive">*</span>
                  </Label>
                  <Select value={division} onValueChange={(val) => val && setDivision(val)} disabled={!canModify || isLoading}>
                    <SelectTrigger className="h-11 bg-secondary/40 border-border/60 text-foreground rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium">
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-2xl max-h-64">
                      {DIVISIONS.map((div) => (
                        <SelectItem key={div} value={div} className="rounded-lg font-medium">{div}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactNumber" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Contact No. <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactNumber"
                    placeholder="e.g. 0771234567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    disabled={!canModify || isLoading}
                    className="h-11 bg-secondary/40 border-border/60 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <AlignLeft className="h-3.5 w-3.5" /> Notes
                  <span className="text-muted-foreground/50 normal-case tracking-normal font-normal text-xs">— optional</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Meeting agenda, required equipment, catering needs..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!canModify || isLoading}
                  rows={3}
                  className="bg-secondary/40 border-border/60 text-foreground placeholder:text-muted-foreground/60 text-sm resize-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all font-medium leading-relaxed"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-7 pb-6 pt-3 flex items-center justify-between gap-3 border-t border-border/50 bg-secondary/10">
              {isEditMode && canModify && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 h-10 px-4 rounded-xl font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              ) : <div />}

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isLoading}
                  className="h-10 px-5 rounded-xl font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                >
                  Cancel
                </Button>
                {canModify && (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-[#312e81] to-[#4338ca] hover:from-[#3730a3] hover:to-[#4f46e5] text-white h-10 px-7 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      isEditMode ? 'Update Meeting' : 'Book Room'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-2xl max-w-md">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-3">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl text-foreground font-bold">Delete this meeting?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground mt-1 leading-relaxed">
              This will permanently cancel the reservation and release the room slot. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2.5">
            <AlertDialogCancel className="h-10 rounded-xl font-semibold flex-1">Keep Meeting</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-10 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-lg shadow-destructive/20 flex-1"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
