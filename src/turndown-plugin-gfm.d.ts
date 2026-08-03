declare module 'turndown-plugin-gfm' {
  export function gfm(turndownService: import('turndown')): void
  export function tables(turndownService: import('turndown')): void
  export function strikethrough(turndownService: import('turndown')): void
  export function taskListItems(turndownService: import('turndown')): void
}
