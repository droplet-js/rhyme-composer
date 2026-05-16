import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { BookPreviewModal } from './components/BookPreviewModal'
import { BookPageCanvas } from './components/BookPageCanvas'
import { FONT_PRESETS, defaultFontPresetId } from './constants/childFonts'
import { pagePreviewHeightPx } from './constants/paper'
import { loadBookAppState, saveBookAppState } from './lib/bookPersistence'
import {
  alignBlockRelativeToBlock,
  applyLayoutAlign,
  resolvePairReferenceBlock,
  type BlockPairAlignKind,
  type LayoutAlignKind,
} from './lib/blockLayout'
import { exportBookDataZip, importBookDataZip, suggestedBundleZipName } from './lib/bookDataBundle'
import { exportSongbookPdf, type PdfLayoutMode } from './lib/exportSongbookPdf'
import type {
  PageBackground,
  SongBook,
  SongPage,
  TextBlock,
} from './types/book'
import './App.css'

const previewHeight = pagePreviewHeightPx()

function newTextBlock(overrides?: Partial<TextBlock>): TextBlock {
  return {
    id: crypto.randomUUID(),
    text: '',
    xPct: 10,
    yPct: 12,
    widthPct: 80,
    fontSize: 17,
    lineHeight: 1.65,
    color: '#2c2416',
    textAlign: 'left',
    fontWeight: 400,
    fontPresetId: defaultFontPresetId(),
    ...overrides,
  }
}

function newPage(): SongPage {
  return {
    id: crypto.randomUUID(),
    pageName: '',
    background: {
      color: '#ffffff',
      imageFit: 'cover',
    },
    blocks: [],
    showPageNumber: false,
    pageNumberDisplay: '',
  }
}

/** Deep copy page with new page id and new ids for every text block. */
function cloneSongPage(source: SongPage): SongPage {
  return {
    id: crypto.randomUUID(),
    pageName: source.pageName,
    background: { ...source.background },
    blocks: source.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
    showPageNumber: source.showPageNumber,
    pageNumberDisplay: source.pageNumberDisplay,
  }
}

const initialBook: SongBook = {
  title: '儿歌集',
  pages: [
    {
      id: crypto.randomUUID(),
      pageName: '小星星',
      background: { color: '#ffffff', imageFit: 'cover' },
      showPageNumber: false,
      pageNumberDisplay: '',
      blocks: [
        newTextBlock({
          text: '小星星',
          yPct: 8,
          fontSize: 22,
          fontWeight: 700,
          textAlign: 'center',
          widthPct: 84,
          xPct: 8,
          fontPresetId: 'zcool-kuaile',
        }),
        newTextBlock({
          text:
            '一闪一闪亮晶晶\n满天都是小星星\n挂在天空放光明\n好像许多小眼睛',
          yPct: 28,
          fontSize: 16,
          xPct: 10,
          widthPct: 80,
          fontPresetId: 'songti',
        }),
      ],
    },
    newPage(),
  ],
}

function sidebarPageTitle(page: SongPage, index: number): string {
  const n = page.pageName.trim()
  if (n.length > 0) return n.length > 18 ? `${n.slice(0, 18)}…` : n
  return `第 ${index + 1} 页`
}

type AppState = {
  book: SongBook
  selectedIndex: number
}

const initialState: AppState = {
  book: initialBook,
  selectedIndex: 0,
}

