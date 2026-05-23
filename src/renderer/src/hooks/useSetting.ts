import { useEffect, useRef, useState } from 'react'

/**
 * v1.7.6: спільний хук для роботи з generic-таблицею `settings` (key-value).
 * Уніфікує патерн «read on mount + edit + save» з трьох call-сайтів
 * (Settings.tsx × 2, FormationReport.tsx). Аналогічний підхід до useLookups —
 * module-level cache + per-key pub/sub, тож save() в одній сторінці
 * автоматично оновлює value в усіх інших підписниках без перезавантаження.
 *
 * Для batch-сценаріїв (4+ ключі одночасно, як RopPhrasesAdmin) хук НЕ
 * призначений — там залишається settingsGetAll().
 */

const cache = new Map<string, string>()
const subscribers = new Map<string, Set<(v: string) => void>>()
const inFlight = new Map<string, Promise<string>>()

async function fetchSetting(key: string): Promise<string> {
  const existing = inFlight.get(key)
  if (existing) return existing
  const promise = (async () => {
    const raw = await window.api.settingsGet(key)
    const value = (raw as string | null) ?? ''
    cache.set(key, value)
    inFlight.delete(key)
    return value
  })()
  inFlight.set(key, promise)
  return promise
}

function notify(key: string, value: string): void {
  subscribers.get(key)?.forEach((fn) => fn(value))
}

/**
 * Скинути cache для конкретного ключа та ре-фетчити з БД. Викликати,
 * якщо settings змінились зовні від хука (rare — нпрд після імпорту).
 */
export async function invalidateSetting(key: string): Promise<void> {
  cache.delete(key)
  inFlight.delete(key)
  const fresh = await fetchSetting(key)
  notify(key, fresh)
}

export interface SettingHandle {
  /** Збережене значення (committed). Для read-only consumer'ів. */
  value: string
  /** Локальний edit-state. Інпут має bind'итись сюди. */
  draft: string
  /** Оновити draft (committed value не змінюється до save()). */
  setDraft: (v: string) => void
  /**
   * Записати draft → БД + notify cross-component subscribers.
   * Опційний `override` — закомітити інше значення (нпрд trim'нутий
   * варіант draft'у), оминаючи async setDraft race.
   */
  save: (override?: string) => Promise<void>
  /** true до завершення першого read'у з БД. */
  isLoading: boolean
  /** draft !== value */
  isDirty: boolean
  /** true після save() до наступного setDraft() — для UI «Збережено» feedback. */
  isSaved: boolean
}

export function useSetting(key: string, defaultValue = ''): SettingHandle {
  const initial = cache.get(key) ?? defaultValue
  const [value, setValue] = useState<string>(initial)
  const [draft, setDraftState] = useState<string>(initial)
  const [isLoading, setIsLoading] = useState<boolean>(!cache.has(key))
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const fetched = useRef<boolean>(cache.has(key))

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true
      fetchSetting(key).then((fresh) => {
        setValue(fresh)
        setDraftState(fresh)
        setIsLoading(false)
      })
    }
    // Subscriber не торкається isSaved — інакше save() в цьому ж компоненті
    // одразу скине власний «Збережено» badge через self-notify.
    const subscriber = (fresh: string): void => {
      setValue(fresh)
      setDraftState(fresh)
      setIsLoading(false)
    }
    if (!subscribers.has(key)) subscribers.set(key, new Set())
    subscribers.get(key)!.add(subscriber)
    return () => {
      subscribers.get(key)?.delete(subscriber)
    }
  }, [key])

  const setDraft = (v: string): void => {
    setDraftState(v)
    setIsSaved(false)
  }

  const save = async (override?: string): Promise<void> => {
    const next = override ?? draft
    await window.api.settingsSet(key, next)
    cache.set(key, next)
    setValue(next)
    setDraftState(next)
    setIsSaved(true)
    notify(key, next)
  }

  return {
    value,
    draft,
    setDraft,
    save,
    isLoading,
    isDirty: draft !== value,
    isSaved,
  }
}
