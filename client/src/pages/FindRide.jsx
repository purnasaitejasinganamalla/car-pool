import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, SocketContext } from '../App';
import { Search, MapPin, Compass, Users, IndianRupee, MessageSquare, Phone, Filter, Star, Info, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function FindRide() {
  const { user, token } = useContext(AuthContext);
  const { addNotification } = useContext(SocketContext);
  const navigate = useNavigate();

  // Search Filters
  const [college, setCollege] = useState(user?.college || 'IIT Bombay');
  const [date, setDate] = useState('Today'); // 'Today' | 'Tomorrow' | 'Any'
  const [vehicleType, setVehicleType] = useState('Any'); // 'Any' | 'Bike' | 'Car'
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [maxPrice, setMaxPrice] = useState(100);
  const [gender, setGender] = useState('Any');
  const [timeRange, setTimeRange] = useState('Any'); // 'Any' | 'Morning' | 'Afternoon' | 'Evening'

  // Results
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState([]);

  // Booking details modal
  const [bookingRide, setBookingRide] = useState(null);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Load Colleges
  useEffect(() => {
    fetch('/api/colleges')
      .then(res => res.json())
      .then(data => setColleges(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch Rides
  const searchRides = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        college,
        date,
        vehicleType,
        seats: seatsNeeded,
        maxPrice,
        gender,
        timeRange
      });

      const res = await fetch(`/api/rides/search?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRides(data);
      }
    } catch (err) {
      console.error('Error searching rides:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchRides();
  }, [college, date, vehicleType, seatsNeeded, maxPrice, gender, timeRange]);

  // Handle request to join carpool
  const handleJoinRideSubmit = async (e) => {
    e.preventDefault();
    if (!bookingRide) return;

    setBookingLoading(true);
    try {
      const res = await fetch(`/api/rides/${bookingRide._id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ seatsBooked: Number(seatsToBook) })
      });
      const data = await res.json();
      if (res.ok) {
        addNotification({
          id: Math.random().toString(),
          type: 'booking',
          title: 'Request Sent',
          message: `Join request sent to ${bookingRide.driver.name}!`
        });
        alert('Join request sent successfully! Wait for driver response in dashboard.');
        setBookingRide(null);
        setSeatsToBook(1);
        searchRides();
      } else {
        alert(data.message || 'Booking failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  // Live seats count color indicators
  const getSeatsBadge = (available, original) => {
    if (available === 0) {
      return { text: 'Ride Full', style: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400' };
    } else if (available === 1) {
      return { text: 'Only 1 seat left', style: 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400' };
    } else {
      return { text: `${available} seats available`, style: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' };
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Find Commute Rides</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Search classmate routes, check student-driver profiles, and join verified carpools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/40 sticky top-24">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2.5 mb-4 flex items-center gap-1.5">
              <Filter size={14} />
              <span>Filters</span>
            </h3>

            <div className="space-y-4">
              {/* College */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">College Campus</label>
                <select
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900 outline-none dark:text-white cursor-pointer"
                >
                  {colleges.map((c, i) => (
                    <option key={i} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Option */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                <div className="grid grid-cols-3 gap-1">
                  {['Today', 'Tomorrow', 'Any'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDate(d)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        date === d
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900 outline-none dark:text-white cursor-pointer"
                >
                  <option value="Any">Any</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                </select>
              </div>

              {/* Price cap slider */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Max fuel share</span>
                  <span className="text-brand-500 font-extrabold">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="10"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>

              {/* Gender Preference */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender Restriction</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900 outline-none dark:text-white cursor-pointer"
                >
                  <option value="Any">No restriction (Any)</option>
                  <option value="Male">Male only</option>
                  <option value="Female">Female only</option>
                </select>
              </div>

              {/* Departure hours */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time of Day</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900 outline-none dark:text-white cursor-pointer"
                >
                  <option value="Any">Any time</option>
                  <option value="Morning">Morning (6 AM - 12 PM)</option>
                  <option value="Afternoon">Afternoon (12 PM - 5 PM)</option>
                  <option value="Evening">Evening (5 PM - 11 PM)</option>
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* Search Feed Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-56 rounded-3xl animate-shimmer border border-slate-200/50 dark:border-slate-800/40"></div>
              ))}
            </div>
          ) : rides.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500 bg-white/20 dark:bg-slate-900/10">
              <span className="text-3xl block mb-2">🚗</span>
              <p className="font-bold text-slate-700 dark:text-slate-300">No active classmate rides found</p>
              <p className="text-xs mt-1">Try modifying your filters, date options or search in nearby campuses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rides.map((ride) => {
                const badge = getSeatsBadge(ride.seatsAvailable, ride.originalSeats);
                return (
                  <div key={ride._id} className="glass-card rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/40 hover:shadow-premium transition-all flex flex-col justify-between">
                    <div>
                      {/* Driver Card Header */}
                      <div className="flex justify-between items-start gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                        <div className="flex items-center gap-2.5">
                          <img src={ride.driver.profilePhoto} alt={ride.driver.name} className="h-9 w-9 rounded-full bg-slate-100 object-cover border border-slate-200" />
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                              {ride.driver.name}
                              {ride.driver.isVerified && <span className="text-[10px] text-brand-500" title="Student Verified">✓</span>}
                            </h4>
                            <span className="text-[9px] text-slate-400 font-bold block">{ride.driver.college}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-xs font-extrabold text-brand-500">₹{ride.price}</span>
                          <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">fuel share</span>
                        </div>
                      </div>

                      {/* Locations details */}
                      <div className="space-y-2 mb-4">
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-400 shrink-0"></span>
                          <span className="truncate"><strong>Pickup:</strong> {ride.pickup}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0"></span>
                          <span className="truncate"><strong>College:</strong> {ride.destination}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-100/50 dark:border-slate-850">
                          <Info size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate"><strong>Landmark:</strong> {ride.landmark || 'Main Street'}</span>
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="flex flex-wrap gap-2 mb-3 mt-1 text-[10px] font-bold">
                        <a 
                          href={`tel:${ride.phone || ride.driver.phone}`} 
                          className="flex items-center gap-1 text-slate-600 hover:text-brand-500 bg-slate-100/60 dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800"
                        >
                          <Phone size={10} className="text-brand-500" />
                          <span>{ride.phone || ride.driver.phone}</span>
                        </a>
                        {(ride.instagramId || ride.driver.instagramId) && (
                          <a 
                            href={`https://instagram.com/${(ride.instagramId || ride.driver.instagramId).replace(/^@/, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-slate-600 hover:text-pink-500 bg-slate-100/60 dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800"
                          >
                            <span className="text-pink-500 font-bold text-[9px] leading-none">📸</span>
                            <span>{ride.instagramId || ride.driver.instagramId}</span>
                          </a>
                        )}
                      </div>

                      {/* Seat details / type */}
                      <div className="flex justify-between items-center gap-2 mb-4">
                        <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-lg border uppercase tracking-wider ${badge.style}`}>
                          {badge.text}
                        </span>

                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          🚗 {ride.vehicleType || ride.driver.vehicleDetails.type} • {ride.vehicleModel || ride.driver.vehicleDetails.model || 'Vehicle'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-2 pt-3.5 border-t border-slate-100 dark:border-slate-800/50">
                      <a
                        href={`tel:${ride.phone || ride.driver.phone}`}
                        className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-900 transition-colors"
                        title="Call driver"
                      >
                        <Phone size={15} />
                      </a>

                      <button
                        disabled={ride.seatsAvailable === 0}
                        onClick={() => setBookingRide(ride)}
                        className={`flex-grow py-2.5 rounded-xl font-bold text-xs shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-1 ${
                          ride.seatsAvailable === 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none dark:bg-slate-800'
                            : 'bg-gradient-to-tr from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white shadow-brand-500/20'
                        }`}
                      >
                        <span>Join Ride</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* JOIN BOOKING DETAIL POPUP MODAL */}
      <AnimatePresence>
        {bookingRide && (
          <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"></div>
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
              >
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Join Carpool Setup</h3>
                  <button onClick={() => setBookingRide(null)} className="text-slate-400 hover:text-slate-650"><X size={18} /></button>
                </div>

                <div className="text-left mb-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Confirm seat sharing with <strong className="text-slate-800 dark:text-slate-200">{bookingRide.driver.name}</strong> to college.</p>
                </div>

                <form onSubmit={handleJoinRideSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 text-left mb-1.5">How many seats do you need?</label>
                    <select
                      value={seatsToBook}
                      onChange={(e) => setSeatsToBook(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 outline-none dark:text-white"
                    >
                      {[...Array(bookingRide.seatsAvailable)].map((_, i) => (
                        <option key={i} value={i + 1}>{i + 1} seat{(i + 1) > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center font-bold text-xs">
                    <span className="text-slate-500">Fuel Contribution Total:</span>
                    <span className="text-brand-500 text-sm">₹{seatsToBook * bookingRide.price}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingRide(null)}
                      className="flex-1 py-3 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="flex-1 py-3 text-xs font-bold bg-brand-600 text-white rounded-xl shadow-md hover:bg-brand-500 flex items-center justify-center gap-1.5"
                    >
                      {bookingLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          <span>Request Seats</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
