import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../App';
import { Mail, User, Phone, School, Car, Key, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const { login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  
  // Registration state
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [instagramId, setInstagramId] = useState('');
  const [vehicleType, setVehicleType] = useState('None');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  
  // Verification states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    // Load colleges list
    fetch('/api/colleges')
      .then(res => res.json())
      .then(data => setColleges(data))
      .catch(err => console.error(err));
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Make sure credentials are correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    setError('');
    if (!name || !college || !email || !phone || !password) {
      setError('Please fill in all required fields');
      return;
    }

    // Basic email check
    const isEmailValid = email.includes('@') && email.includes('.');
    if (!isEmailValid) {
      setError('Please register with a valid email address');
      return;
    }

    // Open OTP simulation modal
    setShowOtpModal(true);
  };

  const handleVerifyOtp = async () => {
    if (otpCode !== '1234') {
      setError('Invalid OTP code. Enter 1234 to verify.');
      return;
    }
    
    setError('');
    setLoading(true);
    setShowOtpModal(false);
    
    try {
      await register({
        name,
        college,
        email,
        phone,
        password,
        instagramId: instagramId ? `@${instagramId}` : '',
        vehicleType,
        vehicleModel,
        vehicleNumber
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 relative py-12">
      {/* Background circles */}
      <div className="absolute top-[10%] left-[5%] h-72 w-72 rounded-full bg-brand-500/5 blur-[80px]"></div>
      <div className="absolute bottom-[10%] right-[5%] h-80 w-80 rounded-full bg-emerald-500/5 blur-[90px]"></div>

      <div className="w-full max-w-lg">
        {/* Form Container */}
        <motion.div
          layout
          className="glass-card rounded-3xl p-8 border border-slate-200/50 dark:border-slate-800/40 shadow-2xl relative"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-3xl">🚗</span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
              {isLogin ? 'Welcome Back!' : 'Create Student Account'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {isLogin ? 'Enter email to sign in to CampusRide' : 'Provide student info to join your college carpool'}
            </p>
          </div>

          {error && !showOtpModal && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-xs font-semibold dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterClick} className="space-y-4">
            {!isLogin && (
              <>
                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rahul Sharma"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                {/* College selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">College Campus *</label>
                  <div className="relative">
                    <School className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <select
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 outline-none transition-all dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="">Select your College</option>
                      {colleges.map((c, i) => (
                        <option key={i} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Phone number */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                {/* Instagram ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Instagram Username (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-sm font-bold text-slate-400">@</span>
                    <input
                      type="text"
                      placeholder="username"
                      value={instagramId}
                      onChange={(e) => setInstagramId(e.target.value.replace(/^@/, ''))}
                      className="w-full pl-9 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder={isLogin ? "aarav.sharma@iitb.ac.in" : "student@domain.com"}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 outline-none transition-all dark:text-white"
                />
              </div>
              {!isLogin && (
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">Verify with mock OTP 1234</span>
              )}
              {isLogin && (
                <span className="text-[10px] text-brand-500/80 dark:text-brand-400/80 font-bold block mt-1 cursor-pointer hover:underline" onClick={() => setEmail('aarav.sharma@iitb.ac.in')}>
                  💡 Quick demo email: aarav.sharma@iitb.ac.in
                </span>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900/50 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            {/* Registration Vehicle section */}
            {!isLogin && (
              <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-4 mt-4">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Do you own a Vehicle?</label>
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
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Model Name</label>
                      <input
                        type="text"
                        placeholder="Honda City"
                        required
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white/50 focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900/50 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vehicle Number</label>
                      <input
                        type="text"
                        placeholder="MH-02-AB-1234"
                        required
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white/50 focus:border-brand-500 dark:border-slate-800 dark:bg-slate-900/50 outline-none dark:text-white"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Action button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl py-3.5 text-sm font-bold shadow-md shadow-brand-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 mt-6"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Proceed to Verify'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="text-center mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              {isLogin ? "New user? Create a Student Account" : "Already registered? Login to account"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* OTP SIMULATION POPUP MODAL */}
      <AnimatePresence>
        {showOtpModal && (
          <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"></div>
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 mx-auto mb-4">
                  <ShieldCheck size={26} />
                </span>
                
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Verification Code</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  We simulated sending a 4-digit verification code to <span className="font-bold text-slate-600 dark:text-slate-300">{email}</span>.
                </p>

                <div className="my-5">
                  <div className="relative">
                    <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      maxLength="4"
                      placeholder="Enter verification code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 text-center text-sm font-bold tracking-widest rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:border-brand-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <span className="text-[10px] text-brand-500/80 font-bold block mt-1">
                    💡 Hint: Enter code 1234 to verify
                  </span>
                </div>

                {error && (
                  <p className="text-xs text-red-500 font-bold mb-3">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowOtpModal(false)}
                    className="flex-1 py-3 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    className="flex-1 py-3 text-xs font-bold bg-brand-600 text-white rounded-xl shadow-md hover:bg-brand-500"
                  >
                    Verify Code
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
