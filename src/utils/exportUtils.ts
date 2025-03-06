import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, LineRuleType, convertInchesToTwip, AlignmentType, spacing } from 'docx';
import { saveAs } from 'file-saver';

const formatTitle = (text: string): string => {
  // Remove special characters and limit length
  return text
    .replace(/[^\w\s-]/g, '')
    .trim()
    .slice(0, 100);
};

const getCurrentDate = (): string => {
  return new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const exportToPDF = async (title: string, content: string) => {
  const doc = new jsPDF();
  
  // Configure page size and margins (1 inch margins for APA)
  const margin = 25.4; // 1 inch in mm
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (2 * margin);
  
  // Set font to Times New Roman (APA requirement)
  doc.setFont('times', 'normal');
  
  // Add running head
  doc.setFontSize(12);
  doc.text('RUNNING HEAD: ' + title.toUpperCase().slice(0, 50), margin, margin/2);
  
  // Add page number
  doc.text('1', pageWidth - margin, margin/2);
  
  // Add title (centered, bold, 12pt)
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  let y = margin + 12;
  titleLines.forEach((line: string) => {
    const titleWidth = doc.getTextWidth(line);
    const x = (pageWidth - titleWidth) / 2;
    doc.text(line, x, y);
    y += 16;
  });
  
  // Add author and institution
  y += 12;
  doc.setFont('times', 'normal');
  doc.text('Generado por Otto Chat', pageWidth/2, y, { align: 'center' });
  y += 12;
  doc.text(getCurrentDate(), pageWidth/2, y, { align: 'center' });
  
  // Add abstract
  y += 24;
  doc.setFont('times', 'bold');
  doc.text('Abstract', margin, y);
  y += 16;
  
  // Add content with proper line spacing (double-spaced)
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  const lineHeight = 8; // Double spacing
  const contentLines = doc.splitTextToSize(content, contentWidth);
  
  contentLines.forEach((line: string) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
      // Add running head and page number to new page
      doc.setFontSize(12);
      doc.text('RUNNING HEAD: ' + title.toUpperCase().slice(0, 50), margin, margin/2);
      doc.text(String(doc.internal.getNumberOfPages()), pageWidth - margin, margin/2);
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });
  
  // Save with formatted title
  const formattedTitle = formatTitle(title);
  doc.save(`${formattedTitle}.pdf`);
};

export const exportToWord = async (title: string, content: string) => {
  // Create new document with APA style settings
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
          },
        },
      },
      children: [
        // Running head
        new Paragraph({
          children: [
            new TextRun({
              text: 'RUNNING HEAD: ' + title.toUpperCase().slice(0, 50),
              font: 'Times New Roman',
              size: 24, // 12pt
            }),
          ],
          spacing: {
            before: 240,
            after: 240,
          },
        }),
        
        // Title
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              font: 'Times New Roman',
              size: 24, // 12pt
            }),
          ],
          spacing: {
            before: 480,
            after: 240,
          },
          alignment: AlignmentType.CENTER,
        }),
        
        // Author
        new Paragraph({
          children: [
            new TextRun({
              text: 'Generado por Otto Chat',
              font: 'Times New Roman',
              size: 24,
            }),
          ],
          spacing: {
            before: 240,
            after: 240,
          },
          alignment: AlignmentType.CENTER,
        }),
        
        // Date
        new Paragraph({
          children: [
            new TextRun({
              text: getCurrentDate(),
              font: 'Times New Roman',
              size: 24,
            }),
          ],
          spacing: {
            before: 240,
            after: 480,
          },
          alignment: AlignmentType.CENTER,
        }),
        
        // Abstract heading
        new Paragraph({
          children: [
            new TextRun({
              text: 'Abstract',
              bold: true,
              font: 'Times New Roman',
              size: 24,
            }),
          ],
          spacing: {
            before: 240,
            after: 240,
          },
        }),
        
        // Content
        new Paragraph({
          children: [
            new TextRun({
              text: content,
              font: 'Times New Roman',
              size: 24,
            }),
          ],
          spacing: {
            line: 480, // Double spacing
            before: 240,
            after: 240,
          },
        }),
      ],
    }],
  });

  // Generate and save document with formatted title
  const formattedTitle = formatTitle(title);
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${formattedTitle}.docx`);
};