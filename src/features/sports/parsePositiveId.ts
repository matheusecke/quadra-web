/** Converte parâmetro de rota/controle HTML em ID de domínio. Só use na fronteira. */
export function parsePositiveId(raw: string | undefined | null): number | null {
  if (raw == null || raw === '') return null
  if (!/^[1-9]\d*$/.test(raw)) return null
  const n = Number(raw)
  return Number.isSafeInteger(n) ? n : null
}
