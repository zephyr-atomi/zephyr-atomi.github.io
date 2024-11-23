export default {
  lang: 'en-US',
  title: 'Zephyr Guo',
  description: 'Zephyr Guo is an Backend / Embedded Engineer.',
  cleanUrls: true,
  sitemap: {
    hostname: 'https://zephyr-atomi.github.io',
    lastmodDateOnly: false
  },
  head: [
    ['meta', { property: 'author', content: 'Zephyr Guo' }],
    ['meta', { name: 'og:site_name', content: 'Zephyr Guo' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@else_clause' }],
    ['meta', { name: 'twitter:creator', content: '@else_clause' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1, user-scalable=no' }]
  ],
  themeConfig: {
    logo: { src: '/logo.png', width: 24, height: 24 },
    aside: true,
    outline: {
      level: 'deep'
    },
    nav: nav(),
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zephyr-atomi/' }
    ]
  }
}

function nav() {
  return [
    {
      text: 'Blog',
      link: '/blog/',
      activeMatch: '/blog'
    }
  ]
}
