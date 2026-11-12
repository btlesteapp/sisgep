import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, BarChart3, ShieldCheck, LogOut, Menu, X, Settings } from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/stats', icon: BarChart3, label: 'Estatística' },
    { path: '/productivity', icon: ShieldCheck, label: 'Produtividade' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="mobile-toggle"
        style={{
          position: 'fixed',
          top: '15px',
          left: '15px',
          zIndex: 1001,
          padding: '10px',
          borderRadius: '10px',
          background: 'var(--primary-color)',
          border: 'none',
          color: 'white',
          display: 'none', // Managed by CSS media query
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      <aside
        className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          height: '100vh',
          borderRadius: '0 24px 24px 0',
          padding: '2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '3rem', padding: '0 0.5rem' }}>
          <img src="./logo.png" alt="Logo BTL LESTE" style={{ width: '48px', height: '48px', objectFit: 'contain', minWidth: '32px' }} />
          <h2 className="gradient-text sidebar-text" style={{ fontSize: '1.2rem', whiteSpace: 'nowrap' }}>SISGEP-LESTE</h2>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className="nav-link"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '12px',
                borderRadius: '12px',
                textDecoration: 'none',
                color: isActive ? (theme === 'dark' ? 'white' : 'var(--primary-color)') : 'var(--text-muted)',
                background: isActive ? (theme === 'dark' ? 'var(--glass-bg)' : 'var(--primary-glow)') : 'transparent',
                border: isActive ? '1px solid var(--surface-border)' : '1px solid transparent',
                marginBottom: '0.5rem',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              })}
            >
              <item.icon size={22} style={{ minWidth: '22px' }} />
              <span className="sidebar-text" style={{ fontWeight: '500' }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div className="glass-card sidebar-user" style={{ padding: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div style={{
              minWidth: '32px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {user?.nome?.[0].toUpperCase()}
            </div>
            <div className="sidebar-text" style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nome}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>RG: {user?.rg}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="nav-link"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '12px',
              color: 'var(--danger)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            <LogOut size={22} style={{ minWidth: '22px' }} />
            <span className="sidebar-text">Sair</span>
          </button>
        </div>
      </aside>

      <style dangerouslySetInnerHTML={{
        __html: `
        .sidebar {
          width: 70px;
          background: var(--sidebar-bg);
          backdrop-filter: blur(20px);
          border-right: 1px solid var(--surface-border);
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
        }

        .sidebar:hover {
          width: 260px;
          box-shadow: 20px 0 50px rgba(0,0,0,0.5);
        }

        .sidebar-text {
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }

        .sidebar:hover .sidebar-text {
          opacity: 1;
          pointer-events: auto;
        }

        .sidebar-user {
          background: transparent;
          border: none;
        }
        
        .sidebar:hover .sidebar-user {
          background: var(--glass-bg);
          border: 1px solid var(--surface-border);
        }

        @media (max-width: 768px) {
          .mobile-toggle {
            display: block !important;
          }
          .sidebar {
            width: 260px;
            left: -260px;
          }
          .sidebar.mobile-open {
            left: 0;
          }
          .sidebar-text {
            opacity: 1;
            pointer-events: auto;
          }
        }
      `}} />
    </>
  );
};

export default Sidebar;
