import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@fullcalendar/common',
    '@fullcalendar/core',
    '@fullcalendar/daygrid',
    '@fullcalendar/interaction',
    '@fullcalendar/react',
    '@fullcalendar/timegrid',
  ],
}

export default nextConfig
