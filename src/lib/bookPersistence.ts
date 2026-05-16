import { defaultFontPresetId } from '../constants/childFonts'
import type { PageBackground, SongBook, SongPage, TextBlock } from '../types/book'

const STORAGE_KEY = 'rhyme_composer:state:v1'
/** 旧版应用 id；首次从新版存储读取，保存后删除以免重复占用。 */
const STORAGE_KEY_LEGACY = 'lite_book:state:v1'
const SCHEMA_VERSION = 1 as const

export type BookAppState = {
  book: SongBook
  selectedIndex: number
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

function migrateTextBlock(raw: unknown): TextBlock | null {
  if (!isRecord(raw)) return null
  const ta = raw.textAlign
  const textAlign =
    ta === 'left' || ta === 'center' || ta === 'right' ? ta : 'left'
  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    text: typeof raw.text === 'string' ? raw.text : '',
    fontPresetId:
      typeof raw.fontPresetId === 'string'
        ? raw.fontPresetId
        : defaultFontPresetId(),
    xPct: typeof raw.xPct === 'number' && Number.isFinite(raw.xPct) ? raw.xPct : 10,
    yPct: typeof raw.yPct === 'number' && Number.isFinite(raw.yPct) ? raw.yPct : 12,
    widthPct:
      typeof raw.widthPct === 'number' && Number.isFinite(raw.widthPct)
        ? raw.widthPct
        : 80,
    fontSize:
      typeof raw.fontSize === 'number' && Number.isFinite(raw.fontSize)
        ? raw.fontSize
        : 17,
    lineHeight:
      typeof raw.lineHeight === 'number' && Number.isFinite(raw.lineHeight)
        ? raw.lineHeight
        : 1.65,
    color: typeof raw.color === 'string' ? raw.color : '#2c2416',
    textAlign,
    fontWeight:
      typeof raw.fontWeight === 'number' && Number.isFinite(raw.fontWeight)
        ? raw.fontWeight
        : 400,
  }
}

function migrateBackground(raw: unknown): PageBackground {
  if (!isRecord(raw)) {
    return { color: '#ffffff', imageFit: 'cover' }
  }
  const fit = raw.imageFit
  const imageFit =
    fit === 'cover' || fit === 'contain' || fit === 'center' ? fit : 'cover'
  return {
    color: typeof raw.color === 'string' ? raw.color : '#ffffff',
    imageDataUrl:
      typeof raw.imageDataUrl === 'string' ? raw.imageDataUrl : undefined,
    imageFit,
  }
}

function migratePage(raw: unknown): SongPage | null {
  if (!isRecord(raw)) return null
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null

  const blocksIn = Array.isArray(raw.blocks) ? raw.blocks : []
  const blocks = blocksIn
    .map(migrateTextBlock)
    .filter((b): b is TextBlock => b != null)

  return {
    id: raw.id,
    pageName: typeof raw.pageName === 'string' ? raw.pageName : '',
    background: migrateBackground(raw.background),
    blocks,
    showPageNumber:
      typeof raw.showPageNumber === 'boolean' ? raw.showPageNumber : false,
    pageNumberDisplay:
      typeof raw.pageNumberDisplay === 'string' ? raw.pageNumberDisplay : '',
  }
}

function migrateBook(raw: unknown): SongBook | null {
  if (!isRecord(raw)) return null
  const title = typeof raw.title === 'string' ? raw.title : '我的儿歌串编'
  const pagesIn = Array.isArray(raw.pages) ? raw.pages : []
  const pages = pagesIn
    .map(migratePage)
    .filter((p): p is SongPage => p != null)
  if (pages.length === 0) return null
  return { title, pages }
}

/** 从 localStorage 恢复；失败或无效时返回 fallback。 */
export function loadBookAppState(fallback: BookAppState): BookAppState {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(STORAGE_KEY_LEGACY)
    if (!raw) return fallback
    const data = JSON.parse(raw) as unknown
    if (!isRecord(data) || data.v !== SCHEMA_VERSION) return fallback
    const book = migrateBook(data.book)
    if (!book) return fallback
    let selectedIndex = 0
    if (typeof data.selectedIndex === 'number' && Number.isFinite(data.selectedIndex)) {
      selectedIndex = Math.max(
        0,
        Math.min(Math.trunc(data.selectedIndex), book.pages.length - 1),
      )
    }
    return { book, selectedIndex }
  } catch {
    return fallback
  }
}

/** 写入 localStorage（同步）。 */
export function saveBookAppState(state: BookAppState): void {
  if (typeof localStorage === 'undefined') return
  try {
    const payload = {
      v: SCHEMA_VERSION,
      book: state.book,
      selectedIndex: state.selectedIndex,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    try {
      localStorage.removeItem(STORAGE_KEY_LEGACY)
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.warn('RhymeComposer: 无法写入 localStorage（可能已满）', e)
  }
}
