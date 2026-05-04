import { useEffect, useState } from 'react'
import bannerUrl from '../../assets/ares-banner.jpeg'
import shieldUrl from '../../assets/ares-shield.png'

/**
 * SplashScreen — перший екран при запуску додатку.
 * Показується ~1.2s під час завантаження БД, потім fade-out.
 */
export default function SplashScreen({
  status = 'Завантаження бази даних…'
}: {
  status?: string
}): JSX.Element {
  const [phase, setPhase] = useState<'in' | 'hold'>('in')
  useEffect(() => {
    const t = setTimeout(() => setPhase('hold'), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0d0c0a',
        display: 'grid',
        placeItems: 'center',
        opacity: phase === 'in' ? 0 : 1,
        transition: 'opacity 320ms ease'
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bannerUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.22,
          filter: 'saturate(0.85)'
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(13,12,10,0.55) 55%, rgba(13,12,10,0.95) 100%)'
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          textAlign: 'center'
        }}
      >
        <img
          src={shieldUrl}
          width={120}
          height={138}
          alt="ARES"
          style={{
            objectFit: 'contain',
            filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.55))'
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: '0.04em',
              color: 'oklch(0.97 0.005 80)'
            }}
          >
            ALVARES{' '}
            <span
              style={{
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: 16,
                color: 'oklch(0.80 0.13 86)',
                letterSpacing: '0.12em'
              }}
            >
              AI
            </span>
          </div>

          <div
            style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'oklch(0.66 0.007 80)'
            }}
          >
            12 ШР · 4 ШБ · 92 ОШБр
          </div>
        </div>

        <div
          style={{
            width: 180,
            height: 2,
            background: 'oklch(0.30 0.006 70)',
            borderRadius: 1,
            overflow: 'hidden',
            marginTop: 8
          }}
        >
          <div
            style={{
              width: '40%',
              height: '100%',
              background: 'oklch(0.80 0.13 86)',
              animation: 'alvares-splash-bar 1.4s ease-in-out infinite'
            }}
          />
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontSize: 10.5,
            color: 'oklch(0.50 0.008 70)',
            letterSpacing: '0.08em'
          }}
        >
          {status}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: 10,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'oklch(0.55 0.06 60)'
        }}
      >
        ми вже поруч
      </div>

      <style>{`
        @keyframes alvares-splash-bar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
    </div>
  )
}
