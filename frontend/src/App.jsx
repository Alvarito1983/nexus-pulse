import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Login from './components/Login.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('pulse-token'));
  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('pulse-user'));
      return u?.username || u || null;
    } catch { return null; }
  });

  function handleLogin(tok, userObj) {
    setToken(tok);
    setUser(userObj?.username || userObj);
  }

  function handleLogout() {
    const tok = localStorage.getItem('pulse-token');
    if (tok) fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${tok}` } }).catch(() => {});
    localStorage.removeItem('pulse-token');
    localStorage.removeItem('pulse-user');
    setToken(null);
    setUser(null);
  }

  if (!token) return <Login onLogin={handleLogin} />;
  return <Dashboard token={token} user={user} onLogout={handleLogout} />;
}
