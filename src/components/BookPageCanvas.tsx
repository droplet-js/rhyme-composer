import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { fontStackForPreset } from '../constants/childFonts'
import { PAGE_PREVIEW_WIDTH_PX, pagePreviewHeightPx } from '../constants/paper'
import {
  SNAP_THRESHOLD_PCT,
  estimateBlockHeightPct,
  maxTopPctForBlock,
} from '../lib/blockLayout'
import type { SongBook, SongPage, TextBlock } from '../types/book'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

type SnapGuides = {
  vx?: 'left' | 'center' | 'right'
  hy?: 'top' | 'center' | 'bottom'
}

function snap1D<T extends string>(
  value: number,
  pairs: ReadonlyArray<readonly [number, T]>,
  threshold: number,
): { val: number; tag?: T } {
  let best = value
  let tag: T | undefined
  let bestD = threshold + 1
  for (const [target, label] of pairs) {
    const d = Math.abs(value - target)
    if (d <= threshold && d < bestD) {
      best = target
      bestD = d
      tag = label
    }
  }
  return { val: best, tag }
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

function SnapGuidesOverlay({ g }: { g: SnapGuides }) {
  const line: CSSProperties = {
    position: 'absolute',
    background: 'rgba(184, 134, 11, 0.72)',
    pointerEvents: 'none',
    zIndex: 10,
    boxSizing: 'border-box',
  }
  return (
    <>
      {g.vx === 'left' && (
        <div
          aria-hidden
          style={{ ...line, left: 0, top: 0, bottom: 0, width: 1 }}
        />
      )}
      {g.vx === 'center' && (
        <div
          aria-hidden
          style={{
            ...line,
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            transform: 'translateX(-50%)',
          }}
        />
      )}
      {g.vx === 'right' && (
        <div
          aria-hidden
          style={{
            ...line,
            left: '100%',
            top: 0,
            bottom: 0,
            width: 1,
            transform: 'translateX(-100%)',
          }}
        />
      )}
      {g.hy === 'top' && (
        <div
          aria-hidden
          style={{ ...line, top: 0, left: 0, right: 0, height: 1 }}
        />
      )}
      {g.hy === 'center' && (
        <div
          aria-hidden
          style={{
            ...line,
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            transform: 'translateY(-50%)',
          }}
        />
      )}
      {g.hy === 'bottom' && (
        <div
          aria-hidden
          style={{
            ...line,
            top: '100%',
            left: 0,
            right: 0,
            height: 1,
            transform: 'translateY(-100%)',
          }}
        />
      )}
    </>
  )
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
  const [snapGuides, setSnapGuides] = useState<SnapGuides | null>(null)
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

      const el = root.querySelector(
        `[data-block-id="${d.blockId}"]`,
      ) as HTMLElement | null
      let hPct = estimateBlockHeightPct(block, rect.height)
      if (el) {
        const br = el.getBoundingClientRect()
        hPct = Math.max(4, (br.height / rect.height) * 100)
      }
      const wPct = block.widthPct
      const maxTop = maxTopPctForBlock(block, rect.height)

      const nxRaw = clamp(
        d.originXPct + dxPct,
        0,
        Math.max(0, 100 - wPct),
      )
      const nyRaw = clamp(d.originYPct + dyPct, 0, maxTop)

      const xPairs = [
        [0, 'left'],
        [50 - wPct / 2, 'center'],
        [100 - wPct, 'right'],
      ] as const
      const yPairs = [
        [0, 'top'],
        [50 - hPct / 2, 'center'],
        [maxTop, 'bottom'],
      ] as const

      const sx = snap1D(nxRaw, xPairs, SNAP_THRESHOLD_PCT)
      const sy = snap1D(nyRaw, yPairs, SNAP_THRESHOLD_PCT)

      setSnapGuides({
        vx: sx.tag,
        hy: sy.tag,
      })

      ou(d.blockId, { xPct: sx.val, yPct: sy.val })
    }

    const onUp = () => {
      dragRef.current = null
      setSnapGuides(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [interactive, setSnapGuides])

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
      {interactive &&
        snapGuides &&
        (snapGuides.vx != null || snapGuides.hy != null) && (
          <SnapGuidesOverlay g={snapGuides} />
        )}
      {page.blocks.map((block) => {
        const selected = interactive && selectedBlockId === block.id
        return (
          <div
            key={block.id}
            data-block-id={block.id}
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
            fontFamily: fontStackForPreset('noto-sans-sc'),
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
