import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "0xHunter - Track the hidden movements in Ethereum's dark forest"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {/* Ethereum symbol (simplified diamond shape) */}
        <div
          style={{
            width: '120px',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            position: 'relative',
          }}
        >
          {/* Simplified Ethereum diamond using divs */}
          <div
            style={{
              width: '0',
              height: '0',
              borderLeft: '60px solid transparent',
              borderRight: '60px solid transparent',
              borderTop: '100px solid #627EEA',
              opacity: 0.8,
            }}
          />
          <div
            style={{
              width: '0',
              height: '0',
              borderLeft: '60px solid transparent',
              borderRight: '60px solid transparent',
              borderBottom: '100px solid #627EEA',
              opacity: 0.6,
              marginTop: '-50px',
            }}
          />
        </div>
        
        {/* 0xHunter Text */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 600,
            color: 'white',
            letterSpacing: '0.05em',
            marginBottom: '20px',
          }}
        >
          0xHunter
        </div>
        
        {/* Tagline */}
        <div
          style={{
            fontSize: '24px',
            color: '#9CA3AF',
          }}
        >
          Track the hidden movements in Ethereum's dark forest
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

