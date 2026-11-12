import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList } from 'recharts';
import {
  Shield, Target, AlertTriangle, CheckCircle, Calendar,
  Skull, HandCoins, Car, Bus, Store, Zap, Package,
  ShieldAlert, UserMinus, CarFront, FlaskConical, Layers, Lock, Ghost, Search,
  TrendingUp, TrendingDown, Minus, Layers as LayersIcon, Image as ImageIcon
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Tendência de Crimes</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                <Line type="monotone" dataKey="ROUBO" stroke="var(--primary-color)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="FURTO" stroke="var(--accent-color)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="HOMICÍDIO DOLOSO" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Produtividade por Categoria</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PROD_ITEMS.map(item => ({
                name: item.split(' ')[0],
                value: currentDisplayProd[item],
                fullName: item
              }))} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={8} interval={0} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '0.8rem' }}
                  formatter={(value) => [typeof value === 'number' ? value.toFixed(2).replace(/\.00$/, '') : value]}
                />
                <Bar dataKey="value" fill="var(--secondary-color)" radius={[4, 4, 0, 0]}>
                  {PROD_ITEMS.map((entry, index) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary-color)' : 'var(--accent-color)'} />)}
                  <LabelList
                    dataKey="value"
                    position="top"
                    fill="var(--text-muted)"
                    fontSize={10}
                    formatter={(val) => typeof val === 'number' ? val.toFixed(2).replace(/\.00$/, '') : val}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Criminalidade por Categoria (Detalhado)</h3>
        <div style={{ height: '350px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={STATS_ITEMS.map(item => ({
                name: item,
                value: currentDisplayStats[item]
              }))}
              margin={{ top: 25, right: 20, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize={9}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="var(--text-muted)" fontSize={10} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '0.8rem' }}
              />
              <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]}>
                {STATS_ITEMS.map((entry, index) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ef4444' : '#f87171'} />)}
                <LabelList dataKey="value" position="top" fill="var(--text-muted)" fontSize={10} />
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
