import { renderPdfBuffer, generateQrPng } from "../../lib/pdf";

export interface LibraryCardInput {
  schoolName: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  sectionName: string;
  verifyUrl: string;
}

const CARD_WIDTH = 153;
const CARD_HEIGHT = 243;

export function generateLibraryCardPdf(input: LibraryCardInput): Promise<Buffer> {
  return renderPdfBuffer(
    async (doc) => {
      doc.rect(0, 0, CARD_WIDTH, CARD_HEIGHT).fill("#ffffff");

      doc
        .fillColor("#1d4ed8")
        .fontSize(10)
        .text(input.schoolName, 10, 12, { width: CARD_WIDTH - 20, align: "center", ellipsis: true });
      doc.fillColor("#0f172a").fontSize(9).text("LIBRARY CARD", 10, 28, { width: CARD_WIDTH - 20, align: "center" });

      doc.moveTo(10, 44).lineTo(CARD_WIDTH - 10, 44).lineWidth(0.5).strokeColor("#e2e8f0").stroke();

      doc.fillColor("#0f172a").fontSize(8);
      doc.text(`Name: ${input.studentName}`, 10, 54, { width: CARD_WIDTH - 20 });
      doc.text(`Reg No: ${input.registrationNumber}`, 10, 68, { width: CARD_WIDTH - 20 });
      doc.text(`Class: ${input.className} - ${input.sectionName}`, 10, 82, { width: CARD_WIDTH - 20 });

      const qr = await generateQrPng(input.verifyUrl);
      const qrSize = 80;
      doc.image(qr, (CARD_WIDTH - qrSize) / 2, 120, { fit: [qrSize, qrSize] });

      doc
        .fontSize(6.5)
        .fillColor("#64748b")
        .text("Present this card to borrow or return library books.", 10, CARD_HEIGHT - 24, {
          width: CARD_WIDTH - 20,
          align: "center",
        });
    },
    { size: [CARD_WIDTH, CARD_HEIGHT], margin: 0 }
  );
}
