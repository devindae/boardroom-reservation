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
import { Trash2, AlertCircle, CalendarDays, Clock, MapPin, AlignLeft, Building2, Phone } from 'lucide-react'
import { toast } from 'sonner'

interface BookingDialogProps {
  isOpen: boolean
  onClose: () => void
  rooms: Room[]
  initialValues?: {
    id?: string
    title?: string
    roomId?: string
    date?: string // YYYY-MM-DD
    startTime?: string // HH:mm
    endTime?: string // HH:mm
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

    if (!title.trim()) {
      setErrorMessage('Please enter a meeting title.')
      return
    }

    if (!division.trim()) {
      setErrorMessage('Please enter your division / department.')
      return
    }

    if (!contactNumber.trim()) {
      setErrorMessage('Please enter a contact number.')
      return
    }

    if (!roomId) {
      setErrorMessage('Please select a meeting room.')
      return
    }

    const startIso = `${date}T${startTime}:00`
    const endIso = `${date}T${endTime}:00`

    // Client side validation
    const validation = validateBooking(startIso, endIso)
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid booking timeframe.')
      return
    }

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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

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
      const response = await fetch(`/api/reservations/${initialValues.id}`, {
        method: 'DELETE',
      })
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
    : profile?.email
    ? profile.email.slice(0, 2).toUpperCase()
    : 'US'

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[480px] p-0 border-0 shadow-2xl overflow-y-auto max-h-[90vh] rounded-2xl bg-card">
          {/* Subtle Top Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />
          
          {/* Header Area */}
          <DialogHeader className="px-7 pt-7 pb-5 bg-secondary/30">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col gap-1 text-left">
                <DialogTitle className="text-xl font-semibold text-foreground tracking-tight">
                  {isEditMode ? (canModify ? 'Edit Reservation' : 'Meeting Details') : 'New Meeting Booking'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-medium">
                  {isEditMode && !canModify ? 'View booking information' : 'Schedule a boardroom or meeting space'}
                </p>
              </div>
            </div>
          </DialogHeader>

          {!canModify && isEditMode ? (
            <div className="px-7 py-6 space-y-6">
              <div className="space-y-1">
                 <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Meeting Title</p>
                 <p className="text-base font-semibold text-foreground">{title}</p>
              </div>
              
              <div className="space-y-1">
                 <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Room</p>
                 <div className="flex items-center gap-2">
                   <MapPin className="h-4 w-4 text-primary" />
                   <span className="text-sm text-foreground">{rooms.find((r) => r.id === roomId)?.name} · {rooms.find((r) => r.id === roomId)?.location}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date</p>
                   <div className="flex items-center gap-2 text-sm text-foreground">
                     <CalendarDays className="h-4 w-4 text-primary" />
                     {date}
                   </div>
                 </div>
                 <div className="space-y-1">
                   <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Time</p>
                   <div className="flex items-center gap-2 text-sm text-foreground">
                     <Clock className="h-4 w-4 text-primary" />
                     {startTime} - {endTime}
                   </div>
                 </div>
              </div>

              <div className="p-3 bg-secondary/30 border border-border/50 rounded-xl flex items-center gap-3">
                 <Avatar className="h-9 w-9 border border-background shadow-sm">
                   <AvatarFallback className="bg-primary text-primary-foreground font-medium text-xs">
                     {initialValues?.organizerName?.[0]?.toUpperCase() || 'US'}
                   </AvatarFallback>
                 </Avatar>
                 <div className="flex flex-col leading-tight">
                   <span className="text-xs text-muted-foreground font-medium">Organizer</span>
                   <span className="text-sm font-semibold text-foreground">
                     {initialValues?.organizerName || 'Employee'}
                   </span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Division</p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Building2 className="h-4 w-4 text-primary" />
                    {division || 'N/A'}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contact No.</p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    {contactNumber || 'N/A'}
                  </div>
                </div>
              </div>

              {notes && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Notes</p>
                  <div className="flex items-start gap-2 text-sm text-foreground bg-secondary/20 p-3 rounded-lg border border-border/30">
                    <AlignLeft className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="whitespace-pre-wrap">{notes}</span>
                  </div>
                </div>
              )}

              <div className="pt-6 mt-2 flex items-center justify-end border-t border-border/50">
                <Button type="button" onClick={onClose} className="h-11 px-8 rounded-xl font-semibold bg-secondary text-foreground hover:bg-secondary/80">
                  Close
                </Button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="px-7 py-6 space-y-6">
            
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-foreground">
                Meeting Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. Q3 Strategy Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canModify || isLoading}
                className="h-11 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:bg-background rounded-xl transition-all shadow-sm"
                required
              />
            </div>

            {/* Room */}
            <div className="space-y-2">
              <Label htmlFor="room" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Room
              </Label>
              <Select
                value={roomId}
                onValueChange={(val) => val && setRoomId(val)}
                disabled={!canModify || isLoading}
              >
                <SelectTrigger className="h-11 bg-secondary/50 border-border/50 text-foreground rounded-xl focus:ring-primary focus:bg-background transition-all shadow-sm">
                  <SelectValue placeholder="Select room">
                    {rooms.find((r) => r.id === roomId)
                      ? `${rooms.find((r) => r.id === roomId)?.name} · ${rooms.find((r) => r.id === roomId)?.location}`
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 shadow-xl">
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="rounded-lg">
                      {`${r.name} · ${r.location}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Times Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={!canModify || isLoading}
                  className="h-11 px-3 bg-secondary/50 border-border/50 text-foreground rounded-xl focus-visible:ring-primary focus-visible:bg-background transition-all shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Start
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  step="900"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={!canModify || isLoading}
                  className="h-11 px-3 bg-secondary/50 border-border/50 text-foreground rounded-xl focus-visible:ring-primary focus-visible:bg-background transition-all shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  End
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  step="900"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!canModify || isLoading}
                  className="h-11 px-3 bg-secondary/50 border-border/50 text-foreground rounded-xl focus-visible:ring-primary focus-visible:bg-background transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Organizer Chip */}
            <div className="p-3 bg-secondary/30 border border-border/50 rounded-xl flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-background shadow-sm">
                <AvatarFallback className="bg-primary text-primary-foreground font-medium text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-muted-foreground font-medium">Organizer</span>
                <span className="text-sm font-semibold text-foreground">
                  {profile?.name || 'Current Employee'}
                </span>
              </div>
            </div>

            {/* Division & Contact Number Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="division" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Division <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={division}
                  onValueChange={(val) => val && setDivision(val)}
                  disabled={!canModify || isLoading}
                >
                  <SelectTrigger className="h-11 bg-secondary/50 border-border/50 text-foreground rounded-xl focus:ring-primary focus:bg-background transition-all shadow-sm">
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 shadow-xl max-h-64">
                    {[
                      'Trading',
                      'Finance',
                      'EVO Pay',
                      'University',
                      'Grab IT',
                      'IT',
                      'HR',
                      'Fintech - Issuance',
                      'Fintech - Solutions',
                      'EMD',
                      'TSD'
                    ].map((div) => (
                      <SelectItem key={div} value={div} className="rounded-lg">
                        {div}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Contact No. <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactNumber"
                  placeholder="e.g. 0771234567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  disabled={!canModify || isLoading}
                  className="h-11 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:bg-background rounded-xl transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <AlignLeft className="h-4 w-4 text-muted-foreground" />
                Notes <span className="font-normal text-muted-foreground text-xs ml-1">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Meeting agenda, equipment needs, catering..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!canModify || isLoading}
                rows={3}
                className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground text-sm resize-none rounded-xl focus-visible:ring-primary focus-visible:bg-background transition-all shadow-sm"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-6 mt-2 flex items-center justify-between border-t border-border/50">
              {isEditMode && canModify && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 font-semibold h-11 px-4 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isLoading}
                  className="h-11 px-6 rounded-xl font-semibold text-muted-foreground hover:text-foreground transition-all"
                >
                  Cancel
                </Button>

                {canModify && (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-8 rounded-xl font-semibold shadow-lg shadow-primary/25 transition-all"
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
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-foreground font-semibold">Delete Meeting?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground mt-2">
              This will permanently cancel this reservation and free up the room. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="h-11 rounded-xl font-semibold">Keep Meeting</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-11 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold shadow-lg shadow-destructive/20">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
