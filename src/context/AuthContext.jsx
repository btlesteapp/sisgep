import React, { createContext, useContext, useState } from 'react';
import { db, isFirebaseReady } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sisgep_user_profile');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (rg, senha) => {
    setLoading(true);

    try {
      // 1. Se o Firebase estiver configurado e conectado
      if (isFirebaseReady && db) {
        const usersRef = collection(db, 'usuarios');
        const q = query(usersRef, where('rg', '==', String(rg).trim()), where('senha', '==', String(senha).trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          const userData = {
            id: querySnapshot.docs[0].id,
            ...docData
          };
          setUser(userData);
          localStorage.setItem('sisgep_user_profile', JSON.stringify(userData));
          setLoading(false);
          return { success: true };
        }
      }

      // 2. Fallback local / Inicialização padrão (ex: primeiro acesso sem banco povoado)
      // Permite login com admin/admin ou se for o usuário salvo localmente
      const trimmedRg = String(rg).trim();
      const trimmedSenha = String(senha).trim();

      if (trimmedRg.toLowerCase() === 'admin' && trimmedSenha === 'admin') {
        const adminUser = {
          rg: 'admin',
          nome: 'Administrador SISGEP',
          nivel_acesso: 'Admin'
        };

        // Se o Firebase estiver pronto mas a coleção estiver vazia, cria o admin automaticamente
        if (isFirebaseReady && db) {
          try {
            await setDoc(doc(db, 'usuarios', 'admin'), {
              ...adminUser,
              senha: 'admin'
            });
          } catch (e) {
            console.warn('Não foi possível gravar o admin padrão no Firebase:', e);
          }
        }

        setUser(adminUser);
        localStorage.setItem('sisgep_user_profile', JSON.stringify(adminUser));
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, message: 'RG ou Senha incorretos' };
    } catch (err) {
      console.error('Erro na autenticação:', err);
      setLoading(false);
      return { success: false, message: 'Erro ao autenticar: ' + (err.message || 'Falha de conexão') };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sisgep_user_profile');
  };

  const updateUserPassword = async (newPassword) => {
    if (!user) return { success: false, message: 'Nenhum usuário conectado.' };

    try {
      if (isFirebaseReady && db && user.id) {
        const userRef = doc(db, 'usuarios', user.id);
        await updateDoc(userRef, { senha: newPassword });
      }

      const updatedUser = { ...user, senha: newPassword };
      setUser(updatedUser);
      localStorage.setItem('sisgep_user_profile', JSON.stringify(updatedUser));
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      return { success: false, message: err.message || 'Falha ao atualizar senha.' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      updateUserPassword,
      isAdmin: user?.nivel_acesso === 'Admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
