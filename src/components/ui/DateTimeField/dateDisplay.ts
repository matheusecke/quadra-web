/** '2026-08-12T19:00' → '12/08/2026 19:00'. Empty → ''. */
export const toDisplay = (value: string, type: 'datetime-local' | 'date'): string => {
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = (datePart ?? '').split('-')
  if (!year || !month || !day) return ''
  const date = `${day}/${month}/${year}`
  return type === 'date' || !timePart ? date : `${date} ${timePart}`
}

/** '12/08/2026 19:00' → '2026-08-12T19:00'. Incomplete or impossible → null. */
export const fromDisplay = (display: string, type: 'datetime-local' | 'date'): string | null => {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/)
  if (!match) return null
  const [, day, month, year, hours = '00', minutes = '00'] = match
  const probe = new Date(Number(year), Number(month) - 1, Number(day))
  if (probe.getMonth() !== Number(month) - 1 || probe.getDate() !== Number(day)) return null
  return type === 'date' ? `${year}-${month}-${day}` : `${year}-${month}-${day}T${hours}:${minutes}`
}
