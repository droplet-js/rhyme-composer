import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  A4_LANDSCAPE_MM,
  HALF_A4_MM,
  PAGE_PREVIEW_WIDTH_PX,
  pagePreviewHeightPx,
} from '../constants/paper'
import type { SongBook } from '../types/book'

const EXPORT_SCALE = 2

function previewHeightPx(): number {
  return pagePreviewHeightPx()
}

async function captureHalfPage(el: HTMLElement): Promise<string> {
  const canvas = await html2canvas(el, {
    scale: EXPORT_SCALE,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    width: PAGE_PREVIEW_WIDTH_PX,
    height: previewHeightPx(),
  })
  return canvas.toDataURL('image/png')
}

/**
 * Each PDF sheet is A4 landscape; left/right are two half‑A4 pages (148.5×210 mm).
 */
export async function exportSongbookPdf(
  book: SongBook,
  pageElementsInOrder: HTMLElement[],
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready
  }
  if (pageElementsInOrder.length === 0) return

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [A4_LANDSCAPE_MM.width, A4_LANDSCAPE_MM.height],
  })

  const pairs: [HTMLElement | null, HTMLElement | null][] = []
  for (let i = 0; i < pageElementsInOrder.length; i += 2) {
    pairs.push([
      pageElementsInOrder[i] ?? null,
      pageElementsInOrder[i + 1] ?? null,
    ])
  }

  for (let s = 0; s < pairs.length; s++) {
    const [left, right] = pairs[s]
    if (s > 0) {
      doc.addPage(
        [A4_LANDSCAPE_MM.width, A4_LANDSCAPE_MM.height],
        'landscape',
      )
    }

    if (left) {
      const img = await captureHalfPage(left)
      doc.addImage(
        img,
        'PNG',
        0,
        0,
        HALF_A4_MM.width,
        HALF_A4_MM.height,
        undefined,
        'FAST',
      )
    } else {
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, HALF_A4_MM.width, HALF_A4_MM.height, 'F')
    }

    if (right) {
      const img = await captureHalfPage(right)
      doc.addImage(
        img,
        'PNG',
        HALF_A4_MM.width,
        0,
        HALF_A4_MM.width,
        HALF_A4_MM.height,
        undefined,
        'FAST',
      )
    } else {
      doc.setFillColor(255, 255, 255)
      doc.rect(
        HALF_A4_MM.width,
        0,
        HALF_A4_MM.width,
        HALF_A4_MM.height,
        'F',
      )
    }
  }

  const safeName = book.title.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80)
  doc.save(`${safeName || '儿歌串编'}.pdf`)
}
