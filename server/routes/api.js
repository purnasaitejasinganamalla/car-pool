const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, RideSchedule, RidePost, Booking, Message } = require('../models/Schemas');
const { runScheduler } = require('../scheduler/rideScheduler');
const { getLocalDateString } = require('../utils/dateHelper');
const { isMock } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'campusride-super-secret-key';

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ----------------------------------------------------
// AUTHENTICATION SYSTEM
// ----------------------------------------------------

router.post('/auth/register', async (req, res) => {
  try {
    const { name, college, email, phone, password, instagramId, profilePhoto, vehicleType, vehicleModel, vehicleNumber } = req.body;

    if (!name || !college || !email || !phone) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Allow any email with basic @ and . check
    const isEmailValid = email.includes('@') && email.includes('.');
    if (!isEmailValid) {
      return res.status(400).json({ message: 'Please register with a valid email address' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const newUser = await User.create({
      name,
      college,
      email,
      phone,
      password: password || '',
      instagramId: instagramId || '',
      profilePhoto: profilePhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      vehicleDetails: {
        type: vehicleType || 'None',
        model: vehicleModel || '',
        number: vehicleNumber || ''
      },
      isVerified: true, // auto-verified for smooth student experience in prototype
      isBanned: false,
      emergencyContact: '',
      ratings: [],
      averageRating: 5.0,
      savedFuelEstimate: 0
    });

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: newUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Dynamically auto-register user on login with any credentials
      const name = email.split('@')[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      user = await User.create({
        name: displayName,
        college: 'IIT Bombay', // Default college
        email,
        phone: '+91 99999 99999', // Default phone
        password: password || '',
        instagramId: '',
        profilePhoto: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`,
        vehicleDetails: {
          type: 'None',
          model: '',
          number: ''
        },
        isVerified: true,
        isBanned: false,
        emergencyContact: '',
        ratings: [],
        averageRating: 5.0,
        savedFuelEstimate: 0
      });
    }

    if (user.password && user.password !== password) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been suspended for safety reports. Contact admin.' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/users/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving profile' });
  }
});

// Update profile
router.put('/users/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, instagramId, emergencyContact, vehicleType, vehicleModel, vehicleNumber, profilePhoto } = req.body;
    const updated = await User.findByIdAndUpdate(req.userId, {
      name,
      phone,
      instagramId: instagramId || '',
      emergencyContact,
      profilePhoto,
      vehicleDetails: {
        type: vehicleType,
        model: vehicleModel,
        number: vehicleNumber
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Public profile & reviews
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Hide email & phone for privacy unless logged in (handled by client)
    res.json({
      _id: user._id,
      name: user.name,
      college: user.college,
      profilePhoto: user.profilePhoto,
      vehicleDetails: user.vehicleDetails,
      ratings: user.ratings,
      averageRating: user.averageRating,
      savedFuelEstimate: user.savedFuelEstimate,
      isVerified: user.isVerified,
      instagramId: user.instagramId,
      phone: user.phone
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving user info' });
  }
});

// Submit a review/rating
router.post('/users/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const newRating = {
      reviewerId: req.userId,
      rating: Number(rating),
      review: review || '',
      createdAt: new Date().toISOString()
    };

    const updatedRatings = [...(targetUser.ratings || []), newRating];
    const avg = updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length;

    const updated = await User.findByIdAndUpdate(req.params.id, {
      ratings: updatedRatings,
      averageRating: Number(avg.toFixed(1))
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error leaving review' });
  }
});

// Get colleges list
router.get('/colleges', async (req, res) => {
  res.json([
    { name: 'IIT Bombay' },
    { name: 'Delhi University (DU)' },
    { name: 'BITS Pilani' },
    { name: 'RV College of Engineering' },
    { name: 'COEP Pune' },
    { name: 'IIT Delhi' },
    { name: 'IIT Madras' },
    { name: 'IIT Kharagpur' },
    { name: 'BITS Goa' },
    { name: 'BITS Hyderabad' },
    { name: 'DTU Delhi' },
    { name: 'VIT Vellore' },
    { name: 'MIT Manipal' },
    { name: 'SRM University' },
    { name: 'Anna University' },
    { name: 'Jadavpur University' },
    { name: 'NIT Trichy' },
    { name: 'NIT Surathkal' },
    { name: 'IIT Roorkee' },
    { name: 'IIT Guwahati' },
    { name: 'IIT Kanpur' },
    { name: 'IIIT Delhi' },
    { name: 'NSUT Delhi' },
    { name: 'NIT Warangal' },
    { name: 'NIT Rourkela' },
    { name: 'PES University' },
    { name: 'New Horizon College of Engineering' },
    { name: 'Dayananda Sagar College of Engineering' },
    { name: 'MSRIT Bangalore' },
    { name: 'BMS College of Engineering' },
    { name: 'PSG College of Technology' },
    { name: 'College of Engineering Guindy' },
    { name: 'VIT Chennai' },
    { name: 'Manipal University Jaipur' },
    { name: 'Thapar Institute of Engineering and Technology' },
    { name: 'KIIT University Bhubaneswar' },
    { name: 'Amity University Noida' },
    { name: 'LPU Punjab' },
    { name: 'Christ University Bangalore' },
    { name: 'Symbiosis International University Pune' },
    { name: 'PEC Chandigarh' },
    { name: 'HBTU Kanpur' }
  ]);
});

// ----------------------------------------------------
// RIDE POSTING & SCHEDULING SYSTEM
// ----------------------------------------------------

router.post('/rides/post', authMiddleware, async (req, res) => {
  try {
    const {
      pickup, destination, landmark, routeDescription,
      time, repeatType, selectedDays, selectedDates,
      seats, price, genderPreference, phone, instagramId,
      vehicleType, vehicleModel
    } = req.body;

    if (!pickup || !destination || !time || !repeatType || !seats || !price) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const schedule = await RideSchedule.create({
      userId: req.userId,
      pickup,
      destination,
      landmark: landmark || '',
      routeDescription: routeDescription || '',
      time,
      repeatType,
      selectedDays: selectedDays || [],
      selectedDates: selectedDates || [],
      excludedDates: [],
      seats: Number(seats),
      price: Number(price),
      genderPreference: genderPreference || 'Any',
      phone: phone || '',
      instagramId: instagramId || '',
      vehicleType: vehicleType || 'Car',
      vehicleModel: vehicleModel || '',
      isActive: true
    });

    // Automatically trigger scheduler for relevant dates so they appear immediately in searches and dashboard!
    const datesToRun = new Set();
    const todayStr = getLocalDateString();
    datesToRun.add(todayStr);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getLocalDateString(tomorrow);
    datesToRun.add(tomorrowStr);

    if (repeatType === 'Calendar' && selectedDates && selectedDates.length > 0) {
      selectedDates.forEach(d => datesToRun.add(d));
    }

    if (repeatType === 'EveryDay' || repeatType === 'Weekly') {
      for (let i = 2; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        datesToRun.add(getLocalDateString(d));
      }
    }

    for (const dStr of Array.from(datesToRun)) {
      await runScheduler(dStr);
    }

    res.status(201).json({
      message: 'Schedule created and rides generated successfully',
      schedule
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error posting ride schedule' });
  }
});

router.get('/rides/schedule', authMiddleware, async (req, res) => {
  try {
    const schedules = await RideSchedule.find({ userId: req.userId });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving schedules' });
  }
});

// Edit, pause, resume or skip dates in schedule
router.put('/rides/schedule/:id', authMiddleware, async (req, res) => {
  try {
    const { isActive, excludedDates, time, seats } = req.body;
    const schedule = await RideSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (schedule.userId !== req.userId) return res.status(403).json({ message: 'Unauthorized' });

    const updateObj = {};
    if (isActive !== undefined) updateObj.isActive = isActive;
    if (excludedDates !== undefined) updateObj.excludedDates = excludedDates;
    if (time !== undefined) updateObj.time = time;
    if (seats !== undefined) updateObj.seats = Number(seats);

    const updated = await RideSchedule.findByIdAndUpdate(req.params.id, updateObj);
    
    // Regenerate/Update active posts
    const todayStr = getLocalDateString();
    await runScheduler(todayStr);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating schedule' });
  }
});

// Cancel a specific date only (skips via exclusion)
router.put('/rides/schedule/:id/cancel-date', authMiddleware, async (req, res) => {
  try {
    const { dateStr } = req.body; // "YYYY-MM-DD"
    const schedule = await RideSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    // 1. Add to excluded list
    const excluded = [...(schedule.excludedDates || [])];
    if (!excluded.includes(dateStr)) {
      excluded.push(dateStr);
    }
    await RideSchedule.findByIdAndUpdate(req.params.id, { excludedDates: excluded });

    // 2. Mark any generated RidePost on this date as Cancelled
    const post = await RidePost.findOne({ scheduleId: req.params.id, rideDate: dateStr });
    if (post) {
      await RidePost.findByIdAndUpdate(post._id, { status: 'Cancelled' });
    }

    res.json({ message: `Successfully cancelled ride for date ${dateStr}` });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling date instance' });
  }
});

// Update specific date instance's departure time (Edit Today/Tomorrow only override)
router.put('/rides/post/:id/override-time', authMiddleware, async (req, res) => {
  try {
    const { departureTime } = req.body;
    const post = await RidePost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Ride post not found' });
    if (post.driverId !== req.userId) return res.status(403).json({ message: 'Unauthorized' });

    const updated = await RidePost.findByIdAndUpdate(req.params.id, {
      departureTime,
      overrideTime: departureTime
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error editing ride departure time' });
  }
});

// ----------------------------------------------------
// FIND RIDE FEED & SEARCH
// ----------------------------------------------------

router.get('/rides/search', async (req, res) => {
  try {
    const { college, date, vehicleType, seats, maxPrice, gender, timeRange } = req.query;
    
    // Find all active posts
    let posts = await RidePost.find({ status: 'Active' });
    
    // Get drivers detail map to filter by college & gender
    const allUsers = await User.find();
    const userMap = {};
    allUsers.forEach(u => {
      userMap[u._id] = u;
    });

    let results = [];

    for (let post of posts) {
      const driver = userMap[post.driverId];
      if (!driver) continue;

      // Filter: College
      if (college && !post.destination.toLowerCase().includes(college.toLowerCase())) continue;

      // Filter: Date ("Today" / "Tomorrow" or "YYYY-MM-DD")
      const todayStr = getLocalDateString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getLocalDateString(tomorrow);

      let matchDate = post.rideDate;
      if (date === 'Today' && matchDate !== todayStr) continue;
      if (date === 'Tomorrow' && matchDate !== tomorrowStr) continue;
      if (date && date !== 'Today' && date !== 'Tomorrow' && date !== 'Any' && matchDate !== date) continue;

      // Filter: Vehicle Type
      const postVehicleType = post.vehicleType || driver.vehicleDetails.type;
      if (vehicleType && vehicleType !== 'Any' && postVehicleType !== vehicleType) continue;

      // Filter: Seats Available
      if (seats && post.seatsAvailable < Number(seats)) continue;

      // Filter: Price
      if (maxPrice && post.price > Number(maxPrice)) continue;

      // Filter: Gender Preference (must match driver preference OR passenger preference)
      if (gender && gender !== 'Any' && post.genderPreference && post.genderPreference !== 'Any' && post.genderPreference !== gender) continue;

      // Filter: Time Range (morning 6-12, afternoon 12-17, evening 17-22)
      if (timeRange && timeRange !== 'Any') {
        const [hours] = post.departureTime.split(':').map(Number);
        if (timeRange === 'Morning' && (hours < 5 || hours >= 12)) continue;
        if (timeRange === 'Afternoon' && (hours < 12 || hours >= 17)) continue;
        if (timeRange === 'Evening' && (hours < 17 || hours >= 23)) continue;
      }

      results.push({
        ...post,
        driver: {
          _id: driver._id,
          name: driver.name,
          college: driver.college,
          profilePhoto: driver.profilePhoto,
          vehicleDetails: driver.vehicleDetails,
          averageRating: driver.averageRating,
          phone: driver.phone,
          instagramId: driver.instagramId
        }
      });
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error searching rides' });
  }
});

// Update seats available live (Ride owner control)
router.put('/rides/post/:id/seats', authMiddleware, async (req, res) => {
  try {
    const { seatsAvailable } = req.body;
    const post = await RidePost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Ride post not found' });
    if (post.driverId !== req.userId) return res.status(403).json({ message: 'Unauthorized' });

    const status = Number(seatsAvailable) === 0 ? 'Completed' : post.status;

    const updated = await RidePost.findByIdAndUpdate(req.params.id, {
      seatsAvailable: Number(seatsAvailable),
      status
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating seats availability' });
  }
});

// ----------------------------------------------------
// BOOKINGS & UPI WORKFLOW
// ----------------------------------------------------

router.post('/rides/:id/join', authMiddleware, async (req, res) => {
  try {
    const { seatsBooked } = req.body;
    const ride = await RidePost.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride post not found' });

    if (ride.driverId === req.userId) {
      return res.status(400).json({ message: 'You cannot join your own ride!' });
    }

    if (ride.seatsAvailable < Number(seatsBooked)) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    // Create a pending booking
    const booking = await Booking.create({
      riderId: req.userId,
      rideId: req.params.id,
      seatsBooked: Number(seatsBooked),
      paymentStatus: 'Pending',
      paymentDetails: {
        upiId: '',
        transactionId: ''
      },
      status: 'Pending'
    });

    res.status(201).json({
      message: 'Join request sent. Please wait for ride owner to accept and complete fuel sharing.',
      booking
    });
  } catch (err) {
    res.status(500).json({ message: 'Error joining ride' });
  }
});

// View pending requests (for ride owners) & bookings (for passengers)
router.get('/bookings/requests', authMiddleware, async (req, res) => {
  try {
    const allBookings = await Booking.find();
    const allPosts = await RidePost.find();
    const allUsers = await User.find();

    const userMap = {};
    allUsers.forEach(u => { userMap[u._id] = u; });

    const postsMap = {};
    allPosts.forEach(p => { postsMap[p._id] = p; });

    const requests = []; // rides I host that people want to join
    const myBookings = []; // rides I want to join hosted by others

    for (const b of allBookings) {
      const ride = postsMap[b.rideId];
      if (!ride) continue;

      const rider = userMap[b.riderId];
      const driver = userMap[ride.driverId];

      if (ride.driverId === req.userId) {
        requests.push({
          ...b,
          ride,
          rider: rider ? {
            _id: rider._id,
            name: rider.name,
            college: rider.college,
            profilePhoto: rider.profilePhoto,
            phone: rider.phone,
            averageRating: rider.averageRating
          } : null
        });
      }

      if (b.riderId === req.userId) {
        myBookings.push({
          ...b,
          ride,
          driver: driver ? {
            _id: driver._id,
            name: driver.name,
            college: driver.college,
            profilePhoto: driver.profilePhoto,
            phone: driver.phone,
            averageRating: driver.averageRating,
            vehicleDetails: driver.vehicleDetails
          } : null
        });
      }
    }

    res.json({ requests, myBookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving bookings' });
  }
});

// Update booking request status (Accept / Reject)
router.put('/bookings/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // 'Accepted' | 'Rejected' | 'Cancelled'
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const ride = await RidePost.findById(booking.rideId);
    if (!ride) return res.status(404).json({ message: 'Ride post not found' });

    if (ride.driverId !== req.userId && booking.riderId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }

    // Apply seats deduction on Accept
    if (status === 'Accepted' && booking.status !== 'Accepted') {
      if (ride.seatsAvailable < booking.seatsBooked) {
        return res.status(400).json({ message: 'Not enough seats available anymore' });
      }

      const newSeats = ride.seatsAvailable - booking.seatsBooked;
      await RidePost.findByIdAndUpdate(ride._id, {
        seatsAvailable: newSeats,
        status: newSeats === 0 ? 'Completed' : ride.status,
        $push: {
          joinedRiders: {
            riderId: booking.riderId,
            bookingId: booking._id,
            seatsBooked: booking.seatsBooked
          }
        }
      });

      // Credit mock savings to driver
      const driver = await User.findById(ride.driverId);
      const fuelCredits = (booking.seatsBooked * ride.price) / 100; // rough estimation (1L = ₹100)
      await User.findByIdAndUpdate(ride.driverId, {
        savedFuelEstimate: Number((driver.savedFuelEstimate + fuelCredits).toFixed(1))
      });
    }

    // Handle Cancellation / Rejection seats return
    if (status === 'Cancelled' && booking.status === 'Accepted') {
      await RidePost.findByIdAndUpdate(ride._id, {
        seatsAvailable: ride.seatsAvailable + booking.seatsBooked,
        status: 'Active', // reactive if full
        $pull: { joinedRiders: { bookingId: booking._id } }
      });
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, { status });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating booking status' });
  }
});

// Update booking UPI Payment details
router.put('/bookings/:id/payment', authMiddleware, async (req, res) => {
  try {
    const { upiId, transactionId } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const updated = await Booking.findByIdAndUpdate(req.params.id, {
      paymentStatus: 'Paid',
      paymentDetails: {
        upiId,
        transactionId
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error submitting payment details' });
  }
});

// Get user rides dashboard stats
router.get('/rides/my-rides', authMiddleware, async (req, res) => {
  try {
    const hostedRides = await RidePost.find({ driverId: req.userId });
    res.json({ hostedRides });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving your rides' });
  }
});

// ----------------------------------------------------
// CHAT & CALL SYSTEMS
// ----------------------------------------------------

router.get('/chats', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find();
    // Filter chats where user is sender or receiver
    const rooms = {};
    const allUsers = await User.find();
    const userMap = {};
    allUsers.forEach(u => { userMap[u._id] = u; });

    for (const msg of messages) {
      if (msg.senderId === req.userId || msg.receiverId === req.userId) {
        const partnerId = msg.senderId === req.userId ? msg.receiverId : msg.senderId;
        const partner = userMap[partnerId];
        if (!partner) continue;

        if (!rooms[partnerId] || new Date(msg.createdAt) > new Date(rooms[partnerId].lastMessageTime)) {
          rooms[partnerId] = {
            partnerId,
            partnerName: partner.name,
            partnerPhoto: partner.profilePhoto,
            partnerPhone: partner.phone, // only visible if ride accepted (handled client side)
            lastMessage: msg.text,
            lastMessageTime: msg.createdAt,
            isSeen: msg.senderId === req.userId ? true : msg.isSeen
          };
        }
      }
    }

    res.json(Object.values(rooms).sort((a,b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving chats list' });
  }
});

router.get('/chats/:partnerId', authMiddleware, async (req, res) => {
  try {
    const pId = req.params.partnerId;
    const cId1 = `${req.userId}_${pId}`;
    const cId2 = `${pId}_${req.userId}`;

    // Mark messages as read
    const allMessages = await Message.find();
    for (const msg of allMessages) {
      if (msg.senderId === pId && msg.receiverId === req.userId && !msg.isSeen) {
        await Message.findByIdAndUpdate(msg._id, { isSeen: true });
      }
    }

    const messages = await Message.find();
    const chatMsgs = messages.filter(m => m.chatId === cId1 || m.chatId === cId2)
      .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json(chatMsgs);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving chat messages' });
  }
});

router.post('/chats/message', authMiddleware, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text) {
      return res.status(400).json({ message: 'Receiver and text required' });
    }

    const chatId = [req.userId, receiverId].sort().join('_');
    const msg = await Message.create({
      chatId,
      senderId: req.userId,
      receiverId,
      text,
      isSeen: false
    });

    // Note: real Socket.io triggers are broadcasted inside server.js event handlers.
    // REST fallback will return the created message.
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Error sending message' });
  }
});

// ----------------------------------------------------
// MANUAL SCHEDULER TRIGGER (Demo Helper)
// ----------------------------------------------------
router.post('/scheduler/trigger', authMiddleware, async (req, res) => {
  try {
    const { dateStr } = req.body; // "YYYY-MM-DD"
    const target = dateStr || getLocalDateString();
    const summary = await runScheduler(target);
    res.json({
      message: `Scheduler ran successfully for date ${target}`,
      summary
    });
  } catch (err) {
    res.status(500).json({ message: 'Scheduler run failed', error: err.message });
  }
});

// ----------------------------------------------------
// ADMIN SYSTEM CONTROLS
// ----------------------------------------------------

router.get('/admin/users', authMiddleware, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    // Simple demo admin check: any user email containing 'admin' or just allow for display
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Admin list retrieval failed' });
  }
});

router.put('/admin/users/:id/verify', authMiddleware, async (req, res) => {
  try {
    const { isVerified } = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, { isVerified });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user verification' });
  }
});

router.put('/admin/users/:id/ban', authMiddleware, async (req, res) => {
  try {
    const { isBanned } = req.body;
    const updated = await User.findByIdAndUpdate(req.params.id, { isBanned });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user suspension status' });
  }
});

module.exports = router;
