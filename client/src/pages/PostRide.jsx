import React, { useState, useContext } from 'react';
import { AuthContext, SocketContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Compass, IndianRupee, Users, Clock, Check, ChevronLeft, AlertCircle } from 'lucide-react';
import InteractiveMap from '../components/InteractiveMap';
import { motion } from 'framer-motion';

export default function PostRide() {
  const { token, user } = useContext(AuthContext);
  const { addNotification } = useContext(SocketContext);
  const navigate = useNavigate();

  // Route Details
  const [pickup, setPickup] = useState('Powai Vihar, Mumbai');
  const [destination, setDestination] = useState(user?.college || 'IIT Bombay');
  const [landmark, setLandmark] = useState('Near D-Mart');
  const [routeDescription, setRouteDescription] = useState('JVLR Road');
  const [time, setTime] = useState('08:30');
  const [seats, setSeats] = useState(4);
  const [price, setPrice] = useState(60);
  const [genderPreference, setGenderPreference] = useState('Any');
  const [phone, setPhone] = useState(user?.phone || '');
  const [instagramId, setInstagramId] = useState(user?.instagramId || '');
  const [vehicleType, setVehicleType] = useState(() => (user?.vehicleDetails?.type === 'Bike' || user?.vehicleDetails?.type === 'Car') ? user.vehicleDetails.type : 'Car');
  const [vehicleModel, setVehicleModel] = useState(user?.vehicleDetails?.model || '');
  const [colleges, setColleges] = useState([]);

  React.useEffect(() => {
    fetch('/api/colleges')
      .then(res => res.json())
      .then(data => setColleges(data))
      .catch(err => console.error(err));
  }, []);

  // Recurrence Schedule Details
  const [repeatType, setRepeatType] = useState('Today'); // 'Today' | 'Tomorrow' | 'EveryDay' | 'Weekly' | 'Calendar'
  const [selectedDays, setSelectedDays] = useState([]); // Weekdays 0-6
  const [calendarDates, setCalendarDates] = useState([]); // YYYY-MM-DD strings
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate calendar dates for selection (Current month + next month)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handleDaySelect = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(prev => prev.filter(d => d !== dayIndex));
    } else {
      setSelectedDays(prev => [...prev, dayIndex]);
    }
  };

  const handleCalendarDateToggle = (dateStr) => {
    if (calendarDates.includes(dateStr)) {
      setCalendarDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setCalendarDates(prev => [...prev, dateStr]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pickup || !destination || !time || !seats || !price) {
      setError('Please fill in all core fields');
      return;
    }

    if (repeatType === 'Weekly' && selectedDays.length === 0) {
      setError('Please select at least one weekday');
      return;
    }

    if (repeatType === 'Calendar' && calendarDates.length === 0) {
      setError('Please select at least one date from the calendar');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/rides/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pickup,
          destination,
          landmark,
          routeDescription,
          time,
          repeatType,
          selectedDays,
          selectedDates: calendarDates,
          seats: Number(seats),
          price: Number(price),
          genderPreference,
          phone,
          instagramId: instagramId ? (instagramId.startsWith('@') ? instagramId : `@${instagramId}`) : '',
          vehicleType,
          vehicleModel
        })
      });

      const data = await res.json();
      if (res.ok) {
        addNotification({
          id: Math.random().toString(),
          type: 'schedule',
          title: 'Ride Posted Successfully',
          message: `Your ride schedule (${repeatType}) starting from ${pickup} is live!`
        });
        alert('Ride Posted Successfully!');
        navigate('/dashboard');
      } else {
        setError(data.message || 'Error posting ride');
      }
    } catch (err) {
      setError('Failed to contact server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Post a Commute Ride</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Define your route, select scheduling rules, and find students to share your fuel expenses.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Form Fields */}
        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 text-xs font-semibold dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Core Route Details */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50 pb-2 mb-2">Route Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Pickup Point *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Destination Campus *</label>
                <div className="relative">
                  <Compass className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="">Select College</option>
                    {colleges.map((c, i) => (
                      <option key={i} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Pickup Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Exit Gate 1"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Route description</label>
                <input
                  type="text"
                  placeholder="e.g. Via highway"
                  value={routeDescription}
                  onChange={(e) => setRouteDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Seats *</label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Fuel cost *</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Gender Pref</label>
                <select
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="Any">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Departure Time *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/50 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Contact Instagram</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">@</span>
                  <input
                    type="text"
                    value={instagramId}
                    onChange={(e) => setInstagramId(e.target.value.replace(/^@/, ''))}
                    className="w-full pl-7 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">🚗 Vehicle Type</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['Bike', 'Car'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setVehicleType(t)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      vehicleType === t
                        ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {t === 'Bike' ? '🏍️ Bike' : '🚗 Car'}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Vehicle Name / Model</label>
              <input
                type="text"
                placeholder="e.g. Honda City, Royal Enfield Classic 350"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white/50 focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">This will be shown on your ride card so riders know what vehicle to look for.</p>
            </div>

          </div>

          {/* Interactive Route Map */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Route preview</label>
            <InteractiveMap pickup={pickup} destination={destination} height="200px" />
          </div>

        </div>

        {/* Right Column: Advanced Schedule Options */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/50 pb-2 mb-4 flex items-center gap-1">
              <Calendar size={14} />
              <span>Schedule & Posting Options</span>
            </h3>

            {/* Repeat Type Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-2 gap-2 mb-6">
              {['Today', 'Tomorrow', 'EveryDay', 'Weekly', 'Calendar'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRepeatType(type)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    repeatType === type
                      ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 dark:text-slate-300'
                  }`}
                >
                  {type === 'EveryDay' ? 'Every Day' : type}
                </button>
              ))}
            </div>

            {/* OPTION DETAIL RENDERERS */}
            {repeatType === 'Today' && (
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <strong>Today Option:</strong> Your ride will be posted immediately for today's date only. It will automatically expire after the departure time.
              </p>
            )}

            {repeatType === 'Tomorrow' && (
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <strong>Tomorrow Option:</strong> Your ride will be posted for tomorrow's date only. It will automatically expire after departure.
              </p>
            )}

            {repeatType === 'EveryDay' && (
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                <strong>Every Day Option:</strong> The scheduler engine will automatically create a ride post for you every single day at midnight.
              </p>
            )}

            {repeatType === 'Weekly' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Select Weekdays</label>
                <div className="flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDaySelect(idx)}
                      className={`h-10 w-10 text-xs font-bold rounded-xl border flex items-center justify-center transition-all ${
                        selectedDays.includes(idx)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Rides will auto-post only on the selected weekdays at midnight.
                </p>
              </div>
            )}

            {repeatType === 'Calendar' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Select Calendar Dates</label>
                
                {/* Authentic Native Date Picker */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/40">
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-100">Add Date</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        id="datePickerInput"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-brand-500 outline-none dark:border-slate-800 dark:bg-slate-900/50 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = document.getElementById('datePickerInput').value;
                          if (val && !calendarDates.includes(val)) {
                            setCalendarDates(prev => [...prev, val].sort());
                            document.getElementById('datePickerInput').value = '';
                          }
                        }}
                        className="bg-brand-500 text-white font-bold text-xs px-4 rounded-xl hover:bg-brand-600 shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {calendarDates.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-100 block mb-2">Selected Dates ({calendarDates.length})</label>
                      <div className="flex flex-wrap gap-2">
                        {calendarDates.map(date => (
                          <div key={date} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm">
                            <span>{date}</span>
                            <button
                              type="button"
                              onClick={() => handleCalendarDateToggle(date)}
                              className="text-brand-400 hover:text-red-500 focus:outline-none"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Click on dates to add or remove them. Skips holidays and exams instantly. Only active on selected dates.
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl py-3.5 text-sm font-bold shadow-md shadow-brand-500/25 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 mt-8"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Create Ride Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
