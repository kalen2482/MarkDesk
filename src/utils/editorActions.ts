// Editor text manipulation utilities

export function wrapSelection(text: string, start: number, end: number, prefix: string, suffix: string = prefix): { text: string; start: number; end: number } {
  const selected = text.slice(start, end)
  const newText = text.slice(0, start) + prefix + selected + suffix + text.slice(end)
  return {
    text: newText,
    start: start + prefix.length,
    end: end + prefix.length,
  }
}

export function toggleWrapSelection(text: string, start: number, end: number, prefix: string, suffix: string = prefix): { text: string; start: number; end: number } {
  let actualEnd = end
  while (actualEnd > start && text[actualEnd - 1] === '\n') {
    actualEnd--
  }
  let actualStart = start
  while (actualStart < actualEnd && text[actualStart] === '\n') {
    actualStart++
  }

  const selected = text.slice(actualStart, actualEnd)
  const before = text.slice(0, actualStart)
  const after = text.slice(actualEnd)

  if (before.endsWith(prefix) && after.startsWith(suffix)) {
    const newText = before.slice(0, -prefix.length) + selected + after.slice(suffix.length)
    return {
      text: newText,
      start: actualStart - prefix.length,
      end: actualEnd - prefix.length,
    }
  }

  if (selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length >= prefix.length + suffix.length) {
    const inner = selected.slice(prefix.length, selected.length - suffix.length)
    const newText = before + inner + after
    return {
      text: newText,
      start: actualStart,
      end: actualStart + inner.length,
    }
  }

  const newText = before + prefix + selected + suffix + after
  return {
    text: newText,
    start: actualStart + prefix.length,
    end: actualEnd + prefix.length,
  }
}

export function insertAtCursor(text: string, pos: number, insertion: string): { text: string; start: number; end: number } {
  const newText = text.slice(0, pos) + insertion + text.slice(pos)
  return {
    text: newText,
    start: pos,
    end: pos + insertion.length,
  }
}

export function insertLinePrefix(text: string, start: number, end: number, prefix: string): { text: string; start: number; end: number } {
  const lines = text.split('\n')
  const startLine = text.slice(0, start).split('\n').length - 1
  const endLine = text.slice(0, end).split('\n').length - 1

  let charOffset = 0
  for (let i = startLine; i <= endLine; i++) {
    lines[i] = prefix + lines[i]
    charOffset += prefix.length
  }

  return {
    text: lines.join('\n'),
    start: start + prefix.length,
    end: end + charOffset,
  }
}

export function removeLinePrefix(text: string, start: number, end: number, prefix: string): { text: string; start: number; end: number } {
  const lines = text.split('\n')
  const startLine = text.slice(0, start).split('\n').length - 1
  const endLine = text.slice(0, end).split('\n').length - 1

  let charOffset = 0
  for (let i = startLine; i <= endLine; i++) {
    if (lines[i].startsWith(prefix)) {
      lines[i] = lines[i].slice(prefix.length)
      charOffset -= prefix.length
    }
  }

  return {
    text: lines.join('\n'),
    start: Math.max(0, start + charOffset),
    end: Math.max(0, end + charOffset),
  }
}

export function setHeadingLevel(text: string, start: number, end: number, level: number): { text: string; start: number; end: number } {
  const lines = text.split('\n')
  const startLine = text.slice(0, start).split('\n').length - 1
  const endLine = text.slice(0, end).split('\n').length - 1

  let newStart = start
  let newEnd = end
  let charDiff = 0

  for (let i = startLine; i <= endLine; i++) {
    const oldLine = lines[i]
    const stripped = oldLine.replace(/^#{1,6}\s+/, '')
    const oldPrefix = oldLine.slice(0, oldLine.length - stripped.length)
    const newPrefix = level === 0 ? '' : '#'.repeat(level) + ' '
    lines[i] = newPrefix + stripped

    if (i === startLine) {
      newStart = start - oldPrefix.length + newPrefix.length
    }
    charDiff += newPrefix.length - oldPrefix.length
  }

  newEnd = end + charDiff

  return {
    text: lines.join('\n'),
    start: newStart,
    end: newEnd,
  }
}

export function insertTable(rows: number, cols: number): string {
  const header = '| ' + Array(cols).fill('Header').map((h, i) => `${h} ${i + 1}`).join(' | ') + ' |'
  const separator = '| ' + Array(cols).fill('---').join(' | ') + ' |'
  const body = Array(rows - 1).fill(null).map((_, r) =>
    '| ' + Array(cols).fill(`Cell ${r + 1}`).join(' | ') + ' |'
  ).join('\n')
  return `${header}\n${separator}\n${body}\n`
}

export function insertCodeBlock(language: string = ''): string {
  return `\n\`\`\`${language}\n\n\`\`\`\n`
}

export function insertMermaidDiagram(type: string = 'graph TD'): string {
  return `\n\`\`\`mermaid\n${type}\n    A[开始] --> B[结束]\n\`\`\`\n`
}

export function insertCallout(type: string = 'INFO'): string {
  return `\n> [!${type}]\n> 请输入提示内容。\n`
}

export function insertFootnote(): string {
  return `\n这里有一个脚注引用[^1]。\n\n[^1]: 这是脚注的内容。\n`
}

export function insertFormula(): string {
  return `\n$$\nE = mc^2\n$$\n`
}

export function insertInlineFormula(): string {
  return `$E = mc^2$`
}

export function insertToc(): string {
  return `\n[TOC]\n`
}

export function applyTextColor(text: string, start: number, end: number, color: string): { text: string; start: number; end: number } {
  const selected = text.slice(start, end) || '彩色文字'
  const insertion = `<span style="color: ${color}">${selected}</span>`
  const newText = text.slice(0, start) + insertion + text.slice(end)
  return {
    text: newText,
    start: start + insertion.length,
    end: start + insertion.length,
  }
}

export function applyBgColor(text: string, start: number, end: number, color: string): { text: string; start: number; end: number } {
  const selected = text.slice(start, end) || '背景色文字'
  const insertion = `<span style="background-color: ${color}">${selected}</span>`
  const newText = text.slice(0, start) + insertion + text.slice(end)
  return {
    text: newText,
    start: start + insertion.length,
    end: start + insertion.length,
  }
}
