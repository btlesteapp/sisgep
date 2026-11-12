import React, { useState } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw,
  Eye, Save, RotateCcw, Copy, Sparkles, FileSpreadsheet
} from 'lucide-react';
import { extractTextFromPdf, parseZoneIndicatorsText } from '../utils/pdfParser';
import { DEFAULT_ZONE_DATA } from './ZoneIndicators';
import { db, isFirebaseReady } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const PdfImporter = ({ onDataImported, currentData }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [manualText, setManualText] = useState('');
  const [activeInputTab, setActiveInputTab] = useState('pdf'); // 'pdf' | 'paste'

  // Processa arquivo PDF
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== 'application/pdf' && !uploadedFile.name.endsWith('.pdf')) {
      setError('Por favor, selecione um arquivo em formato PDF (.pdf).');
      return;
    }

    setFile(uploadedFile);
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const text = await extractTextFromPdf(uploadedFile);
      setExtractedText(text);

      const parsed = parseZoneIndicatorsText(text);
      if (!parsed || parsed.length === 0) {
        throw new Error('Não foi possível identificar a estrutura de zonas na leitura automática do PDF. Tente colar o texto ou tabela na aba ao lado.');
      }

      setParsedData(parsed);
      setSuccess(`PDF lido com sucesso! ${parsed.length} zonas identificadas.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao processar o arquivo PDF.');
    } finally {
      setLoading(false);
    }
  };

  // Processa texto colado manualmente
  const handleParseManualText = () => {
    if (!manualText.trim()) {
      setError('Cole o conteúdo da tabela ou do PDF no campo abaixo.');
      return;
    }

    setError('');
    setSuccess('');
    try {
      const parsed = parseZoneIndicatorsText(manualText);
      if (!parsed || parsed.length === 0) {
        throw new Error('Nenhuma zona ou crime foi reconhecido no texto informado.');
      }
      setParsedData(parsed);
      setSuccess(`Texto analisado com sucesso! ${parsed.length} zonas identificadas.`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Salva no Firestore e no LocalStorage
  const handleSaveToSystem = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setLoading(true);
    try {
      // 1. LocalStorage
      localStorage.setItem('sisgep_zone_indicators', JSON.stringify(parsedData));

      // 2. Firebase Firestore
      if (isFirebaseReady && db) {
        const docRef = doc(db, 'config', 'zone_indicators');
        await setDoc(docRef, {
          updatedAt: new Date().toISOString(),
          data: parsedData
        });
      }

      if (onDataImported) {
        onDataImported(parsedData);
      }

      setSuccess('Dados importados e salvos com sucesso no sistema e no Firebase!');
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar no servidor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Restaura dados padrão
  const handleRestoreDefault = async () => {
    if (!window.confirm('Deseja realmente restaurar os dados oficiais padrão (Jan a Set - 2021 a 2026)?')) {
      return;
    }

    setLoading(true);
    try {
      localStorage.removeItem('sisgep_zone_indicators');

      if (isFirebaseReady && db) {
        const docRef = doc(db, 'config', 'zone_indicators');
        await setDoc(docRef, {
          updatedAt: new Date().toISOString(),
          data: DEFAULT_ZONE_DATA
        });
      }

      if (onDataImported) {
        onDataImported(DEFAULT_ZONE_DATA);
      }

      setParsedData(null);
      setFile(null);
      setSuccess('Dados restaurados para o padrão oficial.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem', background: 'var(--surface-color)', borderRadius: '14px', border: '1px solid var(--surface-border)' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary-color)" />
            Importador de Indicadores por Zona
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Carregue um arquivo PDF ou cole os dados da tabela para atualizar o dashboard automaticamente.
          </p>
        </div>

        <button
          onClick={handleRestoreDefault}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.7rem',
            fontWeight: '700',
            background: 'transparent',
            border: '1px solid var(--surface-border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title="Restaura os valores oficiais"
        >
          <RotateCcw size={13} /> Restaurar Padrão Oficial
        </button>
      </div>

      {/* Tabs de Seleção de Método (Upload PDF / Colar Texto) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveInputTab('pdf')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '700',
            border: activeInputTab === 'pdf' ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
            background: activeInputTab === 'pdf' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
            color: activeInputTab === 'pdf' ? 'var(--primary-color)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <UploadCloud size={14} /> Carregar Arquivo PDF
        </button>
        <button
          onClick={() => setActiveInputTab('paste')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '700',
            border: activeInputTab === 'paste' ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
            background: activeInputTab === 'paste' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
            color: activeInputTab === 'paste' ? 'var(--primary-color)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <Copy size={14} /> Colar Texto / Tabela
        </button>
      </div>

      {/* Método 1: Upload PDF */}
      {activeInputTab === 'pdf' && (
        <div style={{
          border: '2px dashed var(--surface-border)',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.01)',
          position: 'relative',
          cursor: 'pointer'
        }}>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)'
            }}>
              <UploadCloud size={24} />
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', margin: '4px 0 0 0' }}>
              {file ? file.name : 'Clique ou arraste o arquivo PDF aqui'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              Formato aceito: .pdf (ex: Relatório de Indicadores por Zona de Manaus)
            </p>
          </div>
        </div>
      )}

      {/* Método 2: Colar Texto */}
      {activeInputTab === 'paste' && (
        <div>
          <textarea
            rows={6}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Cole aqui o texto copiado do PDF ou planilha..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-color)',
              color: 'var(--text-color)',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              outline: 'none',
              marginBottom: '8px'
            }}
          />
          <button
            onClick={handleParseManualText}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={14} /> Analisar Texto
          </button>
        </div>
      )}

      {/* Mensagens de Alerta */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', color: 'var(--primary-color)', fontSize: '0.8rem' }}>
          <RefreshCw size={16} className="animate-spin" /> Processando dados...
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', color: '#ef4444', fontSize: '0.8rem', background: '#ef444415', padding: '8px 12px', borderRadius: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', color: '#10b981', fontSize: '0.8rem', background: '#10b98115', padding: '8px 12px', borderRadius: '8px' }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Pré-visualização dos Dados Extraídos */}
      {parsedData && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={16} color="var(--primary-color)" />
              <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>Prévia dos Dados Reconhecidos</span>
            </div>

            <button
              onClick={handleSaveToSystem}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '8px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Save size={15} /> Aplicar e Salvar no Sistema
            </button>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.7rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-border)', color: 'var(--text-color)' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Zona</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Natureza</th>
                  <th style={{ padding: '6px' }}>2021</th>
                  <th style={{ padding: '6px' }}>2022</th>
                  <th style={{ padding: '6px' }}>2023</th>
                  <th style={{ padding: '6px' }}>2024</th>
                  <th style={{ padding: '6px' }}>2025</th>
                  <th style={{ padding: '6px', fontWeight: '800', color: 'var(--primary-color)' }}>2026</th>
                  <th style={{ padding: '6px' }}>Comparativo</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.map(z => z.itens.map((i, idx) => (
                  <tr key={`${z.zona}-${i.natureza}`} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    {idx === 0 && (
                      <td rowSpan={z.itens.length} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: '800', verticalAlign: 'middle', borderRight: '1px solid var(--surface-border)', color: 'var(--primary-color)' }}>
                        {z.zona}
                      </td>
                    )}
                    <td style={{ padding: '6px 10px', textAlign: 'left' }}>{i.natureza}</td>
                    <td>{i.v2021}</td>
                    <td>{i.v2022}</td>
                    <td>{i.v2023}</td>
                    <td>{i.v2024}</td>
                    <td>{i.v2025}</td>
                    <td style={{ fontWeight: '800', color: 'var(--primary-color)' }}>{i.v2026}</td>
                    <td style={{ fontWeight: '700' }}>{i.comp}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfImporter;
