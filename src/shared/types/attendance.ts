export interface AttendanceRecord {
  id: number
  personnelId: number
  date: string
  statusCode: string
  presenceGroup: string | null
}
