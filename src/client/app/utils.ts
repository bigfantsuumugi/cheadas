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
    pagePath += 'index'
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
      const pageHash = __VP_HASH_MAP__[pagePath.toLowerCase()]
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

/**
 * transofrm 'diff remove' node's text to 'delete'
 * @param sibling
 * @returns
 */
export function handleDiffNodes(sibling: HTMLElement) {
  const newSibling = sibling.cloneNode(true) as HTMLElement
  const siblingClass = newSibling.getAttribute('class')

  if (!siblingClass?.includes('has-diff')) return newSibling

  const codeNode = newSibling.getElementsByTagName('code')[0]
  const diffNodes = codeNode.querySelectorAll(
    '.diff.remove'
  ) as NodeListOf<HTMLElement>

  diffNodes.forEach((node) => {
    node.innerText = 'delete'
  })

  return newSibling
}
