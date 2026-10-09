// Lecture anonyme du chat Twitch par IRC (WebSocket), sans compte ni token.
// Côté client uniquement.

export interface ChatMessage {
  user: string
  text: string
  isBroadcaster: boolean
  isMod: boolean
}

export function useTwitchChat(channel: string, onMessage: (m: ChatMessage) => void) {
  const connected = ref(false)
  let ws: WebSocket | null = null
  let retry: ReturnType<typeof setTimeout> | undefined
  let stopped = false

  function parse(line: string): ChatMessage | null {
    // @tags :nick!nick@nick.tmi.twitch.tv PRIVMSG #chan :texte
    let rest = line
    const tags: Record<string, string> = {}
    if (rest.startsWith('@')) {
      const end = rest.indexOf(' ')
      for (const kv of rest.slice(1, end).split(';')) {
        const i = kv.indexOf('=')
        tags[kv.slice(0, i)] = kv.slice(i + 1)
      }
      rest = rest.slice(end + 1)
    }
    const m = rest.match(/^:(\w+)!\S+ PRIVMSG #\S+ :(.*)$/)
    if (!m) return null
    const badges = tags.badges ?? ''
    return {
      user: tags['display-name'] || m[1]!,
      text: m[2]!.trim(),
      isBroadcaster: badges.includes('broadcaster/'),
      isMod: tags.mod === '1' || badges.includes('moderator/'),
    }
  }

  function connect() {
    if (stopped) return
    ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443')
    ws.onopen = () => {
      ws!.send('CAP REQ :twitch.tv/tags')
      ws!.send(`NICK justinfan${Math.floor(10000 + Math.random() * 80000)}`)
      ws!.send(`JOIN #${channel.toLowerCase()}`)
      connected.value = true
    }
    ws.onmessage = (ev) => {
      for (const line of String(ev.data).split('\r\n')) {
        if (!line) continue
        if (line.startsWith('PING')) {
          ws!.send('PONG :tmi.twitch.tv')
          continue
        }
        const msg = parse(line)
        if (msg) onMessage(msg)
      }
    }
    ws.onclose = () => {
      connected.value = false
      if (!stopped) retry = setTimeout(connect, 3000)
    }
    ws.onerror = () => ws?.close()
  }

  function disconnect() {
    stopped = true
    clearTimeout(retry)
    ws?.close()
  }

  return { connected, connect, disconnect }
}
