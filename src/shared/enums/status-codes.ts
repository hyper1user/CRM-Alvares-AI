export interface StatusTypeEntry {
  id: number
  code: string
  name: string
  groupName: string
  onSupply: boolean
  rewardAmount: number | null
  sortOrder: number
  colorCode: string
}

export const STATUS_TYPES: StatusTypeEntry[] = [
  { id: 1, code: 'РВ', name: 'Район виконання', groupName: 'Так', onSupply: true, rewardAmount: 100000, sortOrder: 1, colorCode: '#52c41a' },
  { id: 2, code: 'РЗ', name: 'Район зосередження', groupName: 'Так', onSupply: true, rewardAmount: 50000, sortOrder: 2, colorCode: '#73d13d' },
  { id: 3, code: 'РШ', name: 'Район штабу', groupName: 'Так', onSupply: true, rewardAmount: 50000, sortOrder: 3, colorCode: '#95de64' },
  { id: 4, code: 'ППД', name: 'Пункт постійної дислокації', groupName: 'Так', onSupply: true, rewardAmount: 30000, sortOrder: 4, colorCode: '#b7eb8f' },
  { id: 5, code: 'АДП', name: 'Адмінпосада', groupName: 'Так', onSupply: true, rewardAmount: null, sortOrder: 5, colorCode: '#d9f7be' },
  { id: 6, code: 'ВП', name: 'Відпустка', groupName: 'Відпустка', onSupply: true, rewardAmount: null, sortOrder: 10, colorCode: '#1890ff' },
  { id: 7, code: 'ДВП', name: 'Додаткова відпустка', groupName: 'Відпустка', onSupply: true, rewardAmount: null, sortOrder: 11, colorCode: '#40a9ff' },
  { id: 8, code: 'ВПХ', name: 'Відпустка за хворобою', groupName: 'Відпустка', onSupply: true, rewardAmount: null, sortOrder: 12, colorCode: '#69c0ff' },
  { id: 9, code: 'ВПС', name: 'Відпустка сімейна', groupName: 'Відпустка', onSupply: true, rewardAmount: null, sortOrder: 13, colorCode: '#91d5ff' },
  { id: 10, code: 'ВПП', name: 'Відпустка по пораненню', groupName: 'Відпустка', onSupply: true, rewardAmount: null, sortOrder: 14, colorCode: '#bae7ff' },
  { id: 11, code: 'СЗЧ', name: 'Самовільне залишення ч-ни', groupName: 'Інше', onSupply: true, rewardAmount: null, sortOrder: 20, colorCode: '#ff4d4f' },
  { id: 12, code: '200', name: 'Загиблий', groupName: 'Загиблі', onSupply: false, rewardAmount: null, sortOrder: 30, colorCode: '#000000' },
  { id: 13, code: 'ЗБ', name: 'Зниклий безвісти', groupName: 'Загиблі', onSupply: false, rewardAmount: null, sortOrder: 31, colorCode: '#434343' },
  { id: 14, code: 'ПОЛОН', name: 'В полоні', groupName: 'Загиблі', onSupply: false, rewardAmount: null, sortOrder: 32, colorCode: '#595959' },
  { id: 15, code: 'ШП', name: 'Шпиталь', groupName: 'Лікування', onSupply: true, rewardAmount: null, sortOrder: 40, colorCode: '#faad14' },
  { id: 16, code: 'НП', name: 'На поправці', groupName: 'Лікування', onSupply: true, rewardAmount: null, sortOrder: 41, colorCode: '#ffc53d' },
  { id: 17, code: 'ВБВ', name: 'Виконання бойового завдання', groupName: 'Так', onSupply: true, rewardAmount: 100000, sortOrder: 6, colorCode: '#389e0d' },
  { id: 18, code: 'ЗВ', name: 'Звільнений', groupName: 'Виключені', onSupply: false, rewardAmount: null, sortOrder: 50, colorCode: '#8c8c8c' },
  { id: 19, code: 'ВД', name: 'Відрядження', groupName: 'Так', onSupply: true, rewardAmount: null, sortOrder: 7, colorCode: '#13c2c2' },
  { id: 20, code: 'АР', name: 'Арешт', groupName: 'Інше', onSupply: true, rewardAmount: null, sortOrder: 21, colorCode: '#cf1322' },
  { id: 21, code: 'БЗВП', name: 'Без звістки про перебування', groupName: 'Інше', onSupply: true, rewardAmount: null, sortOrder: 22, colorCode: '#a8071a' }
]
