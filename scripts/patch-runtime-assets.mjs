import { readFile, writeFile } from 'node:fs/promises'

const indexPath = new URL('../dist/index.html', import.meta.url)
const html = await readFile(indexPath, 'utf8')

const styles = [...html.matchAll(/<link rel="stylesheet" crossorigin href="([^"]+)">/g)].map((match) => match[1])
const scripts = [...html.matchAll(/<script type="module" crossorigin src="([^"]+)"><\/script>/g)].map((match) => match[1])

if (styles.length === 0 && scripts.length === 0) {
  throw new Error('No runtime assets found to patch in dist/index.html')
}

const assetLoader = [
  '    <script>',
  '      (function () {',
  `        const assets = ${JSON.stringify({ styles, scripts })}`,
  "        const baseHref = document.baseURI || window.location.href",
  '',
  '        assets.styles.forEach(function (href) {',
  "          const link = document.createElement('link')",
  "          link.rel = 'stylesheet'",
  "          link.crossOrigin = ''",
  '          link.href = new URL(href, baseHref).href',
  '          document.head.appendChild(link)',
  '        })',
  '',
  '        assets.scripts.forEach(function (src) {',
  "          const script = document.createElement('script')",
  "          script.type = 'module'",
  "          script.crossOrigin = ''",
  '          script.src = new URL(src, baseHref).href',
  '          document.head.appendChild(script)',
  '        })',
  '      })()',
  '    </script>',
].join('\n')

const patchedHtml = html
  .replace(/<script type="module" crossorigin src="[^"]+"><\/script>\n?/g, '')
  .replace(/<link rel="stylesheet" crossorigin href="[^"]+">\n?/g, '')
  .replace('</head>', `${assetLoader}\n  </head>`)

await writeFile(indexPath, patchedHtml)
