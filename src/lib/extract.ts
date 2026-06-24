import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ExtractProgress {
  stage: string;
  pct?: number;
}

async function extractPdf(
  file: File,
  onProgress?: (p: ExtractProgress) => void
): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    onProgress?.({ stage: `Reading page ${n}/${pdf.numPages}`, pct: n / pdf.numPages });
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    parts.push(text);
  }
  return parts.join("\n\n").trim();
}

async function extractImage(
  file: File,
  onProgress?: (p: ExtractProgress) => void
): Promise<string> {
  onProgress?.({ stage: "Running OCR on image…" });
  // tesseract.js is heavy; import it only when an image is actually processed.
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress?.({ stage: "Recognizing text…", pct: m.progress });
      }
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}

/** Extract plain text from a PDF, image, or text file. */
export async function extractTextFromFile(
  file: File,
  onProgress?: (p: ExtractProgress) => void
): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdf(file, onProgress);
  }
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|tiff?)$/.test(name)) {
    return extractImage(file, onProgress);
  }
  if (file.type.startsWith("text/") || /\.(txt|md|csv|rtf)$/.test(name)) {
    return (await file.text()).trim();
  }
  // Fallback: try to read as text.
  return (await file.text()).trim();
}
