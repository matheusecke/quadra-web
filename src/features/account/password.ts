const numberPattern = /\d/
const specialPattern = /[^A-Za-z0-9]/

export const PASSWORD_RULE_MESSAGE =
  'A senha deve ter no mínimo 8 caracteres, 1 número e 1 caractere especial.'

export const isStrongPassword = (value: string): boolean =>
  value.length >= 8 && numberPattern.test(value) && specialPattern.test(value)
