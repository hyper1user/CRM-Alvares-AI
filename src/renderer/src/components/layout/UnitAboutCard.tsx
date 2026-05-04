import bannerUrl from '../../assets/ares-banner.jpeg'
import shieldUrl from '../../assets/ares-shield.png'

/**
 * UnitAboutCard — церемоніальна картка "Про підрозділ" для Settings.tsx.
 * Розмір: full-width, висота фіксована 220px.
 */
export default function UnitAboutCard(): JSX.Element {
  return (
    <div
      style={{
        position: 'relative',
        height: 220,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid var(--line-1)',
        background: 'var(--bg-1)'
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bannerUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          opacity: 0.32,
          filter: 'saturate(0.9)'
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to right, var(--bg-1) 0%, color-mix(in oklab, var(--bg-1), transparent 35%) 50%, transparent 100%)'
        }}
      />

      <div
        style={{
          position: 'relative',
          height: '100%',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20
        }}
      >
        <img
          src={shieldUrl}
          width={84}
          height={97}
          alt="ARES"
          style={{
            objectFit: 'contain',
            flexShrink: 0,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--fg-3)'
            }}
          >
            Підрозділ
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.01em',
              color: 'var(--fg-0)',
              lineHeight: 1.15
            }}
          >
            12 штурмова рота
          </div>

          <div
            style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 12,
              color: 'var(--fg-2)',
              letterSpacing: '0.04em'
            }}
          >
            12 штурмова рота · 4 штурмовий батальйон · 92 окрема штурмова бригада
          </div>

          <div
            style={{
              marginTop: 8,
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 11,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              fontWeight: 600
            }}
          >
            ми вже поруч
          </div>
        </div>
      </div>
    </div>
  )
}
