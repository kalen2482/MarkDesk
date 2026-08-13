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

const appCopy: Record<AppLanguage, Record<string, string>> = {
  'zh-CN': { backup: '备份', restoreBackup: '恢复备份', exportAs: '导出为', saveFailed: '保存失败，请检查文件权限或路径。', recentMissing: '无法打开最近文件；该文件可能已移动或删除。', backupRestored: '备份已恢复，请另存为以保存文档。', backupInvalid: '无法恢复备份：文件格式无效。' },
  en: { backup: 'Backup', restoreBackup: 'Restore backup', exportAs: 'Export as', saveFailed: 'Save failed. Check the file path and permissions.', recentMissing: 'Could not open the recent file. It may have been moved or deleted.', backupRestored: 'Backup restored. Save As to keep the document.', backupInvalid: 'Could not restore backup: invalid file format.' },
  ja: { backup: 'バックアップ', restoreBackup: 'バックアップを復元', exportAs: 'エクスポート', saveFailed: '保存に失敗しました。ファイルのパスと権限を確認してください。', recentMissing: '最近使ったファイルを開けません。移動または削除された可能性があります。', backupRestored: 'バックアップを復元しました。別名で保存してください。', backupInvalid: 'バックアップを復元できません。ファイル形式が無効です。' },
  ko: { backup: '백업', restoreBackup: '백업 복원', exportAs: '내보내기', saveFailed: '저장하지 못했습니다. 파일 경로와 권한을 확인하세요.', recentMissing: '최근 파일을 열 수 없습니다. 이동되었거나 삭제되었을 수 있습니다.', backupRestored: '백업을 복원했습니다. 다른 이름으로 저장하세요.', backupInvalid: '백업을 복원할 수 없습니다. 파일 형식이 올바르지 않습니다.' },
  fr: { backup: 'Sauvegarde', restoreBackup: 'Restaurer la sauvegarde', exportAs: 'Exporter', saveFailed: 'Échec de l’enregistrement. Vérifiez le chemin et les autorisations.', recentMissing: 'Impossible d’ouvrir le fichier récent. Il a peut-être été déplacé ou supprimé.', backupRestored: 'Sauvegarde restaurée. Enregistrez sous pour conserver le document.', backupInvalid: 'Impossible de restaurer la sauvegarde : format de fichier invalide.' },
  de: { backup: 'Sicherung', restoreBackup: 'Sicherung wiederherstellen', exportAs: 'Exportieren', saveFailed: 'Speichern fehlgeschlagen. Prüfen Sie Pfad und Berechtigungen.', recentMissing: 'Die zuletzt verwendete Datei konnte nicht geöffnet werden. Sie wurde möglicherweise verschoben oder gelöscht.', backupRestored: 'Sicherung wiederhergestellt. Bitte unter einem neuen Namen speichern.', backupInvalid: 'Sicherung konnte nicht wiederhergestellt werden: ungültiges Dateiformat.' },
  es: { backup: 'Copia de seguridad', restoreBackup: 'Restaurar copia', exportAs: 'Exportar como', saveFailed: 'Error al guardar. Comprueba la ruta y los permisos.', recentMissing: 'No se pudo abrir el archivo reciente. Puede haberse movido o eliminado.', backupRestored: 'Copia restaurada. Usa Guardar como para conservar el documento.', backupInvalid: 'No se pudo restaurar la copia: formato de archivo no válido.' },
}

export const tr = (language: AppLanguage, key: string) => appCopy[language]?.[key] || appCopy.en[key] || key

