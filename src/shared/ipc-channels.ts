export const IPC = {
  // Database
  DB_HEALTH: 'db:health',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',

  // Personnel
  PERSONNEL_LIST: 'personnel:list',
  PERSONNEL_GET: 'personnel:get',
  PERSONNEL_CREATE: 'personnel:create',
  PERSONNEL_UPDATE: 'personnel:update',
  PERSONNEL_DELETE: 'personnel:delete',
  PERSONNEL_SEARCH: 'personnel:search',

  // Positions
  POSITIONS_LIST: 'positions:list',
  POSITIONS_GET: 'positions:get',
  POSITIONS_CREATE: 'positions:create',
  POSITIONS_UPDATE: 'positions:update',

  // Subdivisions
  SUBDIVISIONS_LIST: 'subdivisions:list',
  SUBDIVISIONS_TREE: 'subdivisions:tree',

  // Movements
  MOVEMENTS_LIST: 'movements:list',
  MOVEMENTS_CREATE: 'movements:create',
  MOVEMENTS_GET_BY_PERSON: 'movements:get-by-person',

  // Statuses
  STATUS_HISTORY_LIST: 'status-history:list',
  STATUS_HISTORY_CREATE: 'status-history:create',
  STATUS_HISTORY_GET_BY_PERSON: 'status-history:get-by-person',

  // Attendance
  ATTENDANCE_GET_MONTH: 'attendance:get-month',
  ATTENDANCE_SET_DAY: 'attendance:set-day',
  ATTENDANCE_SNAPSHOT: 'attendance:snapshot',

  // Documents
  DOCUMENTS_GENERATE: 'documents:generate',
  DOCUMENTS_LIST: 'documents:list',

  // Orders
  ORDERS_LIST: 'orders:list',
  ORDERS_CREATE: 'orders:create',

  // Leave
  LEAVE_LIST: 'leave:list',
  LEAVE_CREATE: 'leave:create',

  // Injuries
  INJURIES_LIST: 'injuries:list',
  INJURIES_CREATE: 'injuries:create',

  // Losses
  LOSSES_LIST: 'losses:list',
  LOSSES_CREATE: 'losses:create',

  // Lookups (довідники)
  RANKS_LIST: 'ranks:list',
  STATUS_TYPES_LIST: 'status-types:list',
  BLOOD_TYPES_LIST: 'blood-types:list',
  CONTRACT_TYPES_LIST: 'contract-types:list',
  EDUCATION_LEVELS_LIST: 'education-levels:list',

  // Import/Export
  IMPORT_EJOOS: 'import:ejoos',
  IMPORT_DATA: 'import:data',
  EXPORT_EJOOS: 'export:ejoos',
  EXPORT_CSV: 'export:csv',

  // Statistics
  STATISTICS_SUMMARY: 'statistics:summary',
  STATISTICS_BY_STATUS: 'statistics:by-status',
  STATISTICS_BY_SUBDIVISION: 'statistics:by-subdivision'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
