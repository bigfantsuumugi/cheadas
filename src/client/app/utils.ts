import { siteDataRef } from './data.js'
import { inBrowser, EXTERNAL_URL_RE, sanitizeFileName } from '../shared.js'

export { inBrowser }

/**
 * Join two paths by resolving the slash collision.
 */
export function joinPath(base: string, path: string): string {
  return `${base}${path}`.replace(/\/+/g, '/')
}

export function withBase(path: string) {
  return EXTERNAL_URL_RE.test(path)
    ? path
    : joinPath(siteDataRef.value.base, path)
}

/**
 * Converts a url path to the corresponding js chunk filename.
 */
export function pathToFile(path: string): string {
  let pagePath = path.replace(/\.html$/, '')
  pagePath = decodeURIComponent(pagePath)

  if (pagePath.endsWith('/')) {
    if (import.meta.env.DEV) {
      // in dev, we are importing the md files directly, and if there's a trailing slash
      // it's likely an index.md file
      pagePath += 'index'
    } else {
      // remove trailing slashes from pagePath
      pagePath = pagePath.slice(0, -1)
    }
  }

  // if we removed the trailing slash and have an empty page path
  // we are trying to render the index/home page...
  if (pagePath.length === 0) {
    pagePath = '/index'
  }

  if (import.meta.env.DEV) {
    // always force re-fetch content in dev
    pagePath += `.md?t=${Date.now()}`
  } else {
    // in production, each .md file is built into a .md.js file following
    // the path conversion scheme.
    // /foo/bar.html -> ./foo_bar.md
    if (inBrowser) {
      const base = import.meta.env.BASE_URL
      pagePath =
        sanitizeFileName(
          pagePath.slice(base.length).replace(/\//g, '_') || 'index'
        ) + '.md'
      // client production build needs to account for page hash, which is
      // injected directly in the page's html
      let pageHash = __VP_HASH_MAP__[pagePath.toLowerCase()]

      if (!pageHash) {
        // try looking for an index.md hash
        pagePath = pagePath.replace('.md', '_index.md')
        pageHash = __VP_HASH_MAP__[pagePath.toLowerCase()]
      }

      pagePath = `${base}assets/${pagePath}.${pageHash}.js`
    } else {
      // ssr build uses much simpler name mapping
      pagePath = `./${sanitizeFileName(
        pagePath.slice(1).replace(/\//g, '_')
      )}.md.js`
    }
  }

  return pagePath
}
