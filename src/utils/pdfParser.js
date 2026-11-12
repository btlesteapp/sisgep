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
    fullText += pageText + ' ';
  }
  
  return fullText;
}

const ORDERED_ZONAS = [
  "CENTRO OESTE E CENTRO SUL",
  "LESTE",
  "NORTE",
  "OESTE",
  "SUL"
];

const ORDERED_CRIMES = [
  "ROUBO EM ESTABELECIMENTO COMERCIAL",
  "ROUBO DE VEÍCULO",
  "FURTO DE VEÍCULO",
  "ROUBO EM RESIDÊNCIA",
  "ROUBO A TRANSEUNTE",
  "ROUBO A COLETIVO",
  "HOMICÍDIO",
  "LATROCÍNIO"
];

/**
 * Analisador ultra-robusto de relatórios PDF de Indicadores por Zona de Manaus
 * Divide as 5 Zonas e 8 Crimes de forma exata e limpa
 * @param {string} rawText 
 * @returns {Array}
 */
export function parseZoneIndicatorsText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Texto vazio ou formato inválido.');
  }

  // Normaliza múltiplos espaços e quebras de linha para um único espaço
  const normalized = rawText
    .toUpperCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Localiza cada ocorrência das naturezas conhecidas
  const sortedCrimes = [...ORDERED_CRIMES].sort((a, b) => b.length - a.length);

  const occurrences = [];
  for (const crime of sortedCrimes) {
    let pos = 0;
    while ((pos = normalized.indexOf(crime, pos)) !== -1) {
      occurrences.push({ crime, index: pos });
      pos += crime.length;
    }
  }

  // Ordena pela posição no texto
  occurrences.sort((a, b) => a.index - b.index);

  // Remove sobreposições
  const nonOverlapping = [];
  let lastEnd = -1;
  for (const occ of occurrences) {
    if (occ.index >= lastEnd) {
      nonOverlapping.push(occ);
      lastEnd = occ.index + occ.crime.length;
    }
  }

  if (nonOverlapping.length === 0) {
    throw new Error('Nenhum crime/natureza reconhecido no arquivo.');
  }

  const rows = [];
  for (let i = 0; i < nonOverlapping.length; i++) {
    const current = nonOverlapping[i];
    const nextStart = i + 1 < nonOverlapping.length ? nonOverlapping[i + 1].index : normalized.length;
    let snippet = normalized.substring(current.index + current.crime.length, nextStart).trim();

    // Remove rodapés conhecidos
    const footerIdx = snippet.indexOf('INDICADORES');
    if (footerIdx !== -1) {
      snippet = snippet.substring(0, footerIdx).trim();
    }

    // Snippet contém: 6 números e o comparativo
    // Ex: "67 70 68 38 29 13 -16 REGISTROS"
    const tokens = snippet.split(' ').filter(Boolean);
    const nums = [];
    let compTokens = [];

    for (let t = 0; t < tokens.length; t++) {
      if (nums.length < 6 && /^\d+$/.test(tokens[t])) {
        nums.push(parseInt(tokens[t], 10));
      } else {
        compTokens.push(tokens[t]);
      }
    }

    let compStr = compTokens.join(' ').trim();
    const v2025 = nums[4] ?? 0;
    const v2026 = nums[5] ?? 0;
    let tipo = 'neutro';

    if (compStr) {
      if (compStr.includes('-')) tipo = 'queda';
      else if (compStr.includes('+') || (compStr.includes('%') && parseFloat(compStr) > 0)) tipo = 'alta';
      else if (compStr.includes('NEUTRO')) tipo = 'neutro';
    } else {
      if (v2026 < v2025) {
        tipo = 'queda';
        compStr = `-${v2025 - v2026} REGISTROS`;
      } else if (v2026 > v2025) {
        tipo = 'alta';
        compStr = `+${v2026 - v2025} REGISTROS`;
      } else {
        compStr = 'NEUTRO';
      }
    }

    rows.push({
      natureza: current.crime,
      v2021: nums[0] ?? 0,
      v2022: nums[1] ?? 0,
      v2023: nums[2] ?? 0,
      v2024: nums[3] ?? 0,
      v2025: v2025,
      v2026: v2026,
      comp: compStr,
      tipo
    });
  }

  // Agrupa os 8 crimes em cada uma das 5 Zonas
  const zones = [];
  const itemsPerZone = 8;
  for (let z = 0; z < ORDERED_ZONAS.length; z++) {
    const zonaName = ORDERED_ZONAS[z];
    const zoneItems = rows.slice(z * itemsPerZone, (z + 1) * itemsPerZone);
    if (zoneItems.length > 0) {
      zones.push({
        zona: zonaName,
        itens: zoneItems
      });
    }
  }

  return zones;
}
