import { useCallback, useEffect, useRef } from 'react'
import { fontStackForPreset } from '../constants/childFonts'
import { PAGE_PREVIEW_WIDTH_PX, pagePreviewHeightPx } from '../constants/paper'
import type { SongBook, SongPage, TextBlock } from '../types/book'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

type Props = {
  book: SongBook
  page: SongPage
  captureRef?: (el: HTMLDivElement | null) => void
  interactive?: boolean
  selectedBlockId?: string | null
  onSelectBlock?: (id: string | null) => void
  onUpdateBlock?: (blockId: string, patch: Partial<TextBlock>) => void
}

export function BookPageCanvas({
  book: _book,
  page,
  captureRef,
  interactive = false,
  selectedBlockId = null,
  onSelectBlock,
  onUpdateBlock,
}: Props) {
  void _book
  const rootRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    blockId: string
    startClientX: number
    startClientY: number
    originXPct: number
    originYPct: number
  } | null>(null)

  const onUpdateBlockRef = useRef(onUpdateBlock)
  const pageRef = useRef(page)

  useEffect(() => {
    onUpdateBlockRef.current = onUpdateBlock
  }, [onUpdateBlock])

  useEffect(() => {
    pageRef.current = page
  }, [page])

  const setRootRef = useCallback(
    (el: HTMLDivElement | null) => {
      rootRef.current = el
      captureRef?.(el)
    },
    [captureRef],
  )

  const bgSize =
    page.background.imageFit === 'cover'
      ? 'cover'
      : page.background.imageFit === 'contain'
        ? 'contain'
        : 'auto'

  useEffect(() => {
    if (!interactive) return

    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      const root = rootRef.current
      const ou = onUpdateBlockRef.current
      const p = pageRef.current
      if (!d || !root || !ou) return
      const rect = root.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return
      const dxPct = ((e.clientX - d.startClientX) / rect.width) * 100
      const dyPct = ((e.clientY - d.startClientY) / rect.height) * 100
      const block = p.blocks.find((b) => b.id === d.blockId)
      if (!block) return
      const nx = clamp(
        d.originXPct + dxPct,
        0,
        Math.max(0, 100 - block.widthPct),
      )
      const ny = clamp(d.originYPct + dyPct, 0, 95)
      ou(d.blockId, { xPct: nx, yPct: ny })
    }

    const onUp = () => {
      dragRef.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [interactive])

  const h = pagePreviewHeightPx()
  const w = PAGE_PREVIEW_WIDTH_PX

  const startDrag = (e: React.MouseEvent, block: TextBlock) => {
    if (!interactive || !onUpdateBlock) return
    e.stopPropagation()
    e.preventDefault()
    onSelectBlock?.(block.id)
    dragRef.current = {
      blockId: block.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originXPct: block.xPct,
      originYPct: block.yPct,
    }
  }

  return (
    <div
      ref={setRootRef}
      className="book-page-capture"
      style={{
        width: w,
        height: h,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #e8dfd0',
      }}
    >
      <div
        aria-hidden
        onMouseDown={
          interactive
            ? () => {
                onSelectBlock?.(null)
              }
            : undefined
        }
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: page.background.color,
          backgroundImage: page.background.imageDataUrl
            ? `url(${page.background.imageDataUrl})`
            : undefined,
          backgroundRepeat: 'no-repeat',
          backgroundSize: bgSize,
          backgroundPosition: 'center',
        }}
      />
      {page.blocks.map((block) => {
        const selected = interactive && selectedBlockId === block.id
        return (
          <div
            key={block.id}
            onMouseDown={(e) => startDrag(e, block)}
            style={{
              position: 'absolute',
              left: `${block.xPct}%`,
              top: `${block.yPct}%`,
              width: `${block.widthPct}%`,
              fontFamily: fontStackForPreset(block.fontPresetId),
              fontSize: block.fontSize,
              lineHeight: block.lineHeight,
              color: block.color,
              textAlign: block.textAlign,
              fontWeight: block.fontWeight,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              cursor: interactive ? 'grab' : undefined,
              boxSizing: 'border-box',
              zIndex: 1,
              outline: selected ? '2px dashed #b8860b' : undefined,
              outlineOffset: 2,
              borderRadius: 2,
              minHeight: '1em',
              ...(interactive && selected
                ? { boxShadow: '0 0 0 1px rgb(184 134 11 / 0.35)' }
                : {}),
            }}
          >
            {block.text}
          </div>
        )
      })}
      {page.showPageNumber && page.pageNumberDisplay.trim() !== '' && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '2%',
            textAlign: 'center',
            fontSize: 11,
            fontFamily: fontStackForPreset('nunito'),
            color: 'rgb(44 36 22 / 0.55)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {page.pageNumberDisplay.trim()}
        </div>
      )}
    </div>
  )
}
