import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { X, Download, Image as ImageIcon, Settings, Check } from 'lucide-react';
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

const FlyerModal = ({ isOpen, onClose }) => {
  const { statsData, prodData, YEARS, MONTHS, STATS_ITEMS, PROD_ITEMS } = useData();
  const flyerRef = useRef(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState([new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1]);
  const [selectedItems, setSelectedItems] = useState(DEFAULT_FLYER_ITEMS);
  const [isConfiguring, setIsConfiguring] = useState(true);

  if (!isOpen) return null;

  const toggleItem = (item) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(prev => prev.filter(i => i !== item));
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  const calculateCustomVariation = (item) => {
    // Tenta achar em stats ou prod
    const isStats = STATS_ITEMS.includes(item);
    const dataObj = isStats ? statsData : prodData;

    const yearData = dataObj[selectedYear];
    const prevYearData = dataObj[selectedYear - 1];

    if (!yearData || !prevYearData || !yearData[item] || !prevYearData[item]) return 0;

    let currentSum = 0;
    let prevSum = 0;

    // Soma apenas os meses selecionados
    selectedMonths.forEach(i => {
      currentSum += (yearData[item][i] || 0);
      prevSum += (prevYearData[item][i] || 0);
    });

    if (prevSum === 0) return currentSum > 0 ? 100 : 0;
    return ((currentSum - prevSum) / prevSum) * 100;
  };

  const handleDownload = async () => {
    if (!flyerRef.current) return;

    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2, // Maior qualidade
        backgroundColor: '#1a1a1a',
        useCORS: true
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      const monthsStr = selectedMonths.map(i => MONTHS[i]).join('_');
      link.download = `Flyer_CGD_${selectedYear}_Meses_${monthsStr}.png`;
      link.click();
    } catch (err) {
      console.error("Erro ao gerar imagem", err);
      alert("Não foi possível gerar a imagem.");
    }
  };

  const getFlyerLabel = (item) => {
    // Renomeia itens específicos para o flyer, se necessário
    const labels = {
      "HOMICÍDIO DOLOSO": "HOMICÍDIO",
      "MORTE POR INTERVENÇÃO PM": "MORTE POR INTENÇÃO POLICIAL",
      "ROUBO DE VEÍCULOS": "ROUBO DE VEÍCULO",
      "FURTO DE VEÍCULOS": "FURTO DE VEÍCULO",
      "ROUBO EM RESIDÊNCIA": "ROUBO A RESIDÊNCIA",
      "ROUBO": "ROUBOS",
      "FURTO": "FURTOS"
    };
    return labels[item] || item;
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem' }}>
      <div className="modal-content" style={{ maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-color)', border: '1px solid var(--surface-border)' }}>

        {/* HEADER DO MODAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon size={24} color="var(--primary-color)" /> Gerador de Flyer CGD
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* CONTROLES / CONFIGURAÇÃO */}
        {isConfiguring && (
          <div className="flyer-config-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ano de Análise (Comparativo com ano anterior)</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', color: 'var(--text-main)' }}
                >
                  {YEARS.filter(y => y > YEARS[0]).map(year => (
                    <option key={year} value={year}>{year} (vs {year - 1})</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Período (Meses)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.8rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  {MONTHS.map((m, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes(idx)}
                        onChange={() => {
                          if (selectedMonths.includes(idx)) {
                            setSelectedMonths(prev => prev.filter(i => i !== idx));
                          } else {
                            setSelectedMonths(prev => [...prev, idx].sort((a, b) => a - b));
                          }
                        }}
                        style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Selecione os indicadores para exibir no Flyer</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                {[...STATS_ITEMS, ...PROD_ITEMS].map(item => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item)}
                      onChange={() => toggleItem(item)}
                      style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                    />
                    {getFlyerLabel(item)}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsConfiguring(false)}
              className="btn-primary"
              style={{ padding: '1rem', fontWeight: 'bold', width: '100%', justifyContent: 'center' }}
            >
              Pré-visualizar Flyer
            </button>
          </div>
        )}

        {/* PRÉ-VISUALIZAÇÃO DO FLYER */}
        {!isConfiguring && (
          <div className="flyer-preview-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button onClick={() => setIsConfiguring(true)} className="btn-secondary">
                <Settings size={16} /> Ajustar Dados
              </button>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={onClose} className="btn-secondary">
                  <X size={16} /> Fechar Flyer
                </button>
                <button onClick={handleDownload} className="btn-primary">
                  <Download size={16} /> Baixar Imagem
                </button>
              </div>
            </div>

            {/* FLYER CONTAINER */}
            <div
              ref={flyerRef}
              className="flyer-canvas"
              style={{
                width: '1080px', // Resolução recomendada para Instagram feed
                height: '1350px', // 4:5 aspect ratio
                position: 'relative',
                background: '#000000', // Fundo base escuro
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Impact, Arial Black, sans-serif',
                overflow: 'hidden',
                transform: 'scale(0.5)',
                transformOrigin: 'top center',
                marginBottom: '-675px' // Ajuste pelo scale(0.5)
              }}
            >
              {/* IMAGEM DE FUNDO COM OPACIDADE */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/fundo.png")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.99, zIndex: 0 }}></div>

              {/* Overlay gradiente para legibilidade extra (opcional, deixado mais suave) */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.7) 100%)', zIndex: 1 }}></div>

              {/* Elementos decorativos (setas e formas baseadas na imagem) */}
              <img src="/setaesquerda.png" alt="Seta Esquerda" style={{ position: 'absolute', top: -80, left: -180, width: '350px', height: 'auto', zIndex: 2 }} />
              <img src="/setadireita.png" alt="Seta Direita" style={{ position: 'absolute', bottom: -40, right: -190, width: '350px', height: 'auto', zIndex: 2 }} />

              {/* Content Box */}
              <div style={{ position: 'relative', zIndex: 10, padding: '50px', height: '100%', display: 'flex', flexDirection: 'column' }}>

                {/* CABEÇALHO */}
                <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                  <div style={{ color: 'white', fontSize: '45px', margin: 0, letterSpacing: '4px', textShadow: '4px 4px 10px rgba(0,0,0,0.8)', fontWeight: 'bold' }}>BATALHÃO LESTE</div>
                  <div style={{ padding: '15px 30px', display: 'inline-block', border: '4px solid #333', marginTop: '15px' }}>
                    <div style={{ color: 'white', fontSize: '30px', margin: 0, letterSpacing: '2px', fontWeight: 'bold' }}>ANÁLISE CGD {selectedYear}</div>
                    <div style={{ color: 'white', fontSize: '24px', margin: 0, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' }}>
                      COMPARATIVO: {selectedMonths.map(i => MONTHS[i]).join(', ')}
                    </div>
                  </div>
                </div>

                {/* LISTA DE DADOS */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', padding: '0 30px', justifyContent: 'center' }}>
                  {selectedItems.map((item, idx) => {
                    const variation = calculateCustomVariation(item);
                    const formattedVar = variation > 0 ? `+${variation.toFixed(0)}%` : `${variation.toFixed(0)}%`;

                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '5px', zIndex: 10 }}>
                        <span style={{ color: '#d97706', fontSize: '40px', letterSpacing: '1px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>{getFlyerLabel(item)}</span>
                        <span style={{ color: 'white', fontSize: '48px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>{formattedVar}</span>
                      </div>
                    );
                  })}
                </div>

                {/* RODAPÉ */}
                <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '0px' }}>
                  <div style={{ color: 'white', fontSize: '30px', margin: '0 0 20px 0', letterSpacing: '3px', textShadow: '4px 4px 10px rgba(0,0,0,0.8)', fontWeight: 'bold' }}>CONQUISTAR E MANTER!</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px' }}>
                    <img src="/logo1.png" alt="Logo 1" style={{ width: '80px', height: 'auto', zIndex: 10 }} onError={(e) => e.target.style.display = 'none'} />
                    <img src="/logopm.png" alt="Logo PM" style={{ width: '130px', height: 'auto', zIndex: 10 }} onError={(e) => e.target.style.display = 'none'} />
                    <img src="/logo.png" alt="Logo BTL" style={{ width: '90px', height: 'auto', zIndex: 10 }} onError={(e) => e.target.style.display = 'none'} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlyerModal;
