import React from 'react';
import PdfImporter from '../components/PdfImporter';
import ZoneIndicators from '../components/ZoneIndicators';
import { FileUp, Info } from 'lucide-react';

const ImportPdfPage = () => {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <FileUp size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 4px 0' }}>
              Importar Relatórios e PDFs
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
              Atualize os dados e indicadores das Zonas de Manaus a partir de arquivos oficiais em PDF
            </p>
          </div>
        </div>
      </header>

      {/* Caixa de Ajuda / Instruções */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '12px',
        padding: '1rem 1.2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <Info size={20} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: 'var(--text-color)', lineHeight: 1.5 }}>
          <strong>Como funciona a importação:</strong>
          <br />
          1. Selecione o arquivo PDF do relatório (ex: <em>INDICADORES, POR ZONA - MANAUS - JAN A SET - 2021 A 2026</em>).
          <br />
          2. O sistema lê o PDF no navegador e reconhece automaticamente as zonas policiais e as ocorrências registradas em cada ano.
          <br />
          3. Você confere a prévia e clica em <strong>"Aplicar e Salvar no Sistema"</strong>. O dashboard de Indicadores por Zona será atualizado instantaneamente!
        </div>
      </div>

      {/* Componente Importer */}
      <PdfImporter />

      {/* Visualização Atual dos Indicadores */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Visualização Atual do Dashboard
        </h2>
        <ZoneIndicators />
      </div>
    </div>
  );
};

export default ImportPdfPage;
