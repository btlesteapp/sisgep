import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  Printer, Download, FileText, Filter, Calendar, Shield,
  ShieldAlert, ShieldCheck, CheckCircle, AlertTriangle, TrendingDown,
  TrendingUp, Minus, Settings2, SlidersHorizontal, CheckSquare, Square,
  RotateCcw, MapPin, Eye, FileSpreadsheet, UserCheck, ChevronDown, ChevronUp
} from 'lucide-react';
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
  const [reportSubtitle, setReportSubtitle] = useState('BATALHÃO DE POLICIAMENTO DE ÁREA LESTE - CPA LESTE / PMAM');
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

  // Variação de Armas Apreendidas
  const armasBase = getMonthsTotal('prod', baseYear, 'ARMAS DE FOGO APREENDIDAS');
  const armasTarget = getMonthsTotal('prod', targetYear, 'ARMAS DE FOGO APREENDIDAS');
  const armasBadge = getComparisonBadge(armasBase, armasTarget, false);

  // Variação de Presos
  const presosBase = getMonthsTotal('prod', baseYear, 'PRESOS');
  const presosTarget = getMonthsTotal('prod', targetYear, 'PRESOS');
  const presosBadge = getComparisonBadge(presosBase, presosTarget, false);

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
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: 'var(--surface-color)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-color)'
              }}
            >
              <Download size={15} /> Exportar CSV
            </button>

            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
              }}
            >
              <Printer size={16} /> Imprimir / Salvar PDF
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
        className="report-document"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          padding: '2.5rem 3rem',
          borderRadius: '16px',
          boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
          maxWidth: '1100px',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* CABEÇALHO OFICIAL TIMBRADO */}
        <header style={{
          borderBottom: '2.5px solid #0f172a',
          paddingBottom: '1.2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src="./logo.png"
              alt="Logo BTL LESTE"
              style={{ width: '64px', height: '64px', objectFit: 'contain' }}
            />
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a' }}>
                POLÍCIA MILITAR DO ESTADO DO AMAZONAS
              </h2>
              <h3 style={{ fontSize: '0.85rem', fontWeight: '800', margin: '2px 0', textTransform: 'uppercase', color: '#1e3a8a' }}>
                BATALHÃO LESTE - CONQUISTAR E MANTER!
              </h3>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', margin: 0, color: '#475569', textTransform: 'uppercase' }}>
                {reportSubtitle}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#475569' }}>
            <div><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ marginTop: '2px' }}>
              <span style={{
                background: '#1e3a8a18',
                color: '#1e3a8a',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '800',
                fontSize: '0.7rem',
                display: 'inline-block'
              }}>
                PERÍODO: {getPeriodLabel()} ({rangeLabel})
              </span>
            </div>
          </div>
        </header>

        {/* TÍTULO PRINCIPAL DO DOCUMENTO */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.3px', color: '#0f172a' }}>
            {reportTitle}
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0', fontWeight: '600' }}>
            Série Histórica e Balanço Comparativo de Desempenho Operacional
          </p>
        </div>

        {/* 1. CARDS DE RESUMO EXECUTIVO (KPIS) */}
        {includeKPIs && (
          <section style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {includeCrimes && (
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '5px solid #ef4444' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                    Total de Crimes ({targetYear})
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>
                      {crimesTotalTarget.toLocaleString('pt-BR')}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', ...crimesBadge.style, padding: '2px 6px', borderRadius: '4px' }}>
                      {crimesBadge.text}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>vs {baseYear} ({crimesTotalBase.toLocaleString('pt-BR')} registros)</span>
                </div>
              )}

              {includeProd && (
                <>
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '5px solid #10b981' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      Armas Apreendidas ({targetYear})
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>
                        {armasTarget.toLocaleString('pt-BR')}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', ...armasBadge.style, padding: '2px 6px', borderRadius: '4px' }}>
                        {armasBadge.text}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>vs {baseYear} ({armasBase.toLocaleString('pt-BR')} armas)</span>
                  </div>

                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '5px solid #3b82f6' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      Presos / Detidos ({targetYear})
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>
                        {presosTarget.toLocaleString('pt-BR')}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', ...presosBadge.style, padding: '2px 6px', borderRadius: '4px' }}>
                        {presosBadge.text}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>vs {baseYear} ({presosBase.toLocaleString('pt-BR')} detidos)</span>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* 2. MÓDULO: ÍNDICES CRIMINAIS */}
        {includeCrimes && (
          <section style={{ marginBottom: '2.5rem', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '1rem' }}>
              <ShieldAlert size={18} color="#dc2626" />
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
                1. Índices Criminais ({rangeLabel})
              </h3>
            </div>

            {includeTables && (
              <div style={{ overflowX: 'auto', marginBottom: includeCharts ? '1.5rem' : '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: '800', textTransform: 'uppercase', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', minWidth: '220px' }}>NATUREZA</th>
                      {selectedYears.map(y => (
                        <th key={y} style={{ padding: '8px 6px', minWidth: '60px', background: y === targetYear ? '#fee2e2' : 'transparent', color: y === targetYear ? '#dc2626' : 'inherit' }}>
                          {y}
                        </th>
                      ))}
                      <th style={{ padding: '8px 12px', minWidth: '150px' }}>
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
                          <td style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>
                            {item}
                          </td>
                          {selectedYears.map(y => {
                            const val = getMonthsTotal('stats', y, item);
                            const isTarget = y === targetYear;
                            return (
                              <td key={y} style={{ padding: '8px 6px', fontWeight: isTarget ? '800' : '500', color: isTarget ? '#dc2626' : '#475569' }}>
                                {val.toLocaleString('pt-BR')}
                              </td>
                            );
                          })}
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', ...badge.style }}>
                              <BadgeIcon size={11} /> {badge.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Linha Total */}
                    <tr style={{ background: '#f1f5f9', fontWeight: '900', borderTop: '2px solid #cbd5e1' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'left', color: '#0f172a' }}>TOTAL DE OCORRÊNCIAS</td>
                      {selectedYears.map(y => (
                        <td key={y} style={{ padding: '10px 6px', fontSize: '0.85rem', color: y === targetYear ? '#dc2626' : '#0f172a' }}>
                          {totalCrimesByYear[y].toLocaleString('pt-BR')}
                        </td>
                      ))}
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '900', ...crimesBadge.style }}>
                          <crimesBadge.icon size={12} /> {crimesBadge.text}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {includeCharts && (
              <div style={{ height: '240px', width: '100%', marginTop: '1rem', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crimeChartData} margin={{ top: 15, right: 10, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={8} interval={0} angle={-25} textAnchor="end" height={45} />
                    <YAxis stroke="#64748b" fontSize={9} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    {selectedYears.map((y, idx) => {
                      const isTarget = idx === selectedYears.length - 1;
                      const barColor = selectedYears.length === 2 ? (isTarget ? '#dc2626' : '#94a3b8') : (YEAR_COLORS[y] || '#dc2626');
                      return <Bar key={y} dataKey={`Ano ${y}`} fill={barColor} radius={[3, 3, 0, 0]} />;
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        {/* 3. MÓDULO: PRODUTIVIDADE POLICIAL */}
        {includeProd && (
          <section style={{ marginBottom: '2.5rem', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '1rem' }}>
              <ShieldCheck size={18} color="#059669" />
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
                2. Produtividade Policial ({rangeLabel})
              </h3>
            </div>

            {includeTables && (
              <div style={{ overflowX: 'auto', marginBottom: includeCharts ? '1.5rem' : '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: '800', textTransform: 'uppercase', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', minWidth: '220px' }}>INDICADOR</th>
                      {selectedYears.map(y => (
                        <th key={y} style={{ padding: '8px 6px', minWidth: '60px', background: y === targetYear ? '#d1fae5' : 'transparent', color: y === targetYear ? '#059669' : 'inherit' }}>
                          {y}
                        </th>
                      ))}
                      <th style={{ padding: '8px 12px', minWidth: '150px' }}>
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
                          <td style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>
                            {item}
                          </td>
                          {selectedYears.map(y => {
                            const val = getMonthsTotal('prod', y, item);
                            const isTarget = y === targetYear;
                            return (
                              <td key={y} style={{ padding: '8px 6px', fontWeight: isTarget ? '800' : '500', color: isTarget ? '#059669' : '#475569' }}>
                                {typeof val === 'number' ? (val % 1 === 0 ? val.toLocaleString('pt-BR') : val.toFixed(2)) : val}
                              </td>
                            );
                          })}
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', ...badge.style }}>
                              <BadgeIcon size={11} /> {badge.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Linha Total Produtividade */}
                    <tr style={{ background: '#f1f5f9', fontWeight: '900', borderTop: '2px solid #cbd5e1' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'left', color: '#0f172a' }}>TOTAL DE INTERVENÇÕES</td>
                      {selectedYears.map(y => (
                        <td key={y} style={{ padding: '10px 6px', fontSize: '0.85rem', color: y === targetYear ? '#059669' : '#0f172a' }}>
                          {totalProdByYear[y].toFixed(1).replace(/\.0$/, '')}
                        </td>
                      ))}
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '900', ...armasBadge.style }}>
                          <armasBadge.icon size={12} /> {armasBadge.text}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {includeCharts && (
              <div style={{ height: '230px', width: '100%', marginTop: '1rem', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prodChartData} margin={{ top: 15, right: 10, left: -10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={8} interval={0} angle={-15} textAnchor="end" height={35} />
                    <YAxis stroke="#64748b" fontSize={9} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    {selectedYears.map((y, idx) => {
                      const isTarget = idx === selectedYears.length - 1;
                      const barColor = selectedYears.length === 2 ? (isTarget ? '#059669' : '#94a3b8') : (YEAR_COLORS[y] || '#059669');
                      return <Bar key={y} dataKey={`Ano ${y}`} fill={barColor} radius={[3, 3, 0, 0]} />;
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        {/* 4. MÓDULO: INDICADORES POR ZONA (RESUMO) */}
        {includeZones && (
          <section style={{ marginBottom: '2.5rem', pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '1rem' }}>
              <MapPin size={18} color="#2563eb" />
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
                3. Comparativo por Região Policial (Manaus)
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: '800', textTransform: 'uppercase', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>ZONA POLICIAL</th>
                    <th style={{ padding: '8px 10px' }}>2021</th>
                    <th style={{ padding: '8px 10px' }}>2022</th>
                    <th style={{ padding: '8px 10px' }}>2023</th>
                    <th style={{ padding: '8px 10px' }}>2024</th>
                    <th style={{ padding: '8px 10px', background: '#e0f2fe' }}>2025</th>
                    <th style={{ padding: '8px 10px', background: '#fee2e2', color: '#dc2626', fontWeight: '900' }}>2026</th>
                    <th style={{ padding: '8px 12px' }}>COMPARATIVO % (2025 vs 2026)</th>
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
                        <td style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>
                          ZONA {z.zona}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{t2021.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{t2022.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{t2023.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{t2024.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0f172a', background: '#f0f9ff' }}>{t2025.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '8px 10px', fontWeight: '900', color: '#dc2626', background: '#fff1f2' }}>{t2026.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', ...badge.style }}>
                            <BadgeIcon size={11} /> {badge.text}
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
            marginTop: '2rem',
            padding: '1.2rem',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            pageBreakInside: 'avoid'
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', margin: '0 0 6px 0' }}>
              4. Parecer Técnico-Operacional do Comando
            </h4>
            <textarea
              value={commandNotes}
              onChange={e => setCommandNotes(e.target.value)}
              className="notes-textarea"
              style={{
                width: '100%',
                minHeight: '70px',
                border: 'none',
                background: 'transparent',
                color: '#334155',
                fontSize: '0.8rem',
                lineHeight: '1.5',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </section>
        )}

        {/* 6. ASSINATURA E RODAPÉ OFICIAL */}
        <footer style={{
          marginTop: '3.5rem',
          paddingTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pageBreakInside: 'avoid'
        }}>
          <div style={{ width: '280px', borderTop: '1.5px solid #0f172a', marginBottom: '6px' }}></div>
          <p style={{ margin: 0, fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', color: '#0f172a' }}>
            {officerName}
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>
            Batalhão de Policiamento de Área Leste • PMAM
          </p>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '1.5rem', textAlign: 'center' }}>
            Documento gerado eletronicamente pelo SISGEP-LESTE • Batalhão Leste • Conquistar e Manter!
          </div>
        </footer>
      </div>

      {/* ESTILOS DE IMPRESSÃO (@media print) */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, .sidebar, .mobile-toggle {
            display: none !important;
          }
          .main-content {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .report-document {
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          .notes-textarea {
            border: none !important;
            resize: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default Reports;

