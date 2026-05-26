import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, SocketContext } from '../App';
import { Plus, Search, Calendar, ChevronRight, Check, X, ShieldAlert, Award, User, MessageSquare, Phone, QrCode } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import InteractiveMap from '../components/InteractiveMap';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const { user, token } = useContext(AuthContext);
  const { addNotification } = useContext(SocketContext);
  
  const [hostedRides, setHostedRides] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // UPI payment Modal details
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [upiIdInput, setUpiIdInput] = useState('');
  const [txnInput, setTxnInput] = useState('');

  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      // 1. Load my hosted rides
      const resHosted = await fetch('/api/rides/my-rides', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataHosted = await resHosted.json();
      setHostedRides(dataHosted.hostedRides || []);

      // 2. Load schedules
      const resSched = await fetch('/api/rides/schedule', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataSched = await resSched.json();
      setSchedules(dataSched || []);

      // 3. Load requests (incoming & outgoing)
      const resBookings = await fetch('/api/bookings/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataBookings = await resBookings.json();
      setRequests(dataBookings.requests || []);
      setMyBookings(dataBookings.myBookings || []);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  // Handle request approval
  const handleRequestStatus = async (bookingId, status) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        if (status === 'Accepted') {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 }
          });
          addNotification({
            id: bookingId,
            type: 'booking',
            title: 'Request Approved',
            message: 'You successfully approved this passenger join request!'
          });
        }
        loadDashboardData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit UPI Payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentModalBooking) return;

    try {
      const res = await fetch(`/api/bookings/${paymentModalBooking._id}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ upiId: upiIdInput, transactionId: txnInput })
      });
      if (res.ok) {
        addNotification({
          id: paymentModalBooking._id,
          type: 'payment',
          title: 'Payment Submitted',
          message: 'UPI details submitted. The driver will confirm details shortly.'
        });
        setPaymentModalBooking(null);
        setUpiIdInput('');
        setTxnInput('');
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Skip Schedule Date
  const handleSkipDate = async (scheduleId, dateStr) => {
    try {
      const res = await fetch(`/api/rides/schedule/${scheduleId}/cancel-date`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dateStr })
      });
      if (res.ok) {
        alert(`Ride cancelled successfully for date: ${dateStr}`);
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manual trigger engine for demo
  const handleForceScheduleRun = async () => {
    try {
      const res = await fetch('/api/scheduler/trigger', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Demo scheduler run complete!\nCreated: ${data.summary.createdCount} rides.\nExpired: ${data.summary.expiredCount} rides.`);
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  // Active status color helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Accepted': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'Pending': return 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
      default: return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/20 dark:text-slate-400';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Hey, {user.name.split(' ')[0]}</span>
            <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Student commute panel for <span className="font-semibold text-brand-500">{user.college}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Quick trigger for demo scheduler */}
          <button
            onClick={handleForceScheduleRun}
            className="rounded-xl border border-dashed border-brand-300 hover:border-brand-500 px-3.5 py-2 text-xs font-bold text-brand-500 bg-brand-50/20 dark:bg-slate-900 dark:border-brand-800 transition-all duration-200"
            title="Forces scheduler processing check for today"
          >
            ⚙️ Refresh Daily Auto-Posting
          </button>
          
          <Link
            to="/find-ride"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-premium dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 hover:bg-slate-50 transition-all"
          >
            Find a Ride
          </Link>
          <Link
            to="/post-ride"
            className="rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 transition-all flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Post a Ride</span>
          </Link>
        </div>
      </div>

      {/* Overview Statistics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Weekly Schedules', value: schedules.length, icon: Calendar, color: 'text-brand-500 bg-brand-50 dark:bg-brand-950/20' },
          { label: 'Rides Posted Today', value: hostedRides.filter(r => r.rideDate === new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]).length, icon: Award, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { label: 'Saved Fuel Estimate', value: `${user.savedFuelEstimate || 0} L`, icon: Check, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' },
          { label: 'Fuel Cash Saved', value: `₹${(user.savedFuelEstimate || 0) * 100}`, icon: ShieldAlert, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' }
        ].map((card, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/40">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{card.label}</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 block">{card.value}</span>
              </div>
              <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon size={18} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: My Active Commutes & Templates (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: My Joined Carpools (Passenger Bookings) */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">My Booked Rides (Joined as Passenger)</h2>
            {myBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500 bg-white/20 dark:bg-slate-900/10">
                You haven't requested or joined any rides yet.
                <Link to="/find-ride" className="text-brand-500 hover:underline block font-semibold mt-2 text-xs">Search rides going to college &rarr;</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myBookings.map((b) => (
                  <div key={b._id} className="glass-card rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/40 hover:shadow-premium transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${getStatusStyle(b.status)}`}>
                          Booking: {b.status}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-lg">
                          ₹{b.ride.price} fuel contribution
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800/50 pb-3">
                        <img src={b.driver.profilePhoto} alt={b.driver.name} className="h-8 w-8 rounded-full bg-slate-100 object-cover" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Driver: {b.driver.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{b.ride.vehicleType || b.driver.vehicleDetails.type} • {b.ride.vehicleModel || b.driver.vehicleDetails.model}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
                          <strong>Pickup:</strong> {b.ride.pickup}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                          <strong>College:</strong> {b.ride.destination}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 inline-block"></span>
                          <strong>Time:</strong> {b.ride.rideDate} at {b.ride.departureTime}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                      {b.status === 'Accepted' && b.paymentStatus === 'Pending' && (
                        <button
                          onClick={() => setPaymentModalBooking(b)}
                          className="flex-grow flex items-center justify-center gap-1 bg-gradient-to-tr from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-all"
                        >
                          <QrCode size={13} />
                          <span>Pay UPI ₹{b.ride.price}</span>
                        </button>
                      )}
                      
                      {b.status === 'Accepted' && b.paymentStatus === 'Paid' && (
                        <span className="flex-grow bg-emerald-500/10 text-emerald-500 dark:bg-emerald-950/20 text-center font-bold py-2 rounded-xl text-[10px] border border-emerald-500/20 uppercase tracking-widest">
                          ✓ Paid & Confirmed
                        </span>
                      )}

                      {b.status === 'Accepted' && (
                        <a
                          href={`tel:${b.driver.phone}`}
                          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                          title="Call driver"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Hosted RidePosts (My Scheduled Commutes Active Today/Tomorrow) */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">My Hosted Ride Posts (My car/bike today)</h2>
            {hostedRides.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500 bg-white/20 dark:bg-slate-900/10">
                You haven't posted any active rides.
                <Link to="/post-ride" className="text-brand-500 hover:underline block font-semibold mt-2 text-xs">Post a ride schedule &rarr;</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hostedRides.map((ride) => (
                  <div key={ride._id} className="glass-card rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/40 hover:shadow-premium transition-all">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${
                        ride.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {ride.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Date: {ride.rideDate}
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong>From:</strong> {ride.pickup}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong>To College:</strong> {ride.destination}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong>Departure Time:</strong> {ride.departureTime} {ride.overrideTime && <span className="text-[10px] text-yellow-500 font-bold">(Overridden)</span>}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong>Vehicle:</strong> {ride.vehicleType || 'Car'} • {ride.vehicleModel || 'N/A'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 mb-4 text-xs font-semibold">
                      <span className="text-slate-500">Seats available:</span>
                      <span className={`px-2 py-0.5 rounded-lg text-white text-[10px] font-bold ${
                        ride.seatsAvailable > 2 ? 'bg-accent-green' : ride.seatsAvailable > 0 ? 'bg-accent-yellow' : 'bg-accent-red'
                      }`}>
                        {ride.seatsAvailable} / {ride.originalSeats} seats left
                      </span>
                    </div>

                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => handleSkipDate(ride.scheduleId, ride.rideDate)}
                        className="rounded-xl border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 text-xs font-bold transition-all dark:border-red-950/30 dark:hover:bg-red-950/20"
                      >
                        Cancel Ride
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Active Templates (Schedules) */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">My General Schedules (Recurring Templates)</h2>
            {schedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500 bg-white/20 dark:bg-slate-900/10">
                No active schedules set. Daily rides are posted from schedules automatically.
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((s) => (
                  <div key={s._id} className="glass-card rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/45 px-2.5 py-0.5 rounded-lg uppercase tracking-wider text-[9px]">
                          {s.repeatType}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {s.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <strong>Route:</strong> {s.pickup} &rarr; {s.destination}
                      </p>
                      {s.repeatType === 'Weekly' && (
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          Days: {s.selectedDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const date = prompt('Enter date to exclude (YYYY-MM-DD):');
                          if (date) handleSkipDate(s._id, date);
                        }}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                      >
                        Skip Date
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Bookings Requests & Alerts */}
        <div className="space-y-8">
          
          {/* Incoming Bookings requests */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Incoming Carpool Requests</h2>
            {requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500 bg-white/20 dark:bg-slate-900/10 text-xs">
                No active join requests from other classmates.
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req._id} className="glass-card rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/40 relative">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <img src={req.rider.profilePhoto} alt={req.rider.name} className="h-8 w-8 rounded-full bg-slate-100" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{req.rider.name}</h4>
                          <span className="text-[9px] text-slate-400 block font-semibold">{req.rider.college}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-brand-500 bg-brand-50 dark:bg-brand-950/20 px-2 py-0.5 rounded-lg border border-brand-100/30">
                        {req.seatsBooked} {req.seatsBooked > 1 ? 'seats' : 'seat'}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-2 mb-4">
                      <p><strong>Pickup Landmark:</strong> {req.ride.landmark || req.ride.pickup}</p>
                      <p><strong>Departure Date:</strong> {req.ride.rideDate} at {req.ride.departureTime}</p>
                      <p><strong>Payment Status:</strong> <span className={`font-bold ${req.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-yellow-500'}`}>{req.paymentStatus}</span></p>
                      {req.paymentDetails.transactionId && (
                        <p className="bg-slate-50 dark:bg-slate-850 p-1.5 rounded-lg mt-1 select-all font-mono text-[9px]">Txn ID: {req.paymentDetails.transactionId}</p>
                      )}
                    </div>

                    {req.status === 'Pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestStatus(req._id, 'Rejected')}
                          className="flex-1 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 py-2 text-xs font-bold dark:border-red-950/30 dark:hover:bg-red-950/20 transition-all flex items-center justify-center gap-1"
                        >
                          <X size={13} />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => handleRequestStatus(req._id, 'Accepted')}
                          className="flex-1 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white py-2 text-xs font-bold shadow-md hover:from-brand-500 transition-all flex items-center justify-center gap-1"
                        >
                          <Check size={13} />
                          <span>Accept</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Request {req.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety Advisory block */}
          <div className="rounded-3xl p-5 border border-emerald-200 bg-emerald-50/20 dark:border-emerald-950/30 dark:bg-slate-900/30">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-accent-green"></span>
              <span>Campus Safety Panel</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Always double-check the student ID card of the driver or passenger at the landmark pickup location. Commute safely and cheap!
            </p>
          </div>

        </div>
      </div>

      {/* UPI SCANNER MODAL POPUP */}
      {paymentModalBooking && (
        <>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"></div>
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">UPI Fuel Payment Check</h3>
                <button onClick={() => setPaymentModalBooking(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">SCAN & PAY</p>
                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-200 block my-1">
                  ₹{paymentModalBooking.ride.price}
                </span>

                {/* Dummy QR Code Rendering */}
                <div className="bg-white p-3 rounded-xl max-w-[130px] mx-auto my-3 border border-slate-200 flex items-center justify-center">
                  <div className="w-24 h-24 bg-[repeating-conic-gradient(#000_0_25%,#fff_0_50%)] bg-[size:10px_10px] opacity-90"></div>
                </div>

                <p className="text-[10px] text-slate-500 font-mono">UPI ID: {paymentModalBooking.driver.name.toLowerCase().replace(/ /g, '')}@okaxis</p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 text-left mb-1">Your UPI ID</label>
                  <input
                    type="text"
                    required
                    placeholder="student@okaxis"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 focus:border-brand-500 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 text-left mb-1">Transaction Ref ID</label>
                  <input
                    type="text"
                    required
                    placeholder="TXN12938172"
                    value={txnInput}
                    onChange={(e) => setTxnInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 focus:border-brand-500 outline-none dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-bold shadow-md transition-all mt-4"
                >
                  Submit Payment Details
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}

    </div>
  );
}
