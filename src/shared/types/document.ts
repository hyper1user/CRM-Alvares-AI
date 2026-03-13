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

export interface DocumentTemplate {
  id: number
  name: string
  templateType: string
  filePath: string
  description: string | null
  isDefault: boolean
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
