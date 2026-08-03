import React, { createContext, useContext } from 'react'
import type { AppLanguage } from './types'

type Messages = Record<string, string>
const messages: Record<AppLanguage, Messages> = {
  'zh-CN': { language: '界面语言', languageHint: '仅影响 MarkDesk 界面，不会翻译你的 Markdown 文档', settings: '设置' },
  en: { language: 'Interface language', languageHint: 'Changes MarkDesk only; your Markdown document is never translated.', settings: 'Settings' },
  ja: { language: '表示言語', languageHint: 'MarkDesk の表示のみを変更します。Markdown 文書は翻訳されません。', settings: '設定' },
  ko: { language: '인터페이스 언어', languageHint: 'MarkDesk 인터페이스만 변경하며 Markdown 문서는 번역하지 않습니다.', settings: '설정' },
  fr: { language: "Langue de l'interface", languageHint: 'Modifie uniquement MarkDesk ; le document Markdown ne sera pas traduit.', settings: 'Paramètres' },
  de: { language: 'Oberflächensprache', languageHint: 'Ändert nur MarkDesk; Ihr Markdown-Dokument wird nicht übersetzt.', settings: 'Einstellungen' },
  es: { language: 'Idioma de la interfaz', languageHint: 'Solo cambia MarkDesk; el documento Markdown no se traduce.', settings: 'Ajustes' },
}
const I18nContext = createContext<{ language: AppLanguage; t: (key: string) => string }>({ language: 'zh-CN', t: (key) => messages['zh-CN'][key] || key })
export const I18nProvider: React.FC<{ language: AppLanguage; children: React.ReactNode }> = ({ language, children }) => <I18nContext.Provider value={{ language, t: (key) => messages[language][key] || messages.en[key] || key }}>{children}</I18nContext.Provider>
export const useI18n = () => useContext(I18nContext)

