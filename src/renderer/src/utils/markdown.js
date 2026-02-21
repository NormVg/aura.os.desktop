/**
 * Shared markdown renderer with syntax highlighting.
 * Uses `marked` for parsing and `highlight.js` for code blocks.
 */
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import mermaid from 'mermaid'

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#8B7CFF',        // brighter node fill
    primaryTextColor: '#FFFFFF',    // max contrast text
    primaryBorderColor: '#A89CFF',  // clearer borders
    lineColor: '#E6E1FF',           // brighter connectors

    secondaryColor: '#111114',      // deeper contrast layer
    tertiaryColor: '#0B0B0E',       // darkest base

    background: '#0B0B0E',          // canvas background
    mainBkg: '#15151A',             // node background
    secondBkg: '#101014',

    textColor: '#F5F5FF',           // global text
    fontSize: '14px'
  }
})

// Register commonly used languages
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import markdown from 'highlight.js/lib/languages/markdown'
import yaml from 'highlight.js/lib/languages/yaml'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import rust from 'highlight.js/lib/languages/rust'
import go from 'highlight.js/lib/languages/go'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c', cpp)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('go', go)

// Configure marked with highlight.js and mermaid
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight(code, lang) {
    // Handle mermaid diagrams
    if (lang === 'mermaid') {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
      // Store the code for later rendering
      const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<div class="mermaid-diagram" data-mermaid-code="${escapedCode}" data-mermaid-id="${id}">${code}</div>`
    }

    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (_) {
        /* fall through */
      }
    }
    try {
      return hljs.highlightAuto(code).value
    } catch (_) {
      /* fall through */
    }
    return code
  }
})

/**
 * Render markdown string to HTML.
 * @param {string} text - Markdown text
 * @returns {string} Sanitized HTML
 */
export function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
}
