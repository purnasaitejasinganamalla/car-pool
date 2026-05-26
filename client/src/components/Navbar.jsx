import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext, ThemeContext, SocketContext } from '../App';
import { Sun, Moon, Menu, X, Bell, LogOut, User, MessageSquare, Plus, Search, HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { notifications, unreadChats, setUnreadChats } = useContext(SocketContext);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const clearUnreadChats = () => {
    setUnreadChats(0);
    setNotifDropdownOpen(false);
  };

  const activeStyle = ({ isActive }) => 
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive 
        ? 'text-brand-500 dark:text-brand-400 font-semibold' 
        : 'text-slate-600 hover:text-brand-500 dark:text-slate-300 dark:hover:text-brand-400'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
                <span className="text-xl">🚗</span>
              </span>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 bg-clip-text text-transparent dark:from-brand-400">
                CampusRide
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink to="/" end className={activeStyle}>Home</NavLink>
            {user && (
              <>
                <NavLink to="/dashboard" className={activeStyle}>Dashboard</NavLink>
                <NavLink to="/find-ride" className={activeStyle}>Find Ride</NavLink>
                <NavLink to="/post-ride" className={activeStyle}>Post Ride</NavLink>
                {user.email === 'admin@campusride.org' && (
                  <NavLink to="/admin" className={activeStyle}>Admin</NavLink>
                )}
              </>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user ? (
              <>
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors duration-200"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-accent-green border-2 border-white dark:border-slate-950"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setNotifDropdownOpen(false)}></div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 z-50 w-80 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-md"
                        >
                          <div className="px-3 py-2 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Notifications</span>
                            {notifications.length > 0 && (
                              <button 
                                onClick={() => setNotifications([])} 
                                className="text-[10px] font-semibold text-brand-500 hover:underline"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                          <div className="max-h-64 overflow-y-auto py-1">
                            {notifications.length === 0 ? (
                              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                                No new notifications
                              </div>
                            ) : (
                              notifications.map((n) => (
                                <div key={n.id} className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors duration-150 border-b border-slate-100/50 dark:border-slate-800/30 last:border-0">
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{n.title}</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Link & Logout */}
                <div className="hidden md:flex items-center gap-2 border-l border-slate-200/60 dark:border-slate-800 pl-3">
                  <Link to="/profile" className="flex items-center gap-2 group">
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border border-slate-200 bg-slate-100 object-cover group-hover:ring-2 group-hover:ring-brand-500 transition-all duration-200"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-brand-500 transition-colors duration-200">
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors duration-200"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/auth"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-slate-900 transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  className="rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 hover:shadow-lg transition-all duration-200"
                >
                  Join CampusRide
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:hidden"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-md overflow-hidden"
          >
            <div className="space-y-1.5 px-4 py-4">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Home
              </Link>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/find-ride"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Find Ride
                  </Link>
                  <Link
                    to="/post-ride"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Post Ride
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Profile
                  </Link>
                  {user.email === 'admin@campusride.org' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-base font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-center items-center rounded-xl border border-slate-200 dark:border-slate-800 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-center items-center rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
