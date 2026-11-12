import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Extrai texto completo de um arquivo PDF
 * @param {File} file 
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

const KNOWN_ZONAS = [
  "CENTRO OESTE E CENTRO SUL",
  "LESTE",
  "NORTE",
  "OESTE",
  "SUL"
];

const KNOWN_NATUREZAS = [
  "HOMICÍDIO",
  "LATROCÍNIO",
  "ROUBO DE VEÍCULO",
  "FURTO DE VEÍCULO",
  "ROUBO EM RESIDÊNCIA",
  "ROUBO A TRANSEUNTE",
  "ROUBO A COLETIVO",
  "ROUBO EM ESTABELECIMENTO COMERCIAL"
];

/**
 * Analisador inteligente de linhas do PDF ou texto colado
 * Reconhece Zonas, Crimes, Anos (2021 a 2026) e Comparativo
 */
export function parseZoneIndicatorsText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Texto vazio ou formato inválido.');
  }

  // Normaliza o texto
  const cleanText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .toUpperCase();

  const results = [];

  // Percorre cada zona conhecida
  KNOWN_ZONAS.forEach(zonaName => {
    const itens = [];

    // Localiza a seção da zona no texto ou analisa linha a linha
    KNOWN_NATUREZAS.forEach(natureza => {
      // Regex procurando a natureza seguida de números
      // Ex: HOMICÍDIO 67 70 68 38 29 13 -16 REGISTROS
      // ou com quebras de linha e tabulações
      const escapedNat = natureza.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Procura números após a menção da natureza
      const regex = new RegExp(
        `${escapedNat}[^0-9\\n]*([0-9]+)[^0-9\\n]+([0-9]+)[^0-9\\n]+([0-9]+)[^0-9\\n]+([0-9]+)[^0-9\\n]+([0-9]+)[^0-9\\n]+([0-9]+)([^\\n\\r]*)`,
        'gi'
      );

      // Vamos também tentar uma abordagem flexível baseada em tokens
      let match = regex.exec(cleanText);
      if (match) {
        const v2021 = parseInt(match[1], 10) || 0;
        const v2022 = parseInt(match[2], 10) || 0;
        const v2023 = parseInt(match[3], 10) || 0;
        const v2024 = parseInt(match[4], 10) || 0;
        const v2025 = parseInt(match[5], 10) || 0;
        const v2026 = parseInt(match[6], 10) || 0;
        const compRaw = (match[7] || '').trim();

        let tipo = 'neutro';
        if (compRaw.includes('-') || v2026 < v2025) tipo = 'queda';
        else if (compRaw.includes('+') || v2026 > v2025) tipo = 'alta';

        let compStr = compRaw;
        if (!compStr) {
          if (v2025 > 0) {
            const pct = Math.round(((v2026 - v2025) / v2025) * 100);
            compStr = `${pct > 0 ? '+' : ''}${pct}%`;
          } else {
            compStr = v2026 === v2025 ? 'NEUTRO' : `+${v2026 - v2025} REGISTROS`;
          }
        }

        itens.push({
          natureza,
          v2021,
          v2022,
          v2023,
          v2024,
          v2025,
          v2026,
          comp: compStr,
          tipo
        });
      }
    });

    if (itens.length > 0) {
      results.push({
        zona: zonaName,
        itens
      });
    }
  });

  return results;
}
