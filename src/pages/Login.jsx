import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const [rg, setRg] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(rg, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{
      height: '100vh',
      background: '#e9eff3',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <img src="./logo.png" alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
        </div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '900',
          color: '#0a1d37',
          margin: '0',
          letterSpacing: '-1px'
        }}>SGEP-LESTE</h1>
        <p style={{
          color: '#3b82f6',
          fontSize: '0.75rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginTop: '5px'
        }}>Gestão de Estatística e Produtividade - btl leste</p>
      </div>

      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
        border: '1px solid #f0f4f8'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0a1d37', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Acesso Restrito</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Informe suas credenciais para entrar.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>RG Militar</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <User size={18} />
              </div>
              <input
                type="text"
                value={rg}
                onChange={(e) => setRg(e.target.value)}
                placeholder="Digite seu registro"
                style={{
                  width: '100%',
                  padding: '14px 15px 14px 45px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  color: '#0a1d37',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 15px 14px 45px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  color: '#0a1d37',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '25px' }}>
            <button type="button" style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '0.7rem',
              fontWeight: '800',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>Esqueci minha senha</button>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '15px', textAlign: 'center', fontWeight: '600' }}>{error}</p>}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              background: '#1d4ed8',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#1e40af'}
            onMouseOut={(e) => e.target.style.background = '#1d4ed8'}
          >
            Entrar no Sistema
          </button>
        </form>
      </div>

      <div style={{
        marginTop: '40px',
        textAlign: 'center',
        fontSize: '0.65rem',
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        sgep-leste - Desenvolvido pelo CB Luciano Costa V.1.0
      </div>
    </div>
  );
};

export default Login;
