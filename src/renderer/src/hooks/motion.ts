/* ========================================================================
   ALVARES AI — Motion hooks
   React 19 / TypeScript. Працюють разом з assets/animations.css.
   ======================================================================== */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import type { CSSProperties } from 'react'

/* useCountUp — анімує число від 0 до target за `duration` мс. */
export function useCountUp(target: number, duration = 800, deps: unknown[] = []): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number): void => {
      const t = Math.max(0, Math.min(1, (now - start) / duration))
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setValue(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, ...deps])
  return value
}

/* usePageTransition — повертає key (pathname), щоб React перемонтував сторінку
   при кожній зміні роуту і CSS-анімація `.alvares-page` зіграла. */
export function usePageTransition(): string {
  const loc = useLocation()
  return loc.pathname
}

/* useSplash — тримає splash видимим duration мс, потім приховує. */
export function useSplash(durationMs = 1800): boolean {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), durationMs)
    return () => clearTimeout(t)
  }, [durationMs])
  return visible
}

/* useStaggerStyle — повертає inline-style з animation-delay = index * step мс
   (обмежений maxIndex, щоб у великих списках не було повільного появи). */
export function useStaggerStyle(index: number, step = 25, maxIndex = 12): CSSProperties {
  const i = Math.min(index, maxIndex)
  return { animationDelay: `${i * step}ms` }
}

/* useToast — простий toast-state для CSS-slide-in. Для повноцінного — Ant message. */
export function useToast(): {
  visible: boolean
  message: string
  show: (msg: string) => void
} {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const timer = useRef<number | null>(null)

  const show = useCallback((msg: string) => {
    setMessage(msg)
    setVisible(false)
    requestAnimationFrame(() => setVisible(true))
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setVisible(false), 2600)
  }, [])

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    []
  )

  return { visible, message, show }
}

/* useSparkDraw — викликає re-draw анімації sparkline при зміні даних. */
export function useSparkDraw(deps: unknown[]): number {
  const [k, setK] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setK((v) => v + 1)
  }, deps)
  return k
}
