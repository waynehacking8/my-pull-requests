import { Feed } from 'feed'
import { joinURL } from 'ufo'
import { getRequestURL } from 'h3'

export default defineEventHandler(async (event) => {
  const domain = getRequestURL(event).origin
  const { user, prs } = await $fetch <Contributions> ('/api/contributions')
  const feed = new Feed({
    title: `${user.name} is contributing...`,
    description: `Discover ${user.name}'s recent pull requests on GitHub`,
    id: domain,
    link: domain,
    language: 'en',
    image: joinURL(domain, 'favicon.png'),
    favicon: joinURL(domain, 'favicon.png'),
    copyright: `CC BY-NC-SA 4.0 2024 © ${user.name}`,
    feedLinks: {
      rss: `${domain}/feed.xml`,
    },
  })

  // The payload arrives in creation order, so emitting it as-is left a PR that
  // landed today sitting below three weeks of older entries. Order the feed by
  // the same activity timestamp the items are dated with.
  const recentFirst = [...prs].sort((a, b) =>
    new Date(prActivityAt(b)).getTime() - new Date(prActivityAt(a)).getTime(),
  )

  for (const pr of recentFirst) {
    feed.addItem({
      link: pr.url,
      // Dating a merged PR by created_at pushed it into the feed weeks in the
      // past, where readers sort it below everything and nobody ever sees it.
      date: new Date(prActivityAt(pr)),
      title: pr.title,
      image: `https://github.com/${pr.repo.split('/')[0]}.png`,
      description: `<a href="${pr.url}">${pr.title}</a>`,
    })
  }

  appendHeader(event, 'Content-Type', 'application/xml')
  return feed.rss2()
})
