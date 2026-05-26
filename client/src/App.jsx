import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';

// Page imports (created next)
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PostRide from './pages/PostRide';
import FindRide from './pages/FindRide';
import ChatPage from './pages/ChatPage';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';

// Create contexts
export const AuthContext = createContext(null);
export const SocketContext = createContext(null);
export const ThemeContext = createContext(null);

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Real-time state
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadChats, setUnreadChats] = useState(0);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load User Profile on bootstrap
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            // Token expired/invalid
            logout();
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // Setup WebSockets (Socket.io)
  useEffect(() => {
    if (user && token) {
      const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';
      const s = io(socketUrl);
      setSocket(s);

      s.on('connect', () => {
        s.emit('register_user', user._id);
      });

      s.on('receive_message', (msg) => {
        // Trigger notification sound/banner
        addNotification({
          id: Math.random().toString(),
          type: 'chat',
          title: 'New Message',
          message: msg.text,
          senderId: msg.senderId
        });
        setUnreadChats(prev => prev + 1);
      });

      s.on('user_status_change', (data) => {
        // Handle online/offline changes dynamically
      });

      return () => {
        s.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user, token]);

  // Helper to add notifications
  const addNotification = (notif) => {
    setNotifications(prev => [notif, ...prev].slice(0, 10)); // keep last 10
  };

  // Auth operations
  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    addNotification({
      id: 'welcome',
      type: 'system',
      title: 'Welcome back!',
      message: `Successfully logged in as ${data.user.name}`
    });
  };

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    addNotification({
      id: 'welcome',
      type: 'system',
      title: 'Account Created',
      message: `Welcome to CampusRide, ${data.user.name}!`
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setNotifications([]);
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (loading) return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
    return user ? children : <Navigate to="/auth" replace />;
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
        <SocketContext.Provider value={{ socket, notifications, addNotification, unreadChats, setUnreadChats }}>
          <Router>
            <div className="min-h-screen flex flex-col transition-colors duration-300">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/post-ride" element={<ProtectedRoute><PostRide /></ProtectedRoute>} />
                  <Route path="/find-ride" element={<ProtectedRoute><FindRide /></ProtectedRoute>} />
                  <Route path="/chat" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </Router>
        </SocketContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
