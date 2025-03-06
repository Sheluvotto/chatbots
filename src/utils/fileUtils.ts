import { v4 as uuidv4 } from 'uuid';
import { Attachment } from '../types/chat';
import * as pdfjs from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Supported file types
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'text/html',
  'text/css',
  'application/javascript',
  'application/json',
  'text/markdown',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
];

export const processFile = async (file: File): Promise<Attachment | null> => {
  try {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${file.name}. Maximum size is 5MB.`);
    }
    
    // Check file type
    if (!SUPPORTED_FILE_TYPES.includes(file.type) && !file.type.startsWith('text/')) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
    
    // Create attachment object
    const attachment: Attachment = {
      id: uuidv4(),
      name: file.name,
      type: file.type,
      size: file.size,
    };
    
    // For text files, read the content
    if (file.type.startsWith('text/') || 
        file.type === 'application/json' || 
        file.type === 'application/javascript') {
      try {
        const content = await readTextFile(file);
        attachment.content = content;
      } catch (error) {
        console.error('Error reading text file:', error);
        throw new Error(`Failed to read file: ${file.name}`);
      }
    } 
    // For PDF files, extract text
    else if (file.type === 'application/pdf') {
      try {
        const content = await extractTextFromPdf(file);
        attachment.content = content;
      } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error(`Failed to extract text from PDF: ${file.name}. Please ensure the PDF is not encrypted or corrupted.`);
      }
    } else {
      // For binary files, create a URL
      attachment.url = URL.createObjectURL(file);
    }
    
    return attachment;
  } catch (error) {
    throw error;
  }
};

const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    // Convert the file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document with better error handling
    const loadingTask = pdfjs.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: true,
      isEvalSupported: true,
      useSystemFonts: true
    });

    const pdf = await loadingTask.promise;
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        fullText += `--- Page ${i} ---\nError: Could not extract text from this page.\n\n`;
      }
    }
    
    return fullText || 'No text could be extracted from this PDF.';
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to process PDF. The file might be corrupted, encrypted, or in an unsupported format.');
  }
};

export const extractTextFromAttachments = (attachments: Attachment[]): string => {
  return attachments
    .filter(att => att.content)
    .map(att => `File: ${att.name}\n\n${att.content}`)
    .join('\n\n---\n\n');
};