const toolbarUiText: Record<string, Partial<Record<AppLanguage, string>>> = {
  '撤销': { en: 'Undo', ja: '元に戻す', ko: '실행 취소', fr: 'Annuler', de: 'Rückgängig', es: 'Deshacer' },
  '重做': { en: 'Redo', ja: 'やり直す', ko: '다시 실행', fr: 'Rétablir', de: 'Wiederholen', es: 'Rehacer' },
  '加粗': { en: 'Bold', ja: '太字', ko: '굵게', fr: 'Gras', de: 'Fett', es: 'Negrita' },
  '斜体': { en: 'Italic', ja: '斜体', ko: '기울임꼴', fr: 'Italique', de: 'Kursiv', es: 'Cursiva' },
  '删除线': { en: 'Strikethrough', ja: '取り消し線', ko: '취소선', fr: 'Barré', de: 'Durchgestrichen', es: 'Tachado' },
  '下划线': { en: 'Underline', ja: '下線', ko: '밑줄', fr: 'Souligné', de: 'Unterstrichen', es: 'Subrayado' },
  '行内代码': { en: 'Inline code', ja: 'インラインコード', ko: '인라인 코드', fr: 'Code en ligne', de: 'Inline-Code', es: 'Código en línea' },
  '无序列表': { en: 'Bulleted list', ja: '箇条書き', ko: '글머리 기호 목록', fr: 'Liste à puces', de: 'Aufzählung', es: 'Lista con viñetas' },
  '有序列表': { en: 'Ordered list', ja: '番号付きリスト', ko: '번호 매기기 목록', fr: 'Liste ordonnée', de: 'Nummerierte Liste', es: 'Lista ordenada' },
  '任务列表': { en: 'Task list', ja: 'タスクリスト', ko: '작업 목록', fr: 'Liste de tâches', de: 'Aufgabenliste', es: 'Lista de tareas' },
  '增加缩进': { en: 'Increase indent', ja: 'インデントを増やす', ko: '들여쓰기 늘리기', fr: 'Augmenter le retrait', de: 'Einzug vergrößern', es: 'Aumentar sangría' },
  '减少缩进': { en: 'Decrease indent', ja: 'インデントを減らす', ko: '들여쓰기 줄이기', fr: 'Réduire le retrait', de: 'Einzug verkleinern', es: 'Reducir sangría' },
  '引用块': { en: 'Quote block', ja: '引用', ko: '인용 블록', fr: 'Citation', de: 'Zitatblock', es: 'Cita' },
  '高亮标记': { en: 'Highlight', ja: 'ハイライト', ko: '강조 표시', fr: 'Surlignage', de: 'Hervorheben', es: 'Resaltar' },
  '字体颜色': { en: 'Text color', ja: '文字色', ko: '글자 색', fr: 'Couleur du texte', de: 'Textfarbe', es: 'Color del texto' },
  '背景颜色': { en: 'Background color', ja: '背景色', ko: '배경색', fr: 'Couleur d’arrière-plan', de: 'Hintergrundfarbe', es: 'Color de fondo' },
  '字号': { en: 'Font size', ja: '文字サイズ', ko: '글꼴 크기', fr: 'Taille de police', de: 'Schriftgröße', es: 'Tamaño de fuente' },
  '超链接': { en: 'Link', ja: 'リンク', ko: '링크', fr: 'Lien', de: 'Link', es: 'Enlace' },
  '图片': { en: 'Image', ja: '画像', ko: '이미지', fr: 'Image', de: 'Bild', es: 'Imagen' },
  '表格': { en: 'Table', ja: '表', ko: '표', fr: 'Tableau', de: 'Tabelle', es: 'Tabla' },
  '代码块': { en: 'Code block', ja: 'コードブロック', ko: '코드 블록', fr: 'Bloc de code', de: 'Codeblock', es: 'Bloque de código' },
  '分隔线': { en: 'Divider', ja: '区切り線', ko: '구분선', fr: 'Séparateur', de: 'Trennlinie', es: 'Separador' },
  '公式': { en: 'Formula', ja: '数式', ko: '수식', fr: 'Formule', de: 'Formel', es: 'Fórmula' },
  'Mermaid 图表': { en: 'Mermaid diagram', ja: 'Mermaid 図', ko: 'Mermaid 다이어그램', fr: 'Diagramme Mermaid', de: 'Mermaid-Diagramm', es: 'Diagrama Mermaid' },
  '提示块': { en: 'Callout', ja: 'コールアウト', ko: '콜아웃', fr: 'Encadré', de: 'Hinweisblock', es: 'Aviso' },
  '脚注': { en: 'Footnote', ja: '脚注', ko: '각주', fr: 'Note de bas de page', de: 'Fußnote', es: 'Nota al pie' },
  '目录': { en: 'Table of contents', ja: '目次', ko: '목차', fr: 'Table des matières', de: 'Inhaltsverzeichnis', es: 'Tabla de contenido' },
  '格式刷': { en: 'Format painter', ja: '書式のコピー', ko: '서식 복사', fr: 'Reproduire la mise en forme', de: 'Format übertragen', es: 'Copiar formato' },
  '快捷键': { en: 'Keyboard shortcuts', ja: 'キーボードショートカット', ko: '키보드 단축키', fr: 'Raccourcis clavier', de: 'Tastenkürzel', es: 'Atajos de teclado' },
  '快捷键帮助': { en: 'Keyboard shortcut help', ja: 'ショートカットヘルプ', ko: '단축키 도움말', fr: 'Aide des raccourcis', de: 'Tastenkürzel-Hilfe', es: 'Ayuda de atajos' },
  '关于': { en: 'About', ja: 'このアプリについて', ko: '정보', fr: 'À propos', de: 'Über', es: 'Acerca de' },
  '更多工具': { en: 'More tools', ja: 'その他のツール', ko: '더 많은 도구', fr: 'Plus d’outils', de: 'Weitere Werkzeuge', es: 'Más herramientas' },
  '排版': { en: 'Typography', ja: '書式', ko: '서식', fr: 'Mise en forme', de: 'Formatierung', es: 'Formato' },
  '插入内容': { en: 'Insert content', ja: 'コンテンツを挿入', ko: '콘텐츠 삽입', fr: 'Insérer du contenu', de: 'Inhalt einfügen', es: 'Insertar contenido' },
  '高级格式': { en: 'Advanced formatting', ja: '高度な書式', ko: '고급 서식', fr: 'Mise en forme avancée', de: 'Erweiterte Formatierung', es: 'Formato avanzado' },
  '工具': { en: 'Tools', ja: 'ツール', ko: '도구', fr: 'Outils', de: 'Werkzeuge', es: 'Herramientas' },
  '更多': { en: 'More', ja: 'その他', ko: '더 보기', fr: 'Plus', de: 'Mehr', es: 'Más' },
  '标题快捷': { en: 'Heading shortcuts', ja: '見出しショートカット', ko: '제목 단축키', fr: 'Raccourcis de titres', de: 'Überschriften', es: 'Atajos de títulos' },
  '正文': { en: 'Paragraph', ja: '本文', ko: '본문', fr: 'Paragraphe', de: 'Absatz', es: 'Párrafo' },
  ...Object.fromEntries(Array.from({ length: 6 }, (_, index) => {
    const level = index + 1
    return [`标题 ${level}`, { en: `Heading ${level}`, ja: `見出し ${level}`, ko: `제목 ${level}`, fr: `Titre ${level}`, de: `Überschrift ${level}`, es: `Título ${level}` }]
  })),
}

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

export const translateUiText = (language: AppLanguage, value: string): string =>
  toolbarUiText[value]?.[language] || uiText[value]?.[language] || value

const protectedSelector = 'textarea, input, pre, code, .markdown-preview, .contenteditable-preview, .preview-content'
const originalText = new WeakMap<Text, string>()
const originalAttributes = new WeakMap<HTMLElement, Partial<Record<'title' | 'aria-label' | 'placeholder', string>>>()
export const localizeApplicationUi = (language: AppLanguage, root: Node = document.body) => {
  if (root instanceof Element && root.closest(protectedSelector)) return
  const translate = (value: string) => translateUiText(language, value)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  if (root.nodeType === Node.TEXT_NODE) nodes.push(root as Text)
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
  const elements: HTMLElement[] = []
  if (root instanceof HTMLElement && root.matches('[title], [aria-label], [placeholder]')) elements.push(root)
  if (root instanceof Element || root instanceof Document || root instanceof DocumentFragment) {
    elements.push(...Array.from(root.querySelectorAll<HTMLElement>('[title], [aria-label], [placeholder]')))
  }
  elements.forEach((el) => {
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
