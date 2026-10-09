// Génère le code que le joueur tape dans le chat Twitch : !lier CODE
import { randomInt } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const player = await requirePlayer(event)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('')
  const { error } = await gameDb(event).from('profiles').update({ link_code: code }).eq('id', player.id)
  fail(error)
  return { code }
})
