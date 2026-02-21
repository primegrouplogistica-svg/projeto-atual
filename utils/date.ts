export function parseDateLocal(dateStr: string): Date {
  if (!dateStr) return new Date(NaN)
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr) || /^\d{4}-\d{2}-\d{2}\s/.test(dateStr)) {
    const datePart = dateStr.slice(0, 10)
    const [y, m, d] = datePart.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(dateStr)
}

export function formatDateBr(dateStr: string): string {
  const d = parseDateLocal(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function todayLocalDateInput(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
