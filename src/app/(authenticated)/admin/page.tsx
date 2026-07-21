'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Room, Profile } from '@/lib/types'
import { isValidCompanyEmail } from '@/lib/validation'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, DoorClosed, Plus, Trash2, Mail, CheckCircle2, AlertCircle, Edit, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AdminPage() {
  const { profile, isAdmin, isSuperAdmin, isLoading: authLoading } = useAuth()

  const [users, setUsers] = useState<Profile[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Invite User Modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'user' | 'admin' | 'super_admin'>('user')
  const [inviteLoading, setInviteLoading] = useState(false)

  // Add/Edit Room Modal state
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [roomName, setRoomName] = useState('')
  const [roomLocation, setRoomLocation] = useState('')
  const [roomLoading, setRoomLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [usersRes, roomsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/rooms'),
      ])

      if (usersRes.ok) setUsers(await usersRes.json())
      if (roomsRes.ok) setRooms(await roomsRes.json())
    } catch {
      toast.error('Failed to load admin management data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchData()
    }
  }, [isAdmin, fetchData])

  // Handle Invite User
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidCompanyEmail(inviteEmail)) {
      toast.error('Please enter a valid company email address ending with @cba.lk')
      return
    }

    setInviteLoading(true)

    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to send invitation')
      } else {
        toast.success(data.message || 'User invited successfully!')
        setIsInviteOpen(false)
        setInviteEmail('')
        setInviteName('')
        fetchData()
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  // Handle Toggle User Role
  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'super_admin') => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        toast.success('User role updated')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update role')
      }
    } catch {
      toast.error('Error updating user role')
    }
  }

  // Handle Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return

    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('User removed')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete user')
      }
    } catch {
      toast.error('Error deleting user')
    }
  }

  // Handle Save Room (Add / Edit)
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomName.trim() || !roomLocation.trim()) {
      toast.error('Please fill in room name and location')
      return
    }

    setRoomLoading(true)

    try {
      const isEdit = Boolean(selectedRoom?.id)
      const url = isEdit ? `/api/rooms/${selectedRoom?.id}` : '/api/rooms'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName.trim(), location: roomLocation.trim() }),
      })

      if (res.ok) {
        toast.success(isEdit ? 'Room updated!' : 'Room created successfully!')
        setIsRoomDialogOpen(false)
        setSelectedRoom(null)
        setRoomName('')
        setRoomLocation('')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Could not save room')
      }
    } catch {
      toast.error('Network error saving room')
    } finally {
      setRoomLoading(false)
    }
  }

  // Handle Delete Room
  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this meeting room?')) return

    try {
      const res = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Room deleted')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete room')
      }
    } catch {
      toast.error('Error deleting room')
    }
  }

  const openAddRoomModal = () => {
    setSelectedRoom(null)
    setRoomName('')
    setRoomLocation('')
    setIsRoomDialogOpen(true)
  }

  const openEditRoomModal = (room: Room) => {
    setSelectedRoom(room)
    setRoomName(room.name)
    setRoomLocation(room.location)
    setIsRoomDialogOpen(true)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="h-6 w-6 border-2 border-[#6F1258] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-4">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-4">
          You need Administrator permissions to access the management console.
        </p>
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Return to Calendar
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <Navbar />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#6F1258] dark:text-[#FF8A3D]" />
            Administrator Management Console
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage system employees, user roles, and meeting room configurations
          </p>
        </div>

        <Link href="/">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" />
            Back to Calendar
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={isSuperAdmin ? 'users' : 'rooms'} className="w-full">
        <TabsList className="bg-muted p-1 border border-border">
          {isSuperAdmin && (
            <TabsTrigger value="users" className="gap-2 text-xs font-semibold">
              <Users className="w-4 h-4 text-[#6F1258] dark:text-[#FF8A3D]" />
              User Management ({users.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="rooms" className="gap-2 text-xs font-semibold">
            <DoorClosed className="w-4 h-4 text-[#313773] dark:text-indigo-400" />
            Meeting Rooms ({rooms.length})
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        {isSuperAdmin && (
          <TabsContent value="users" className="space-y-4 pt-4">
          <Card className="border border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-bold">Employees & Roles</CardTitle>
                <CardDescription className="text-xs">
                  First user is Administrator. Invite employees using their @cba.lk email.
                </CardDescription>
              </div>

              <Button
                onClick={() => setIsInviteOpen(true)}
                size="sm"
                className="bg-[#6F1258] hover:bg-[#580E46] text-white gap-1.5 text-xs"
              >
                <Mail className="w-4 h-4 text-[#FF6C0E]" />
                Invite User
              </Button>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Name & Email</TableHead>
                      <TableHead className="text-xs font-bold">Role</TableHead>
                      <TableHead className="text-xs font-bold">Joined Date</TableHead>
                      <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{u.name || 'Employee'}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(val) => {
                              if (val === 'user' || val === 'admin') {
                                handleRoleChange(u.id, val)
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-28 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === profile?.id}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Room Management Tab */}
        <TabsContent value="rooms" className="space-y-4 pt-4">
          <Card className="border border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-bold">Meeting Rooms Config</CardTitle>
                <CardDescription className="text-xs">
                  Manage available boardroom and floor locations for scheduling.
                </CardDescription>
              </div>

              <Button
                onClick={openAddRoomModal}
                size="sm"
                className="bg-[#6F1258] hover:bg-[#580E46] text-white gap-1.5 text-xs"
              >
                <Plus className="w-4 h-4 text-[#FF6C0E]" />
                Add Room
              </Button>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rooms.map((r) => (
                  <Card key={r.id} className="border border-border/80 p-4 relative flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#6F1258]" />
                        <h3 className="font-bold text-base text-foreground">{r.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        Location: <span className="font-medium text-foreground">{r.location}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditRoomModal(r)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRoom(r.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#6F1258]" />
              Invite New Employee
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sends an invitation magic link to sign in to the boardroom system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="inviteEmail" className="text-xs font-semibold">
                Company Email (@cba.lk) *
              </Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="employee.initial@cba.lk"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inviteName" className="text-xs font-semibold">
                Full Name (Optional)
              </Label>
              <Input
                id="inviteName"
                placeholder="e.g. John Perera"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inviteRole" className="text-xs font-semibold">
                Assigned Role
              </Label>
              <Select value={inviteRole} onValueChange={(v) => { if (v === 'user' || v === 'admin' || v === 'super_admin') setInviteRole(v as 'user'|'admin'|'super_admin') }}>
                <SelectTrigger id="inviteRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Book & edit own)</SelectItem>
                  <SelectItem value="admin">Administrator (Manage Rooms)</SelectItem>
                  <SelectItem value="super_admin">Super Admin (Full Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={inviteLoading} className="bg-[#6F1258] text-white">
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Room Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRoom ? 'Edit Meeting Room' : 'Add New Meeting Room'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure room name and floor location
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRoom} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="roomName" className="text-xs font-semibold">
                Room Name *
              </Label>
              <Input
                id="roomName"
                placeholder="e.g. Executive Meeting Room"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roomLocation" className="text-xs font-semibold">
                Location / Floor *
              </Label>
              <Input
                id="roomLocation"
                placeholder="e.g. 2nd Floor, West Wing"
                value={roomLocation}
                onChange={(e) => setRoomLocation(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsRoomDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={roomLoading} className="bg-[#6F1258] text-white">
                {roomLoading ? 'Saving...' : 'Save Room'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
