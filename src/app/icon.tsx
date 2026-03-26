import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #7c3aed, #f43f5e, #f59e0b)',
          borderRadius: '25%',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 'bold',
            marginBottom: 10,
            letterSpacing: '-0.05em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          LAVIE
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: '600',
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '10px 24px',
            borderRadius: '100px',
          }}
        >
          LavieAi.net
        </div>
      </div>
    ),
    { ...size }
  );
}
