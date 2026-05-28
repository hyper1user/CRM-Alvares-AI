import bannerUrl from '../../assets/ares-banner.jpeg'
import shieldUrl from '../../assets/ares-shield.png'

/**
 * SplashScreen — перший екран при запуску.
 * Контрольована версія: видимий, поки batt-app не запропонує `leaving=true`.
 * Анімації — у assets/animations.css (.alvares-splash__*).
 */
const WORD = 'ALVARES'

export default function SplashScreen({
  status = 'Завантаження бази даних…',
  leaving = false
}: {
  status?: string
  leaving?: boolean
}): JSX.Element {
  return (
    <div
      className={`alvares-splash ${leaving ? 'leaving' : ''}`}
      style={{ ['--splash-banner' as string]: `url('${bannerUrl}')` }}
    >
      <div className="alvares-splash__stack">
        <img src={shieldUrl} alt="ARES" className="alvares-splash__shield" />
        <div className="alvares-splash__title">
          {WORD.split('').map((c, i) => (
            <span key={i} className="ch" style={{ ['--i' as string]: i }}>
              {c}
            </span>
          ))}
          <span className="ai ch" style={{ ['--i' as string]: 8 }}>
            AI
          </span>
        </div>
        <div className="alvares-splash__unit">12 ШР · 4 ШБ · 92 ОШБр</div>
        <div className="alvares-splash__bar">
          <i />
        </div>
        <div
          className="alvares-splash__unit"
          style={{ marginTop: -4, opacity: 0.7, letterSpacing: '0.08em', textTransform: 'none' }}
        >
          {status}
        </div>
      </div>
      <div className="alvares-splash__slogan">ми вже поруч</div>
    </div>
  )
}
