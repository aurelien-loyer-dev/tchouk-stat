// Helpers jsPDF partagés entre les différents générateurs de PDF (results,
// playerResults, history, tournament) — bannière d'en-tête et mise à l'échelle
// de colonnes de tableau, les deux blocs strictement identiques d'un
// générateur à l'autre. La pagination (ensurePage) reste locale à chaque
// générateur : elle referme sur un `y` mutable propre à chaque fonction.

export function drawPdfHeader(doc, { title, titleSize = 15 }) {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFillColor(20, 30, 48)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(titleSize)
  doc.text(title, 14, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
}

export function resetPdfTextColor(doc) {
  doc.setTextColor(15, 23, 42)
}

export function scaleCols(cols, maxW) {
  const totalW = cols.reduce((s, c) => s + c.w, 0)
  const scale = maxW / totalW
  return cols.map(c => ({ ...c, w: c.w * scale }))
}

export function xOfFactory(scaledCols, left) {
  return idx => {
    let x = left
    for (let i = 0; i < idx; i++) x += scaledCols[i].w
    return x
  }
}
