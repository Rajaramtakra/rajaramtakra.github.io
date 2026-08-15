import PDFDocument from "pdfkit";
import QRCode from "qrcode";

/** Renders a pdfkit document to a Buffer. `draw` receives the open document and must not call `doc.end()` itself. */
export async function renderPdfBuffer(
  draw: (doc: PDFKit.PDFDocument) => void | Promise<void>,
  options?: PDFKit.PDFDocumentOptions
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 40, ...options });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  await draw(doc);
  doc.end();
  return done;
}

/** Generates a QR code as a PNG buffer, suitable for `doc.image()`. */
export function generateQrPng(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { type: "png", margin: 1, width: 220 });
}
