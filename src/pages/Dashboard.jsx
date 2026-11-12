import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList, Legend } from 'recharts';
import {
  Shield, Target, AlertTriangle, CheckCircle, Calendar,
  Skull, HandCoins, Car, Bus, Store, Zap, Package,
  ShieldAlert, UserMinus, CarFront, FlaskConical, Layers, Lock, Ghost, Search,
  TrendingUp, TrendingDown, Minus, Layers as LayersIcon, Image as ImageIcon,
  ShieldCheck, ArrowUpRight, ArrowDownRight, Scale
} from 'lucide-react';
import FlyerModal from '../components/FlyerModal';
import ZoneIndicators from '../components/ZoneIndicators';

const SectionTitle = ({ title, icon: Icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}>
    <Icon size={16} color="var(--primary-color)" />
    <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h2>
  </div>
);

const KPICard = ({ title, value, variation, icon: Icon, color, isInverse = false, varLabel = "" }) => {
  const isIncrease = variation > 0;
  const isDecrease = variation < 0;

  let varColor = 'var(--text-muted)';
  if (isIncrease) varColor = isInverse ? '#ef4444' : '#10b981';
  if (isDecrease) varColor = isInverse ? '#10b981' : '#ef4444';

  return (
    <div className="glass-card" style={{
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.8rem',
      border: '1px solid var(--surface-border)',
      width: '100%'
    }}>
      <div className="kpi-icon-container" style={{
        padding: '8px',
        background: `${color}20`,
        borderRadius: '10px',
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.65rem',
          marginBottom: '2px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>{title}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>{value % 1 === 0 ? value : value.toFixed(2)}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1px',
              fontSize: '0.65rem',
              fontWeight: '700',
              color: varColor,
              background: `${varColor}10`,
              padding: '1px 4px',
              borderRadius: '4px'
            }}>
              {isIncrease && <TrendingUp size={10} />}
              {isDecrease && <TrendingDown size={10} />}
              {Math.abs(variation).toFixed(1)}%
              {varLabel && <span style={{ marginLeft: '4px', fontSize: '0.55rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{varLabel}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComparativeTooltip = ({ active, payload, label, prevYearKey, currYearKey, isInverse = false }) => {
  if (active && payload && payload.length) {
    const prevItem = payload.find(p => p.dataKey === prevYearKey);
    const currItem = payload.find(p => p.dataKey === currYearKey);
    const prevVal = Number(prevItem?.value || 0);
    const currVal = Number(currItem?.value || 0);
    const diff = currVal - prevVal;
    const pct = prevVal > 0 ? ((currVal - prevVal) / prevVal) * 100 : (currVal > 0 ? 100 : 0);
    const isGood = isInverse ? diff <= 0 : diff >= 0;

    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(12px)',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        color: '#f8fafc',
        fontSize: '0.8rem',
        minWidth: '220px'
      }}>
        <div style={{ fontWeight: '800', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', fontSize: '0.85rem' }}>
          {label}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#94a3b8' }}>{prevYearKey}:</span>
          <span style={{ fontWeight: '700' }}>{typeof prevVal === 'number' ? prevVal.toLocaleString('pt-BR') : prevVal}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: isInverse ? '#f87171' : '#34d399' }}>{currYearKey}:</span>
          <span style={{ fontWeight: '800', color: isInverse ? '#f87171' : '#34d399' }}>{typeof currVal === 'number' ? currVal.toLocaleString('pt-BR') : currVal}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '6px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontWeight: '800',
          color: isGood ? '#10b981' : '#ef4444'
        }}>
          <span>Variação:</span>
          <span>
            {diff > 0 ? `+${diff.toLocaleString('pt-BR')}` : diff.toLocaleString('pt-BR')} ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { statsData, prodData, MONTHS, YEARS, selectedYear, setSelectedYear, STATS_ITEMS, PROD_ITEMS, calculateTotal, calculateTotalVariation } = useData();
  const [showFlyer, setShowFlyer] = useState(false);

  const isAllYears = selectedYear === 'all';

  const getYearTotal = (type, year, item) => {
    const dataArray = type === 'stats' ? statsData[year][item] : prodData[year][item];
    const today = new Date();
    const currentRealYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (Number(year) === currentRealYear) {
      let sum = 0;
      if (currentMonth > 0) {
        for (let i = 0; i < currentMonth; i++) sum += (dataArray[i] || 0);
      }
      return sum;
    }
    return calculateTotal(dataArray);
  };

  const calculateGlobalVariation = (type, item) => {
    const firstYear = YEARS[0];
    const lastYear = YEARS[YEARS.length - 1];

    const firstTotal = getYearTotal(type, firstYear, item);
    const lastTotal = getYearTotal(type, lastYear, item);

    if (firstTotal === 0) return lastTotal > 0 ? 100 : 0;
    return ((lastTotal - firstTotal) / firstTotal) * 100;
  };

  let currentDisplayStats = {};
  let currentDisplayProd = {};
  let chartData;

  if (isAllYears) {
    STATS_ITEMS.forEach(item => {
      let sum = 0;
      YEARS.forEach(y => sum += calculateTotal(statsData[y][item]));
      currentDisplayStats[item] = sum;
    });
    PROD_ITEMS.forEach(item => {
      let sum = 0;
      YEARS.forEach(y => sum += calculateTotal(prodData[y][item]));
      currentDisplayProd[item] = sum;
    });

    chartData = YEARS.map(year => {
      const data = { name: year.toString() };
      STATS_ITEMS.forEach(item => {
        data[item] = calculateTotal(statsData[year][item]);
      });
      return data;
    });
  } else {
    STATS_ITEMS.forEach(item => {
      currentDisplayStats[item] = calculateTotal(statsData[selectedYear][item]);
    });
    PROD_ITEMS.forEach(item => {
      currentDisplayProd[item] = calculateTotal(prodData[selectedYear][item]);
    });

    chartData = MONTHS.map((month, idx) => {
      const data = { name: month };
      STATS_ITEMS.forEach(item => {
        data[item] = statsData[selectedYear][item][idx];
      });
      return data;
    });
  }

  // Anos para comparação direta entre períodos
  const currYear = isAllYears ? YEARS[YEARS.length - 1] : Number(selectedYear);
  const prevYear = isAllYears 
    ? YEARS[YEARS.length - 2] 
    : (currYear > YEARS[0] ? currYear - 1 : currYear);
  const prevYearKey = `Ano ${prevYear}`;
  const currYearKey = `Ano ${currYear}`;

  const statsComparativeData = STATS_ITEMS.map(item => {
    const valPrev = getYearTotal('stats', prevYear, item);
    const valCurr = getYearTotal('stats', currYear, item);
    const diff = valCurr - valPrev;
    const pct = valPrev > 0 ? ((valCurr - valPrev) / valPrev) * 100 : (valCurr > 0 ? 100 : 0);
    return {
      name: item,
      [prevYearKey]: valPrev,
      [currYearKey]: valCurr,
      diff,
      pct
    };
  });

  const prodComparativeData = PROD_ITEMS.map(item => {
    const valPrev = getYearTotal('prod', prevYear, item);
    const valCurr = getYearTotal('prod', currYear, item);
    const diff = valCurr - valPrev;
    const pct = valPrev > 0 ? ((valCurr - valPrev) / valPrev) * 100 : (valCurr > 0 ? 100 : 0);
    return {
      name: item,
      [prevYearKey]: valPrev,
      [currYearKey]: valCurr,
      diff,
      pct
    };
  });


  const statsIcons = {
    "HOMICÍDIO DOLOSO": Skull, "LATROCÍNIO": HandCoins, "ROUBO DE VEÍCULOS": Car,
    "FURTO DE VEÍCULOS": CarFront, "ROUBO EM RESIDÊNCIA": ShieldAlert, "ROUBO A TRANSEUNTES": UserMinus,
    "ROUBO A COLETIVO": Bus, "ROUBO A PONTO COMERCIAL": Store, "MORTE POR INTERVENÇÃO PM": Zap,
    "FURTO": Package, "ROUBO": AlertTriangle
  };

  const prodIcons = {
    "ARMAS DE FOGO APREENDIDAS": Shield, "VEÍCULOS RECUPERADOS": Target, "ENTORPECENTES EM Kg (TRÁFICO)": FlaskConical,
    "MUNIÇÕES": Layers, "PRESOS": Lock, "SIMULACRO": Ghost, "FORAGIDOS": Search
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <header className="dashboard-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>BATALHÃO LESTE - DASHBOARD GERAL</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {isAllYears ? 'Histórico Consolidado' : `Batalhão Leste - Conquistar e Manter! (${selectedYear})`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div className="year-selector" style={{ display: 'flex', gap: '2px', background: 'var(--glass-bg)', padding: '3px', borderRadius: '8px', border: '1px solid var(--surface-border)', overflowX: 'auto', maxWidth: '100vw' }}>
            <button onClick={() => setSelectedYear('all')} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: selectedYear === 'all' ? 'var(--primary-color)' : 'transparent', color: selectedYear === 'all' ? 'white' : 'var(--text-muted)', fontWeight: '600', fontSize: '0.7rem' }}>TODOS</button>
            {YEARS.map(year => (
              <button key={year} onClick={() => setSelectedYear(year)} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: selectedYear === year ? 'var(--primary-color)' : 'transparent', color: selectedYear === year ? 'white' : 'var(--text-muted)', fontWeight: '600', fontSize: '0.7rem' }}>{year}</button>
            ))}
          </div>
          <button 
            onClick={() => setShowFlyer(true)} 
            className="btn-primary" 
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ImageIcon size={14} /> Exibir Fly
          </button>
        </div>
      </header>

      <FlyerModal isOpen={showFlyer} onClose={() => setShowFlyer(false)} />

      <SectionTitle title="Produtividade" icon={CheckCircle} />
      <div className="kpi-grid">
        {PROD_ITEMS.map(item => (
          <KPICard
            key={item}
            title={item.replace(' (TRÁFICO)', '').replace(' APREENDIDAS', '')}
            value={currentDisplayProd[item]}
            variation={isAllYears ? calculateGlobalVariation('prod', item) : (selectedYear > YEARS[0] ? calculateTotalVariation('prod', selectedYear, item) : 0)}
            icon={prodIcons[item] || CheckCircle}
            color="#10b981"
            varLabel={isAllYears ? "vs 2021" : `vs ${selectedYear - 1}`}
          />
        ))}
      </div>

      <SectionTitle title="índice de Criminalidade" icon={AlertTriangle} />
      <div className="kpi-grid">
        {STATS_ITEMS.map(item => (
          <KPICard
            key={item}
            title={item}
            value={currentDisplayStats[item]}
            variation={isAllYears ? calculateGlobalVariation('stats', item) : (selectedYear > YEARS[0] ? calculateTotalVariation('stats', selectedYear, item) : 0)}
            icon={statsIcons[item] || AlertTriangle}
            color="#ef4444"
            isInverse={true}
            varLabel={isAllYears ? "vs 2021" : `vs ${selectedYear - 1}`}
          />
        ))}
      </div>

      {/* GRÁFICO 1: COMPARATIVO DOS ÍNDICES CRIMINAIS */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#ef4444" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                Comparativo dos Índices Criminais ({prevYear} vs {currYear})
              </h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
              Comparativo direto de ocorrências criminais entre os anos {prevYear} e {currYear}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#94a3b8', display: 'inline-block' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>Ano {prevYear}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444', display: 'inline-block' }}></span>
              <span style={{ color: '#ef4444' }}>Ano {currYear}</span>
            </div>
          </div>
        </div>

        <div style={{ height: '360px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statsComparativeData}
              margin={{ top: 25, right: 20, left: 0, bottom: 65 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize={9}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={65}
              />
              <YAxis stroke="var(--text-muted)" fontSize={10} />
              <Tooltip
                content={<ComparativeTooltip prevYearKey={prevYearKey} currYearKey={currYearKey} isInverse={true} />}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.8rem', paddingBottom: '10px' }} />
              <Bar dataKey={prevYearKey} fill="#94a3b8" radius={[4, 4, 0, 0]}>
                <LabelList dataKey={prevYearKey} position="top" fill="var(--text-muted)" fontSize={9} />
              </Bar>
              <Bar dataKey={currYearKey} fill="#ef4444" radius={[4, 4, 0, 0]}>
                <LabelList dataKey={currYearKey} position="top" fill="#ef4444" fontSize={9} fontWeight="bold" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 2: COMPARATIVO DA PRODUTIVIDADE */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                Comparativo de Produtividade Policial ({prevYear} vs {currYear})
              </h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
              Apreensões de armas, entorpecentes, veículos recuperados e prisões realizadas
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#94a3b8', display: 'inline-block' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>Ano {prevYear}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }}></span>
              <span style={{ color: '#10b981' }}>Ano {currYear}</span>
            </div>
          </div>
        </div>

        <div style={{ height: '340px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prodComparativeData}
              margin={{ top: 25, right: 20, left: 0, bottom: 45 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize={9}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis stroke="var(--text-muted)" fontSize={10} />
              <Tooltip
                content={<ComparativeTooltip prevYearKey={prevYearKey} currYearKey={currYearKey} isInverse={false} />}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.8rem', paddingBottom: '10px' }} />
              <Bar dataKey={prevYearKey} fill="#94a3b8" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey={prevYearKey}
                  position="top"
                  fill="var(--text-muted)"
                  fontSize={9}
                  formatter={(val) => typeof val === 'number' ? val.toFixed(2).replace(/\.00$/, '') : val}
                />
              </Bar>
              <Bar dataKey={currYearKey} fill="#10b981" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey={currYearKey}
                  position="top"
                  fill="#10b981"
                  fontSize={9}
                  fontWeight="bold"
                  formatter={(val) => typeof val === 'number' ? val.toFixed(2).replace(/\.00$/, '') : val}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Indicadores Por Zona (PDF / Estatísticas Oficiais de Manaus) */}
      <ZoneIndicators />

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 480px) {
          .kpi-icon-container { padding: 6px !important; }
          .kpi-icon-container svg { width: 16px; height: 16px; }
          h3 { font-size: 1.1rem !important; }
          .year-selector { margin-top: 0.5rem; width: 100%; justify-content: space-between; }
        }
      `}} />
    </div>
  );
};

export default Dashboard;
