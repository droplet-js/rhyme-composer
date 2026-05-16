import { useEffect, useMemo } from 'react'
import { BookPageCanvas } from './BookPageCanvas'
import { PAGE_PREVIEW_WIDTH_PX, pagePreviewHeightPx } from '../constants/paper'
import { bookletLandscapeIndexPairs } from '../lib/exportSongbookPdf'
import type { SongBook, SongPage } from '../types/book'

type Props = {
  open: boolean
  onClose: () => void
  book: SongBook
}

const PREVIEW_SCALE = 0.38

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
  if (name) return `编辑第 ${n} 页 · ${name.length > 10 ? `${name.slice(0, 10)}…` : name}`
  return `编辑第 ${n} 页`
}

export function BookPreviewModal({ open, onClose, book }: Props) {
  const slotH = pagePreviewHeightPx() * PREVIEW_SCALE

  const spreads = useMemo(() => {
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
              折帖总览
            </h2>
            <p className="book-preview-sub">
              与导出 PDF 相同，为骑马钉折帖顺序：每张 A4
              横版一页；按张纸「正面 → 背面」双面打印，对折装订后即得正确页序（不足 4
              的倍数时会自动补白半页）。
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
          {spreads.length === 0 ? (
            <p className="hint-muted">暂无页面。</p>
          ) : (
            spreads.map((sp) => {
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
          )}
        </div>
      </div>
    </div>
  )
}
