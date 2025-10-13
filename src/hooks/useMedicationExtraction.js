import { useCallback, useMemo, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

let pdfjsLibPromise;

const ensurePdfJs = async () => {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = (async () => {
      const pdfjs = await import('pdfjs-dist');
      const workerSrcModule = await import('pdfjs-dist/build/pdf.worker.mjs?url');
      if (pdfjs.GlobalWorkerOptions && workerSrcModule?.default) {
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrcModule.default;
      }
      return pdfjs;
    })();
  }
  return pdfjsLibPromise;
};

const MEDICATION_KEYWORDS = [
  'tablet',
  'tab',
  'capsule',
  'cap',
  'syrup',
  'dose',
  'doses',
  'ointment',
  'cream',
  'drops',
  'injection',
  'inj',
  'solution',
  'suspension',
  'medication',
  'medicine',
  'rx',
  'prescription'
];

const MEDICATION_REGEX = /\b(\d+(?:\.\d+)?)\s?(mg|ml|mcg|g|iu|tablet|tab|capsule|pill)\b/i;

const normalizeLine = (line) => line
  .replace(/[\t\r]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const extractMedicationLines = (text) => {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((line) => line.length > 3);

  const unique = new Map();
  const lowerKeywords = MEDICATION_KEYWORDS;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const lower = line.toLowerCase();
    const containsKeyword = lowerKeywords.some((keyword) => lower.includes(keyword));
    const matchesRegex = MEDICATION_REGEX.test(line);
    if (containsKeyword || matchesRegex) {
      if (!unique.has(lower)) {
        unique.set(lower, line);
      }
    }
  }

  return Array.from(unique.values());
};

export const useMedicationExtraction = () => {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const extractFromImage = useCallback(async (file) => {
    setStatus('processing-image');
    setProgress(0);
    const response = await Tesseract.recognize(file, 'eng', {
      logger: (message) => {
        if (message?.status === 'recognizing text' && typeof message.progress === 'number') {
          setProgress(Math.round(message.progress * 100));
        }
      },
    });
    setProgress(100);
    return response.data.text || '';
  }, []);

  const extractFromPdf = useCallback(async (file) => {
    setStatus('processing-pdf');
    setProgress(0);
    const arrayBuffer = await file.arrayBuffer();
    const pdfjs = await ensurePdfJs();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    let collectedText = '';
    for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex += 1) {
      const page = await pdfDocument.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      collectedText += `${pageText}\n`;
      setProgress(Math.round((pageIndex / pdfDocument.numPages) * 100));
    }
    return collectedText;
  }, []);

  const extractFromFile = useCallback(async (file) => {
    setError(null);
    if (!file) {
      throw new Error('No file provided');
    }
    let rawText = '';
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        rawText = await extractFromPdf(file);
      } else if (file.type.startsWith('image/')) {
        rawText = await extractFromImage(file);
      } else {
        throw new Error('Unsupported file type. Please upload an image or a PDF.');
      }
      const medications = extractMedicationLines(rawText);
      setStatus('completed');
      setProgress(100);
      return {
        rawText,
        medications,
        fileName: file.name,
        sourceType: file.type.startsWith('image/') ? 'image' : 'pdf',
      };
    } catch (err) {
      console.error('Medication extraction failed:', err);
      setError(err?.message || 'Failed to extract medications');
      setStatus('error');
      throw err;
    }
  }, [extractFromImage, extractFromPdf]);

  return useMemo(() => ({
    extractFromFile,
    status,
    progress,
    error,
    reset,
  }), [extractFromFile, status, progress, error, reset]);
};

export default useMedicationExtraction;
