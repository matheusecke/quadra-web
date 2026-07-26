/**
 * Campeonato guarda instantes (`timestamptz`); o formulário coleta dias. A conversão é
 * meia-noite LOCAL: meia-noite UTC volta como o dia anterior a oeste de Greenwich, e o
 * admin veria 09/jan onde escolheu 10/jan.
 */
export function toInstant(day: string, endOfDay = false): string | null {
  if (!day) return null
  const [year, month, date] = day.split('-').map(Number)
  const local = endOfDay
    ? new Date(year, month - 1, date, 23, 59, 59)
    : new Date(year, month - 1, date)
  return Number.isNaN(local.getTime()) ? null : local.toISOString()
}

/** Instante da API → valor de um `<input type="date">`, no fuso de quem está olhando. */
export function toDayInput(instant: string | null): string {
  if (!instant) return ''
  const local = new Date(instant)
  if (Number.isNaN(local.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`
}
