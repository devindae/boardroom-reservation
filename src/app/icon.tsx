import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 14,
          background: '#FF6C0E',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000000',
          fontWeight: 800,
          borderRadius: '6px',
          fontFamily: 'sans-serif',
          letterSpacing: '-0.03em',
          paddingBottom: '1px',
        }}
      >
        cba
      </div>
    ),
    {
      ...size,
    }
  )
}
