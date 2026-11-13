import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList, Legend } from 'recharts';
import {
  Shield, Target, AlertTriangle, CheckCircle, Calendar,
  Skull, HandCoins, Car, Bus, Store, Zap, Package,
  ShieldAlert, UserMinus, CarFront, FlaskConical, Layers, Lock, Ghost, Search,
  TrendingUp, TrendingDown, Minus, Layers as LayersIcon, Image as ImageIcon,
  ShieldCheck, ArrowUpRight, ArrowDownRight, Scale, Check,
  Table as TableIcon, BarChart3
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

const YEAR_COLORS = {
  2021: '#64748b',
  2022: '#8b5cf6',
  2023: '#06b6d4',
  2024: '#f59e0b',
  2025: '#94a3b8',
  2026: '#3b82f6',
};

const getComparisonBadge = (valBase, valTarget, isInverse = false) => {
  const numBase = Number(valBase || 0);
  const numTarget = Number(valTarget || 0);
  const diff = numTarget - numBase;

  if (diff === 0) {
    return {
      text: '— NEUTRO',
      tipo: 'neutro',
      style: {
        background: 'rgba(148, 163, 184, 0.12)',
        color: 'var(--text-muted)',
        border: '1px solid rgba(148, 163, 184, 0.25)'
      },
      icon: Minus
    };
  }

  const pct = numBase > 0 ? ((numTarget - numBase) / numBase) * 100 : (numTarget > 0 ? 100 : 0);
  const isGood = isInverse ? diff < 0 : diff > 0;
  
  // Se os valores forem pequenos (< 15), exibe quantidade de registros conforme relatório oficial
  const useAbsolute = (numBase < 15 && numTarget < 15);
  const formattedDiff = diff > 0 ? `+${diff % 1 === 0 ? diff : diff.toFixed(1)}` : `${diff % 1 === 0 ? diff : diff.toFixed(1)}`;
  const formattedPct = `${pct > 0 ? `+${pct.toFixed(0)}%` : `${pct.toFixed(0)}%`}`;
  
  const text = useAbsolute
    ? `${formattedDiff} REGISTROS`
    : `${formattedPct}${Math.abs(pct) >= 20 ? ' 👍' : ''}`;

  if (isGood) {
    return {
      text,
      tipo: 'bom',
      style: {
        background: 'rgba(16, 185, 129, 0.15)',
        color: '#10b981',
        border: '1px solid rgba(16, 185, 129, 0.3)'
      },
      icon: isInverse ? TrendingDown : TrendingUp
    };
  } else {
    return {
      text,
      tipo: 'ruim',
      style: {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      },
      icon: isInverse ? TrendingUp : TrendingDown
    };
  }
};

const MultiYearTooltip = ({ active, payload, label, selectedYears, isInverse = false }) => {
  if (active && payload && payload.length) {
    const targetYear = selectedYears.length > 0 ? Math.max(...selectedYears) : 2026;
    const baseYear = selectedYears.length > 1 ? Math.min(...selectedYears) : null;

    const baseItem = baseYear ? payload.find(p => p.dataKey === `Ano ${baseYear}`) : null;
    const targetItem = targetYear ? payload.find(p => p.dataKey === `Ano ${targetYear}`) : null;

    const baseVal = Number(baseItem?.value || 0);
    const targetVal = Number(targetItem?.value || 0);
    const diff = targetVal - baseVal;
    const pct = baseVal > 0 ? ((targetVal - baseVal) / baseVal) * 100 : (targetVal > 0 ? 100 : 0);
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
        {payload.map((p) => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: p.color || '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color || '#94a3b8', display: 'inline-block' }}></span>
              {p.dataKey}:
            </span>
            <span style={{ fontWeight: '700' }}>
              {typeof p.value === 'number' ? (p.value % 1 === 0 ? p.value.toLocaleString('pt-BR') : p.value.toFixed(2)) : p.value}
            </span>
          </div>
        ))}
        {baseYear && targetYear && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontWeight: '800',
            color: isGood ? '#10b981' : '#ef4444'
          }}>
            <span>Variação ({baseYear} vs {targetYear}):</span>
            <span>
              {diff > 0 ? `+${diff.toLocaleString('pt-BR')}` : diff.toLocaleString('pt-BR')} ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const MonthFilterBar = ({
  months,
  selectedMonths,
  onChange,
  activeColor = 'var(--primary-color)',
  title = "Filtrar por Mês"
}) => {
  const isAll = selectedMonths.length === 12;
  const isJanSet = selectedMonths.length === 9 && selectedMonths.every((m, idx) => m === idx);
  const isSem1 = selectedMonths.length === 6 && selectedMonths.every((m, idx) => m === idx);
  const isSem2 = selectedMonths.length === 6 && selectedMonths.every((m, idx) => m === idx + 6);

  const toggleMonth = (idx) => {
    if (selectedMonths.includes(idx)) {
      if (selectedMonths.length === 1) return; // manter pelo menos 1 mês selecionado
      onChange(selectedMonths.filter(m => m !== idx));
    } else {
      onChange([...selectedMonths, idx].sort((a, b) => a - b));
    }
  };

  const getPeriodLabel = () => {
    if (isAll) return 'Ano Inteiro (Jan a Dez)';
    if (isJanSet) return 'Jan a Set (9 Meses)';
    if (isSem1) return '1º Semestre (Jan a Jun)';
    if (isSem2) return '2º Semestre (Jul a Dez)';
    if (selectedMonths.length === 1) return months[selectedMonths[0]];
    return `${selectedMonths.length} meses (${selectedMonths.map(i => months[i]).join(', ')})`;
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--surface-border)',
      borderRadius: '12px',
      padding: '10px 14px',
      marginBottom: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color={activeColor} />
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-color)', textTransform: 'uppercase' }}>
            {title}:
          </span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: '700',
            color: activeColor,
            background: `${activeColor}18`,
            padding: '2px 8px',
            borderRadius: '6px'
          }}>
            {getPeriodLabel()}
          </span>
        </div>

        {/* Atalhos Rápidos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onChange([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])}
            style={{
              padding: '3px 8px',
              borderRadius: '5px',
              fontSize: '0.65rem',
              fontWeight: '700',
              border: '1px solid var(--surface-border)',
              background: isAll ? activeColor : 'transparent',
              color: isAll ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onChange([0, 1, 2, 3, 4, 5, 6, 7, 8])}
            style={{
              padding: '3px 8px',
              borderRadius: '5px',
              fontSize: '0.65rem',
              fontWeight: '700',
              border: '1px solid var(--surface-border)',
              background: isJanSet ? activeColor : 'transparent',
              color: isJanSet ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Jan a Set
          </button>
          <button
            type="button"
            onClick={() => onChange([0, 1, 2, 3, 4, 5])}
            style={{
              padding: '3px 8px',
              borderRadius: '5px',
              fontSize: '0.65rem',
              fontWeight: '700',
              border: '1px solid var(--surface-border)',
              background: isSem1 ? activeColor : 'transparent',
              color: isSem1 ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            1º Sem
          </button>
          <button
            type="button"
            onClick={() => onChange([6, 7, 8, 9, 10, 11])}
            style={{
              padding: '3px 8px',
              borderRadius: '5px',
              fontSize: '0.65rem',
              fontWeight: '700',
              border: '1px solid var(--surface-border)',
              background: isSem2 ? activeColor : 'transparent',
              color: isSem2 ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            2º Sem
          </button>
        </div>
      </div>

      {/* Pílulas de Cada Mês (Seleção Múltipla) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {months.map((m, idx) => {
          const isSelected = selectedMonths.includes(idx);
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggleMonth(idx)}
              style={{
                flex: '1 0 calc(8.33% - 4px)',
                minWidth: '40px',
                padding: '6px 4px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: isSelected ? '800' : '600',
                border: isSelected ? `1px solid ${activeColor}` : '1px solid var(--surface-border)',
                background: isSelected ? activeColor : 'rgba(255, 255, 255, 0.02)',
                color: isSelected ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MultiYearFilterBar = ({
  years,
  selectedYears,
  onChange,
  activeColor = 'var(--primary-color)',
  title = "Filtrar por Ano"
}) => {
  const isAll = selectedYears.length === years.length;
  const isLast2 = selectedYears.length === 2 && selectedYears.includes(2025) && selectedYears.includes(2026);
  const isLast3 = selectedYears.length === 3 && selectedYears.includes(2024) && selectedYears.includes(2025) && selectedYears.includes(2026);
  const is2021vs2026 = selectedYears.length === 2 && selectedYears.includes(2021) && selectedYears.includes(2026);

  const toggleYear = (yr) => {
    if (selectedYears.includes(yr)) {
      if (selectedYears.length === 1) return; // manter ao menos 1 ano selecionado
      onChange(selectedYears.filter(y => y !== yr));
    } else {
      onChange([...selectedYears, yr].sort((a, b) => a - b));
    }
  };

  const getPeriodLabel = () => {
    if (isAll) return 'Todos os Anos (2021 a 2026)';
    if (isLast2) return '2025 vs 2026';
    if (isLast3) return '2024 a 2026';
    if (is2021vs2026) return '2021 vs 2026';
    if (selectedYears.length === 1) return `Ano ${selectedYears[0]}`;
    return `${selectedYears.join(', ')}`;
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--surface-border)',
      borderRadius: '12px',
      padding: '10px 14px',
      marginBottom: '0.8rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color={activeColor} />
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-color)', textTransform: 'uppercase' }}>
            {title}:
          </span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: '700',
            color: activeColor,
            background: `${activeColor}18`,
            padding: '2px 8px',
            borderRadius: '6px'
          }}>
            {getPeriodLabel()}
          </span>
        </div>

        {/* Atalhos Rápidos de Ano */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onChange([...years])}
            style={{
              padding: '3px 8px',
              borderRadius: '5px',
              fontSize: '0.65rem',
              fontWeight: '700',
              border: '1px solid var(--surface-border)',
              background: isAll ? activeColor : 'transparent',
              color: isAll ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onChange([2025, 2026])}
            style={{
              padding: '3px 8px',
              borderRadius: '5px',
              fontSize: '0.65rem',
              fontWeight: '700',
              border: '1px solid var(--surface-border)',
              background: isLast2 ? activeColor : 'transparent',
              color: isLast2 ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            2025 e 2026
          </button>
          <button
            type="button"
            onClick={() => onChange([2024, 2025, 2026])}
            style={{
              padding: '3px 8px',
              borderRadius: '5px',
              fontSize: '0.65rem',
              fontWeight: '700',
              border: '1px solid var(--surface-border)',
              background: isLast3 ? activeColor : 'transparent',
              color: isLast3 ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            2024 a 2026
          </button>
          <button
            type="button"
            onClick={() => onChange([2021, 2026])}
            style={{
              padding: '3px 8px',
              borderRadius: '5px',
              fontSize: '0.65rem',
              fontWeight: '700',
              border: '1px solid var(--surface-border)',
              background: is2021vs2026 ? activeColor : 'transparent',
              color: is2021vs2026 ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            2021 vs 2026
          </button>
        </div>
      </div>

      {/* Pílulas de Cada Ano (Seleção Múltipla) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {years.map((y) => {
          const isSelected = selectedYears.includes(y);
          return (
            <button
              key={y}
              type="button"
              onClick={() => toggleYear(y)}
              style={{
                flex: '1 0 calc(16.66% - 6px)',
                minWidth: '55px',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: isSelected ? '800' : '600',
                border: isSelected ? `1.5px solid ${activeColor}` : '1px solid var(--surface-border)',
                background: isSelected ? `${activeColor}22` : 'rgba(255, 255, 255, 0.02)',
                color: isSelected ? activeColor : 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {isSelected ? `✓ ${y}` : y}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const OfficialTable = ({
  items,
  icons,
  years,
  getYearValue,
  isInverse = false,
  activeColor = '#3b82f6',
  totalLabel = "TOTAL GERAL"
}) => {
  const targetYear = years.length > 0 ? Math.max(...years) : 2026;
  const baseYear = years.length > 1 ? Math.min(...years) : (years[0] > 2021 ? years[0] - 1 : years[0] || 2025);

  // Totais por ano
  const totalsByYear = {};
  years.forEach(y => {
    totalsByYear[y] = items.reduce((acc, item) => acc + Number(getYearValue(y, item) || 0), 0);
  });

  const totalBaseVal = totalsByYear[baseYear] || 0;
  const totalTargetVal = totalsByYear[targetYear] || 0;
  const totalBadge = getComparisonBadge(totalBaseVal, totalTargetVal, isInverse);
  const TotalBadgeIcon = totalBadge.icon;

  return (
    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--surface-border)', background: 'var(--surface-color)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ background: 'var(--surface-border)', color: 'var(--text-color)', fontWeight: '800', textTransform: 'uppercase' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', minWidth: '220px' }}>NATUREZA</th>
            {years.map(y => {
              const isTarget = y === targetYear;
              return (
                <th
                  key={y}
                  style={{
                    padding: '10px 10px',
                    minWidth: '70px',
                    background: isTarget ? `${activeColor}20` : 'transparent',
                    color: isTarget ? activeColor : 'inherit',
                    fontWeight: isTarget ? '900' : '800'
                  }}
                >
                  {y}
                </th>
              );
            })}
            <th style={{ padding: '10px 14px', minWidth: '160px' }}>
              COMPARATIVO % {years.length > 1 && `(${baseYear} vs ${targetYear})`}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const Icon = icons[item] || ShieldAlert;
            const valBase = getYearValue(baseYear, item);
            const valTarget = getYearValue(targetYear, item);
            const badge = getComparisonBadge(valBase, valTarget, isInverse);
            const BadgeIcon = badge.icon;

            return (
              <tr
                key={item}
                style={{
                  borderBottom: '1px solid var(--surface-border)',
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                }}
              >
                {/* NATUREZA COM ÍCONE */}
                <td style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={15} color={activeColor} style={{ flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                </td>

                {/* VALORES DOS ANOS SELECIONADOS */}
                {years.map(y => {
                  const val = getYearValue(y, item);
                  const isTarget = y === targetYear;
                  return (
                    <td
                      key={y}
                      style={{
                        padding: '10px 10px',
                        background: isTarget ? `${activeColor}08` : 'transparent',
                        fontWeight: isTarget ? '800' : '500',
                        color: isTarget ? activeColor : 'var(--text-muted)'
                      }}
                    >
                      {typeof val === 'number'
                        ? (val % 1 === 0 ? val.toLocaleString('pt-BR') : val.toFixed(2))
                        : val}
                    </td>
                  );
                })}

                {/* COMPARATIVO BADGE */}
                <td style={{ padding: '8px 14px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      ...badge.style
                    }}
                  >
                    <BadgeIcon size={12} />
                    {badge.text}
                  </span>
                </td>
              </tr>
            );
          })}

          {/* LINHA DE TOTAL GERAL */}
          <tr style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderTop: '2px solid var(--surface-border)',
            fontWeight: '800'
          }}>
            <td style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-color)', letterSpacing: '0.5px' }}>
              {totalLabel}
            </td>
            {years.map(y => {
              const val = totalsByYear[y] || 0;
              const isTarget = y === targetYear;
              return (
                <td
                  key={y}
                  style={{
                    padding: '12px 10px',
                    fontWeight: '900',
                    fontSize: '0.85rem',
                    background: isTarget ? `${activeColor}15` : 'transparent',
                    color: isTarget ? activeColor : 'var(--text-color)'
                  }}
                >
                  {typeof val === 'number'
                    ? (val % 1 === 0 ? val.toLocaleString('pt-BR') : val.toFixed(2))
                    : val}
                </td>
              );
            })}
            <td style={{ padding: '10px 14px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  ...totalBadge.style
                }}
              >
                <TotalBadgeIcon size={12} />
                {totalBadge.text}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
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

  // Modos de visualização (Tabela Oficial vs Gráfico Comparativo)
  const [statsViewMode, setStatsViewMode] = useState('tabela'); // 'tabela' | 'grafico'
  const [prodViewMode, setProdViewMode] = useState('tabela');   // 'tabela' | 'grafico'

  // Filtros múltiplos de anos (por padrão todos os anos 2021 a 2026 para a tabela oficial completa)
  const [selectedStatsYears, setSelectedStatsYears] = useState([2021, 2022, 2023, 2024, 2025, 2026]);
  const [selectedProdYears, setSelectedProdYears] = useState([2021, 2022, 2023, 2024, 2025, 2026]);

  // Filtros múltiplos de meses para Criminalidade e Produtividade (por padrão: JAN a SET)
  const [selectedStatsMonths, setSelectedStatsMonths] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const [selectedProdMonths, setSelectedProdMonths] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8]);

  const getMonthsTotal = (type, year, item, monthsList) => {
    const dataArray = type === 'stats' ? statsData[year]?.[item] : prodData[year]?.[item];
    if (!dataArray) return 0;
    return monthsList.reduce((acc, mIdx) => acc + Number(dataArray[mIdx] || 0), 0);
  };

  const statsComparativeData = STATS_ITEMS.map(item => {
    const row = { name: item };
    selectedStatsYears.forEach(y => {
      row[`Ano ${y}`] = getMonthsTotal('stats', y, item, selectedStatsMonths);
    });
    return row;
  });

  const prodComparativeData = PROD_ITEMS.map(item => {
    const row = { name: item };
    selectedProdYears.forEach(y => {
      row[`Ano ${y}`] = getMonthsTotal('prod', y, item, selectedProdMonths);
    });
    return row;
  });

  const statsTargetYear = selectedStatsYears.length > 0 ? Math.max(...selectedStatsYears) : 2026;
  const statsBaseYear = selectedStatsYears.length > 1 
    ? Math.min(...selectedStatsYears) 
    : (selectedStatsYears[0] > 2021 ? selectedStatsYears[0] - 1 : selectedStatsYears[0] || 2025);
  const statsRangeLabel = statsBaseYear === statsTargetYear ? `${statsTargetYear}` : `${statsBaseYear} vs ${statsTargetYear}`;

  const prodTargetYear = selectedProdYears.length > 0 ? Math.max(...selectedProdYears) : 2026;
  const prodBaseYear = selectedProdYears.length > 1 
    ? Math.min(...selectedProdYears) 
    : (selectedProdYears[0] > 2021 ? selectedProdYears[0] - 1 : selectedProdYears[0] || 2025);
  const prodRangeLabel = prodBaseYear === prodTargetYear ? `${prodTargetYear}` : `${prodBaseYear} vs ${prodTargetYear}`;

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

      {/* SEÇÃO 1: COMPARATIVO DOS ÍNDICES CRIMINAIS (TABELA OFICIAL E GRÁFICO) */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#ef4444" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                Índices Criminais - {statsViewMode === 'tabela' ? 'Tabela Oficial' : 'Gráfico Comparativo'} ({statsRangeLabel})
              </h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
              Monitoramento criminal comparativo com seleção múltipla de anos e meses
            </p>
          </div>

          {/* Toggle de Visualização: Tabela Oficial vs Gráfico Comparativo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--surface-color)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--surface-border)'
          }}>
            <button
              type="button"
              onClick={() => setStatsViewMode('tabela')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: statsViewMode === 'tabela' ? '1px solid #ef4444' : '1px solid transparent',
                background: statsViewMode === 'tabela' ? '#ef4444' : 'transparent',
                color: statsViewMode === 'tabela' ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <TableIcon size={14} /> Tabela Oficial
            </button>
            <button
              type="button"
              onClick={() => setStatsViewMode('grafico')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: statsViewMode === 'grafico' ? '1px solid #ef4444' : '1px solid transparent',
                background: statsViewMode === 'grafico' ? '#ef4444' : 'transparent',
                color: statsViewMode === 'grafico' ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <BarChart3 size={14} /> Gráfico Comparativo
            </button>
          </div>
        </div>

        {/* Filtro Múltiplo de Anos para Criminalidade */}
        <MultiYearFilterBar
          years={YEARS}
          selectedYears={selectedStatsYears}
          onChange={setSelectedStatsYears}
          activeColor="#ef4444"
          title="Filtro de Anos (Criminalidade)"
        />

        {/* Filtro Múltiplo de Meses para Criminalidade */}
        <MonthFilterBar
          months={MONTHS}
          selectedMonths={selectedStatsMonths}
          onChange={setSelectedStatsMonths}
          activeColor="#ef4444"
          title="Filtro de Meses (Criminalidade)"
        />

        {/* Exibição: Tabela Oficial ou Gráfico */}
        {statsViewMode === 'tabela' ? (
          <OfficialTable
            items={STATS_ITEMS}
            icons={statsIcons}
            years={selectedStatsYears}
            getYearValue={(year, item) => getMonthsTotal('stats', year, item, selectedStatsMonths)}
            isInverse={true}
            activeColor="#ef4444"
            totalLabel="TOTAL DE CRIMES"
          />
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div style={{ height: '360px', minWidth: selectedStatsYears.length > 3 ? '850px' : '100%' }}>
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
                    content={<MultiYearTooltip selectedYears={selectedStatsYears} isInverse={true} />}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.8rem', paddingBottom: '10px' }} />
                  {selectedStatsYears.map((y, idx) => {
                    const isTarget = idx === selectedStatsYears.length - 1;
                    const barColor = selectedStatsYears.length === 2
                      ? (isTarget ? '#ef4444' : '#94a3b8')
                      : (y === 2026 ? '#ef4444' : (YEAR_COLORS[y] || '#ef4444'));
                    return (
                      <Bar key={y} dataKey={`Ano ${y}`} fill={barColor} radius={[4, 4, 0, 0]}>
                        <LabelList
                          dataKey={`Ano ${y}`}
                          position="top"
                          fill={barColor}
                          fontSize={9}
                          fontWeight={isTarget ? 'bold' : 'normal'}
                          formatter={(val) => typeof val === 'number' ? (val % 1 === 0 ? val : val.toFixed(1)) : val}
                        />
                      </Bar>
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: COMPARATIVO DA PRODUTIVIDADE POLICIAL (TABELA OFICIAL E GRÁFICO) */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                Produtividade Policial - {prodViewMode === 'tabela' ? 'Tabela Oficial' : 'Gráfico Comparativo'} ({prodRangeLabel})
              </h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
              Apreensões de armas, entorpecentes, veículos recuperados e prisões realizadas
            </p>
          </div>

          {/* Toggle de Visualização: Tabela Oficial vs Gráfico Comparativo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--surface-color)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--surface-border)'
          }}>
            <button
              type="button"
              onClick={() => setProdViewMode('tabela')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: prodViewMode === 'tabela' ? '1px solid #10b981' : '1px solid transparent',
                background: prodViewMode === 'tabela' ? '#10b981' : 'transparent',
                color: prodViewMode === 'tabela' ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <TableIcon size={14} /> Tabela Oficial
            </button>
            <button
              type="button"
              onClick={() => setProdViewMode('grafico')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: prodViewMode === 'grafico' ? '1px solid #10b981' : '1px solid transparent',
                background: prodViewMode === 'grafico' ? '#10b981' : 'transparent',
                color: prodViewMode === 'grafico' ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <BarChart3 size={14} /> Gráfico Comparativo
            </button>
          </div>
        </div>

        {/* Filtro Múltiplo de Anos para Produtividade */}
        <MultiYearFilterBar
          years={YEARS}
          selectedYears={selectedProdYears}
          onChange={setSelectedProdYears}
          activeColor="#10b981"
          title="Filtro de Anos (Produtividade)"
        />

        {/* Filtro Múltiplo de Meses para Produtividade */}
        <MonthFilterBar
          months={MONTHS}
          selectedMonths={selectedProdMonths}
          onChange={setSelectedProdMonths}
          activeColor="#10b981"
          title="Filtro de Meses (Produtividade)"
        />

        {/* Exibição: Tabela Oficial ou Gráfico */}
        {prodViewMode === 'tabela' ? (
          <OfficialTable
            items={PROD_ITEMS}
            icons={prodIcons}
            years={selectedProdYears}
            getYearValue={(year, item) => getMonthsTotal('prod', year, item, selectedProdMonths)}
            isInverse={false}
            activeColor="#10b981"
            totalLabel="TOTAL DE PRODUTIVIDADE"
          />
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div style={{ height: '340px', minWidth: selectedProdYears.length > 3 ? '750px' : '100%' }}>
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
                    content={<MultiYearTooltip selectedYears={selectedProdYears} isInverse={false} />}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.8rem', paddingBottom: '10px' }} />
                  {selectedProdYears.map((y, idx) => {
                    const isTarget = idx === selectedProdYears.length - 1;
                    const barColor = selectedProdYears.length === 2
                      ? (isTarget ? '#10b981' : '#94a3b8')
                      : (y === 2026 ? '#10b981' : (YEAR_COLORS[y] || '#10b981'));
                    return (
                      <Bar key={y} dataKey={`Ano ${y}`} fill={barColor} radius={[4, 4, 0, 0]}>
                        <LabelList
                          dataKey={`Ano ${y}`}
                          position="top"
                          fill={barColor}
                          fontSize={9}
                          fontWeight={isTarget ? 'bold' : 'normal'}
                          formatter={(val) => typeof val === 'number' ? (val % 1 === 0 ? val : val.toFixed(1)) : val}
                        />
                      </Bar>
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
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
