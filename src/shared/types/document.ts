// ==================== ORDERS ====================

export interface Order {
  id: number
  orderType: string
  orderNumber: string
  orderDate: string
  subject: string | null
  bodyText: string | null
  signedBy: string | null
  filePath: string | null
  createdAt: string
}

export interface OrderItem {
  id: number
  orderId: number
  personnelId: number | null
  actionType: string | null
  description: string | null
  sortOrder: number | null
}

export interface OrderListItem extends Order {
  itemsCount: number
}

export interface OrderFilters {
  search?: string
  orderType?: string
  dateFrom?: string
  dateTo?: string
}

export interface CreateOrderRequest {
  orderType: string
  orderNumber: string
  orderDate: string
  subject?: string
  bodyText?: string
  signedBy?: string
  items?: CreateOrderItemRequest[]
}

export interface CreateOrderItemRequest {
  personnelId?: number | null
  actionType?: string
  description?: string
  sortOrder?: number
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
}

// ==================== LEAVE RECORDS ====================

export interface LeaveRecord {
  id: number
  personnelId: number
  leaveType: string
  startDate: string
  endDate: string
  travelDays: number | null
  destination: string | null
  orderNumber: string | null
  orderDate: string | null
  ticketNumber: string | null
  returnDate: string | null
  tccRegistration: string | null
  notes: string | null
  createdAt: string
}

export interface LeaveRecordListItem extends LeaveRecord {
  fullName: string
  rankName: string | null
}

export interface LeaveRecordFilters {
  search?: string
  leaveType?: string
  personnelId?: number
  dateFrom?: string
  dateTo?: string
}

export interface CreateLeaveRecordRequest {
  personnelId: number
  leaveType: string
  startDate: string
  endDate: string
  travelDays?: number
  destination?: string
  orderNumber?: string
  orderDate?: string
  ticketNumber?: string
  notes?: string
}

// ==================== DOCUMENT TEMPLATES ====================

// v1.4.0: 4 видимі категорії + 'retired' для прихованих архівних шаблонів.
export type TemplateCategory = 'event' | 'raport' | 'discharge' | 'monetary' | 'retired'

export interface DocumentTemplate {
  id: number
  name: string
  templateType: string
  filePath: string
  description: string | null
  isDefault: boolean
  category: TemplateCategory | null
}

export interface GeneratedDocument {
  id: number
  templateId: number | null
  documentType: string
  title: string | null
  personnelIds: string | null
  filePath: string
  generatedAt: string
}

/**
 * v1.6.1: результат batch-генерації Бойових розпоряджень на період
 * (RangePicker у Generator'і). N записів у generated_documents,
 * один директорій, список пропущених днів (немає БР батальйону у xlsx).
 */
export interface BatchGenerationResult {
  type: 'batch'
  count: number
  /** ISO дати днів, для яких не знайшлось БР батальйону у xlsx. */
  skippedDays: string[]
  /** Папка, у яку збережено всі файли. */
  dirPath: string
  /** ID створених записів у generated_documents. */
  ids: number[]
}

export interface GenerateDocumentRequest {
  templateId: number
  title: string
  personnelIds?: number[]
  fields: Record<string, string>
}

export interface TemplateInfo {
  template: DocumentTemplate
  tags: string[]
}

export interface GeneratedDocumentListItem extends GeneratedDocument {
  templateName?: string
}

export interface DocumentListFilters {
  documentType?: string
  search?: string
}
