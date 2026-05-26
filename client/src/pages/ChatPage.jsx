import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext, SocketContext } from '../App';
import { Send, Phone, MessageSquare, ShieldCheck, HelpCircle, Check, CheckCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ChatPage() {
  const { user, token } = useContext(AuthContext);
  const { socket, unreadChats, setUnreadChats } = useContext(SocketContext);
  
  const [rooms, setRooms] = useState([]);
  const [activePartner, setActivePartner] = useState(null); // partner user details
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  const [showCallWarning, setShowCallWarning] = useState(false);
  const [bookingsStatus, setBookingsStatus] = useState([]); // to check if booking accepted
  
  const messagesEndRef = useRef(null);
  const location = useLocation();

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat rooms list
  const loadRooms = async () => {
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(data);

        // Check if redirected from FindRide page with state partnerId
        if (location.state?.partnerId) {
          const targetPartnerId = location.state.partnerId;
          const targetRoom = data.find(r => r.partnerId === targetPartnerId);
          if (targetRoom) {
            handleSelectRoom(targetRoom);
          } else {
            // New chat session
            const resUser = await fetch(`/api/users/${targetPartnerId}`);
            if (resUser.ok) {
              const partnerInfo = await resUser.json();
              setActivePartner({
                partnerId: partnerInfo._id,
                partnerName: partnerInfo.name,
                partnerPhoto: partnerInfo.profilePhoto,
                partnerPhone: partnerInfo.phone,
                lastMessage: '',
                lastMessageTime: new Date().toISOString()
              });
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load active booking status to unlock numbers
  const loadBookings = async () => {
    try {
      const res = await fetch('/api/bookings/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookingsStatus([...data.requests, ...data.myBookings]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      loadRooms();
      loadBookings();
    }
  }, [token]);

  // Listen to Socket.io messages
  useEffect(() => {
    if (socket) {
      const handleReceive = (msg) => {
        if (activePartner && (msg.senderId === activePartner.partnerId || msg.receiverId === activePartner.partnerId)) {
          setMessages(prev => [...prev, msg]);
          // Mark seen
          fetch(`/api/chats/${activePartner.partnerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        loadRooms();
      };
      
      socket.on('receive_message', handleReceive);
      return () => {
        socket.off('receive_message', handleReceive);
      };
    }
  }, [socket, activePartner]);

  // Select a Chat Room
  const handleSelectRoom = async (room) => {
    setActivePartner(room);
    setUnreadChats(0);
    try {
      const res = await fetch(`/api/chats/${room.partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Message
  const handleSendMessageSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartner) return;

    const payload = {
      receiverId: activePartner.partnerId,
      text: inputText
    };

    setInputText('');

    try {
      const res = await fetch('/api/chats/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        
        // Broadcast via Socket.io
        if (socket) {
          socket.emit('send_message', {
            senderId: user._id,
            receiverId: activePartner.partnerId,
            text: payload.text
          });
        }
        
        loadRooms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Safe calling check: only allowed if booking is accepted
  const handleCallClick = () => {
    const isAccepted = bookingsStatus.some(
      b => (b.status === 'Accepted' && (b.riderId === activePartner.partnerId || b.ride.driverId === activePartner.partnerId))
    );

    if (isAccepted) {
      window.location.href = `tel:${activePartner.partnerPhone}`;
    } else {
      setShowCallWarning(true);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 h-[calc(100vh-8rem)]">
      <div className="glass-card rounded-3xl border border-slate-200/50 dark:border-slate-800/40 h-full overflow-hidden grid grid-cols-1 md:grid-cols-3">
        
        {/* Left Pane: Chats list */}
        <div className="border-r border-slate-200 dark:border-slate-800/50 flex flex-col h-full bg-white/40 dark:bg-slate-900/10">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/50">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <MessageSquare size={16} className="text-brand-500" />
              <span>Inbox Commutes</span>
            </h3>
          </div>

          <div className="flex-grow overflow-y-auto p-2 space-y-1">
            {rooms.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No active conversations yet.
              </div>
            ) : (
              rooms.map((room) => {
                const isActive = activePartner?.partnerId === room.partnerId;
                return (
                  <button
                    key={room.partnerId}
                    onClick={() => handleSelectRoom(room)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all duration-150 flex items-center gap-3 ${
                      isActive 
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/15 dark:bg-brand-600'
                        : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-350'
                    }`}
                  >
                    <img src={room.partnerPhoto} alt={room.partnerName} className="h-9 w-9 rounded-full bg-slate-100 object-cover" />
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-bold truncate">{room.partnerName}</h4>
                        <span className={`text-[8px] font-bold ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                          {new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                        {room.lastMessage}
                      </p>
                    </div>
                    {!room.isSeen && !isActive && (
                      <span className="h-2 w-2 rounded-full bg-accent-red shrink-0 animate-ping"></span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Message Feed Box */}
        <div className="md:col-span-2 flex flex-col h-full bg-white/20 dark:bg-slate-950/10">
          {activePartner ? (
            <>
              {/* Box Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 flex justify-between items-center bg-white/50 dark:bg-slate-900/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <img src={activePartner.partnerPhoto} alt={activePartner.partnerName} className="h-9 w-9 rounded-full bg-slate-100" />
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{activePartner.partnerName}</h3>
                    <span className="text-[9px] text-slate-400 block font-semibold">Active Campus Connection</span>
                  </div>
                </div>

                <button
                  onClick={handleCallClick}
                  className="rounded-xl border border-slate-200 p-2.5 text-brand-600 hover:bg-slate-50 dark:border-slate-800 dark:text-brand-400 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <Phone size={14} />
                  <span>Safe Call</span>
                </button>
              </div>

              {/* Message scroll container */}
              <div className="flex-grow overflow-y-auto p-4 space-y-3.5">
                {messages.map((m) => {
                  const isMe = m.senderId === user._id;
                  return (
                    <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs ${
                        isMe 
                          ? 'bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-150'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        <div className={`text-[8px] flex items-center justify-end gap-1 mt-1 font-bold ${
                          isMe ? 'text-white/70' : 'text-slate-400'
                        }`}>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            <span>
                              {m.isSeen ? <CheckCheck size={10} /> : <Check size={10} />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef}></div>
              </div>

              {/* Footer text input */}
              <form onSubmit={handleSendMessageSubmit} className="p-4 border-t border-slate-200 dark:border-slate-800/50 flex gap-2">
                <input
                  type="text"
                  placeholder="Discuss pickup landmarks or schedules..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-grow px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 focus:border-brand-500 outline-none dark:text-white dark:bg-slate-900/50"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-brand-500 text-white p-3 hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/10"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col h-full items-center justify-center text-center p-8">
              <span className="text-4xl block mb-2">💬</span>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">No active chat selected</h3>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1">Select an active carpool inbox to arrange meeting points or timing details.</p>
            </div>
          )}
        </div>

      </div>

      {/* SECURE CALL WARNING MODAL */}
      <AnimatePresence>
        {showCallWarning && (
          <>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"></div>
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400 mx-auto mb-4">
                  <ShieldCheck size={26} />
                </span>
                
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Safe Calling Enabled</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Student phone numbers are kept strictly hidden for privacy until a ride booking request is officially accepted.
                </p>

                <div className="my-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 text-left text-[11px] text-slate-400">
                  ⚠️ Request {activePartner?.partnerName} to join your carpool or accept their pending join request in the Dashboard to unlock call coordinates.
                </div>

                <button
                  onClick={() => setShowCallWarning(false)}
                  className="w-full py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500"
                >
                  Understood
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
