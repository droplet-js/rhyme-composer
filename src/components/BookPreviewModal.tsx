import { useEffect, useMemo } from 'react'
import { BookPageCanvas } from './BookPageCanvas'
import { PAGE_PREVIEW_WIDTH_PX, pagePreviewHeightPx } from '../constants/paper'
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

export function BookPreviewModal({ open, onClose, book }: Props) {
  const slotH = pagePreviewHeightPx() * PREVIEW_SCALE

  const spreads = useMemo(() => {
    const pages = book.pages
    const out: { left: SongPage; right: SongPage | null }[] = []
    for (let i = 0; i < pages.length; i += 2) {
      const left = pages[i]
      if (!left) continue
      out.push({ left, right: pages[i + 1] ?? null })
    }
    return out
  }, [book.pages])

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
              书籍预览
            </h2>
            <p className="book-preview-sub">
              顺序与导出 PDF 一致：每开为横版 A4，左、右各一页（半张 A4）。
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
            spreads.map((sp, si) => {
              const leftNum = si * 2 + 1
              const rightNum = si * 2 + 2
              const label = sp.right
                ? `第 ${si + 1} 开 · 页 ${leftNum}–${rightNum}`
                : `第 ${si + 1} 开 · 页 ${leftNum}（右侧为空白半页）`
              return (
                <section key={`${sp.left.id}-${si}`} className="book-preview-spread">
                  <h3 className="book-preview-spread-title">{label}</h3>
                  <div className="book-preview-spread-pages">
                    <ScaledPage
                      book={book}
                      page={sp.left}
                      scale={PREVIEW_SCALE}
                    />
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
