/** "3 sources", "1 source". */
export function plural(n: number, word: string, pluralWord = `${word}s`): string {
  return `${n} ${n > 1 ? pluralWord : word}`
}
