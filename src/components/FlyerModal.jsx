import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { X, Download, Image as ImageIcon, Upload, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';

const DEFAULT_FLYER_ITEMS = [
  "HOMICÍDIO DOLOSO",
  "LATROCÍNIO",
  "MORTE POR INTERVENÇÃO PM",
  "ROUBO DE VEÍCULOS",
  "FURTO DE VEÍCULOS",
  "ROUBO EM RESIDÊNCIA",
  "ROUBO A TRANSEUNTES",
  "ROUBO A COLETIVO",
  "ROUBO A PONTO COMERCIAL",
  "ROUBO",
  "FURTO"
];

const FLYER_LABELS = {
  "HOMICÍDIO DOLOSO": "HOMICÍDIO",
  "LATROCÍNIO": "LATROCÍNIO",
  "MORTE POR INTERVENÇÃO PM": "MORTE POR INTENÇÃO POLICIAL",
  "ROUBO DE VEÍCULOS": "ROUBO DE VEÍCULO",
  "FURTO DE VEÍCULOS": "FURTO DE VEÍCULO",
  "ROUBO EM RESIDÊNCIA": "ROUBO A RESIDÊNCIA",
  "ROUBO A TRANSEUNTES": "ROUBO A TRANSEUNTE",
  "ROUBO A COLETIVO": "ROUBO A COLETIVO",
  "ROUBO A PONTO COMERCIAL": "ROUBO A PONTO COMERCIAL",
  "ROUBO": "ROUBOS",
  "FURTO": "FURTOS",
  "ARMAS DE FOGO APREENDIDAS": "ARMAS DE FOGO",
  "VEÍCULOS RECUPERADOS": "VEÍCULOS RECUPERADOS",
  "ENTORPECENTES EM Kg (TRÁFICO)": "ENTORPECENTES (KG)",
  "MUNIÇÕES": "MUNIÇÕES",
  "PRESOS": "PRESOS",
  "SIMULACRO": "SIMULACRO",
  "FORAGIDOS": "FORAGIDOS"
};

const formatPeriodLabel = (months, monthsList) => {
  if (!months || months.length === 0) return "COMPARATIVO DO PERÍODO";
  const sorted = [...months].sort((a, b) => a - b);
  if (sorted.length === 1) {
    const fullMonths = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    return `COMPARATIVO ${fullMonths[sorted[0]]}`;
  }
  const first = monthsList[sorted[0]];
  const last = monthsList[sorted[sorted.length - 1]];
  if (sorted.length === 12) {
    return "COMPARATIVO JAN A DEZ";
  }
  return `COMPARATIVO ${first} A ${last}`;
};

const FlyerModal = ({ isOpen, onClose }) => {
  const { statsData, prodData, YEARS, MONTHS, STATS_ITEMS, PROD_ITEMS } = useData();
  const flyerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState([new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1]);
  const [selectedItems, setSelectedItems] = useState(DEFAULT_FLYER_ITEMS);
  const [isDownloading, setIsDownloading] = useState(false);

  // Textos personalizáveis
  const [mainTitle, setMainTitle] = useState("BATALHÃO LESTE");
  const [customCgdTitle, setCustomCgdTitle] = useState("");
  const [customPeriodSubtitle, setCustomPeriodSubtitle] = useState("");
  const [footerSlogan, setFooterSlogan] = useState("CONQUISTAR E MANTER!");
  const [watermarkHandle, setWatermarkHandle] = useState("@BTLESTE_AM_PMAM");
  const [showPlusSign, setShowPlusSign] = useState(false);

  const cgdTitle = customCgdTitle || `ANÁLISE CGD ${selectedYear}`;
  const periodSubtitle = customPeriodSubtitle || formatPeriodLabel(selectedMonths, MONTHS);

  // Modo de renderização: 'auto' (100% código fiel ao modelo) ou 'custom_bg' (sobrepor em PNG fornecido)
  const [renderMode, setRenderMode] = useState('auto');
  const [customBgUrl, setCustomBgUrl] = useState(null);
  const [customBgOnlyValues, setCustomBgOnlyValues] = useState(false);

  // Escala de zoom no preview para caber perfeitamente no monitor
  const [zoom, setZoom] = useState(0.42);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleItem = (item) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(prev => prev.filter(i => i !== item));
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  const selectDefaultFlyerItems = () => {
    setSelectedItems(DEFAULT_FLYER_ITEMS);
  };

  const selectAllStats = () => {
    setSelectedItems(prev => Array.from(new Set([...prev, ...STATS_ITEMS])));
  };

  const clearStats = () => {
    setSelectedItems(prev => prev.filter(i => !STATS_ITEMS.includes(i)));
  };

  const selectAllProd = () => {
    setSelectedItems(prev => Array.from(new Set([...prev, ...PROD_ITEMS])));
  };

  const clearProd = () => {
    setSelectedItems(prev => prev.filter(i => !PROD_ITEMS.includes(i)));
  };

  const calculateCustomVariation = (item) => {
    const isStats = STATS_ITEMS.includes(item);
    const dataObj = isStats ? statsData : prodData;

    const yearData = dataObj[selectedYear];
    const prevYearData = dataObj[selectedYear - 1];

    if (!yearData || !prevYearData || !yearData[item] || !prevYearData[item]) return 0;

    let currentSum = 0;
    let prevSum = 0;

    selectedMonths.forEach(i => {
      currentSum += (yearData[item][i] || 0);
      prevSum += (prevYearData[item][i] || 0);
    });

    if (prevSum === 0) return currentSum > 0 ? 100 : 0;
    return ((currentSum - prevSum) / prevSum) * 100;
  };

  const handleCustomImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomBgUrl(url);
      setRenderMode('custom_bg');
    }
  };

  const handleDownload = async () => {
    if (!flyerRef.current) return;
    setIsDownloading(true);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      // Renderiza em alta resolução (scale: 2 produz imagem 2160x2700)
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2,
        backgroundColor: '#000000',
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      const monthsStr = selectedMonths.map(i => MONTHS[i]).join('_');
      link.download = `Flyer_CGD_${selectedYear}_${monthsStr}.png`;
      link.click();
    } catch (err) {
      console.error("Erro ao gerar imagem", err);
      alert("Não foi possível gerar a imagem.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getFlyerLabel = (item) => {
    return FLYER_LABELS[item] || item;
  };

  // Ajuste dinâmico de tamanho de fonte conforme a quantidade de itens escolhidos
  const itemCount = selectedItems.length;
  const rowFontSize = itemCount > 14 ? '26px' : (itemCount > 12 ? '30px' : (itemCount > 9 ? '36px' : '40px'));
  const valueFontSize = itemCount > 14 ? '30px' : (itemCount > 12 ? '34px' : (itemCount > 9 ? '42px' : '46px'));
  const rowGap = itemCount > 14 ? '3px' : (itemCount > 12 ? '6px' : (itemCount > 9 ? '9px' : '14px'));
  const cardPadding = itemCount > 12 ? '14px 30px' : '20px 36px';

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '1420px',
          width: '98vw',
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column',
          background: '#0b0f17',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
          overflow: 'hidden',
          margin: 'auto 0'
        }}
      >

        {/* 1. HEADER FIXO (SEMPRE VISÍVEL NO TOPO COM BOTÃO FECHAR) */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0e141f',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.9rem 1.4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(234, 140, 30, 0.15)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <ImageIcon size={22} color="#ea8c1e" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Gerador de Flyer CGD - Batalhão Leste
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                Ajuste os filtros à esquerda e veja a atualização do flyer em tempo real à direita
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn-primary"
              style={{
                padding: '0.5rem 1.1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#ea8c1e',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: isDownloading ? 'wait' : 'pointer'
              }}
            >
              <Download size={16} /> {isDownloading ? 'Gerando...' : 'Baixar Imagem HD'}
            </button>

            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                cursor: 'pointer',
                padding: '0.5rem 1.1rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                transition: 'all 0.2s'
              }}
              title="Fechar janela (ESC)"
            >
              <X size={17} /> Fechar
            </button>
          </div>
        </div>

        {/* 2. CORPO DO MODAL (LAYOUT DIVIDIDO EM 2 COLUNAS RESPONSIVAS COM SCROLL INDEPENDENTE) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '1.2rem',
          padding: '1.2rem',
          background: '#080c14'
        }}>

          {/* COLUNA ESQUERDA: CONTROLES & FILTROS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* SELETOR DE MODO */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Modo:</span>
              <button
                onClick={() => setRenderMode('auto')}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: renderMode === 'auto' ? '1px solid #ea8c1e' : '1px solid rgba(255,255,255,0.1)',
                  background: renderMode === 'auto' ? 'rgba(234, 140, 30, 0.2)' : 'transparent',
                  color: renderMode === 'auto' ? '#ea8c1e' : '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                🎨 Modelo Oficial SISGEP
              </button>
              <button
                onClick={() => {
                  setRenderMode('custom_bg');
                  if (!customBgUrl && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: renderMode === 'custom_bg' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                  background: renderMode === 'custom_bg' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: renderMode === 'custom_bg' ? '#60a5fa' : '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                🖼️ Usar Imagem Base PNG
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCustomImageUpload}
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
              />
            </div>

            {/* ANO E TÍTULOS */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Ano de Análise
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: '#121722', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '0.8rem' }}
                >
                  {YEARS.filter(y => y > YEARS[0]).map(year => (
                    <option key={year} value={year}>{year} (vs {year - 1})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Título Superior
                </label>
                <input
                  type="text"
                  value={mainTitle}
                  onChange={(e) => setMainTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: '#121722', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Texto CGD
                </label>
                <input
                  type="text"
                  placeholder={`ANÁLISE CGD ${selectedYear}`}
                  value={customCgdTitle}
                  onChange={(e) => setCustomCgdTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: '#121722', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Texto Período
                </label>
                <input
                  type="text"
                  placeholder={formatPeriodLabel(selectedMonths, MONTHS)}
                  value={customPeriodSubtitle}
                  onChange={(e) => setCustomPeriodSubtitle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: '#121722', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Lema do Rodapé
                </label>
                <input
                  type="text"
                  value={footerSlogan}
                  onChange={(e) => setFooterSlogan(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: '#121722', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Marca d'Água Lateral
                </label>
                <input
                  type="text"
                  value={watermarkHandle}
                  onChange={(e) => setWatermarkHandle(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: '#121722', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* SELEÇÃO DE MESES */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                Meses no Comparativo:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.3rem' }}>
                {MONTHS.map((m, idx) => {
                  const isChecked = selectedMonths.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          if (selectedMonths.length > 1) {
                            setSelectedMonths(prev => prev.filter(i => i !== idx));
                          }
                        } else {
                          setSelectedMonths(prev => [...prev, idx].sort((a, b) => a - b));
                        }
                      }}
                      style={{
                        padding: '0.35rem 0.2rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: isChecked ? '1px solid #ea8c1e' : '1px solid rgba(255,255,255,0.08)',
                        background: isChecked ? 'rgba(234, 140, 30, 0.25)' : '#121722',
                        color: isChecked ? '#ea8c1e' : '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FILTROS DE INDICADORES (CRIMINALIDADE & PRODUTIVIDADE) */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                  Indicadores no Flyer ({selectedItems.length} selecionados)
                </span>
                <button
                  type="button"
                  onClick={selectDefaultFlyerItems}
                  style={{ background: 'rgba(234, 140, 30, 0.15)', color: '#ea8c1e', border: '1px solid rgba(234, 140, 30, 0.35)', borderRadius: '4px', padding: '0.2rem 0.55rem', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <RotateCcw size={11} /> Padrão (11 Itens)
                </button>
              </div>

              {/* GRUPO 1: ÍNDICES DE CRIMINALIDADE */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>
                    🚨 Criminalidade ({STATS_ITEMS.filter(i => selectedItems.includes(i)).length}/{STATS_ITEMS.length})
                  </span>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={selectAllStats}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={clearStats}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', maxHeight: '140px', overflowY: 'auto', paddingRight: '4px' }}>
                  {STATS_ITEMS.map(item => {
                    const isSelected = selectedItems.includes(item);
                    return (
                      <label
                        key={item}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.25rem 0.45rem',
                          borderRadius: '4px',
                          background: isSelected ? 'rgba(234, 140, 30, 0.15)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1px solid rgba(234, 140, 30, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          fontSize: '0.73rem',
                          color: isSelected ? '#ea8c1e' : '#94a3b8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item)}
                          style={{ accentColor: '#ea8c1e', width: '13px', height: '13px', flexShrink: 0 }}
                        />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getFlyerLabel(item)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* GRUPO 2: PRODUTIVIDADE POLICIAL */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>
                    🛡️ Produtividade ({PROD_ITEMS.filter(i => selectedItems.includes(i)).length}/{PROD_ITEMS.length})
                  </span>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={selectAllProd}
                      style={{ background: 'transparent', border: 'none', color: '#34d399', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={clearProd}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', maxHeight: '110px', overflowY: 'auto', paddingRight: '4px' }}>
                  {PROD_ITEMS.map(item => {
                    const isSelected = selectedItems.includes(item);
                    return (
                      <label
                        key={item}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.25rem 0.45rem',
                          borderRadius: '4px',
                          background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          fontSize: '0.73rem',
                          color: isSelected ? '#34d399' : '#94a3b8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item)}
                          style={{ accentColor: '#10b981', width: '13px', height: '13px', flexShrink: 0 }}
                        />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getFlyerLabel(item)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* OPÇÕES ADICIONAIS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showPlusSign}
                    onChange={(e) => setShowPlusSign(e.target.checked)}
                    style={{ accentColor: '#ea8c1e' }}
                  />
                  Exibir sinal '+' em variações positivas (ex: +100%)
                </label>

                {renderMode === 'custom_bg' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={customBgOnlyValues}
                      onChange={(e) => setCustomBgOnlyValues(e.target.checked)}
                      style={{ accentColor: '#ea8c1e' }}
                    />
                    A imagem PNG já tem os nomes dos crimes (exibir só porcentagens)
                  </label>
                )}
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: PREVIEW AO VIVO DO FLYER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>

            {/* BARRA DE ZOOM DO PREVIEW */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                Visualização do Flyer
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <button
                  onClick={() => setZoom(prev => Math.max(0.3, prev - 0.04))}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px' }}
                  title="Diminuir Zoom"
                >
                  <ZoomOut size={14} />
                </button>
                <span style={{ fontSize: '0.72rem', color: '#f8fafc', minWidth: '36px', textAlign: 'center' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(prev => Math.min(0.65, prev + 0.04))}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px' }}
                  title="Aumentar Zoom"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            {/* CONTAINER VISÍVEL DO CANVAS (COM ZOOM RESPONSIVO) */}
            <div style={{
              width: '100%',
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              height: `${1350 * zoom + 10}px`,
              maxHeight: '680px',
              borderRadius: '8px',
              background: '#040609',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)'
            }}>
              <div style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: '1080px',
                height: '1350px'
              }}>

                {/* O CANVAS REAL (1080x1350) */}
                <div
                  ref={flyerRef}
                  className="flyer-canvas"
                  style={{
                    width: '1080px',
                    height: '1350px',
                    position: 'relative',
                    background: '#000000',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: "'Anton', 'Impact', sans-serif",
                    overflow: 'hidden',
                    userSelect: 'none'
                  }}
                >
                  {/* MODO 1: RENDERIZAÇÃO OFICIAL SISGEP */}
                  {renderMode === 'auto' && (
                    <>
                      {/* Fundo Tijolo Escuro */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage: 'url("./fundo.png")',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          opacity: 0.95,
                          zIndex: 0
                        }}
                      />

                      {/* Gradiente de iluminação idêntico à arte */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.92) 100%)',
                          zIndex: 1
                        }}
                      />

                      {/* Reflexos sutis de viatura policial (azul à esquerda, vermelho à direita) */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '260px',
                          background: 'radial-gradient(ellipse at 28% 90%, rgba(0, 102, 255, 0.25) 0%, transparent 60%), radial-gradient(ellipse at 72% 90%, rgba(255, 30, 30, 0.25) 0%, transparent 60%)',
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Retículo técnico / militar superior direito */}
                      <div style={{ position: 'absolute', top: 38, right: 38, zIndex: 3, opacity: 0.38, pointerEvents: 'none' }}>
                        <svg width="130" height="130" viewBox="0 0 130 130" fill="none" stroke="#ffffff" strokeWidth="2.5">
                          <line x1="0" y1="28" x2="130" y2="28" />
                          <line x1="102" y1="0" x2="102" y2="130" />
                          <circle cx="102" cy="28" r="5" strokeWidth="2.5" />
                          <circle cx="102" cy="28" r="1.5" fill="#ffffff" />
                        </svg>
                      </div>

                      {/* Seta Laranja Superior Esquerda */}
                      <img
                        src="./setaesquerda.png"
                        alt="Seta Esquerda"
                        style={{
                          position: 'absolute',
                          top: '128px',
                          left: 0,
                          width: '125px',
                          height: 'auto',
                          zIndex: 3,
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Seta Laranja Inferior Direita */}
                      <img
                        src="./setadireita.png"
                        alt="Seta Direita"
                        style={{
                          position: 'absolute',
                          bottom: '125px',
                          right: 0,
                          width: '125px',
                          height: 'auto',
                          zIndex: 3,
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Marca d'água lateral esquerda vertical: @BTLESTE_AM_PMAM */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-55px',
                          top: '49%',
                          transform: 'translateY(-50%) rotate(-90deg)',
                          transformOrigin: 'center center',
                          fontFamily: "'Anton', 'Impact', sans-serif",
                          fontStyle: 'italic',
                          fontSize: '43px',
                          letterSpacing: '5px',
                          color: 'rgba(255, 255, 255, 0.22)',
                          zIndex: 3,
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none'
                        }}
                      >
                        {watermarkHandle}
                      </div>

                      {/* CONTEÚDO PRINCIPAL DO FLYER */}
                      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

                        {/* CABEÇALHO */}
                        <div style={{ textAlign: 'center', marginTop: '45px', marginBottom: '14px' }}>
                          <div
                            style={{
                              color: '#ffffff',
                              fontSize: '66px',
                              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
                              fontWeight: 900,
                              letterSpacing: '4.5px',
                              margin: '0 0 16px 0',
                              textShadow: '0 4px 14px rgba(0,0,0,0.95)',
                              textTransform: 'uppercase'
                            }}
                          >
                            {mainTitle}
                          </div>

                          {/* Caixa Preta Arredondada */}
                          <div
                            style={{
                              display: 'inline-block',
                              background: '#000000',
                              borderRadius: '8px',
                              padding: '10px 42px 12px 42px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.9)',
                              border: '1px solid rgba(255,255,255,0.06)'
                            }}
                          >
                            <div
                              style={{
                                color: '#ffffff',
                                fontSize: '41px',
                                fontFamily: "'Montserrat', 'Arial Black', sans-serif",
                                fontWeight: 900,
                                letterSpacing: '2.5px',
                                lineHeight: 1.15,
                                textTransform: 'uppercase'
                              }}
                            >
                              {cgdTitle}
                            </div>
                            <div
                              style={{
                                color: '#ffffff',
                                fontSize: '24px',
                                fontFamily: "'Montserrat', 'Arial Black', sans-serif",
                                fontWeight: 800,
                                letterSpacing: '2px',
                                marginTop: '3px',
                                textTransform: 'uppercase'
                              }}
                            >
                              {periodSubtitle}
                            </div>
                          </div>
                        </div>

                        {/* CARD CENTRAL DE DADOS */}
                        <div
                          style={{
                            position: 'relative',
                            width: '730px',
                            margin: '10px auto 0 auto',
                            background: 'rgba(14, 16, 20, 0.72)',
                            borderRadius: '6px',
                            padding: cardPadding,
                            boxShadow: '0 12px 35px rgba(0,0,0,0.75)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: rowGap,
                            minHeight: '380px'
                          }}
                        >
                          {/* Watermark circular com gráfico de barras / seta ascendente */}
                          <div
                            style={{
                              position: 'absolute',
                              right: '20px',
                              bottom: '15px',
                              opacity: 0.12,
                              pointerEvents: 'none',
                              zIndex: 0
                            }}
                          >
                            <svg width="210" height="210" viewBox="0 0 100 100" fill="none" stroke="#ffffff" strokeWidth="2.5">
                              <circle cx="50" cy="50" r="44" strokeWidth="3" />
                              <circle cx="50" cy="50" r="38" strokeWidth="1" strokeDasharray="3 3" />
                              <rect x="30" y="55" width="8" height="20" fill="#ffffff" />
                              <rect x="44" y="45" width="8" height="30" fill="#ffffff" />
                              <rect x="58" y="35" width="8" height="40" fill="#ffffff" />
                              <path d="M26 62 L48 38 L62 48 L76 28" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                              <polyline points="66,28 76,28 76,38" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>

                          {/* AVISO SE NENHUM ITEM SELECIONADO */}
                          {selectedItems.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '26px' }}>
                              Nenhum indicador selecionado nos filtros.
                            </div>
                          )}

                          {/* LISTA DOS ITENS SELECIONADOS */}
                          {selectedItems.map((item, idx) => {
                            const variation = calculateCustomVariation(item);
                            const formattedVar = variation > 0
                              ? (showPlusSign ? `+${variation.toFixed(0)}%` : `${variation.toFixed(0)}%`)
                              : `${variation.toFixed(0)}%`;

                            return (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  position: 'relative',
                                  zIndex: 1,
                                  padding: '2px 0'
                                }}
                              >
                                <span
                                  style={{
                                    color: '#ea8c1e',
                                    fontSize: rowFontSize,
                                    fontFamily: "'Anton', 'Impact', 'Bebas Neue', sans-serif",
                                    letterSpacing: '0.8px',
                                    textTransform: 'uppercase',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.95)'
                                  }}
                                >
                                  {getFlyerLabel(item)}
                                </span>
                                <span
                                  style={{
                                    color: '#ffffff',
                                    fontSize: valueFontSize,
                                    fontFamily: "'Anton', 'Impact', 'Bebas Neue', sans-serif",
                                    fontWeight: 900,
                                    letterSpacing: '1px',
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.95)'
                                  }}
                                >
                                  {formattedVar}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* RODAPÉ */}
                        <div style={{ textAlign: 'center', marginTop: 'auto', marginBottom: '28px' }}>
                          <div
                            style={{
                              color: '#ffffff',
                              fontSize: '44px',
                              fontFamily: "'Montserrat', 'Arial Black', sans-serif",
                              fontWeight: 900,
                              letterSpacing: '3.5px',
                              margin: '0 0 16px 0',
                              textShadow: '0 4px 12px rgba(0,0,0,0.95)',
                              textTransform: 'uppercase'
                            }}
                          >
                            {footerSlogan}
                          </div>

                          {/* 3 BRASÕES OFICIAIS */}
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px' }}>
                            {/* CPM */}
                            <img
                              src="./logo1.png"
                              alt="Logo CPM"
                              style={{ height: '76px', width: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}
                              onError={(e) => (e.target.style.display = 'none')}
                            />
                            {/* PMAM */}
                            <img
                              src="./logopm.png"
                              alt="Logo PMAM"
                              style={{ height: '116px', width: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}
                              onError={(e) => (e.target.style.display = 'none')}
                            />
                            {/* BTL LESTE */}
                            <img
                              src="./logo.png"
                              alt="Logo BTL LESTE"
                              style={{ height: '86px', width: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))' }}
                              onError={(e) => (e.target.style.display = 'none')}
                            />
                          </div>
                        </div>

                      </div>
                    </>
                  )}

                  {/* MODO 2: SOBREPOSIÇÃO EM IMAGEM BASE */}
                  {renderMode === 'custom_bg' && (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {customBgUrl ? (
                        <img
                          src={customBgUrl}
                          alt="Template Base"
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111827', color: '#94a3b8', gap: '1rem' }}>
                          <Upload size={48} color="#ea8c1e" />
                          <div style={{ fontSize: '1.2rem', color: '#f8fafc', fontWeight: 600 }}>Nenhuma imagem PNG carregada</div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-primary"
                            style={{ padding: '0.6rem 1.2rem', cursor: 'pointer' }}
                          >
                            Selecionar Arquivo PNG
                          </button>
                        </div>
                      )}

                      {customBgUrl && (
                        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                          {!customBgOnlyValues && (
                            <div style={{ position: 'absolute', top: '145px', left: 0, right: 0, textAlign: 'center' }}>
                              <div style={{ color: '#ffffff', fontSize: '38px', fontFamily: "'Montserrat', sans-serif", fontWeight: 900, letterSpacing: '2px' }}>
                                {cgdTitle}
                              </div>
                              <div style={{ color: '#ffffff', fontSize: '23px', fontFamily: "'Montserrat', sans-serif", fontWeight: 800, letterSpacing: '2px', marginTop: '4px' }}>
                                {periodSubtitle}
                              </div>
                            </div>
                          )}

                          <div
                            style={{
                              position: 'absolute',
                              top: '340px',
                              left: '180px',
                              width: '720px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            {selectedItems.map((item, idx) => {
                              const variation = calculateCustomVariation(item);
                              const formattedVar = variation > 0
                                ? (showPlusSign ? `+${variation.toFixed(0)}%` : `${variation.toFixed(0)}%`)
                                : `${variation.toFixed(0)}%`;

                              return (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: customBgOnlyValues ? 'flex-end' : 'space-between',
                                    alignItems: 'center',
                                    height: '48px'
                                  }}
                                >
                                  {!customBgOnlyValues && (
                                    <span
                                      style={{
                                        color: '#ea8c1e',
                                        fontSize: rowFontSize,
                                        fontFamily: "'Anton', 'Impact', sans-serif",
                                        letterSpacing: '0.8px',
                                        textTransform: 'uppercase',
                                        textShadow: '2px 2px 4px rgba(0,0,0,0.95)'
                                      }}
                                    >
                                      {getFlyerLabel(item)}
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      color: '#ffffff',
                                      fontSize: valueFontSize,
                                      fontFamily: "'Anton', 'Impact', sans-serif",
                                      fontWeight: 900,
                                      letterSpacing: '1px',
                                      textShadow: '2px 2px 4px rgba(0,0,0,0.95)'
                                    }}
                                  >
                                    {formattedVar}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 3. RODAPÉ FIXO DO MODAL (SEMPRE VISÍVEL NA BASE) */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0e141f',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.7rem 1.4rem'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Dica: Feche a janela com a tecla <strong>ESC</strong> ou clicando fora do modal.
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1.2rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <X size={15} /> Fechar Flyer
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn-primary"
              style={{
                padding: '0.5rem 1.4rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#ea8c1e',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: isDownloading ? 'wait' : 'pointer'
              }}
            >
              <Download size={16} /> {isDownloading ? 'Gerando Imagem...' : 'Baixar Imagem HD'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FlyerModal;
