// Fil unifié : toutes les publications mélangées, les plus récentes d'abord.
export default defineEventHandler(async () => {
  const { twitchClientId, twitchClientSecret, public: { twitchLogin, youtubeChannelId, blueskyHandle } } = useRuntimeConfig()

  const [youtube, bluesky, twitch] = await Promise.all([
    youtubeChannelId ? fetchYoutube(youtubeChannelId) : [],
    blueskyHandle ? fetchBluesky(blueskyHandle) : [],
    twitchClientId && twitchClientSecret ? fetchTwitch(twitchLogin) : [],
  ])

  const items: FeedItem[] = [...youtube, ...bluesky, ...twitch].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40)

  return {
    items,
    sources: {
      youtube: Boolean(youtubeChannelId),
      bluesky: Boolean(blueskyHandle),
      twitch: Boolean(twitchClientId && twitchClientSecret),
    },
  }
})
