import JSZip from 'jszip'
import { defaultFontPresetId } from '../constants/childFonts'
import type { PageBackground, SongBook, SongPage, TextBlock } from '../types/book'

/** 根目录清单（JSON）；背景二进制在 `backgrounds/` 下。 */
export const BUNDLE_JSON_FILE = 'book.json'

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

type BackgroundZipFields = {
  color: string
  imageFit: PageBackground['imageFit']
  imageDataUrl?: string
  imageFile?: string
}

function migrateBackgroundZip(raw: unknown): BackgroundZipFields {
  if (!isRecord(raw)) {
    return { color: '#ffffff', imageFit: 'cover' }
  }
  const fit = raw.imageFit
  const imageFit =
    fit === 'cover' || fit === 'contain' || fit === 'center' ? fit : 'cover'
  return {
    color: typeof raw.color === 'string' ? raw.color : '#ffffff',
    imageFit,
    imageDataUrl:
      typeof raw.imageDataUrl === 'string' ? raw.imageDataUrl : undefined,
    imageFile: typeof raw.imageFile === 'string' ? raw.imageFile : undefined,
  }
}

/** 导入过程中暂存 ZIP 内背景相对路径 */
type ImportPage = SongPage & { _zipImageFile?: string }

function migratePageZip(raw: unknown): ImportPage | null {
  if (!isRecord(raw)) return null
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null

  const blocksIn = Array.isArray(raw.blocks) ? raw.blocks : []
  const blocks = blocksIn
    .map(migrateTextBlock)
    .filter((b): b is TextBlock => b != null)

  const bf = migrateBackgroundZip(raw.background)
  const imageFile = bf.imageFile?.trim()
  const useEmbedded =
    !imageFile && bf.imageDataUrl && bf.imageDataUrl.startsWith('data:')

  const background: PageBackground = {
    color: bf.color,
    imageFit: bf.imageFit,
    ...(useEmbedded ? { imageDataUrl: bf.imageDataUrl } : {}),
  }

  return {
    id: raw.id,
    pageName: typeof raw.pageName === 'string' ? raw.pageName : '',
    background,
    blocks,
    showPageNumber:
      typeof raw.showPageNumber === 'boolean' ? raw.showPageNumber : false,
    pageNumberDisplay:
      typeof raw.pageNumberDisplay === 'string' ? raw.pageNumberDisplay : '',
    ...(imageFile ? { _zipImageFile: imageFile } : {}),
  }
}

function parseBundleBook(
  raw: unknown,
): { title: string; pages: ImportPage[] } | null {
  if (!isRecord(raw)) return null
  const title =
    typeof raw.title === 'string' && raw.title.trim() !== ''
      ? raw.title
      : '我的儿歌串编'
  const pagesIn = Array.isArray(raw.pages) ? raw.pages : []
  const pages = pagesIn
    .map(migratePageZip)
    .filter((p): p is ImportPage => p != null)
  if (pages.length === 0) return null
  return { title, pages }
}

function normalizeZipEntryPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\/+/, '')
}

function mimeFromFilepath(path: string): string {
  const lower = path.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/png'
}

function isSafeBackgroundRef(pageId: string, ref: string): boolean {
  const p = normalizeZipEntryPath(ref)
  if (p.includes('..')) return false
  if (!p.startsWith('backgrounds/')) return false
  const base = p.slice('backgrounds/'.length)
  if (!base || base.includes('/')) return false
  return base.startsWith(`${pageId}.`)
}

async function zipEntryToDataUrl(
  entry: JSZip.JSZipObject,
  mime: string,
): Promise<string> {
  const b64 = await entry.async('base64')
  return `data:${mime};base64,${b64}`
}

async function hydrateImportPages(zip: JSZip, pages: ImportPage[]): Promise<SongPage[]> {
  return Promise.all(
    pages.map(async (p) => {
      const ref = p._zipImageFile
      if (!ref) {
        const { _zipImageFile: _z, ...song } = p
        void _z
        return song
      }
      if (!isSafeBackgroundRef(p.id, ref)) {
        throw new Error(`非法背景路径：${ref}（须为 backgrounds/<页面id>.后缀）`)
      }
      const path = normalizeZipEntryPath(ref)
      const entry = zip.file(path)
      if (!entry) {
        throw new Error(`ZIP 中缺少背景文件：${path}`)
      }
      const mime = mimeFromFilepath(path)
      const dataUrl = await zipEntryToDataUrl(entry, mime)
      const { _zipImageFile: _z, ...rest } = p
      void _z
      return {
        ...rest,
        background: {
          ...rest.background,
          imageDataUrl: dataUrl,
        },
      }
    }),
  )
}

