import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Lock, Palette, Check, Sun, Moon } from 'lucide-react';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { updateUserPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ text: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    setLoading(true);
    const result = await updateUserPassword(newPassword);
    setLoading(false);

    if (!result.success) {
      setMessage({ text: result.message, type: 'error' });
    } else {
      setMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>Configurações</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Gerencie sua conta e preferências do sistema</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {/* Appearance Section */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <Palette size={20} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.2rem' }}>Aparência</h2>
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Escolha o tema visual que mais lhe agrada.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button 
              onClick={() => theme !== 'dark' && toggleTheme()}
              style={{
                padding: '1.5rem',
                borderRadius: '12px',
                border: theme === 'dark' ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                background: '#05070a',
                color: 'white',
                cursor: 'pointer',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <Moon size={24} style={{ marginBottom: '10px' }} />
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Tema Escuro</div>
              {theme === 'dark' && <Check size={16} style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--primary-color)' }} />}
            </button>

            <button 
              onClick={() => theme !== 'light' && toggleTheme()}
              style={{
                padding: '1.5rem',
                borderRadius: '12px',
                border: theme === 'light' ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)',
                background: '#ffffff',
                color: '#0a1d37',
                cursor: 'pointer',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <Sun size={24} style={{ marginBottom: '10px' }} />
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Tema Claro</div>
              {theme === 'light' && <Check size={16} style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--primary-color)' }} />}
            </button>
          </div>
        </section>

        {/* Security Section */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <Lock size={20} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.2rem' }}>Segurança</h2>
          </div>

          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nova Senha</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-card"
                style={{ width: '100%', padding: '12px', outline: 'none', color: 'var(--text-main)' }}
                placeholder="No mínimo 6 caracteres"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confirmar Nova Senha</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-card"
                style={{ width: '100%', padding: '12px', outline: 'none', color: 'var(--text-main)' }}
                placeholder="Repita a nova senha"
              />
            </div>

            {message.text && (
              <p style={{ 
                color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', 
                fontSize: '0.85rem', 
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {message.text}
              </p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary-color)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Settings;
