import shieldUrl from '../../assets/ares-shield.png'

/**
 * BrandMark — шеврон 12 ШР / 4 ШБ.
 * Замінює попередній placeholder з літерою «A» в sidebar.
 *
 * Використання:
 *   <BrandMark />              // стандартний 26×26 для sidebar
 *   <BrandMark size={48} />    // для splash / Settings
 */
export default function BrandMark({ size = 26 }: { size?: number }): JSX.Element {
  return (
    <img
      src={shieldUrl}
      width={size}
      height={size}
      alt="ARES · 12 ШР"
      style={{
        objectFit: 'contain',
        flexShrink: 0,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))'
      }}
    />
  )
}
