import * as pdfjsLib from 'pdfjs-dist'

// Set worker source
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`
}

export async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    let fullText = ''

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
      fullText += `\n--- Page ${pageNum} ---\n` + pageText
    }

    const trimmed = fullText.trim()
    if (trimmed.length > 20) return trimmed
  } catch (err) {
    console.warn('PDF.js extraction failed, trying fallback stream text extraction', err)
  }

  // Fallback: extract plain text from stream if possible
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const raw = e.target.result || ''
      // Extract text inside parentheses in PDF streams e.g. (Hello World) Tj
      const matches = raw.match(/\(([^()]{2,})\)\s*T[jJ]/g)
      if (matches && matches.length > 0) {
        const text = matches
          .map(m => m.replace(/^[\(\s]+|[\)\sTjJ]+$/g, ''))
          .join(' ')
        resolve(text.slice(0, 8000))
      } else {
        // Return cleaned up printable ascii
        const cleaned = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{2,}/g, ' ')
        resolve(cleaned.slice(0, 5000))
      }
    }
    reader.readAsText(file)
  })
}
