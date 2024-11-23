const giscusConfig = (currentTheme) => ({
  async: true,
  src: 'https://giscus.app/client.js',
  'data-repo': 'zephyr-atomi/zephyr-atomi.github.io',
  'data-repo-id': 'R_kgDONTkpVA',
  'data-category': 'General',
  'data-category-id': 'DIC_kwDONTkpVM4Ckh_A',
  'data-mapping': 'pathname',
  'data-strict': '0',
  'data-reactions-enabled': '1',
  'data-emit-metadata': '0',
  'data-input-position': 'top',
  'data-theme': currentTheme,
  'data-lang': 'en',
  'data-loading': 'lazy',
  crossorigin: 'anonymous'
})

export { giscusConfig }
