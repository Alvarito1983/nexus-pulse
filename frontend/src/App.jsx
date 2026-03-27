import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Login from './components/Login.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('pulse-token'));
  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('pulse-user'));
      if (!u) return null;
      return typeof u === 'string' ? { username: u, role: 'admin' } : u;
    } catch { return null; }
  });

  function handleLogin(tok, userObj) {
    setToken(tok);
    const u = typeof userObj === 'string' ? { username: userObj, role: 'admin' } : userObj;
    setUser(u);
    localStorage.setItem('pulse-user', JSON.stringify(u));
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