const uiText: Record<string, Partial<Record<AppLanguage, string>>> = {
  '目录': { en: 'Outline', ja: 'アウトライン', ko: '개요', fr: 'Plan', de: 'Gliederung', es: 'Esquema' },
  '文件': { en: 'Files', ja: 'ファイル', ko: '파일', fr: 'Fichiers', de: 'Dateien', es: 'Archivos' },
  '源码': { en: 'Source', ja: 'ソース', ko: '소스', fr: 'Source', de: 'Quelltext', es: 'Código' },
  '分栏': { en: 'Split', ja: '分割', ko: '분할', fr: 'Scindé', de: 'Geteilt', es: 'Dividido' },
  '可视化': { en: 'Visual', ja: 'ビジュアル', ko: '시각화', fr: 'Visuel', de: 'Visuell', es: 'Visual' },
  '插入': { en: 'Insert', ja: '挿入', ko: '삽입', fr: 'Insérer', de: 'Einfügen', es: 'Insertar' },
  '设置': { en: 'Settings', ja: '設定', ko: '설정', fr: 'Paramètres', de: 'Einstellungen', es: 'Ajustes' },
  '完成': { en: 'Done', ja: '完了', ko: '완료', fr: 'Terminé', de: 'Fertig', es: 'Listo' },
  '通用': { en: 'General', ja: '一般', ko: '일반', fr: 'Général', de: 'Allgemein', es: 'General' },
  '编辑器': { en: 'Editor', ja: 'エディター', ko: '편집기', fr: 'Éditeur', de: 'Editor', es: 'Editor' },
  '预览': { en: 'Preview', ja: 'プレビュー', ko: '미리 보기', fr: 'Aperçu', de: 'Vorschau', es: 'Vista previa' },
  '搜索': { en: 'Search', ja: '検索', ko: '검색', fr: 'Rechercher', de: 'Suchen', es: 'Buscar' },
  '替换': { en: 'Replace', ja: '置換', ko: '바꾸기', fr: 'Remplacer', de: 'Ersetzen', es: 'Reemplazar' },
  '新建文件': { en: 'New file', ja: '新規ファイル', ko: '새 파일', fr: 'Nouveau fichier', de: 'Neue Datei', es: 'Archivo nuevo' },
  '打开文件': { en: 'Open file', ja: 'ファイルを開く', ko: '파일 열기', fr: 'Ouvrir un fichier', de: 'Datei öffnen', es: 'Abrir archivo' },
  '保存': { en: 'Save', ja: '保存', ko: '저장', fr: 'Enregistrer', de: 'Speichern', es: 'Guardar' },
  '另存为': { en: 'Save as', ja: '名前を付けて保存', ko: '다른 이름으로 저장', fr: 'Enregistrer sous', de: 'Speichern unter', es: 'Guardar como' },
  '导出为': { en: 'Export as', ja: 'エクスポート', ko: '내보내기', fr: 'Exporter', de: 'Exportieren', es: 'Exportar como' },
  '最近文件': { en: 'Recent files', ja: '最近のファイル', ko: '최근 파일', fr: 'Fichiers récents', de: 'Zuletzt verwendet', es: 'Archivos recientes' },
  '清空最近文件': { en: 'Clear recent files', ja: '最近のファイルを消去', ko: '최근 파일 지우기', fr: 'Effacer les fichiers récents', de: 'Zuletzt verwendete löschen', es: 'Borrar recientes' },
  '专注模式': { en: 'Focus mode', ja: '集中モード', ko: '집중 모드', fr: 'Mode concentration', de: 'Fokusmodus', es: 'Modo enfoque' },
  '深色模式': { en: 'Dark mode', ja: 'ダークモード', ko: '다크 모드', fr: 'Mode sombre', de: 'Dunkelmodus', es: 'Modo oscuro' },
  '浅色模式': { en: 'Light mode', ja: 'ライトモード', ko: '라이트 모드', fr: 'Mode clair', de: 'Heller Modus', es: 'Modo claro' },
  '字体大小': { en: 'Font size', ja: 'フォントサイズ', ko: '글꼴 크기', fr: 'Taille de police', de: 'Schriftgröße', es: 'Tamaño de fuente' },
  '自动换行': { en: 'Word wrap', ja: '折り返し', ko: '자동 줄바꿈', fr: 'Retour à la ligne', de: 'Zeilenumbruch', es: 'Ajuste de línea' },
  '显示行号': { en: 'Show line numbers', ja: '行番号を表示', ko: '줄 번호 표시', fr: 'Afficher les numéros', de: 'Zeilennummern anzeigen', es: 'Mostrar números de línea' },
  '滚动同步': { en: 'Sync scrolling', ja: 'スクロール同期', ko: '스크롤 동기화', fr: 'Synchroniser le défilement', de: 'Scrollen synchronisieren', es: 'Sincronizar desplazamiento' },
  '默认打开模式': { en: 'Default view', ja: '既定の表示モード', ko: '기본 보기', fr: "Vue par défaut", de: 'Standardansicht', es: 'Vista predeterminada' },
  '启动时默认显示的编辑模式': { en: 'The editing view shown when MarkDesk starts', ja: '起動時に表示する編集モード', ko: 'MarkDesk 시작 시 표시할 편집 보기', fr: 'Vue affichée au démarrage de MarkDesk', de: 'Beim Start angezeigte Bearbeitungsansicht', es: 'Vista mostrada al iniciar MarkDesk' },
  'Tab 宽度': { en: 'Tab width', ja: 'タブ幅', ko: '탭 너비', fr: 'Largeur de tabulation', de: 'Tabulatorbreite', es: 'Ancho de tabulación' },
  '空格': { en: 'spaces', ja: 'スペース', ko: '공백', fr: 'espaces', de: 'Leerzeichen', es: 'espacios' },
  '长行自动折行显示': { en: 'Wrap long lines automatically', ja: '長い行を自動で折り返す', ko: '긴 줄 자동 줄바꿈', fr: 'Retourner automatiquement les longues lignes', de: 'Lange Zeilen automatisch umbrechen', es: 'Ajustar líneas largas automáticamente' },
  '编辑器左侧显示行号': { en: 'Show line numbers beside the editor', ja: 'エディター横に行番号を表示', ko: '편집기 옆에 줄 번호 표시', fr: "Afficher les numéros de ligne dans l'éditeur", de: 'Zeilennummern neben dem Editor anzeigen', es: 'Mostrar números de línea junto al editor' },
  '拼写检查': { en: 'Spell check', ja: 'スペルチェック', ko: '맞춤법 검사', fr: 'Vérification orthographique', de: 'Rechtschreibprüfung', es: 'Corrector ortográfico' },
  '启用浏览器拼写检查': { en: 'Use the browser spell checker', ja: 'ブラウザーのスペルチェックを使用', ko: '브라우저 맞춤법 검사 사용', fr: 'Utiliser le correcteur du navigateur', de: 'Rechtschreibprüfung des Browsers verwenden', es: 'Usar el corrector del navegador' },
  '编辑器与预览区域滚动联动': { en: 'Keep editor and preview scrolling together', ja: 'エディターとプレビューのスクロールを同期', ko: '편집기와 미리 보기 스크롤 동기화', fr: "Synchroniser le défilement de l'éditeur et de l'aperçu", de: 'Editor und Vorschau gemeinsam scrollen', es: 'Sincronizar el desplazamiento del editor y la vista previa' },
  '正文': { en: 'Paragraph', ja: '本文', ko: '본문', fr: 'Paragraphe', de: 'Absatz', es: 'Párrafo' },
}

const protectedSelector = 'textarea, input, pre, code, .markdown-preview, .contenteditable-preview, .preview-content'
const originalText = new WeakMap<Text, string>()
const originalAttributes = new WeakMap<HTMLElement, Partial<Record<'title' | 'aria-label' | 'placeholder', string>>>()
export const localizeApplicationUi = (language: AppLanguage) => {
  const translate = (value: string) => uiText[value]?.[language] || value
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  nodes.forEach((node) => {
    const parent = node.parentElement
    if (!parent || parent.closest(protectedSelector)) return
    const source = originalText.get(node) || node.nodeValue || ''
    if (!originalText.has(node)) originalText.set(node, source)
    const trimmed = source.trim()
    const translated = translate(trimmed)
    if (translated !== trimmed) node.nodeValue = source.replace(trimmed, translated)
  })
  document.querySelectorAll<HTMLElement>('[title], [aria-label], [placeholder]').forEach((el) => {
    if (el.closest(protectedSelector)) return
    ;(['title', 'aria-label', 'placeholder'] as const).forEach((attribute) => {
      const originals = originalAttributes.get(el) || {}
      const value = originals[attribute] || el.getAttribute(attribute)
      if (value) {
        if (!originals[attribute]) { originals[attribute] = value; originalAttributes.set(el, originals) }
        el.setAttribute(attribute, translate(value))
      }
    })
  })
}
