import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, isFirebaseReady } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const DataContext = createContext();

const STATS_ITEMS = [
  "HOMICÍDIO DOLOSO", "LATROCÍNIO", "ROUBO DE VEÍCULOS", "FURTO DE VEÍCULOS",
  "ROUBO EM RESIDÊNCIA", "ROUBO A TRANSEUNTES", "ROUBO A COLETIVO",
  "ROUBO A PONTO COMERCIAL", "MORTE POR INTERVENÇÃO PM", "FURTO", "ROUBO"
];

const PROD_ITEMS = [
  "ARMAS DE FOGO APREENDIDAS", "VEÍCULOS RECUPERADOS",
  "ENTORPECENTES EM Kg (TRÁFICO)", "MUNIÇÕES", "PRESOS", "SIMULACRO", "FORAGIDOS"
];

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const DB_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

export const DataProvider = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const initializeYearData = (items) => {
    const data = {};
    YEARS.forEach(year => {
      data[year] = {};
      items.forEach(item => {
        data[year][item] = new Array(12).fill(0);
      });
    });
    return data;
  };

  const [statsData, setStatsData] = useState(() => {
    try {
      const saved = localStorage.getItem('sisgep_stats_data');
      return saved ? JSON.parse(saved) : initializeYearData(STATS_ITEMS);
    } catch {
      return initializeYearData(STATS_ITEMS);
    }
  });

  const [prodData, setProdData] = useState(() => {
    try {
      const saved = localStorage.getItem('sisgep_prod_data');
      return saved ? JSON.parse(saved) : initializeYearData(PROD_ITEMS);
    } catch {
      return initializeYearData(PROD_ITEMS);
    }
  });

  const statsRef = useRef(statsData);
  const prodRef = useRef(prodData);
  const isDirtyRef = useRef(isDirty);

  useEffect(() => { statsRef.current = statsData; }, [statsData]);
  useEffect(() => { prodRef.current = prodData; }, [prodData]);
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  const sanitizeDocId = (type, year, item) => {
    return `${type}_${year}_${item.replace(/[\/\s]/g, '_')}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isFirebaseReady && db) {
        console.log('Buscando dados do Firebase Firestore...');
        const querySnapshot = await getDocs(collection(db, 'data_entries'));

        if (!querySnapshot.empty) {
          console.log(`Dados carregados: ${querySnapshot.size} registros encontrados.`);
          const newStats = initializeYearData(STATS_ITEMS);
          const newProd = initializeYearData(PROD_ITEMS);

          querySnapshot.forEach(docSnap => {
            const entry = docSnap.data();
            const yearNum = Number(entry.year);
            const row = DB_MONTHS.map(m => Number(entry[m] || 0));

            if (entry.type === 'stats') {
              if (newStats[yearNum] && newStats[yearNum][entry.item]) {
                newStats[yearNum][entry.item] = row;
              }
            } else {
              if (newProd[yearNum] && newProd[yearNum][entry.item]) {
                newProd[yearNum][entry.item] = row;
              }
            }
          });

          setStatsData(newStats);
          setProdData(newProd);
          localStorage.setItem('sisgep_stats_data', JSON.stringify(newStats));
          localStorage.setItem('sisgep_prod_data', JSON.stringify(newProd));
          setIsDirty(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do Firebase (usando cache local):', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveData = async () => {
    if (!isDirtyRef.current) return;

    try {
      setLoading(true);
      const entries = [];
      const currentStats = statsRef.current;
      const currentProd = prodRef.current;

      // Salva no localStorage como garantia imediata
      localStorage.setItem('sisgep_stats_data', JSON.stringify(currentStats));
      localStorage.setItem('sisgep_prod_data', JSON.stringify(currentProd));

      YEARS.forEach(year => {
        STATS_ITEMS.forEach(item => {
          const row = currentStats[year][item];
          const entry = { type: 'stats', year, item };
          DB_MONTHS.forEach((m, i) => entry[m] = row[i]);
          entries.push(entry);
        });
        PROD_ITEMS.forEach(item => {
          const row = currentProd[year][item];
          const entry = { type: 'prod', year, item };
          DB_MONTHS.forEach((m, i) => entry[m] = row[i]);
          entries.push(entry);
        });
      });

      if (isFirebaseReady && db) {
        // Grava no Firestore em lotes de até 400 (limite do Firestore é 500 por lote)
        const batchSize = 400;
        for (let i = 0; i < entries.length; i += batchSize) {
          const batch = writeBatch(db);
          const chunk = entries.slice(i, i + batchSize);
          chunk.forEach(entry => {
            const docId = sanitizeDocId(entry.type, entry.year, entry.item);
            const docRef = doc(db, 'data_entries', docId);
            batch.set(docRef, entry);
          });
          await batch.commit();
        }
        console.log('Dados sincronizados com o Firebase Firestore com sucesso!');
      } else {
        console.log('Dados salvos no armazenamento local do navegador.');
      }

      setIsDirty(false);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Erro ao salvar:', err.message);
      alert('Erro ao salvar no servidor. Os dados foram mantidos localmente no seu navegador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirtyRef.current) {
        saveData();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const updateStats = (year, item, monthIdx, value) => {
    const val = value === '' ? 0 : Number(value);
    setStatsData(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [item]: prev[year][item].map((v, i) => i === monthIdx ? val : v)
      }
    }));
    setIsDirty(true);
  };

  const updateProd = (year, item, monthIdx, value) => {
    const val = value === '' ? 0 : Number(value);
    setProdData(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [item]: prev[year][item].map((v, i) => i === monthIdx ? val : v)
      }
    }));
    setIsDirty(true);
  };

  const calculateTotal = (dataArray) => dataArray ? dataArray.reduce((acc, curr) => acc + curr, 0) : 0;

  const calculateVariation = (type, year, item, monthIdx) => {
    const currentYearData = type === 'stats' ? statsData[year] : prodData[year];
    const previousYearData = type === 'stats' ? statsData[year - 1] : prodData[year - 1];
    if (!currentYearData || !previousYearData) return 0;
    const currentVal = currentYearData[item][monthIdx];
    const previousVal = previousYearData[item][monthIdx];
    if (previousVal === 0) return currentVal > 0 ? 100 : 0;
    return ((currentVal - previousVal) / previousVal) * 100;
  };

  const calculateTotalVariation = (type, year, item) => {
    const currentYearData = type === 'stats' ? statsData[year] : prodData[year];
    const previousYearData = type === 'stats' ? statsData[year - 1] : prodData[year - 1];
    if (!currentYearData || !previousYearData) return 0;
    const today = new Date();
    const currentRealYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let currentTotal = 0;
    let previousTotal = 0;

    if (Number(year) === currentRealYear) {
      if (currentMonth > 0) {
        for (let i = 0; i < currentMonth; i++) {
          currentTotal += (currentYearData[item][i] || 0);
          previousTotal += (previousYearData[item][i] || 0);
        }
      }
    } else {
      currentTotal = calculateTotal(currentYearData[item]);
      previousTotal = calculateTotal(previousYearData[item]);
    }
    if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
    return ((currentTotal - previousTotal) / previousTotal) * 100;
  };

  return (
    <DataContext.Provider value={{
      statsData, prodData, updateStats, updateProd,
      STATS_ITEMS, PROD_ITEMS, MONTHS, YEARS,
      selectedYear, setSelectedYear, loading, isDirty, lastSaved, saveData, fetchData,
      calculateTotal, calculateVariation, calculateTotalVariation
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
