import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import {
  Printer, Download, FileText, Filter, Calendar, Shield,
  ShieldAlert, ShieldCheck, CheckCircle, AlertTriangle, TrendingDown,
  TrendingUp, Minus, Settings2, SlidersHorizontal, CheckSquare, Square,
  RotateCcw, MapPin, Eye, FileSpreadsheet, UserCheck, ChevronDown, ChevronUp,
  BarChart3, Table as TableIcon, FileDown, Loader2, Image as ImageIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LabelList
} from 'recharts';
import { DEFAULT_ZONE_DATA } from '../components/ZoneIndicators';

const YEAR_COLORS = {
  2021: '#64748b',
  2022: '#8b5cf6',
  2023: '#06b6d4',
  2024: '#f59e0b',
  2025: '#94a3b8',
  2026: '#3b82f6',
};

const formatYearRange = (years) => {
  if (!years || years.length === 0) return '';
  if (years.length === 1) return `${years[0]}`;
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  if (minYear === maxYear) return `${minYear}`;
  return years.length >= 3 ? `${minYear} a ${maxYear}` : `${minYear} vs ${maxYear}`;
};

const getComparisonBadge = (valBase, valTarget, isInverse = false) => {
  const numBase = Number(valBase || 0);
  const numTarget = Number(valTarget || 0);
  const diff = numTarget - numBase;

  if (diff === 0) {
    return {
      text: '— NEUTRO',
      style: { background: 'rgba(148, 163, 184, 0.15)', color: '#64748b', border: '1px solid rgba(148, 163, 184, 0.3)' },
      icon: Minus
    };
  }

  const pct = numBase > 0 ? ((numTarget - numBase) / numBase) * 100 : (numTarget > 0 ? 100 : 0);
  const isGood = isInverse ? diff < 0 : diff > 0;
  const useAbsolute = (numBase < 15 && numTarget < 15);
  const formattedDiff = diff > 0 ? `+${diff % 1 === 0 ? diff : diff.toFixed(1)}` : `${diff % 1 === 0 ? diff : diff.toFixed(1)}`;
  const formattedPct = `${pct > 0 ? `+${pct.toFixed(0)}%` : `${pct.toFixed(0)}%`}`;

  const text = useAbsolute
    ? `${formattedDiff} REGISTROS`
    : `${formattedPct}${Math.abs(pct) >= 20 ? ' 👍' : ''}`;

  if (isGood) {
    return {
      text,
      style: { background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' },
      icon: isInverse ? TrendingDown : TrendingUp
    };
  } else {
    return {
      text,
      style: { background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)' },
      icon: isInverse ? TrendingUp : TrendingDown
    };
  }
};

const Reports = () => {
  const { statsData, prodData, MONTHS, YEARS, STATS_ITEMS, PROD_ITEMS } = useData();

  // Controles de Configuração do Relatório
  const [showFilters, setShowFilters] = useState(true);
  const [reportTitle, setReportTitle] = useState('RELATÓRIO ESTATÍSTICO E OPERACIONAL');
  const [reportSubtitle, setReportSubtitle] = useState('BATALHÃO DE POLICIAMENTO DE ÁREA LESTE - BTL LESTE / PMAM');
  const [officerName, setOfficerName] = useState('COMANDANTE DO BATALHÃO LESTE');
  const [commandNotes, setCommandNotes] = useState('O presente relatório consolidado apresenta o comportamento dos indicadores de criminalidade e a produtividade operacional policial referente ao período analisado, evidenciando as ações preventivas e repressivas desenvolvidas.');

  // Módulos
  const [includeCrimes, setIncludeCrimes] = useState(true);
  const [includeProd, setIncludeProd] = useState(true);
  const [includeZones, setIncludeZones] = useState(true);

  // Elementos Visuais
  const [includeKPIs, setIncludeKPIs] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  // Modos de exibição por abas (Tabela Oficial, Gráfico Comparativo ou Ambos)
  const [crimeViewMode, setCrimeViewMode] = useState('ambos'); // 'tabela' | 'grafico' | 'ambos'
  const [prodViewMode, setProdViewMode] = useState('ambos');   // 'tabela' | 'grafico' | 'ambos'

  // Filtro de Anos (Padrão: Todos de 2021 a 2026)
  const [selectedYears, setSelectedYears] = useState([2021, 2022, 2023, 2024, 2025, 2026]);

  // Filtro de Meses (Padrão: Jan a Set - 0 a 8)
  const [selectedMonths, setSelectedMonths] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8]);

  // Itens específicos selecionados (por padrão, todos)
  const [selectedCrimes, setSelectedCrimes] = useState(STATS_ITEMS);
  const [selectedProds, setSelectedProds] = useState(PROD_ITEMS);

  // Carrega dados de zona
  const zoneData = useMemo(() => {
    try {
      const saved = localStorage.getItem('sisgep_zone_indicators');
      return saved ? JSON.parse(saved) : DEFAULT_ZONE_DATA;
    } catch {
      return DEFAULT_ZONE_DATA;
    }
  }, []);

  // Cálculos do período
  const baseYear = selectedYears.length > 1 ? Math.min(...selectedYears) : (selectedYears[0] > 2021 ? selectedYears[0] - 1 : selectedYears[0] || 2025);
  const targetYear = selectedYears.length > 0 ? Math.max(...selectedYears) : 2026;
  const rangeLabel = formatYearRange(selectedYears);

  const getPeriodLabel = () => {
    if (selectedMonths.length === 12) return 'ANO INTEIRO (JAN A DEZ)';
    if (selectedMonths.length === 9 && selectedMonths.every((m, idx) => m === idx)) return 'JAN A SET';
    if (selectedMonths.length === 6 && selectedMonths.every((m, idx) => m === idx)) return '1º SEMESTRE';
    if (selectedMonths.length === 6 && selectedMonths.every((m, idx) => m === idx + 6)) return '2º SEMESTRE';
    return selectedMonths.map(i => MONTHS[i]).join(', ');
  };

  const getMonthsTotal = (type, year, item) => {
    const dataArray = type === 'stats' ? statsData[year]?.[item] : prodData[year]?.[item];
    if (!dataArray) return 0;
    return selectedMonths.reduce((acc, mIdx) => acc + Number(dataArray[mIdx] || 0), 0);
  };

  // Totais Consolidados de Crimes
  const totalCrimesByYear = useMemo(() => {
    const res = {};
    selectedYears.forEach(y => {
      res[y] = selectedCrimes.reduce((acc, item) => acc + getMonthsTotal('stats', y, item), 0);
    });
    return res;
  }, [selectedYears, selectedCrimes, statsData, selectedMonths]);

  // Totais Consolidados de Produtividade
  const totalProdByYear = useMemo(() => {
    const res = {};
    selectedYears.forEach(y => {
      res[y] = selectedProds.reduce((acc, item) => acc + getMonthsTotal('prod', y, item), 0);
    });
    return res;
  }, [selectedYears, selectedProds, prodData, selectedMonths]);

  // Dados para Gráfico de Crimes
  const crimeChartData = useMemo(() => {
    return selectedCrimes.map(item => {
      const row = { name: item };
      selectedYears.forEach(y => {
        row[`Ano ${y}`] = getMonthsTotal('stats', y, item);
      });
      return row;
    });
  }, [selectedCrimes, selectedYears, statsData, selectedMonths]);

  // Dados para Gráfico de Produtividade
  const prodChartData = useMemo(() => {
    return selectedProds.map(item => {
      const row = { name: item.replace(' (TRÁFICO)', '').replace(' APREENDIDAS', '') };
      selectedYears.forEach(y => {
        row[`Ano ${y}`] = getMonthsTotal('prod', y, item);
      });
      return row;
    });
  }, [selectedProds, selectedYears, prodData, selectedMonths]);

  // Variação de Crimes (Base vs Target)
  const crimesTotalBase = totalCrimesByYear[baseYear] || 0;
  const crimesTotalTarget = totalCrimesByYear[targetYear] || 0;
  const crimesBadge = getComparisonBadge(crimesTotalBase, crimesTotalTarget, true);

  // Variação de Homicídios (Homicídio Doloso)
  const homicidiosBase = getMonthsTotal('stats', baseYear, 'HOMICÍDIO DOLOSO');
  const homicidiosTarget = getMonthsTotal('stats', targetYear, 'HOMICÍDIO DOLOSO');
  const homicidiosBadge = getComparisonBadge(homicidiosBase, homicidiosTarget, true);

  // Variação de Roubos
  const roubosBase = getMonthsTotal('stats', baseYear, 'ROUBO');
  const roubosTarget = getMonthsTotal('stats', targetYear, 'ROUBO');
  const roubosBadge = getComparisonBadge(roubosBase, roubosTarget, true);

  // Exportar dados como CSV
  const handleExportCsv = () => {
    let csv = `RELATORIO: ${reportTitle}\nPERIODO: ${getPeriodLabel()} - ${rangeLabel}\n\n`;

    if (includeCrimes) {
      csv += `--- INDICES CRIMINAIS ---\nNATUREZA;${selectedYears.join(';')};COMPARATIVO\n`;
      selectedCrimes.forEach(item => {
        const row = [item];
        selectedYears.forEach(y => row.push(getMonthsTotal('stats', y, item)));
        const b = getComparisonBadge(getMonthsTotal('stats', baseYear, item), getMonthsTotal('stats', targetYear, item), true);
        row.push(b.text.replace('👍', ''));
        csv += `${row.join(';')}\n`;
      });
      csv += `\n`;
    }

    if (includeProd) {
      csv += `--- PRODUTIVIDADE POLICIAL ---\nINDICADOR;${selectedYears.join(';')};COMPARATIVO\n`;
      selectedProds.forEach(item => {
        const row = [item];
        selectedYears.forEach(y => row.push(getMonthsTotal('prod', y, item)));
        const b = getComparisonBadge(getMonthsTotal('prod', baseYear, item), getMonthsTotal('prod', targetYear, item), false);
        row.push(b.text.replace('👍', ''));
        csv += `${row.join(';')}\n`;
      });
      csv += `\n`;
    }

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_sisgep_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  // Captura do relatório para PDF/Imagem com adaptação para telas mobile
  const generateReportCanvas = async () => {
    if (!reportRef.current) throw new Error("Documento não encontrado");

    if (document.fonts) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(reportRef.current, {
      scale: 2, // Resolução 2x para máxima nitidez
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1050, // Garante proporção de A4 desktop mesmo se estiver no celular
      onclone: (clonedDoc) => {
        const clonedReport = clonedDoc.querySelector('.report-document');
        if (clonedReport) {
          clonedReport.style.width = '1050px';
          clonedReport.style.minWidth = '1050px';
          clonedReport.style.maxWidth = '1050px';
          clonedReport.style.margin = '0 auto';
          clonedReport.style.padding = '20px 28px';
          clonedReport.style.boxSizing = 'border-box';
          clonedReport.style.boxShadow = 'none';
          clonedReport.style.borderRadius = '0';
        }

        // Garante que tabelas não fiquem cortadas por overflow horizontal
        const scrollContainers = clonedDoc.querySelectorAll('.report-document div');
        scrollContainers.forEach(container => {
          if (container.style && (container.style.overflowX === 'auto' || container.style.overflow === 'auto')) {
            container.style.overflow = 'visible';
            container.style.overflowX = 'visible';
            container.style.width = '100%';
          }
        });

        // Oculta abas e controles no-print no documento gerado
        const noPrintEls = clonedDoc.querySelectorAll('.no-print');
        noPrintEls.forEach(el => {
          el.style.display = 'none';
        });

        // Substitui textareas por divs para que todo o parecer apareça sem scrollbar
        const textareas = clonedDoc.querySelectorAll('.report-document textarea');
        textareas.forEach(ta => {
          const div = clonedDoc.createElement('div');
          div.style.cssText = ta.style.cssText;
          div.style.whiteSpace = 'pre-wrap';
          div.style.wordBreak = 'break-word';
          div.style.border = 'none';
          div.style.outline = 'none';
          div.innerText = ta.value;
          ta.parentNode.replaceChild(div, ta);
        });
      }
    });

    return canvas;
  };

  // Gerador direto de PDF (compatível com mobile e desktop)
  const handleDownloadPdf = async () => {
    if (!reportRef.current || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setProgressMessage('Preparando...');

    try {
      setProgressMessage('Renderizando páginas...');
      const canvas = await generateReportCanvas();

      setProgressMessage('Montando PDF A4...');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Primeira página
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Páginas subsequentes se ultrapassar 1 folha A4
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const safeTitle = (reportTitle || 'Relatorio_BTL_LESTE').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safeTitle}_${Date.now()}.pdf`;

      // Salva o PDF diretamente no aparelho
      pdf.save(fileName);
      setProgressMessage('Concluído!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Não foi possível gerar o PDF diretamente. Tentando abrir caixa de diálogo de impressão...');
      window.print();
    } finally {
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setProgressMessage('');
      }, 1500);
    }
  };

  // Gerador de Imagem PNG em alta resolução
  const handleDownloadImage = async () => {
    if (!reportRef.current || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setProgressMessage('Gerando imagem...');

    try {
      const canvas = await generateReportCanvas();
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      const safeTitle = (reportTitle || 'Relatorio_BTL_LESTE').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `${safeTitle}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setProgressMessage('Imagem salva!');
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      alert('Erro ao gerar imagem do relatório.');
    } finally {
      setTimeout(() => {
        setIsGeneratingImage(false);
        setProgressMessage('');
      }, 1500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleYear = (y) => {
    if (selectedYears.includes(y)) {
      if (selectedYears.length === 1) return;
      setSelectedYears(selectedYears.filter(item => item !== y));
    } else {
      setSelectedYears([...selectedYears, y].sort((a, b) => a - b));
    }
  };

  const toggleMonth = (m) => {
    if (selectedMonths.includes(m)) {
      if (selectedMonths.length === 1) return;
      setSelectedMonths(selectedMonths.filter(item => item !== m));
    } else {
      setSelectedMonths([...selectedMonths, m].sort((a, b) => a - b));
    }
  };

  return (
    <div className="reports-page animate-fade-in" style={{ paddingBottom: '4rem' }}>

      {/* BARRA DE FERRAMENTAS SUPERIOR (NÃO APARECE NA IMPRESSÃO) */}
      <div className="no-print" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={24} color="var(--primary-color)" />
              <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Relatório Personalizado</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              Configure os filtros, ative os módulos desejados e gere relatórios operacionais oficiais
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: showFilters ? 'var(--primary-glow)' : 'var(--surface-color)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-color)'
              }}
            >
              <SlidersHorizontal size={15} />
              {showFilters ? 'Ocultar Filtros' : 'Ajustar Filtros'}
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <button
              onClick={handleExportCsv}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: 'var(--surface-color)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-color)'
              }}
              title="Exportar planilha CSV com todos os dados"
            >
              <Download size={14} /> Exportar CSV
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: isGeneratingPdf ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                whiteSpace: 'nowrap'
              }}
              title="Baixar arquivo PDF oficial A4 diretamente no aparelho"
            >
              {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
              {isGeneratingPdf ? (progressMessage || 'Gerando PDF...') : 'Baixar PDF'}
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage || isGeneratingPdf}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: 'var(--surface-color)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-color)',
                whiteSpace: 'nowrap'
              }}
              title="Salvar como imagem PNG para WhatsApp ou visualização rápida"
            >
              <ImageIcon size={14} /> Baixar Imagem (PNG)
            </button>

            <button
              onClick={handlePrint}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: 'var(--surface-color)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-color)'
              }}
              title="Abrir caixa de diálogo do navegador para impressão"
            >
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </div>

        {/* PAINEL DE CONTROLE DE FILTROS (COLAPSÁVEL) */}
        {showFilters && (
          <div className="glass-panel" style={{ padding: '1.2rem', marginTop: '1.2rem', borderRadius: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>

              {/* Coluna 1: Anos e Meses */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> 1. Filtro de Período
                </h4>

                {/* Anos */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>Anos Selecionados:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => setSelectedYears([...YEARS])} style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Todos</button>
                      <button onClick={() => setSelectedYears([2025, 2026])} style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>25/26</button>
                      <button onClick={() => setSelectedYears([2021, 2026])} style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>21/26</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {YEARS.map(y => {
                      const isSel = selectedYears.includes(y);
                      return (
                        <button
                          key={y}
                          onClick={() => toggleYear(y)}
                          style={{
                            flex: '1 0 calc(16.66% - 4px)',
                            padding: '5px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: isSel ? '800' : '600',
                            border: isSel ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
                            background: isSel ? 'var(--primary-color)' : 'transparent',
                            color: isSel ? '#fff' : 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Meses */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>Meses Selecionados:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => setSelectedMonths([0, 1, 2, 3, 4, 5, 6, 7, 8])} style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Jan a Set</button>
                      <button onClick={() => setSelectedMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])} style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Todos</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    {MONTHS.map((m, idx) => {
                      const isSel = selectedMonths.includes(idx);
                      return (
                        <button
                          key={m}
                          onClick={() => toggleMonth(idx)}
                          style={{
                            flex: '1 0 calc(16.66% - 4px)',
                            padding: '4px',
                            borderRadius: '5px',
                            fontSize: '0.68rem',
                            fontWeight: isSel ? '800' : '600',
                            border: isSel ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
                            background: isSel ? 'var(--primary-color)' : 'transparent',
                            color: isSel ? '#fff' : 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Coluna 2: Módulos e Componentes do Relatório */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={14} /> 2. Módulos & Estrutura
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                    <input type="checkbox" checked={includeCrimes} onChange={e => setIncludeCrimes(e.target.checked)} />
                    Índices Criminais
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                    <input type="checkbox" checked={includeProd} onChange={e => setIncludeProd(e.target.checked)} />
                    Produtividade Policial
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                    <input type="checkbox" checked={includeZones} onChange={e => setIncludeZones(e.target.checked)} />
                    Indicadores por Zona
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                    <input type="checkbox" checked={includeKPIs} onChange={e => setIncludeKPIs(e.target.checked)} />
                    Cards de Resumo (KPIs)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                    <input type="checkbox" checked={includeTables} onChange={e => setIncludeTables(e.target.checked)} />
                    Tabelas Oficiais
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                    <input type="checkbox" checked={includeCharts} onChange={e => setIncludeCharts(e.target.checked)} />
                    Gráficos Comparativos
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                    <input type="checkbox" checked={includeNotes} onChange={e => setIncludeNotes(e.target.checked)} />
                    Parecer do Comando
                  </label>
                </div>
              </div>

              {/* Coluna 3: Título, Despacho e Assinatura */}
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Settings2 size={14} /> 3. Textos do Relatório
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Título do Documento:</span>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={e => setReportTitle(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--surface-border)', background: 'var(--surface-color)', color: 'var(--text-color)', fontSize: '0.75rem' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Subtítulo / Órgão:</span>
                    <input
                      type="text"
                      value={reportSubtitle}
                      onChange={e => setReportSubtitle(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--surface-border)', background: 'var(--surface-color)', color: 'var(--text-color)', fontSize: '0.75rem' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Oficial / Assinante:</span>
                    <input
                      type="text"
                      value={officerName}
                      onChange={e => setOfficerName(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--surface-border)', background: 'var(--surface-color)', color: 'var(--text-color)', fontSize: '0.75rem' }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* DOCUMENTO OFICIAL PARA IMPRESSÃO E VISUALIZAÇÃO (FOLHA TIMBRADA) */}
      <div
        ref={reportRef}
        className="report-document"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          padding: '1.2rem 1.6rem',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          maxWidth: '1050px',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* CABEÇALHO OFICIAL TIMBRADO */}
        <header
          className="report-header"
          style={{
            borderBottom: '2px solid #0f172a',
            paddingBottom: '0.4rem',
            marginBottom: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            boxSizing: 'border-box',
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <img
              src="./logo.png"
              alt="Logo BTL LESTE"
              style={{ width: '38px', height: '38px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '0.70rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.3px', color: '#0f172a', lineHeight: 1.15 }}>
                POLÍCIA MILITAR DO ESTADO DO AMAZONAS
              </h2>
              <h3 style={{ fontSize: '0.65rem', fontWeight: '800', margin: '1px 0', textTransform: 'uppercase', color: '#1e3a8a', lineHeight: 1.15 }}>
                BATALHÃO LESTE - CONQUISTAR E MANTER!
              </h3>
              <p style={{ fontSize: '0.58rem', fontWeight: '700', margin: 0, color: '#475569', textTransform: 'uppercase', lineHeight: 1.15 }}>
                {reportSubtitle}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.58rem', color: '#475569', flexShrink: 0, marginLeft: '8px' }}>
            <div style={{ whiteSpace: 'nowrap' }}>
              <strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ marginTop: '2px' }}>
              <span style={{
                background: '#e0e7ff',
                color: '#1e3a8a',
                padding: '2px 5px',
                borderRadius: '4px',
                fontWeight: '800',
                fontSize: '0.56rem',
                display: 'inline-block',
                whiteSpace: 'nowrap'
              }}>
                PERÍODO: {getPeriodLabel()} ({rangeLabel})
              </span>
            </div>
          </div>
        </header>

        {/* TÍTULO PRINCIPAL DO DOCUMENTO */}
        <div style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
          <h1 style={{ fontSize: '0.90rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.2px', color: '#0f172a' }}>
            {reportTitle}
          </h1>
          <p style={{ fontSize: '0.62rem', color: '#64748b', margin: '2px 0 0 0', fontWeight: '600' }}>
            Série Histórica e Balanço Comparativo de Desempenho Operacional
          </p>
        </div>

        {/* 1. CARDS DE RESUMO EXECUTIVO (KPIS) */}
        {includeKPIs && (
          <section style={{ marginBottom: '0.8rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.45rem'
            }}>
              {includeCrimes && (
                <>
                  {/* Card 1: Total de Crimes */}
                  <div style={{ padding: '0.35rem 0.6rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', borderLeft: '3.5px solid #ef4444' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                      Total de Crimes ({targetYear})
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '1px' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: '900', color: '#0f172a' }}>
                        {crimesTotalTarget.toLocaleString('pt-BR')}
                      </span>
                      <span style={{ fontSize: '0.56rem', fontWeight: '800', ...crimesBadge.style, padding: '1px 5px', borderRadius: '4px' }}>
                        {crimesBadge.text}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.52rem', color: '#94a3b8', marginTop: '1px' }}>
                      vs {baseYear} ({crimesTotalBase.toLocaleString('pt-BR')} reg.)
                    </div>
                  </div>

                  {/* Card 2: Homicídios */}
                  <div style={{ padding: '0.35rem 0.6rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', borderLeft: '3.5px solid #b91c1c' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                      Homicídios ({targetYear})
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '1px' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: '900', color: '#0f172a' }}>
                        {homicidiosTarget.toLocaleString('pt-BR')}
                      </span>
                      <span style={{ fontSize: '0.56rem', fontWeight: '800', ...homicidiosBadge.style, padding: '1px 5px', borderRadius: '4px' }}>
                        {homicidiosBadge.text}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.52rem', color: '#94a3b8', marginTop: '1px' }}>
                      vs {baseYear} ({homicidiosBase.toLocaleString('pt-BR')} reg.)
                    </div>
                  </div>

                  {/* Card 3: Roubos */}
                  <div style={{ padding: '0.35rem 0.6rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', borderLeft: '3.5px solid #ea580c' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                      Roubos ({targetYear})
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '1px' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: '900', color: '#0f172a' }}>
                        {roubosTarget.toLocaleString('pt-BR')}
                      </span>
                      <span style={{ fontSize: '0.56rem', fontWeight: '800', ...roubosBadge.style, padding: '1px 5px', borderRadius: '4px' }}>
                        {roubosBadge.text}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.52rem', color: '#94a3b8', marginTop: '1px' }}>
                      vs {baseYear} ({roubosBase.toLocaleString('pt-BR')} reg.)
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* 2. MÓDULO: ÍNDICES CRIMINAIS */}
        {includeCrimes && (
          <section style={{ marginBottom: '1.2rem', pageBreakInside: 'avoid' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1.5px solid #e2e8f0',
              paddingBottom: '3px',
              marginBottom: '0.45rem',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={15} color="#dc2626" />
                <h3 style={{ fontSize: '0.76rem', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
                  1. Índices Criminais ({rangeLabel})
                </h3>
              </div>

              {/* Abas de alternância de exibição (Tabela / Gráfico / Ambos) */}
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setCrimeViewMode('ambos')}
                  style={{
                    padding: '2px 7px',
                    fontSize: '0.60rem',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: crimeViewMode === 'ambos' ? '#dc2626' : 'transparent',
                    color: crimeViewMode === 'ambos' ? '#fff' : '#64748b'
                  }}
                >
                  Ambos
                </button>
                <button
                  type="button"
                  onClick={() => setCrimeViewMode('tabela')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 7px',
                    fontSize: '0.60rem',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: crimeViewMode === 'tabela' ? '#dc2626' : 'transparent',
                    color: crimeViewMode === 'tabela' ? '#fff' : '#64748b'
                  }}
                >
                  <TableIcon size={10} /> Tabela
                </button>
                <button
                  type="button"
                  onClick={() => setCrimeViewMode('grafico')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 7px',
                    fontSize: '0.60rem',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: crimeViewMode === 'grafico' ? '#dc2626' : 'transparent',
                    color: crimeViewMode === 'grafico' ? '#fff' : '#64748b'
                  }}
                >
                  <BarChart3 size={10} /> Gráfico
                </button>
              </div>
            </div>

            {includeTables && (crimeViewMode === 'ambos' || crimeViewMode === 'tabela') && (
              <div style={{ overflowX: 'auto', marginBottom: (includeCharts && (crimeViewMode === 'ambos' || crimeViewMode === 'grafico')) ? '0.6rem' : '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.65rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1.5px solid #cbd5e1' }}>
                      <th style={{ padding: '4px 6px', textAlign: 'left', minWidth: '160px' }}>NATUREZA</th>
                      {selectedYears.map(y => (
                        <th key={y} style={{ padding: '4px 4px', minWidth: '45px', background: y === targetYear ? '#fee2e2' : 'transparent', color: y === targetYear ? '#dc2626' : 'inherit' }}>
                          {y}
                        </th>
                      ))}
                      <th style={{ padding: '4px 6px', minWidth: '115px' }}>
                        COMPARATIVO % ({rangeLabel})
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCrimes.map((item, idx) => {
                      const valBase = getMonthsTotal('stats', baseYear, item);
                      const valTarget = getMonthsTotal('stats', targetYear, item);
                      const badge = getComparisonBadge(valBase, valTarget, true);
                      const BadgeIcon = badge.icon;

                      return (
                        <tr key={item} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '3px 6px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>
                            {item}
                          </td>
                          {selectedYears.map(y => {
                            const val = getMonthsTotal('stats', y, item);
                            const isTarget = y === targetYear;
                            return (
                              <td key={y} style={{ padding: '3px 4px', fontWeight: isTarget ? '800' : '500', color: isTarget ? '#dc2626' : '#475569' }}>
                                {val.toLocaleString('pt-BR')}
                              </td>
                            );
                          })}
                          <td style={{ padding: '2px 4px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '1px 5px', borderRadius: '3px', fontSize: '0.58rem', fontWeight: '800', ...badge.style }}>
                              <BadgeIcon size={9} /> {badge.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Linha Total */}
                    <tr style={{ background: '#f1f5f9', fontWeight: '900', borderTop: '1.5px solid #cbd5e1' }}>
                      <td style={{ padding: '5px 6px', textAlign: 'left', color: '#0f172a' }}>TOTAL DE OCORRÊNCIAS</td>
                      {selectedYears.map(y => (
                        <td key={y} style={{ padding: '5px 4px', fontSize: '0.70rem', color: y === targetYear ? '#dc2626' : '#0f172a' }}>
                          {totalCrimesByYear[y].toLocaleString('pt-BR')}
                        </td>
                      ))}
                      <td style={{ padding: '4px 5px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '2px 6px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: '900', ...crimesBadge.style }}>
                          <crimesBadge.icon size={10} /> {crimesBadge.text}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {includeCharts && (crimeViewMode === 'ambos' || crimeViewMode === 'grafico') && (
              <div style={{ height: '160px', width: '100%', marginTop: '0.4rem', background: '#f8fafc', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crimeChartData} margin={{ top: 8, right: 8, left: -15, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={7} interval={0} angle={-20} textAnchor="end" height={30} />
                    <YAxis stroke="#64748b" fontSize={7.5} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '0.62rem', paddingTop: '2px' }} />
                    {selectedYears.map((y, idx) => {
                      const isTarget = idx === selectedYears.length - 1;
                      const barColor = selectedYears.length === 2 ? (isTarget ? '#dc2626' : '#94a3b8') : (YEAR_COLORS[y] || '#dc2626');
                      return <Bar key={y} dataKey={`Ano ${y}`} fill={barColor} radius={[2, 2, 0, 0]} />;
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        {/* 3. MÓDULO: PRODUTIVIDADE POLICIAL */}
        {includeProd && (
          <section style={{ marginBottom: '1.2rem', pageBreakInside: 'avoid' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1.5px solid #e2e8f0',
              paddingBottom: '3px',
              marginBottom: '0.45rem',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} color="#059669" />
                <h3 style={{ fontSize: '0.76rem', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
                  2. Produtividade Policial ({rangeLabel})
                </h3>
              </div>

              {/* Abas de alternância de exibição (Tabela / Gráfico / Ambos) */}
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => setProdViewMode('ambos')}
                  style={{
                    padding: '2px 7px',
                    fontSize: '0.60rem',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: prodViewMode === 'ambos' ? '#059669' : 'transparent',
                    color: prodViewMode === 'ambos' ? '#fff' : '#64748b'
                  }}
                >
                  Ambos
                </button>
                <button
                  type="button"
                  onClick={() => setProdViewMode('tabela')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 7px',
                    fontSize: '0.60rem',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: prodViewMode === 'tabela' ? '#059669' : 'transparent',
                    color: prodViewMode === 'tabela' ? '#fff' : '#64748b'
                  }}
                >
                  <TableIcon size={10} /> Tabela
                </button>
                <button
                  type="button"
                  onClick={() => setProdViewMode('grafico')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '2px 7px',
                    fontSize: '0.60rem',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: prodViewMode === 'grafico' ? '#059669' : 'transparent',
                    color: prodViewMode === 'grafico' ? '#fff' : '#64748b'
                  }}
                >
                  <BarChart3 size={10} /> Gráfico
                </button>
              </div>
            </div>

            {includeTables && (prodViewMode === 'ambos' || prodViewMode === 'tabela') && (
              <div style={{ overflowX: 'auto', marginBottom: (includeCharts && (prodViewMode === 'ambos' || prodViewMode === 'grafico')) ? '0.6rem' : '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.65rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1.5px solid #cbd5e1' }}>
                      <th style={{ padding: '4px 6px', textAlign: 'left', minWidth: '160px' }}>INDICADOR</th>
                      {selectedYears.map(y => (
                        <th key={y} style={{ padding: '4px 4px', minWidth: '45px', background: y === targetYear ? '#d1fae5' : 'transparent', color: y === targetYear ? '#059669' : 'inherit' }}>
                          {y}
                        </th>
                      ))}
                      <th style={{ padding: '4px 6px', minWidth: '115px' }}>
                        COMPARATIVO % ({rangeLabel})
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProds.map((item, idx) => {
                      const valBase = getMonthsTotal('prod', baseYear, item);
                      const valTarget = getMonthsTotal('prod', targetYear, item);
                      const badge = getComparisonBadge(valBase, valTarget, false);
                      const BadgeIcon = badge.icon;

                      return (
                        <tr key={item} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '3px 6px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>
                            {item}
                          </td>
                          {selectedYears.map(y => {
                            const val = getMonthsTotal('prod', y, item);
                            const isTarget = y === targetYear;
                            return (
                              <td key={y} style={{ padding: '3px 4px', fontWeight: isTarget ? '800' : '500', color: isTarget ? '#059669' : '#475569' }}>
                                {typeof val === 'number' ? (val % 1 === 0 ? val.toLocaleString('pt-BR') : val.toFixed(2)) : val}
                              </td>
                            );
                          })}
                          <td style={{ padding: '2px 4px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '1px 5px', borderRadius: '3px', fontSize: '0.58rem', fontWeight: '800', ...badge.style }}>
                              <BadgeIcon size={9} /> {badge.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Linha Total Produtividade */}
                    <tr style={{ background: '#f1f5f9', fontWeight: '900', borderTop: '1.5px solid #cbd5e1' }}>
                      <td style={{ padding: '5px 6px', textAlign: 'left', color: '#0f172a' }}>TOTAL DE INTERVENÇÕES</td>
                      {selectedYears.map(y => (
                        <td key={y} style={{ padding: '5px 4px', fontSize: '0.70rem', color: y === targetYear ? '#059669' : '#0f172a' }}>
                          {totalProdByYear[y].toFixed(1).replace(/\.0$/, '')}
                        </td>
                      ))}
                      <td style={{ padding: '4px 5px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '2px 6px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: '900', ...getComparisonBadge(totalProdByYear[baseYear], totalProdByYear[targetYear], false).style }}>
                          {getComparisonBadge(totalProdByYear[baseYear], totalProdByYear[targetYear], false).text}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {includeCharts && (prodViewMode === 'ambos' || prodViewMode === 'grafico') && (
              <div style={{ height: '160px', width: '100%', marginTop: '0.4rem', background: '#f8fafc', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prodChartData} margin={{ top: 8, right: 8, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={7} interval={0} angle={-15} textAnchor="end" height={25} />
                    <YAxis stroke="#64748b" fontSize={7.5} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '0.62rem', paddingTop: '2px' }} />
                    {selectedYears.map((y, idx) => {
                      const isTarget = idx === selectedYears.length - 1;
                      const barColor = selectedYears.length === 2 ? (isTarget ? '#059669' : '#94a3b8') : (YEAR_COLORS[y] || '#059669');
                      return <Bar key={y} dataKey={`Ano ${y}`} fill={barColor} radius={[2, 2, 0, 0]} />;
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        {/* 4. MÓDULO: INDICADORES POR ZONA (RESUMO) */}
        {includeZones && (
          <section style={{ marginBottom: '1.2rem', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '3px', marginBottom: '0.45rem' }}>
              <MapPin size={15} color="#2563eb" />
              <h3 style={{ fontSize: '0.76rem', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
                3. Comparativo por Região Policial (Manaus)
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.65rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1.5px solid #cbd5e1' }}>
                    <th style={{ padding: '4px 6px', textAlign: 'left' }}>ZONA POLICIAL</th>
                    <th style={{ padding: '4px 5px' }}>2021</th>
                    <th style={{ padding: '4px 5px' }}>2022</th>
                    <th style={{ padding: '4px 5px' }}>2023</th>
                    <th style={{ padding: '4px 5px' }}>2024</th>
                    <th style={{ padding: '4px 5px', background: '#e0f2fe' }}>2025</th>
                    <th style={{ padding: '4px 5px', background: '#fee2e2', color: '#dc2626', fontWeight: '900' }}>2026</th>
                    <th style={{ padding: '4px 6px' }}>COMPARATIVO % (2025 vs 2026)</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneData.map((z, idx) => {
                    const t2021 = z.itens.reduce((acc, curr) => acc + (curr.v2021 || 0), 0);
                    const t2022 = z.itens.reduce((acc, curr) => acc + (curr.v2022 || 0), 0);
                    const t2023 = z.itens.reduce((acc, curr) => acc + (curr.v2023 || 0), 0);
                    const t2024 = z.itens.reduce((acc, curr) => acc + (curr.v2024 || 0), 0);
                    const t2025 = z.itens.reduce((acc, curr) => acc + (curr.v2025 || 0), 0);
                    const t2026 = z.itens.reduce((acc, curr) => acc + (curr.v2026 || 0), 0);
                    const badge = getComparisonBadge(t2025, t2026, true);
                    const BadgeIcon = badge.icon;

                    return (
                      <tr key={z.zona} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '3px 6px', textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>
                          ZONA {z.zona}
                        </td>
                        <td style={{ padding: '3px 5px', color: '#64748b' }}>{t2021.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '3px 5px', color: '#64748b' }}>{t2022.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '3px 5px', color: '#64748b' }}>{t2023.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '3px 5px', color: '#64748b' }}>{t2024.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '3px 5px', fontWeight: '700', color: '#0f172a', background: '#f0f9ff' }}>{t2025.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '3px 5px', fontWeight: '900', color: '#dc2626', background: '#fff1f2' }}>{t2026.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '2px 4px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '1px 5px', borderRadius: '3px', fontSize: '0.58rem', fontWeight: '800', ...badge.style }}>
                            <BadgeIcon size={9} /> {badge.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 5. PARECER / DESPACHO DO COMANDO */}
        {includeNotes && (
          <section style={{
            marginTop: '0.8rem',
            padding: '0.6rem 0.8rem',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            pageBreakInside: 'avoid'
          }}>
            <h4 style={{ fontSize: '0.70rem', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', margin: '0 0 3px 0' }}>
              4. Parecer Técnico-Operacional do Comando
            </h4>
            <textarea
              value={commandNotes}
              onChange={e => setCommandNotes(e.target.value)}
              className="notes-textarea"
              style={{
                width: '100%',
                minHeight: '42px',
                border: 'none',
                background: 'transparent',
                color: '#334155',
                fontSize: '0.66rem',
                lineHeight: '1.35',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </section>
        )}

        {/* 6. ASSINATURA E RODAPÉ OFICIAL */}
        <footer style={{
          marginTop: '1.2rem',
          paddingTop: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pageBreakInside: 'avoid'
        }}>
          <div style={{ width: '180px', borderTop: '1.5px solid #0f172a', marginBottom: '3px' }}></div>
          <p style={{ margin: 0, fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a' }}>
            {officerName}
          </p>
          <p style={{ margin: '1px 0 0 0', fontSize: '0.58rem', color: '#64748b', textTransform: 'uppercase' }}>
            Batalhão de Policiamento de Área Leste • PMAM
          </p>
          <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: '1rem', textAlign: 'center' }}>
            Documento gerado eletronicamente pelo SISGEP-LESTE • Batalhão Leste • Conquistar e Manter!
          </div>
        </footer>
      </div>

      {/* BARRA DE AÇÕES INFERIOR (ACESSO RÁPIDO NO MOBILE APÓS ROLAR O RELATÓRIO) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '1.2rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: '800',
            cursor: isGeneratingPdf ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
          }}
          title="Baixar arquivo PDF oficial A4 diretamente no aparelho"
        >
          {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {isGeneratingPdf ? (progressMessage || 'Gerando PDF...') : 'Baixar Relatório em PDF'}
        </button>

        <button
          onClick={handleDownloadImage}
          disabled={isGeneratingImage || isGeneratingPdf}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            background: 'var(--surface-color)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-color)'
          }}
          title="Salvar como imagem PNG para WhatsApp ou fotos"
        >
          <ImageIcon size={15} /> Baixar Imagem (PNG)
        </button>

        <button
          onClick={handlePrint}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            background: 'var(--surface-color)',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-color)'
          }}
          title="Abrir caixa de diálogo do navegador para impressão"
        >
          <Printer size={15} /> Imprimir
        </button>
      </div>

      {/* ESTILOS DE IMPRESSÃO (@media print) E ANIMAÇÃO */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 10mm 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body, #root, .app-layout, .main-content {
            background: #ffffff !important;
            color: #0f172a !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
          }
          .no-print, .sidebar, .mobile-toggle {
            display: none !important;
          }
          .report-document {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .report-header {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border-bottom: 2px solid #0f172a !important;
            padding-bottom: 8px !important;
            margin-bottom: 12px !important;
          }
          section, table, tr, footer {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          .notes-textarea {
            border: none !important;
            resize: none !important;
            overflow: visible !important;
            height: auto !important;
          }
        }
      `}} />
    </div>
  );
};

export default Reports;