function parseDataUrl(
  dataUrl: string,
): { mime: string; base64: string } | null {
  const trimmed = dataUrl.trim().replace(/\s/g, '')
  const m = /^data:([^;,]+);base64,(.*)$/i.exec(trimmed)
  if (!m) return null
  const mime = m[1]
  const base64 = m[2]
  if (!base64) return null
  return { mime, base64 }
}

function mimeToFileExt(mime: string): string {
  const m = mime.toLowerCase().split(';')[0]?.trim() ?? 'image/png'
  if (m === 'image/png') return 'png'
  if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg'
  if (m === 'image/webp') return 'webp'
  if (m === 'image/gif') return 'gif'
  return 'png'
}

export type BookDataManifestV1 = {
  formatVersion: 1
  exportedAt: string
  appId: 'rhyme-composer'
  selectedIndex: number
  /** 与运行时一致，但各页 background 可能含 `imageFile` 而无 `imageDataUrl`。 */
  book: SongBook
}

/**
 * 将当前书与选中页导出为 ZIP：`book.json` + `backgrounds/<pageId>.<ext>`（有背景图时）。
 */
export async function exportBookDataZip(
  book: SongBook,
  selectedIndex: number,
): Promise<Blob> {
  const zip = new JSZip()
  const bookClone = JSON.parse(JSON.stringify(book)) as SongBook

  for (const page of bookClone.pages) {
    const url = page.background.imageDataUrl
    if (!url) continue
    const parsed = parseDataUrl(url)
    if (!parsed) continue
    const ext = mimeToFileExt(parsed.mime)
    const path = `backgrounds/${page.id}.${ext}`
    zip.file(path, parsed.base64, { base64: true })
    const { imageDataUrl: _drop, ...bgRest } = page.background
    void _drop
    page.background = {
      ...bgRest,
      imageFile: path,
    } as PageBackground & { imageFile: string }
  }

  const manifest: BookDataManifestV1 = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    appId: 'rhyme-composer',
    selectedIndex,
    book: bookClone as SongBook,
  }

  zip.file(BUNDLE_JSON_FILE, JSON.stringify(manifest, null, 2))
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

export function suggestedBundleZipName(bookTitle: string): string {
  const base = bookTitle
    .replace(/[/\\?%*:|"<>]/g, '-')
    .trim()
    .slice(0, 48)
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `${base || 'RhymeComposer'}-${stamp}.zip`
}

/**
 * 从导出 ZIP 恢复 {@link SongBook} 与选中页下标。
 */
export async function importBookDataZip(file: File): Promise<{
  book: SongBook
  selectedIndex: number
}> {
  const zip = await JSZip.loadAsync(file)
  const jsonEntry = zip.file(BUNDLE_JSON_FILE)
  if (!jsonEntry) {
    throw new Error(`ZIP 中缺少 ${BUNDLE_JSON_FILE}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(await jsonEntry.async('string'))
  } catch {
    throw new Error('book.json 解析失败')
  }

  if (!isRecord(parsed) || parsed.formatVersion !== 1) {
    throw new Error('不支持的包格式（需要 formatVersion: 1）')
  }

  const bookRaw = parsed.book
  const data = parseBundleBook(bookRaw)
  if (!data) {
    throw new Error('book 无效或没有页面')
  }

  const pages = await hydrateImportPages(zip, data.pages)
  const book: SongBook = { title: data.title, pages }

  let selectedIndex = 0
  if (
    typeof parsed.selectedIndex === 'number' &&
    Number.isFinite(parsed.selectedIndex)
  ) {
    selectedIndex = Math.max(
      0,
      Math.min(Math.trunc(parsed.selectedIndex), book.pages.length - 1),
    )
  }

  return { book, selectedIndex }
}
