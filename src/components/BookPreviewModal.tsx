import { useEffect, useMemo } from 'react'
import { BookPageCanvas } from './BookPageCanvas'
import { PAGE_PREVIEW_WIDTH_PX, pagePreviewHeightPx } from '../constants/paper'
import { bookletLandscapeIndexPairs, type PdfLayoutMode } from '../lib/exportSongbookPdf'
import type { SongBook, SongPage } from '../types/book'

type Props = {
  open: boolean
  onClose: () => void
  book: SongBook
  layout: PdfLayoutMode
}

const PREVIEW_SCALE = 0.38
/** 普通 PDF 单页在总览里略放大，便于辨认。 */
const PREVIEW_SCALE_FULL = 0.44

function BlankHalf({ scale }: { scale: number }) {
  const w = PAGE_PREVIEW_WIDTH_PX
  const h = pagePreviewHeightPx()
  return (
    <div
      className="book-preview-half-slot"
      style={{ width: w * scale, height: h * scale }}
    >
      <div
        aria-hidden
        className="book-preview-blank-inner"
        style={{
          width: w,
          height: h,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  )
}

function ScaledPage({
  book,
  page,
  scale,
}: {
  book: SongBook
  page: SongPage
  scale: number
}) {
  const w = PAGE_PREVIEW_WIDTH_PX
  const h = pagePreviewHeightPx()
  return (
    <div
      className="book-preview-half-slot"
      style={{ width: w * scale, height: h * scale }}
    >
      <div
        className="book-preview-scale-inner"
        style={{
          width: w,
          height: h,
          transform: `scale(${scale})`,
        }}
      >
        <BookPageCanvas book={book} page={page} />
      </div>
    </div>
  )
}

function pageAt(book: SongBook, index: number): SongPage | null {
  if (index < 0 || index >= book.pages.length) return null
  return book.pages[index]
}

function formatHalfLabel(book: SongBook, index: number): string {
  if (index < 0 || index >= book.pages.length) return '白页'
  const p = book.pages[index]
  const name = p.pageName.trim()
  const n = index + 1
  if (name)
    return `编辑第 ${n} 页 · ${name.length > 10 ? `${name.slice(0, 10)}…` : name}`
  return `编辑第 ${n} 页`
}

export function BookPreviewModal({ open, onClose, book, layout }: Props) {
  const slotH = pagePreviewHeightPx() * PREVIEW_SCALE

  const bookletSpreads = useMemo(() => {
    const n = book.pages.length
    if (n === 0) return []
    const pairs = bookletLandscapeIndexPairs(n)
    return pairs.map(([li, ri], pdfPageIndex) => {
      const sheetNum = Math.floor(pdfPageIndex / 2) + 1
      const side = pdfPageIndex % 2 === 0 ? '正面' : '背面'
      return {
        pdfPageIndex,
        sheetNum,
        side,
        left: pageAt(book, li),
        right: pageAt(book, ri),
        li,
        ri,
      }
    })
  }, [book])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const isBooklet = layout === 'booklet'

  return (
    <div
      className="book-preview-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="book-preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="book-preview-header">
          <div>
            <h2 id="book-preview-title" className="book-preview-title">
              打印预览
            </h2>
            <p className="book-preview-sub">
              {isBooklet
                ? '当前为对折装订（骑马钉）：每张 A4 横版含左右两个半页；双面打印、对折后与导出 PDF 一致（不足 4 的倍数时尾部补白半页）。'
                : '当前为普通 PDF：A4 竖版，编辑列表第几页即 PDF 第几页，一纸一页。'}
            </p>
          </div>
          <button
            type="button"
            className="btn ghost"
            onClick={onClose}
            autoFocus
          >
            关闭
          </button>
        </header>
        <div className="book-preview-body">
          {book.pages.length === 0 ? (
            <p className="hint-muted">暂无页面。</p>
          ) : isBooklet ? (
            bookletSpreads.map((sp) => {
              const label = `第 ${sp.sheetNum} 张纸 · ${sp.side} · PDF 第 ${sp.pdfPageIndex + 1} 页 · 左：${formatHalfLabel(book, sp.li)} · 右：${formatHalfLabel(book, sp.ri)}`
              return (
                <section
                  key={`booklet-pdf-${sp.pdfPageIndex}`}
                  className="book-preview-spread"
                >
                  <h3 className="book-preview-spread-title">{label}</h3>
                  <div className="book-preview-spread-pages">
                    {sp.left ? (
                      <ScaledPage
                        book={book}
                        page={sp.left}
                        scale={PREVIEW_SCALE}
                      />
                    ) : (
                      <BlankHalf scale={PREVIEW_SCALE} />
                    )}
                    <div
                      className="book-preview-crease"
                      style={{ height: slotH }}
                      aria-hidden
                    />
                    {sp.right ? (
                      <ScaledPage
                        book={book}
                        page={sp.right}
                        scale={PREVIEW_SCALE}
                      />
                    ) : (
                      <BlankHalf scale={PREVIEW_SCALE} />
                    )}
                  </div>
                </section>
              )
            })
          ) : (
            book.pages.map((page, i) => {
              const label = `PDF 第 ${i + 1} 页 · ${formatHalfLabel(book, i)}`
              return (
                <section
                  key={page.id}
                  className="book-preview-spread book-preview-fullpage"
                >
                  <h3 className="book-preview-spread-title">{label}</h3>
                  <div className="book-preview-fullpage-stage">
                    <ScaledPage
                      book={book}
                      page={page}
                      scale={PREVIEW_SCALE_FULL}
                    />
                  </div>
                </section>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
