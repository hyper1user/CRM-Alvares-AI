import { useState, useEffect, useCallback } from 'react'
import type {
  DocumentTemplate,
  GeneratedDocumentListItem,
  DocumentListFilters
} from '@shared/types/document'

interface UseTemplateListResult {
  templates: DocumentTemplate[]
  loading: boolean
  refetch: () => void
}

export function useTemplateList(): UseTemplateListResult {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    window.api
      .templatesList()
      .then((result) => setTemplates(result ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }, [trigger])

  return { templates, loading, refetch }
}

interface UseGeneratedDocumentsResult {
  documents: GeneratedDocumentListItem[]
  loading: boolean
  refetch: () => void
}

export function useGeneratedDocuments(
  filters: DocumentListFilters = {}
): UseGeneratedDocumentsResult {
  const [documents, setDocuments] = useState<GeneratedDocumentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [trigger, setTrigger] = useState(0)

  const refetch = useCallback(() => setTrigger((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    window.api
      .documentsList(filters)
      .then((result) => setDocuments(result ?? []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false))
  }, [filters.documentType, filters.search, trigger])

  return { documents, loading, refetch }
}
