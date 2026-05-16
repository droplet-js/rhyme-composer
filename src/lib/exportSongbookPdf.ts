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

function elementOrNull(
  elements: (HTMLElement | null)[],
  index: number,
): HTMLElement | null {
  if (index < 0 || index >= elements.length) return null
  return elements[index]
}

/** 逻辑页数补足到 4 的倍数（对折装订每张大纸正反面共 4 个半页）。 */
export function bookletPaddedPageCount(logicalCount: number): number {
  if (logicalCount <= 0) return 0
  return Math.ceil(logicalCount / 4) * 4
}

/**
 * 骑马钉折帖：每张物理纸双面各有一页「横版双半页」PDF。
 * 返回若干 [左半页索引, 右半页索引]（0-based，可指向补齐后的空白页）。
 */
export function bookletLandscapeIndexPairs(logicalCount: number): [number, number][] {
  const N = bookletPaddedPageCount(logicalCount)
  if (N === 0) return []

  const sheets = N / 4
  const pairs: [number, number][] = []
  for (let s = 0; s < sheets; s++) {
    pairs.push([N - 1 - 2 * s, 2 * s])
    pairs.push([2 * s + 1, N - 2 - 2 * s])
  }
  return pairs
}

/**
 * 每页 PDF 为 A4 横版；左 / 右为两个半幅 A4（148.5×210 mm）。
 * 页序为骑马钉折帖：双面打印后沿长边对折、叠齐装订即得正确阅读顺序（总页数自动补足到 4 的倍数，尾部为白半页）。
 */
export async function exportSongbookPdf(
  book: SongBook,
  pageElementsInOrder: (HTMLElement | null)[],
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready
  }

  const n = pageElementsInOrder.length
  if (n === 0) return

  const indexPairs = bookletLandscapeIndexPairs(n)

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [A4_LANDSCAPE_MM.width, A4_LANDSCAPE_MM.height],
  })

  for (let s = 0; s < indexPairs.length; s++) {
    const [li, ri] = indexPairs[s]
    const left = elementOrNull(pageElementsInOrder, li)
    const right = elementOrNull(pageElementsInOrder, ri)

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
