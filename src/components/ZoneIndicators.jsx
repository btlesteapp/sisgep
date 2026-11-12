import React, { useState, useMemo } from 'react';
import {
  MapPin, TrendingDown, TrendingUp, Minus, Filter, Search,
  BarChart3, Table as TableIcon, ShieldAlert, Award
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts';

export const ZONE_INDICATORS_DATA = [
  {
    zona: "CENTRO OESTE E CENTRO SUL",
    itens: [
      { natureza: "HOMICÍDIO", v2021: 67, v2022: 70, v2023: 68, v2024: 38, v2025: 29, v2026: 13, comp: "-16 REGISTROS", tipo: "queda" },
      { natureza: "LATROCÍNIO", v2021: 2, v2022: 0, v2023: 5, v2024: 2, v2025: 1, v2026: 5, comp: "+4 REGISTROS", tipo: "alta" },
      { natureza: "ROUBO DE VEÍCULO", v2021: 230, v2022: 154, v2023: 103, v2024: 66, v2025: 68, v2026: 29, comp: "-57%", tipo: "queda" },
      { natureza: "FURTO DE VEÍCULO", v2021: 159, v2022: 176, v2023: 172, v2024: 220, v2025: 198, v2026: 134, comp: "-32%", tipo: "queda" },
      { natureza: "ROUBO EM RESIDÊNCIA", v2021: 88, v2022: 96, v2023: 48, v2024: 37, v2025: 23, v2026: 17, comp: "-6 REGISTROS", tipo: "queda" },
      { natureza: "ROUBO A TRANSEUNTE", v2021: 3057, v2022: 2724, v2023: 2806, v2024: 2855, v2025: 2109, v2026: 1185, comp: "-44%", tipo: "queda" },
      { natureza: "ROUBO A COLETIVO", v2021: 80, v2022: 121, v2023: 195, v2024: 103, v2025: 29, v2026: 8, comp: "-21 REGISTROS", tipo: "queda" },
      { natureza: "ROUBO EM ESTABELECIMENTO COMERCIAL", v2021: 336, v2022: 252, v2023: 240, v2024: 181, v2025: 147, v2026: 68, comp: "-54%", tipo: "queda" }
    ]
  },
  {
    zona: "LESTE",
    itens: [
      { natureza: "HOMICÍDIO", v2021: 241, v2022: 174, v2023: 148, v2024: 148, v2025: 70, v2026: 55, comp: "-21%", tipo: "queda" },
      { natureza: "LATROCÍNIO", v2021: 10, v2022: 10, v2023: 6, v2024: 2, v2025: 2, v2026: 2, comp: "NEUTRO", tipo: "neutro" },
      { natureza: "ROUBO DE VEÍCULO", v2021: 423, v2022: 250, v2023: 245, v2024: 151, v2025: 106, v2026: 48, comp: "-55%", tipo: "queda" },
      { natureza: "FURTO DE VEÍCULO", v2021: 281, v2022: 343, v2023: 237, v2024: 219, v2025: 245, v2026: 189, comp: "-23%", tipo: "queda" },
      { natureza: "ROUBO EM RESIDÊNCIA", v2021: 281, v2022: 141, v2023: 100, v2024: 86, v2025: 42, v2026: 19, comp: "-23 REGISTROS", tipo: "queda" },
      { natureza: "ROUBO A TRANSEUNTE", v2021: 4864, v2022: 4049, v2023: 4289, v2024: 3901, v2025: 2607, v2026: 1777, comp: "-32%", tipo: "queda" },
      { natureza: "ROUBO A COLETIVO", v2021: 157, v2022: 200, v2023: 181, v2024: 89, v2025: 19, v2026: 4, comp: "-15 REGISTROS", tipo: "queda" },
      { natureza: "ROUBO EM ESTABELECIMENTO COMERCIAL", v2021: 411, v2022: 245, v2023: 200, v2024: 130, v2025: 100, v2026: 63, comp: "-37%", tipo: "queda" }
    ]
  },
  {
    zona: "NORTE",
    itens: [
      { natureza: "HOMICÍDIO", v2021: 186, v2022: 194, v2023: 211, v2024: 179, v2025: 87, v2026: 57, comp: "-34%", tipo: "queda" },
      { natureza: "LATROCÍNIO", v2021: 11, v2022: 12, v2023: 2, v2024: 6, v2025: 3, v2026: 3, comp: "NEUTRO", tipo: "neutro" },
      { natureza: "ROUBO DE VEÍCULO", v2021: 644, v2022: 425, v2023: 295, v2024: 240, v2025: 163, v2026: 85, comp: "-48%", tipo: "queda" },
      { natureza: "FURTO DE VEÍCULO", v2021: 468, v2022: 370, v2023: 333, v2024: 333, v2025: 287, v2026: 225, comp: "-22%", tipo: "queda" },
      { natureza: "ROUBO EM RESIDÊNCIA", v2021: 308, v2022: 189, v2023: 143, v2024: 98, v2025: 67, v2026: 47, comp: "-30%", tipo: "queda" },
      { natureza: "ROUBO A TRANSEUNTE", v2021: 6738, v2022: 5371, v2023: 5935, v2024: 5088, v2025: 3840, v2026: 2489, comp: "-35%", tipo: "queda" },
      { natureza: "ROUBO A COLETIVO", v2021: 481, v2022: 447, v2023: 229, v2024: 148, v2025: 108, v2026: 49, comp: "-55%", tipo: "queda" },
      { natureza: "ROUBO EM ESTABELECIMENTO COMERCIAL", v2021: 510, v2022: 368, v2023: 316, v2024: 177, v2025: 150, v2026: 103, comp: "-31%", tipo: "queda" }
    ]
  },
  {
    zona: "OESTE",
    itens: [
      { natureza: "HOMICÍDIO", v2021: 142, v2022: 177, v2023: 104, v2024: 92, v2025: 57, v2026: 57, comp: "NEUTRO", tipo: "neutro" },
      { natureza: "LATROCÍNIO", v2021: 4, v2022: 6, v2023: 3, v2024: 0, v2025: 0, v2026: 1, comp: "+1 REGISTRO", tipo: "alta" },
      { natureza: "ROUBO DE VEÍCULO", v2021: 134, v2022: 97, v2023: 78, v2024: 66, v2025: 42, v2026: 34, comp: "-19%", tipo: "queda" },
      { natureza: "FURTO DE VEÍCULO", v2021: 113, v2022: 125, v2023: 88, v2024: 114, v2025: 113, v2026: 65, comp: "-42%", tipo: "queda" },
      { natureza: "ROUBO EM RESIDÊNCIA", v2021: 100, v2022: 68, v2023: 44, v2024: 25, v2025: 25, v2026: 19, comp: "-6 REGISTROS", tipo: "queda" },
      { natureza: "ROUBO A TRANSEUNTE", v2021: 1760, v2022: 1666, v2023: 1955, v2024: 1724, v2025: 1125, v2026: 647, comp: "-42%", tipo: "queda" },
      { natureza: "ROUBO A COLETIVO", v2021: 194, v2022: 145, v2023: 74, v2024: 50, v2025: 49, v2026: 20, comp: "-29 REGISTROS", tipo: "queda" },
      { natureza: "ROUBO EM ESTABELECIMENTO COMERCIAL", v2021: 129, v2022: 150, v2023: 132, v2024: 119, v2025: 66, v2026: 45, comp: "-32%", tipo: "queda" }
    ]
  },
  {
    zona: "SUL",
    itens: [
      { natureza: "HOMICÍDIO", v2021: 108, v2022: 107, v2023: 113, v2024: 69, v2025: 39, v2026: 39, comp: "NEUTRO", tipo: "neutro" },
      { natureza: "LATROCÍNIO", v2021: 3, v2022: 2, v2023: 4, v2024: 0, v2025: 1, v2026: 1, comp: "NEUTRO", tipo: "neutro" },
      { natureza: "ROUBO DE VEÍCULO", v2021: 159, v2022: 89, v2023: 82, v2024: 59, v2025: 41, v2026: 27, comp: "-14 REGISTROS", tipo: "queda" },
      { natureza: "FURTO DE VEÍCULO", v2021: 207, v2022: 280, v2023: 136, v2024: 205, v2025: 220, v2026: 154, comp: "-30%", tipo: "queda" },
      { natureza: "ROUBO EM RESIDÊNCIA", v2021: 79, v2022: 44, v2023: 28, v2024: 24, v2025: 20, v2026: 23, comp: "+3 REGISTROS", tipo: "alta" },
      { natureza: "ROUBO A TRANSEUNTE", v2021: 3023, v2022: 2739, v2023: 2944, v2024: 2391, v2025: 1805, v2026: 1180, comp: "-35%", tipo: "queda" },
      { natureza: "ROUBO A COLETIVO", v2021: 235, v2022: 384, v2023: 247, v2024: 200, v2025: 44, v2026: 47, comp: "7%", tipo: "alta" },
      { natureza: "ROUBO EM ESTABELECIMENTO COMERCIAL", v2021: 289, v2022: 205, v2023: 200, v2024: 134, v2025: 99, v2026: 64, comp: "-35%", tipo: "queda" }
    ]
  }
];

export const ZoneIndicators = () => {
  const [selectedZona, setSelectedZona] = useState('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('tabela'); // 'tabela' ou 'grafico'

  const zonasList = ['TODAS', ...ZONE_INDICATORS_DATA.map(z => z.zona)];

  // Totais por Zona em 2026 vs 2025
  const zoneSummaries = useMemo(() => {
    return ZONE_INDICATORS_DATA.map(z => {
      const total2025 = z.itens.reduce((acc, curr) => acc + curr.v2025, 0);
      const total2026 = z.itens.reduce((acc, curr) => acc + curr.v2026, 0);
      const varPct = total2025 > 0 ? ((total2026 - total2025) / total2025) * 100 : 0;
      return {
        zona: z.zona,
        total2025,
        total2026,
        varPct,
        diff: total2026 - total2025
      };
    });
  }, []);

  // Dados filtrados para a tabela
  const filteredData = useMemo(() => {
    return ZONE_INDICATORS_DATA
      .filter(z => selectedZona === 'TODAS' || z.zona === selectedZona)
      .map(z => ({
        ...z,
        itens: z.itens.filter(i => 
          i.natureza.toLowerCase().includes(searchTerm.toLowerCase().trim())
        )
      }))
      .filter(z => z.itens.length > 0);
  }, [selectedZona, searchTerm]);

  // Dados para o gráfico de comparação por Zona
  const chartData = useMemo(() => {
    return zoneSummaries.map(s => ({
      name: s.zona === 'CENTRO OESTE E CENTRO SUL' ? 'C. OESTE/SUL' : s.zona,
      fullName: s.zona,
      '2025': s.total2025,
      '2026': s.total2026
    }));
  }, [zoneSummaries]);

  const getBadgeStyle = (tipo) => {
    if (tipo === 'queda') {
      return {
        background: 'rgba(16, 185, 129, 0.15)',
        color: '#10b981',
        border: '1px solid rgba(16, 185, 129, 0.3)'
      };
    }
    if (tipo === 'alta') {
      return {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      };
    }
    return {
      background: 'rgba(148, 163, 184, 0.15)',
      color: 'var(--text-muted)',
      border: '1px solid rgba(148, 163, 184, 0.3)'
    };
  };

  return (
    <section className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem', borderRadius: '16px' }}>
      {/* Header com Título Oficial */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        borderBottom: '1px solid var(--surface-border)',
        paddingBottom: '1.2rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
            padding: '10px',
            borderRadius: '12px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)'
          }}>
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                INDICADORES POR ZONA - MANAUS
              </h2>
              <span style={{
                background: '#10b98120',
                color: '#10b981',
                border: '1px solid #10b98140',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: '800',
                textTransform: 'uppercase'
              }}>
                JAN A SET (2021 A 2026)
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '3px 0 0 0' }}>
              Monitoramento criminal comparativo oficial por região policial da capital
            </p>
          </div>
        </div>

        {/* Toggle Tabela / Gráfico */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setViewMode('tabela')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '700',
              border: viewMode === 'tabela' ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
              background: viewMode === 'tabela' ? 'var(--primary-color)' : 'transparent',
              color: viewMode === 'tabela' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <TableIcon size={14} /> Tabela Oficial
          </button>
          <button
            onClick={() => setViewMode('grafico')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '700',
              border: viewMode === 'grafico' ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
              background: viewMode === 'grafico' ? 'var(--primary-color)' : 'transparent',
              color: viewMode === 'grafico' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <BarChart3 size={14} /> Gráfico Comparativo
          </button>
        </div>
      </div>

      {/* Mini Cards de Destaque por Zona (Ano 2026 vs 2025) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '0.8rem',
        marginBottom: '1.5rem'
      }}>
        {zoneSummaries.map((item) => (
          <div
            key={item.zona}
            onClick={() => setSelectedZona(selectedZona === item.zona ? 'TODAS' : item.zona)}
            style={{
              padding: '0.9rem',
              borderRadius: '12px',
              background: selectedZona === item.zona ? 'rgba(59, 130, 246, 0.12)' : 'var(--surface-color)',
              border: selectedZona === item.zona ? '1.5px solid var(--primary-color)' : '1px solid var(--surface-border)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ZONA {item.zona}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '0.65rem',
                fontWeight: '800',
                color: item.varPct <= 0 ? '#10b981' : '#ef4444',
                background: item.varPct <= 0 ? '#10b98115' : '#ef444415',
                padding: '2px 5px',
                borderRadius: '4px'
              }}>
                {item.varPct < 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                {Math.abs(item.varPct).toFixed(1)}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '1.3rem', fontWeight: '800' }}>
                  {item.total2026.toLocaleString('pt-BR')}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '4px' }}>em 2026</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.total2025.toLocaleString('pt-BR')}
                </span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>(2025)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de Filtros e Busca */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.8rem',
        marginBottom: '1.2rem',
        background: 'rgba(255, 255, 255, 0.02)',
        padding: '0.6rem',
        borderRadius: '10px',
        border: '1px solid var(--surface-border)'
      }}>
        {/* Filtro por Zona */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
            Filtrar Zona:
          </span>
          {zonasList.map(z => (
            <button
              key={z}
              onClick={() => setSelectedZona(z)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                border: selectedZona === z ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
                background: selectedZona === z ? 'var(--primary-color)' : 'transparent',
                color: selectedZona === z ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {z}
            </button>
          ))}
        </div>

        {/* Campo de Busca por Natureza */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar crime (ex: Homicídio)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px 6px 30px',
              borderRadius: '6px',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-color)',
              color: 'var(--text-color)',
              fontSize: '0.75rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Conteúdo: Visualização em Tabela ou Gráfico */}
      {viewMode === 'grafico' ? (
        <div style={{ padding: '1rem', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-color)' }}>
            Comparativo de Ocorrências Totais por Zona (Jan a Set - 2025 vs 2026)
          </h3>
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="2025" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Ano 2025" />
                <Bar dataKey="2026" fill="var(--primary-color)" radius={[4, 4, 0, 0]} name="Ano 2026" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-border)', color: 'var(--text-color)', fontWeight: '800', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', minWidth: '160px' }}>ZONA</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', minWidth: '220px' }}>NATUREZA</th>
                <th style={{ padding: '10px 8px' }}>2021</th>
                <th style={{ padding: '10px 8px' }}>2022</th>
                <th style={{ padding: '10px 8px' }}>2023</th>
                <th style={{ padding: '10px 8px' }}>2024</th>
                <th style={{ padding: '10px 8px', background: 'rgba(59, 130, 246, 0.08)' }}>2025</th>
                <th style={{ padding: '10px 8px', background: 'rgba(59, 130, 246, 0.15)', fontWeight: '900', color: 'var(--primary-color)' }}>2026</th>
                <th style={{ padding: '10px 12px', minWidth: '140px' }}>COMPARATIVO %</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((zonaObj) => {
                return zonaObj.itens.map((item, idx) => {
                  const badge = getBadgeStyle(item.tipo);
                  const isFirstOfZone = idx === 0;

                  return (
                    <tr
                      key={`${zonaObj.zona}-${item.natureza}`}
                      style={{
                        borderBottom: '1px solid var(--surface-border)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                      }}
                    >
                      {/* Coluna ZONA com rowspan visual */}
                      {isFirstOfZone && (
                        <td
                          rowSpan={zonaObj.itens.length}
                          style={{
                            padding: '12px 14px',
                            fontWeight: '900',
                            textAlign: 'left',
                            verticalAlign: 'middle',
                            borderRight: '1px solid var(--surface-border)',
                            color: 'var(--primary-color)',
                            letterSpacing: '0.5px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={14} />
                            {zonaObj.zona}
                          </div>
                        </td>
                      )}

                      {/* NATUREZA */}
                      <td style={{ padding: '8px 14px', textAlign: 'left', fontWeight: '600', color: 'var(--text-color)' }}>
                        {item.natureza}
                      </td>

                      {/* ANOS */}
                      <td style={{ padding: '8px 8px', color: 'var(--text-muted)' }}>{item.v2021}</td>
                      <td style={{ padding: '8px 8px', color: 'var(--text-muted)' }}>{item.v2022}</td>
                      <td style={{ padding: '8px 8px', color: 'var(--text-muted)' }}>{item.v2023}</td>
                      <td style={{ padding: '8px 8px', color: 'var(--text-muted)' }}>{item.v2024}</td>
                      <td style={{ padding: '8px 8px', background: 'rgba(59, 130, 246, 0.04)', fontWeight: '600' }}>{item.v2025}</td>
                      <td style={{ padding: '8px 8px', background: 'rgba(59, 130, 246, 0.08)', fontWeight: '800', color: 'var(--primary-color)' }}>
                        {item.v2026}
                      </td>

                      {/* COMPARATIVO BADGE */}
                      <td style={{ padding: '8px 12px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: '800',
                            ...badge
                          }}
                        >
                          {item.tipo === 'queda' && <TrendingDown size={11} />}
                          {item.tipo === 'alta' && <TrendingUp size={11} />}
                          {item.tipo === 'neutro' && <Minus size={11} />}
                          {item.comp}
                        </span>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ZoneIndicators;
