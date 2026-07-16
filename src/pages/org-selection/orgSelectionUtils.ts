export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  const a = words[0]?.[0] ?? ''
  const b = words[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}