type Action =
  | { type: 'setBookTitle'; title: string }
  | { type: 'setPageName'; index: number; pageName: string }
  | {
      type: 'setPageNumberDisplay'
      index: number
      pageNumberDisplay: string
    }
  | { type: 'setPageBackground'; index: number; patch: Partial<PageBackground> }
  | { type: 'setShowPageNumber'; index: number; show: boolean }
  | { type: 'addTextBlock'; index: number; block: TextBlock }
  | { type: 'removeTextBlock'; index: number; blockId: string }
  | {
      type: 'updateTextBlock'
      index: number
      blockId: string
      patch: Partial<TextBlock>
    }
  | { type: 'addPage' }
  | { type: 'duplicatePage'; index: number }
  | { type: 'removePage'; index: number }
  | { type: 'movePage'; from: number; to: number }
  | { type: 'select'; index: number }
  | { type: 'importData'; book: SongBook; selectedIndex: number }

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setBookTitle':
      return { ...state, book: { ...state.book, title: action.title } }
    case 'setPageName': {
      const pages = state.book.pages.map((p, i) =>
        i === action.index ? { ...p, pageName: action.pageName } : p,
      )
      return { ...state, book: { ...state.book, pages } }
    }
    case 'setPageNumberDisplay': {
      const pages = state.book.pages.map((p, i) =>
        i === action.index
          ? { ...p, pageNumberDisplay: action.pageNumberDisplay }
          : p,
      )
      return { ...state, book: { ...state.book, pages } }
    }
    case 'setPageBackground': {
      const pages = state.book.pages.map((p, i) =>
        i === action.index
          ? {
              ...p,
              background: { ...p.background, ...action.patch },
            }
          : p,
      )
      return { ...state, book: { ...state.book, pages } }
    }
    case 'setShowPageNumber': {
      const pages = state.book.pages.map((p, i) =>
        i === action.index ? { ...p, showPageNumber: action.show } : p,
      )
      return { ...state, book: { ...state.book, pages } }
    }
    case 'addTextBlock': {
      const pages = state.book.pages.map((p, i) =>
        i === action.index
          ? { ...p, blocks: [...p.blocks, action.block] }
          : p,
      )
      return { ...state, book: { ...state.book, pages } }
    }
    case 'removeTextBlock': {
      const pages = state.book.pages.map((p, i) => {
        if (i !== action.index) return p
        return {
          ...p,
          blocks: p.blocks.filter((b) => b.id !== action.blockId),
        }
      })
      return { ...state, book: { ...state.book, pages } }
    }
    case 'updateTextBlock': {
      const pages = state.book.pages.map((p, i) =>
        i === action.index
          ? {
              ...p,
              blocks: p.blocks.map((b) =>
                b.id === action.blockId ? { ...b, ...action.patch } : b,
              ),
            }
          : p,
      )
      return { ...state, book: { ...state.book, pages } }
    }
    case 'addPage': {
      const p = newPage()
      const pages = [...state.book.pages, p]
      return {
        book: { ...state.book, pages },
        selectedIndex: pages.length - 1,
      }
    }
    case 'duplicatePage': {
      const i = action.index
      const len = state.book.pages.length
      if (i < 0 || i >= len) return state
      const copy = cloneSongPage(state.book.pages[i])
      const pages = [...state.book.pages]
      pages.splice(i + 1, 0, copy)
      let selectedIndex = state.selectedIndex
      if (selectedIndex === i) {
        selectedIndex = i + 1
      } else if (selectedIndex > i) {
        selectedIndex++
      }
      return { book: { ...state.book, pages }, selectedIndex }
    }
    case 'removePage': {
      const i = action.index
      const filtered = state.book.pages.filter((_, idx) => idx !== i)
      const pages = filtered.length ? filtered : [newPage()]
      const nextLen = pages.length
      let selectedIndex = state.selectedIndex
      if (state.book.pages.length === 1) selectedIndex = 0
      else if (i < state.selectedIndex) selectedIndex = state.selectedIndex - 1
      else if (i === state.selectedIndex)
        selectedIndex = Math.min(state.selectedIndex, nextLen - 1)
      return { book: { ...state.book, pages }, selectedIndex }
    }
    case 'movePage': {
      const { from, to } = action
      const len = state.book.pages.length
      if (
        from < 0 ||
        from >= len ||
        to < 0 ||
        to >= len ||
        from === to
      ) {
        return state
      }
      const pages = [...state.book.pages]
      const [item] = pages.splice(from, 1)
      pages.splice(to, 0, item)
      let selectedIndex = state.selectedIndex
      if (selectedIndex === from) {
        selectedIndex = to
      } else if (from < to) {
        if (selectedIndex > from && selectedIndex <= to) selectedIndex--
      } else {
        if (selectedIndex >= to && selectedIndex < from) selectedIndex++
      }
      return { book: { ...state.book, pages }, selectedIndex }
    }
    case 'select':
      return { ...state, selectedIndex: action.index }
    case 'importData': {
      const pages =
        action.book.pages.length > 0 ? action.book.pages : [newPage()]
      const book = { ...action.book, pages }
      const selectedIndex = Math.max(
        0,
        Math.min(Math.trunc(action.selectedIndex), book.pages.length - 1),
      )
      return { book, selectedIndex }
    }
    default:
      return state
  }
}

