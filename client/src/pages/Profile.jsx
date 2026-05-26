import React, { useState, useContext, useEffect } from 'react';
import { AuthContext, SocketContext } from '../App';
import { User, Phone, Mail, Award, Navigation, Star, ShieldAlert, Heart, Car, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, token, updateProfile } = useContext(AuthContext);
  const { addNotification } = useContext(SocketContext);

  // Edit fields state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [instagramId, setInstagramId] = useState(user?.instagramId || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  
  // Vehicle details
  const [vehicleType, setVehicleType] = useState(user?.vehicleDetails?.type || 'None');
  const [vehicleModel, setVehicleModel] = useState(user?.vehicleDetails?.model || '');
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleDetails?.number || '');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          phone,
          instagramId,
          emergencyContact,
          vehicleType,
          vehicleModel,
          vehicleNumber,
          profilePhoto: user.profilePhoto // preserve
        })
      });
      const data = await res.json();
      if (res.ok) {
        updateProfile(data);
        addNotification({
          id: 'profile-update',
          type: 'system',
          title: 'Profile Updated',
          message: 'Your student profile information has been saved!'
        });
        setMessage('Changes saved successfully!');
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to save profile changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Student Profile</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, verify vehicle coordinates, and review rating stats.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal info summary */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40 text-center relative overflow-hidden">
            {/* Soft decorative light */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-500 to-emerald-500"></div>

            <img
              src={user.profilePhoto}
              alt={user.name}
              className="h-24 w-24 rounded-full border-4 border-slate-100 bg-slate-100 object-cover mx-auto mb-4 mt-2 shadow-md"
            />
            
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white flex items-center justify-center gap-1">
              <span>{user.name}</span>
              {user.isVerified && <span className="text-[11px] text-brand-500">✓</span>}
            </h3>
            <span className="text-xs font-semibold text-slate-400 block mt-0.5">{user.college}</span>
            <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500 rounded-lg text-xs font-bold border border-yellow-100 dark:border-yellow-900/30">
              <Star size={13} fill="currentColor" /> {user.averageRating || 5.0} Score Rating
            </span>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-850 pt-5 text-left space-y-3.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-455">
                <Mail size={15} className="text-slate-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-455">
                <Phone size={15} className="text-slate-400" />
                <span>{user.phone}</span>
              </div>
              {user.instagramId && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-455">
                  <span className="text-[14px]">📸</span>
                  <span>{user.instagramId}</span>
                </div>
              )}
              {user.vehicleDetails?.type !== 'None' && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-455">
                  <Car size={15} className="text-slate-400" />
                  <span>Commutes with {user.vehicleDetails.type} • {user.vehicleDetails.model}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats summary */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-4">Carbon Impact Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50/30 dark:bg-slate-900/40 border border-emerald-100 dark:border-emerald-950/30 rounded-2xl p-4 text-center">
                <span className="block text-2xl font-extrabold text-emerald-500">{user.savedFuelEstimate || 0}L</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mt-1">Fuel Saved</span>
              </div>
              <div className="bg-brand-50/30 dark:bg-slate-900/40 border border-brand-100 dark:border-brand-950/30 rounded-2xl p-4 text-center">
                <span className="block text-2xl font-extrabold text-brand-500">₹{(user.savedFuelEstimate || 0) * 100}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mt-1">Cash Saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Forms & Reviews feed (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2.5 mb-4">Update Details</h3>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 text-xs font-semibold dark:bg-brand-950/20 dark:border-brand-900/30 dark:text-brand-400">
                {message}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Instagram Username</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">@</span>
                    <input
                      type="text"
                      placeholder="username"
                      value={instagramId}
                      onChange={(e) => setInstagramId(e.target.value.replace(/^@/, ''))}
                      className="w-full pl-8 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Emergency Contact *</label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Parent or Guardian's mobile number"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                  />
                </div>
              </div>

              {/* Vehicle Update Section */}
              <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-6">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase mb-3">Vehicle Details</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {['None', 'Bike', 'Car'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVehicleType(t)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        vehicleType === t
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {vehicleType !== 'None' && (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Model Name</label>
                      <input
                        type="text"
                        placeholder="Honda City"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vehicle License Plate Number</label>
                      <input
                        type="text"
                        placeholder="MH-02-AB-1234"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-tr from-brand-600 to-brand-500 text-white rounded-xl py-3 text-xs font-bold shadow-md hover:from-brand-500 hover:to-brand-600 transition-all flex items-center justify-center gap-1.5 mt-8"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Student Reviews List */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2.5 mb-4">Reviews from Classmates</h3>
            {(!user.ratings || user.ratings.length === 0) ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">You haven't received any reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {user.ratings.map((r, i) => (
                  <div key={i} className="border-b border-slate-100 dark:border-slate-800/40 last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <div className="flex gap-0.5 text-yellow-500">
                        {[...Array(5)].map((_, s) => (
                          <Star key={s} size={11} fill={s < r.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold">
                        {new Date(r.createdAt || new Date()).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{r.review}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
