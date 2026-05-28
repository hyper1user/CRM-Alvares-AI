export enum RankCategory {
  Officers = 'Офіцери',
  Sergeants = 'Сержанти',
  Soldiers = 'Солдати',
  Civilians = 'Працівники'
}

export interface RankEntry {
  id: number
  name: string
  category: RankCategory
  sortOrder: number
  natoCode?: string
}

export const RANKS: RankEntry[] = [
  // Офіцери (430→310)
  { id: 1, name: 'полковник', category: RankCategory.Officers, sortOrder: 430, natoCode: 'OF-5' },
  { id: 2, name: 'підполковник', category: RankCategory.Officers, sortOrder: 420, natoCode: 'OF-4' },
  { id: 3, name: 'майор', category: RankCategory.Officers, sortOrder: 410, natoCode: 'OF-3' },
  { id: 4, name: 'капітан', category: RankCategory.Officers, sortOrder: 400, natoCode: 'OF-2' },
  { id: 5, name: 'старший лейтенант', category: RankCategory.Officers, sortOrder: 390, natoCode: 'OF-1' },
  { id: 6, name: 'лейтенант', category: RankCategory.Officers, sortOrder: 380, natoCode: 'OF-1' },
  { id: 7, name: 'молодший лейтенант', category: RankCategory.Officers, sortOrder: 370, natoCode: 'OF-1' },
  { id: 8, name: 'бригадний генерал', category: RankCategory.Officers, sortOrder: 440, natoCode: 'OF-6' },
  { id: 9, name: 'генерал-майор', category: RankCategory.Officers, sortOrder: 450, natoCode: 'OF-7' },
  { id: 10, name: 'генерал-лейтенант', category: RankCategory.Officers, sortOrder: 460, natoCode: 'OF-8' },
  { id: 11, name: 'генерал', category: RankCategory.Officers, sortOrder: 470, natoCode: 'OF-9' },
  { id: 12, name: 'старший лейтенант (мед)', category: RankCategory.Officers, sortOrder: 391 },
  { id: 13, name: 'лейтенант (мед)', category: RankCategory.Officers, sortOrder: 381 },
  { id: 14, name: 'капітан (мед)', category: RankCategory.Officers, sortOrder: 401 },
  { id: 15, name: 'майор (мед)', category: RankCategory.Officers, sortOrder: 411 },
  // Сержанти (280→210)
  { id: 16, name: 'головний майстер-сержант', category: RankCategory.Sergeants, sortOrder: 280, natoCode: 'OR-9' },
  { id: 17, name: 'штаб-сержант', category: RankCategory.Sergeants, sortOrder: 275, natoCode: 'OR-9' },
  { id: 18, name: 'майстер-сержант', category: RankCategory.Sergeants, sortOrder: 270, natoCode: 'OR-8' },
  { id: 19, name: 'старший сержант', category: RankCategory.Sergeants, sortOrder: 260, natoCode: 'OR-7' },
  { id: 20, name: 'сержант', category: RankCategory.Sergeants, sortOrder: 250, natoCode: 'OR-6' },
  { id: 21, name: 'молодший сержант', category: RankCategory.Sergeants, sortOrder: 240, natoCode: 'OR-5' },
  { id: 22, name: 'старший солдат', category: RankCategory.Sergeants, sortOrder: 230, natoCode: 'OR-4' },
  { id: 23, name: 'головний сержант', category: RankCategory.Sergeants, sortOrder: 265, natoCode: 'OR-8' },
  { id: 24, name: 'перший сержант', category: RankCategory.Sergeants, sortOrder: 255, natoCode: 'OR-7' },
  { id: 25, name: 'старший майстер-сержант', category: RankCategory.Sergeants, sortOrder: 277, natoCode: 'OR-9' },
  // Солдати (130→108)
  { id: 26, name: 'солдат', category: RankCategory.Soldiers, sortOrder: 120, natoCode: 'OR-1' },
  { id: 27, name: 'рекрут', category: RankCategory.Soldiers, sortOrder: 108, natoCode: 'OR-1' },
  { id: 28, name: 'старший матрос', category: RankCategory.Soldiers, sortOrder: 131 },
  { id: 29, name: 'матрос', category: RankCategory.Soldiers, sortOrder: 121 },
  { id: 30, name: 'старший солдат (ВМСУ)', category: RankCategory.Soldiers, sortOrder: 132 },
  // Старшини
  { id: 31, name: 'старшина', category: RankCategory.Sergeants, sortOrder: 220, natoCode: 'OR-5' },
  { id: 32, name: 'головний старшина', category: RankCategory.Sergeants, sortOrder: 225, natoCode: 'OR-5' },
  { id: 33, name: 'штаб-старшина', category: RankCategory.Sergeants, sortOrder: 226, natoCode: 'OR-6' },
  { id: 34, name: 'майстер-старшина', category: RankCategory.Sergeants, sortOrder: 227, natoCode: 'OR-7' },
  { id: 35, name: 'старший майстер-старшина', category: RankCategory.Sergeants, sortOrder: 228, natoCode: 'OR-8' },
  { id: 36, name: 'головний майстер-старшина', category: RankCategory.Sergeants, sortOrder: 229, natoCode: 'OR-9' },
  // Працівники
  { id: 37, name: 'працівник ЗСУ', category: RankCategory.Civilians, sortOrder: 101 },
  { id: 38, name: 'цивільний', category: RankCategory.Civilians, sortOrder: 100 }
]
