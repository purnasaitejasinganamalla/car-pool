import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Users, ShieldCheck, ShieldAlert, Award, Plus, Trash2, Ban } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPanel() {
  const { token, user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadAdminData = async () => {
    try {
      // 1. Get users list
      const resUsers = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resUsers.ok) {
        const dataUsers = await resUsers.json();
        setUsers(dataUsers);
      }

      // 2. Get colleges list
      const resCol = await fetch('/api/colleges');
      if (resCol.ok) {
        const dataCol = await resCol.json();
        setColleges(dataCol);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token]);

  // Handle Verify User Toggle
  const handleVerifyToggle = async (userId, currentVal) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isVerified: !currentVal })
      });
      if (res.ok) {
        setMessage('User verification status updated successfully!');
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Ban User Toggle
  const handleBanToggle = async (userId, currentVal) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isBanned: !currentVal })
      });
      if (res.ok) {
        setMessage('User suspension status updated successfully!');
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add College campus
  const handleAddCollege = (e) => {
    e.preventDefault();
    if (!newCollegeName.trim()) return;

    // Direct mock store push for demo simplicity:
    setColleges(prev => [...prev, { name: newCollegeName }]);
    setMessage(`Successfully added college campus: ${newCollegeName}`);
    setNewCollegeName('');
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  // Double check admin authentication
  if (user?.email !== 'admin@campusride.org') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <span className="text-3xl">🚫</span>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">Access Denied</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This panel is restricted to verified administrators of the CampusRide platform.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Admin Management Dashboard</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verify student cards, suspends reported accounts, and configure active university zones.
        </p>
      </div>

      {message && (
        <div className="mb-6 p-3.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 text-xs font-semibold dark:bg-brand-950/20 dark:border-brand-900/30 dark:text-brand-400">
          {message}
        </div>
      )}

      {/* Main split dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Campus registrations & controls (Span 1) */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2.5 mb-4 flex items-center gap-1.5">
              <Plus size={14} />
              <span>Register College</span>
            </h3>

            <form onSubmit={handleAddCollege} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Campus Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune University"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 focus:border-brand-500 outline-none dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white text-xs font-bold shadow-md hover:from-brand-500 transition-all flex items-center justify-center gap-1"
              >
                <Plus size={13} />
                <span>Add College Campus</span>
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800/50 pt-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Campus Lists</label>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {colleges.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-650 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 dark:text-slate-350">
                    <span className="truncate">{c.name}</span>
                    <span className="text-[9px] uppercase font-bold text-emerald-500">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Students verification table (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2.5 mb-4 flex items-center gap-1.5">
              <Users size={14} />
              <span>Registered Students Control</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 font-bold text-slate-450 uppercase text-[9px] tracking-wider">
                    <th className="py-2.5">Student Info</th>
                    <th className="py-2.5">College Campus</th>
                    <th className="py-2.5">Verification</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                      <td className="py-3 flex items-center gap-2">
                        <img src={u.profilePhoto} alt={u.name} className="h-7 w-7 rounded-full bg-slate-100" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-slate-500 dark:text-slate-400">
                        {u.college}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                          u.isVerified 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20' 
                            : 'bg-yellow-50 text-yellow-600 border border-yellow-100 dark:bg-yellow-950/20'
                        }`}>
                          {u.isVerified ? 'Verified' : 'Pending Review'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleVerifyToggle(u._id, u.isVerified)}
                            className="rounded-lg px-2.5 py-1.5 text-[9px] font-extrabold border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                          >
                            {u.isVerified ? 'Revoke' : 'Verify'}
                          </button>
                          
                          <button
                            onClick={() => handleBanToggle(u._id, u.isBanned)}
                            className={`rounded-lg px-2.5 py-1.5 text-[9px] font-extrabold border transition-all ${
                              u.isBanned 
                                ? 'bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20' 
                                : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 dark:bg-slate-900 dark:border-slate-800'
                            }`}
                          >
                            <Ban size={10} className="inline mr-0.5" />
                            {u.isBanned ? 'Suspended' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
