# Internal Meeting Room Reservation System

A simple, modern, and responsive web application built with **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **FullCalendar**, and **Supabase PostgreSQL** for internal company meeting room scheduling. Inspired by Microsoft Outlook Calendar.

---

## Features

- 📅 **Outlook-Style Calendar**: Day, Week, and Month views with FullCalendar.
- 🎨 **Corporate Branding**: Palette using `#6F1258` (Primary), `#313773` (Secondary), `#DDE1E4` (Background), and `#FF6C0E` (Accent).
- 🔒 **Magic Link Authentication**: Passwordless employee sign-in via Supabase OTP with `@cba.lk` email validation.
- 👑 **First-User Admin Role**: The first registered user automatically becomes the Administrator.
- 🏢 **Default Meeting Rooms**: Pre-configured **Boardroom** (Upper Floor) and **Meeting Room** (First Floor).
- ⏰ **Office Hours Enforcement**: Bookings allowed Monday to Friday, 8:30 AM – 5:00 PM (Sri Lanka Time).
- 🚫 **Validation & Overlap Prevention**: Prevents double-bookings, off-hours bookings, and past bookings.
- ⚡ **Interactive Booking**: Click or drag to create bookings, drag to reschedule, resize to adjust duration.
- 🔍 **Search & Filter**: Filter by meeting title, room filter tabs, and "My Bookings Only" toggle.
- 🛡️ **Admin Panel**: Manage employees, user roles, send magic link invitations, and configure meeting rooms.
- 🌙 **Dark Mode Support**: Seamless dark mode toggling using `next-themes`.

---

## Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Calendar**: [FullCalendar](https://fullcalendar.io/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL & Magic Link Auth)
- **Deployment**: [Vercel](https://vercel.com/)

---

## Local Development Setup

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd boardroom-reservation
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory (refer to `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set Up Supabase Database

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and open the **SQL Editor**.
2. Run the SQL script from `supabase/schema.sql` to create tables, indexes, triggers, and Row Level Security (RLS) policies.
3. Run the SQL script from `supabase/seed.sql` to insert the default meeting rooms (**Boardroom** and **Meeting Room**).

### 4. Enable Supabase Magic Link Auth

1. In Supabase Dashboard, navigate to **Authentication** -> **URL Configuration**.
2. Set the **Site URL** to `http://localhost:3000` (or your Vercel deployment URL).
3. Add `http://localhost:3000/auth/callback` to **Redirect URLs**.

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment to Vercel

1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com/new).
3. Add the environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Update the **Site URL** and **Redirect URLs** in your Supabase Auth settings to match your Vercel URL (e.g. `https://your-app.vercel.app/auth/callback`).
5. Deploy!

---

## User Roles & Permissions

| Feature | User | Administrator |
| :--- | :---: | :---: |
| View Calendar & Reservations | ✅ | ✅ |
| Create Reservations | ✅ | ✅ |
| Edit & Delete Own Reservations | ✅ | ✅ |
| Edit & Delete Any Reservation | ❌ | ✅ |
| Manage Users & Roles | ❌ | ✅ |
| Add, Edit, Delete Rooms | ❌ | ✅ |
| Invite Employees via Magic Link | ❌ | ✅ |