function App() {
  const [{ book, selectedIndex }, dispatch] = useReducer(
    appReducer,
    initialState,
    loadBookAppState,
  )
  const [exporting, setExporting] = useState(false)
  const [bookPreviewOpen, setBookPreviewOpen] = useState(false)
  const [pdfLayoutMode, setPdfLayoutMode] = useState<PdfLayoutMode>('booklet')
  const [bundleBusy, setBundleBusy] = useState(false)
  const [bundleFeedback, setBundleFeedback] = useState<{
    kind: 'ok' | 'err'
    text: string
  } | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [pairRefBlockId, setPairRefBlockId] = useState<string | null>(null)
  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const bgFileRef = useRef<HTMLInputElement>(null)
  const bundleImportRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      saveBookAppState({ book, selectedIndex })
    }, 480)
    return () => window.clearTimeout(id)
  }, [book, selectedIndex])

  useEffect(() => {
    const flush = () => saveBookAppState({ book, selectedIndex })
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [book, selectedIndex])

  const setPageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) pageRefs.current.set(id, el)
    else pageRefs.current.delete(id)
  }, [])

  const selectedPage = book.pages[selectedIndex] ?? book.pages[0]
  const selectedBlock =
    selectedPage?.blocks.find((b) => b.id === selectedBlockId) ?? null

  const pairReferenceBlock = useMemo(() => {
    const page = book.pages[selectedIndex]
    if (!page || !selectedBlockId) return null
    return resolvePairReferenceBlock(
      page.blocks,
      selectedBlockId,
      pairRefBlockId,
    )
  }, [book.pages, selectedIndex, selectedBlockId, pairRefBlockId])

  const pairOtherBlocks = useMemo(() => {
    const page = book.pages[selectedIndex]
    if (!page || !selectedBlockId) return []
    return page.blocks.filter((b) => b.id !== selectedBlockId)
  }, [book.pages, selectedIndex, selectedBlockId])

  const handleExport = useCallback(async () => {
    const elements = book.pages.map((p) => pageRefs.current.get(p.id) ?? null)
    if (!elements.some((e) => e != null)) return
    setExporting(true)
    try {
      await exportSongbookPdf(book, elements, { mode: pdfLayoutMode })
    } finally {
      setExporting(false)
    }
  }, [book, pdfLayoutMode])

  const onBgImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f?.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      dispatch({
        type: 'setPageBackground',
        index: selectedIndex,
        patch: { imageDataUrl: String(reader.result) },
      })
    }
    reader.readAsDataURL(f)
  }

  const patchBlock = (patch: Partial<TextBlock>) => {
    if (!selectedBlock) return
    dispatch({
      type: 'updateTextBlock',
      index: selectedIndex,
      blockId: selectedBlock.id,
      patch,
    })
  }

  const applyBlockLayout = (kind: LayoutAlignKind) => {
    if (!selectedBlock) return
    const next = applyLayoutAlign(selectedBlock, kind, previewHeight)
    patchBlock(next)
  }

  const applyPairAlign = (kind: BlockPairAlignKind) => {
    if (!selectedBlock || !pairReferenceBlock) return
    const next = alignBlockRelativeToBlock(
      selectedBlock,
      pairReferenceBlock,
      kind,
      previewHeight,
    )
    patchBlock(next)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand-mark" aria-hidden />
          <div>
            <h1 className="app-title">儿歌创编</h1>
            <p className="app-sub">
              RhymeComposer · 自定义背景与文字位置 · 半张 A4 · 横版 PDF 双页合一
            </p>
          </div>
        </div>
        <div className="app-header-actions">
          <label className="field-inline">
            <span className="field-label">书名</span>
            <input
              className="input"
              value={book.title}
              onChange={(e) =>
                dispatch({ type: 'setBookTitle', title: e.target.value })
              }
              placeholder="给书起个名字"
            />
          </label>
          <button
            type="button"
            className="btn ghost"
            disabled={bundleBusy}
            onClick={async () => {
              setBundleFeedback(null)
              setBundleBusy(true)
              try {
                const blob = await exportBookDataZip(book, selectedIndex)
                const a = document.createElement('a')
                const url = URL.createObjectURL(blob)
                a.href = url
                a.download = suggestedBundleZipName(book.title)
                a.click()
                URL.revokeObjectURL(url)
                setBundleFeedback({
                  kind: 'ok',
                  text: '已导出 ZIP（含 book.json 与背景图）',
                })
              } catch (e) {
                setBundleFeedback({
                  kind: 'err',
                  text:
                    e instanceof Error ? e.message : '导出失败',
                })
              } finally {
                setBundleBusy(false)
              }
            }}
          >
            导出数据
          </button>
          <input
            ref={bundleImportRef}
            type="file"
            accept=".zip,application/zip"
            className="visually-hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              if (
                !window.confirm(
                  '导入将替换当前书籍内容（可与本地已保存数据不同），确定继续？',
                )
              ) {
                return
              }
              setBundleFeedback(null)
              setBundleBusy(true)
              try {
                const { book: nb, selectedIndex: si } =
                  await importBookDataZip(f)
                dispatch({ type: 'importData', book: nb, selectedIndex: si })
                setSelectedBlockId(null)
                setPairRefBlockId(null)
                setBundleFeedback({ kind: 'ok', text: '导入成功' })
              } catch (err) {
                setBundleFeedback({
                  kind: 'err',
                  text:
                    err instanceof Error ? err.message : '导入失败',
                })
              } finally {
                setBundleBusy(false)
              }
            }}
          />
          <button
            type="button"
            className="btn ghost"
            disabled={bundleBusy}
            onClick={() => bundleImportRef.current?.click()}
          >
            导入数据
          </button>            
          <label className="field-inline tight pdf-layout-field">
            <span className="field-label" title="预览与导出 PDF 共用此选项">
              PDF 版式
            </span>
            <select
              className="input select"
              value={pdfLayoutMode}
              onChange={(e) =>
                setPdfLayoutMode(e.target.value as PdfLayoutMode)
              }
            >
              <option value="booklet">对折装订（骑马钉）</option>
              <option value="fullPage">普通 PDF（一页一纸）</option>
            </select>
          </label>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setBookPreviewOpen(true)}
            disabled={book.pages.length === 0}
          >
            打印预览
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleExport}
            disabled={exporting || book.pages.length === 0}
          >
            {exporting ? '正在导出…' : '导出 PDF'}
          </button>
          {bundleFeedback && (
            <span
              className={`bundle-feedback${bundleFeedback.kind === 'err' ? ' err' : ''}`}
              role="status"
            >
              {bundleFeedback.text}
            </span>
          )}
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar" aria-label="页面列表">
          <div className="sidebar-head">
            <span>页面</span>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => {
                dispatch({ type: 'addPage' })
                setSelectedBlockId(null)
              }}
            >
              + 添加
            </button>
          </div>
          <ol className="page-list">
            {book.pages.map((p, i) => (
              <li key={p.id}>
                <div className="page-reorder" aria-label="调整页面顺序">
                  <button
                    type="button"
                    className="btn icon reorder"
                    title="上移"
                    disabled={i === 0}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      dispatch({ type: 'movePage', from: i, to: i - 1 })
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn icon reorder"
                    title="下移"
                    disabled={i === book.pages.length - 1}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      dispatch({ type: 'movePage', from: i, to: i + 1 })
                    }}
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  className={`page-tab${i === selectedIndex ? ' active' : ''}`}
                  onClick={() => {
                    dispatch({ type: 'select', index: i })
                    setSelectedBlockId(null)
                  }}
                >
                  <span className="page-tab-num">{i + 1}</span>
                  <span className="page-tab-title">{sidebarPageTitle(p, i)}</span>
                </button>
                <button
                  type="button"
                  className="btn icon"
                  title="复制本页（插入到下一页）"
                  aria-label="复制本页"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    dispatch({ type: 'duplicatePage', index: i })
                    setSelectedBlockId(null)
                  }}
                >
                  ⧉
                </button>
                {book.pages.length > 1 && (
                  <button
                    type="button"
                    className="btn icon danger"
                    title="删除本页"
                    onClick={() => {
                      dispatch({ type: 'removePage', index: i })
                      setSelectedBlockId(null)
                    }}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ol>
          <p className="sidebar-hint">
            用 ↑↓ 调整顺序；⧉ 复制当前页。顶栏选择 PDF
            版式后，「打印预览」与导出 PDF 一致（骑马钉 或 逐页 A4）。
          </p>
        </aside>

        <main className="editor">
          {selectedPage && (
            <>
              <section className="editor-form" aria-label="页面与样式">
                <label className="field">
                  <span className="field-label">页面名称（仅用于侧栏区分，不印在书上）</span>
                  <input
                    className="input"
                    value={selectedPage.pageName}
                    onChange={(e) =>
                      dispatch({
                        type: 'setPageName',
                        index: selectedIndex,
                        pageName: e.target.value,
                      })
                    }
                    placeholder={`第 ${selectedIndex + 1} 页`}
                  />
                </label>

                <h2 className="section-title">页面背景</h2>
                <div className="field-row">
                  <label className="field compact">
                    <span className="field-label">底色</span>
                    <input
                      type="color"
                      className="input color"
                      value={
                        /^#[0-9a-f]{6}$/i.test(selectedPage.background.color)
                          ? selectedPage.background.color
                          : '#ffffff'
                      }
                      onChange={(e) =>
                        dispatch({
                          type: 'setPageBackground',
                          index: selectedIndex,
                          patch: { color: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="field compact grow">
                    <span className="field-label">十六进制（可选）</span>
                    <input
                      className="input"
                      value={selectedPage.background.color}
                      onChange={(e) =>
                        dispatch({
                          type: 'setPageBackground',
                          index: selectedIndex,
                          patch: { color: e.target.value },
                        })
                      }
                      placeholder="#ffffff"
                    />
                  </label>
                </div>
                <div className="field-row wrap">
                  <input
                    ref={bgFileRef}
                    type="file"
                    accept="image/*"
                    className="visually-hidden"
                    onChange={onBgImageFile}
                  />
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => bgFileRef.current?.click()}
                  >
                    上传背景图
                  </button>
                  {selectedPage.background.imageDataUrl && (
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() =>
                        dispatch({
                          type: 'setPageBackground',
                          index: selectedIndex,
                          patch: { imageDataUrl: undefined },
                        })
                      }
                    >
                      清除图片
                    </button>
                  )}
                  <label className="field-inline tight">
                    <span className="field-label">铺满方式</span>
                    <select
                      className="input select"
                      value={selectedPage.background.imageFit}
                      onChange={(e) =>
                        dispatch({
                          type: 'setPageBackground',
                          index: selectedIndex,
                          patch: {
                            imageFit: e.target.value as PageBackground['imageFit'],
                          },
                        })
                      }
                    >
                      <option value="cover">裁切铺满</option>
                      <option value="contain">完整显示</option>
                      <option value="center">原始尺寸居中</option>
                    </select>
                  </label>
                </div>
                <label className="field check">
                  <input
                    type="checkbox"
                    checked={selectedPage.showPageNumber}
                    onChange={(e) =>
                      dispatch({
                        type: 'setShowPageNumber',
                        index: selectedIndex,
                        show: e.target.checked,
                      })
                    }
                  />
                  <span>在画布底部显示页码</span>
                </label>
                <label className="field">
                  <span className="field-label">
                    页码文字（任意内容，与页面顺序无关）
                  </span>
                  <input
                    className="input"
                    value={selectedPage.pageNumberDisplay}
                    onChange={(e) =>
                      dispatch({
                        type: 'setPageNumberDisplay',
                        index: selectedIndex,
                        pageNumberDisplay: e.target.value,
                      })
                    }
                    placeholder="例如：1、②、Ⅲ、附录 A…"
                  />
                </label>
                <p className="hint-muted">
                  开启「显示页码」且上面非空时才绘制；可填数字、罗马数字或说明文字。
                </p>

                <h2 className="section-title">文字块</h2>
                <div className="block-chips">
                  {selectedPage.blocks.map((b, i) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`block-chip${selectedBlockId === b.id ? ' active' : ''}`}
                      onClick={() => setSelectedBlockId(b.id)}
                    >
                      块 {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => {
                      const block = newTextBlock({
                        yPct: Math.min(
                          68,
                          10 + selectedPage.blocks.length * 14,
                        ),
                      })
                      dispatch({
                        type: 'addTextBlock',
                        index: selectedIndex,
                        block,
                      })
                      setSelectedBlockId(block.id)
                    }}
                  >
                    + 添加
                  </button>
                </div>

                {selectedPage.blocks.length === 0 && (
                  <p className="hint-muted">
                    本页暂无文字块。可只做背景或插图；需要文字时点「+ 添加」。
                  </p>
                )}
                {selectedPage.blocks.length > 0 && !selectedBlock && (
                  <p className="hint-muted">
                    点击某个「块」标签，或在下方画布中点选文字，即可编辑内容与样式。
                  </p>
                )}

                {selectedBlock && (
                  <div className="block-editor">
                    <label className="field">
                      <span className="field-label">内容（支持换行）</span>
                      <textarea
                        className="textarea"
                        value={selectedBlock.text}
                        onChange={(e) => patchBlock({ text: e.target.value })}
                        rows={8}
                        placeholder="歌词或说明文字…"
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">字体（儿童 / 艺术）</span>
                      <select
                        className="input select fullwidth"
                        value={
                          FONT_PRESETS.some(
                            (f) => f.id === selectedBlock.fontPresetId,
                          )
                            ? selectedBlock.fontPresetId
                            : defaultFontPresetId()
                        }
                        onChange={(e) =>
                          patchBlock({ fontPresetId: e.target.value })
                        }
                      >
                        {FONT_PRESETS.map((p) => (
                          <option
                            key={p.id}
                            value={p.id}
                            style={{ fontFamily: p.stack }}
                          >
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="field-row">
                      <label className="field compact">
                        <span className="field-label">字号</span>
                        <input
                          type="number"
                          className="input"
                          min={10}
                          max={56}
                          value={selectedBlock.fontSize}
                          onChange={(e) =>
                            patchBlock({
                              fontSize: Number(e.target.value) || 16,
                            })
                          }
                        />
                      </label>
                      <label className="field compact grow">
                        <span className="field-label">行高</span>
                        <input
                          type="number"
                          step={0.05}
                          min={1}
                          max={2.5}
                          className="input"
                          value={selectedBlock.lineHeight}
                          onChange={(e) =>
                            patchBlock({
                              lineHeight: Number(e.target.value) || 1.5,
                            })
                          }
                        />
                      </label>
                    </div>
                    <label className="field">
                      <span className="field-label">宽度（占页面宽度 %）</span>
                      <input
                        type="range"
                        min={20}
                        max={100}
                        value={selectedBlock.widthPct}
                        onChange={(e) =>
                          patchBlock({ widthPct: Number(e.target.value) })
                        }
                      />
                      <span className="range-value">{selectedBlock.widthPct}%</span>
                    </label>
                    <div className="field-row">
                      <label className="field compact">
                        <span className="field-label">颜色</span>
                        <input
                          type="color"
                          className="input color"
                          value={
                            /^#[0-9a-f]{6}$/i.test(selectedBlock.color)
                              ? selectedBlock.color
                              : '#2c2416'
                          }
                          onChange={(e) =>
                            patchBlock({ color: e.target.value })
                          }
                        />
                      </label>
                      <label className="field compact grow">
                        <span className="field-label">字重</span>
                        <select
                          className="input select"
                          value={selectedBlock.fontWeight}
                          onChange={(e) =>
                            patchBlock({
                              fontWeight: Number(e.target.value),
                            })
                          }
                        >
                          <option value={400}>常规</option>
                          <option value={600}>半粗</option>
                          <option value={700}>粗体</option>
                        </select>
                      </label>
                    </div>
                    <div className="align-bar" role="group" aria-label="对齐">
                      {(
                        [
                          ['left', '左'],
                          ['center', '中'],
                          ['right', '右'],
                        ] as const
                      ).map(([val, lab]) => (
                        <button
                          key={val}
                          type="button"
                          className={`align-btn${selectedBlock.textAlign === val ? ' on' : ''}`}
                          onClick={() => patchBlock({ textAlign: val })}
                        >
                          {lab}
                        </button>
                      ))}
                    </div>
                    <p className="field-label">位置辅助</p>
                    <div
                      className="layout-quick-bar"
                      role="group"
                      aria-label="块在页面上的位置"
                    >
                      {(
                        [
                          ['h-center', '水平居中'],
                          ['left', '贴左'],
                          ['right', '贴右'],
                          ['v-center', '垂直居中'],
                          ['top', '贴上'],
                          ['bottom', '贴底'],
                        ] as const
                      ).map(([kind, lab]) => (
                        <button
                          key={kind}
                          type="button"
                          className="align-btn layout-quick-btn"
                          onClick={() => applyBlockLayout(kind)}
                        >
                          {lab}
                        </button>
                      ))}
                    </div>
                    {pairOtherBlocks.length > 0 && (
                      <>
                        <p className="field-label">与另一块对齐</p>
                        <label className="field">
                          <span className="field-label">参照文字块</span>
                          <select
                            className="input select fullwidth"
                            value={pairReferenceBlock?.id ?? ''}
                            onChange={(e) =>
                              setPairRefBlockId(
                                e.target.value ? e.target.value : null,
                              )
                            }
                          >
                            {pairOtherBlocks.map((b) => {
                              const num =
                                selectedPage.blocks.findIndex(
                                  (x) => x.id === b.id,
                                ) + 1
                              const preview = b.text.trim()
                              return (
                                <option key={b.id} value={b.id}>
                                  块 {num}
                                  {preview
                                    ? ` · ${
                                        preview.length > 14
                                          ? `${preview.slice(0, 14)}…`
                                          : preview
                                      }`
                                    : ''}
                                </option>
                              )
                            })}
                          </select>
                        </label>
                        <div
                          className="layout-quick-bar pair-align-bar"
                          role="group"
                          aria-label="相对参照块对齐"
                        >
                          {(
                            [
                              ['left-left', '左对左'],
                              ['right-right', '右对右'],
                              ['center-h', '水平居中'],
                              ['top-top', '顶对顶'],
                              ['bottom-bottom', '底对底'],
                              ['center-v', '垂直居中'],
                            ] as const
                          ).map(([kind, lab]) => (
                            <button
                              key={kind}
                              type="button"
                              className="align-btn layout-quick-btn"
                              onClick={() => applyPairAlign(kind)}
                            >
                              {lab}
                            </button>
                          ))}
                        </div>
                        <p className="hint-muted">
                          移动当前选中块，使其与参照块左/右/水平中心线，或顶/底/垂直中心线对齐（盒高度按字号与行数估算）。
                        </p>
                      </>
                    )}
                    <p className="hint-muted">
                      拖拽时靠近边缘或中线会自动吸附，并显示金色参考线；也可用「位置辅助」按钮。点击画布空白处取消选中。
                    </p>
                    <button
                      type="button"
                      className="btn danger-outline sm"
                      onClick={() => {
                        dispatch({
                          type: 'removeTextBlock',
                          index: selectedIndex,
                          blockId: selectedBlock.id,
                        })
                        setSelectedBlockId(null)
                      }}
                    >
                      删除此文字块
                    </button>
                  </div>
                )}
              </section>

              <section className="preview-wrap" aria-label="当前页编辑画布">
                <h2 className="preview-heading">
                  当前页编辑（拖拽吸附：边与中线）
                </h2>
                <div
                  className="preview-stage"
                  style={{ minHeight: previewHeight + 48 }}
                >
                  <BookPageCanvas
                    book={book}
                    page={selectedPage}
                    interactive
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={setSelectedBlockId}
                    onUpdateBlock={(blockId, patch) =>
                      dispatch({
                        type: 'updateTextBlock',
                        index: selectedIndex,
                        blockId,
                        patch,
                      })
                    }
                  />
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <div className="capture-stack" aria-hidden>
        {book.pages.map((p) => (
          <BookPageCanvas
            key={p.id}
            book={book}
            page={p}
            captureRef={(el) => setPageRef(p.id, el)}
          />
        ))}
      </div>

      <BookPreviewModal
        open={bookPreviewOpen}
        onClose={() => setBookPreviewOpen(false)}
        book={book}
        layout={pdfLayoutMode}
      />
    </div>
  )
}

export default App
