const { User, RideSchedule, RidePost, Booking, Message } = require('../models/Schemas');
const { connectDB, isMock } = require('../config/db');

const seed = async () => {
  console.log('[Seed] Seeding sample data to CampusRide database...');
  
  // 1. Clear existing database first
  await User.deleteMany({});
  await RideSchedule.deleteMany({});
  await RidePost.deleteMany({});
  await Booking.deleteMany({});
  await Message.deleteMany({});

  console.log('[Seed] DB cleared. Seeding fresh data...');

  // Helper date strings
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterStr = dayAfterTomorrow.toISOString().split('T')[0];

  // 2. Create sample users
  const user1 = await User.create({
    name: 'Aarav Sharma',
    college: 'IIT Bombay',
    email: 'aarav.sharma@iitb.ac.in',
    phone: '+91 98765 43210',
    instagramId: '@aarav_sharma',
    profilePhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aarav',
    vehicleDetails: {
      type: 'Car',
      model: 'Honda City (Blue)',
      number: 'MH-02-AB-1234'
    },
    isVerified: true,
    isBanned: false,
    emergencyContact: '+91 99999 88888',
    ratings: [
      { reviewerId: 'other', rating: 5, review: 'Always on time and very friendly!', createdAt: new Date() },
      { reviewerId: 'other2', rating: 4, review: 'Safe driver. Clean car.', createdAt: new Date() }
    ],
    averageRating: 4.5,
    savedFuelEstimate: 12.4
  });

  const user2 = await User.create({
    name: 'Ananya Iyer',
    college: 'IIT Bombay',
    email: 'ananya.iyer@iitb.ac.in',
    phone: '+91 91234 56789',
    instagramId: '@ananya.iyer',
    profilePhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ananya',
    vehicleDetails: {
      type: 'Bike',
      model: 'Royal Enfield Classic 350',
      number: 'MH-03-XY-9876'
    },
    isVerified: true,
    isBanned: false,
    emergencyContact: '+91 98888 77777',
    ratings: [
      { reviewerId: 'other', rating: 5, review: 'Awesome bike rider. Great chat along the way!', createdAt: new Date() }
    ],
    averageRating: 5.0,
    savedFuelEstimate: 6.2
  });

  const user3 = await User.create({
    name: 'Rohan Verma',
    college: 'IIT Bombay',
    email: 'rohan.verma@iitb.ac.in',
    phone: '+91 94444 33333',
    instagramId: '@rohan_v',
    profilePhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan',
    vehicleDetails: {
      type: 'None',
      model: '',
      number: ''
    },
    isVerified: true,
    isBanned: false,
    emergencyContact: '+91 95555 44444',
    ratings: [],
    averageRating: 5.0,
    savedFuelEstimate: 0
  });

  const user4 = await User.create({
    name: 'Sneha Patel',
    college: 'Delhi University (DU)',
    email: 'sneha.patel@du.ac.in',
    phone: '+91 93333 22222',
    instagramId: '@sneha_p',
    profilePhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sneha',
    vehicleDetails: {
      type: 'Car',
      model: 'Hyundai i20',
      number: 'DL-3C-CK-4567'
    },
    isVerified: true,
    isBanned: false,
    emergencyContact: '+91 92222 11111',
    ratings: [
      { reviewerId: 'other', rating: 4, review: 'Punctual student ride.', createdAt: new Date() }
    ],
    averageRating: 4.0,
    savedFuelEstimate: 8.5
  });

  // Admin user
  const adminUser = await User.create({
    name: 'CampusRide Admin',
    college: 'IIT Bombay',
    email: 'admin@campusride.org',
    phone: '+91 90000 00000',
    instagramId: '',
    profilePhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    vehicleDetails: { type: 'None', model: '', number: '' },
    isVerified: true,
    isBanned: false,
    emergencyContact: '',
    ratings: [],
    averageRating: 5.0,
    savedFuelEstimate: 0
  });

  console.log('[Seed] Seeding Users: Aarav (Car), Ananya (Bike), Rohan (Passenger), Sneha (Car, DU), Admin');

  // 3. Create Ride Schedules
  // Aarav (IITB) - Everyday Schedule
  const sched1 = await RideSchedule.create({
    userId: user1._id,
    pickup: 'Powai Vihar, Mumbai',
    destination: 'IIT Bombay Main Gate',
    landmark: 'Near D-Mart Powai',
    routeDescription: 'Via JVLR road and through Kendriya Vidyalaya Gate',
    time: '08:30',
    repeatType: 'EveryDay',
    selectedDays: [],
    selectedDates: [],
    excludedDates: [dayAfterStr], // skip day after tomorrow as demo exclusion
    seats: 4,
    price: 60,
    genderPreference: 'Any',
    isActive: true
  });

  // Ananya (IITB) - Weekly Mon/Wed/Fri Schedule
  const sched2 = await RideSchedule.create({
    userId: user2._id,
    pickup: 'Ghatkopar East Metro Station',
    destination: 'IIT Bombay Hill Side Gate',
    landmark: 'Ticket Counter 1',
    routeDescription: 'Via LBS Road and Gandhi Nagar flyover',
    time: '09:00',
    repeatType: 'Weekly',
    selectedDays: [1, 3, 5], // Monday, Wednesday, Friday
    selectedDates: [],
    excludedDates: [],
    seats: 1,
    price: 40,
    genderPreference: 'Female',
    isActive: true
  });

  // Sneha (DU) - Calendar-based Schedule
  const sched3 = await RideSchedule.create({
    userId: user4._id,
    pickup: 'Rajouri Garden Metro',
    destination: 'Miranda House, Delhi University',
    landmark: 'Exit Gate 2',
    routeDescription: 'Via Ring road and Mall road',
    time: '08:15',
    repeatType: 'Calendar',
    selectedDays: [],
    selectedDates: [todayStr, tomorrowStr], // explicitly selected
    excludedDates: [],
    seats: 3,
    price: 80,
    genderPreference: 'Any',
    isActive: true
  });

  console.log('[Seed] Seeding RideSchedules: Aarav (Everyday), Ananya (Mon/Wed/Fri), Sneha (Calendar-based)');

  // 4. Create Ride Posts (instances)
  // Aarav's ride today
  const post1 = await RidePost.create({
    scheduleId: sched1._id,
    driverId: user1._id,
    rideDate: todayStr,
    departureTime: '08:30',
    pickup: 'Powai Vihar, Mumbai',
    destination: 'IIT Bombay Main Gate',
    seatsAvailable: 2, // 2 seats booked (4 original)
    originalSeats: 4,
    price: 60,
    status: 'Active',
    joinedRiders: []
  });

  // Aarav's ride tomorrow (with timing override check)
  const post2 = await RidePost.create({
    scheduleId: sched1._id,
    driverId: user1._id,
    rideDate: tomorrowStr,
    departureTime: '09:00', // Override tomorrow time to 9:00 AM instead of 8:30 AM!
    pickup: 'Powai Vihar, Mumbai',
    destination: 'IIT Bombay Main Gate',
    seatsAvailable: 4,
    originalSeats: 4,
    price: 60,
    status: 'Active',
    joinedRiders: []
  });

  // Ananya's ride today
  const post3 = await RidePost.create({
    scheduleId: sched2._id,
    driverId: user2._id,
    rideDate: todayStr,
    departureTime: '09:00',
    pickup: 'Ghatkopar East Metro Station',
    destination: 'IIT Bombay Hill Side Gate',
    seatsAvailable: 1,
    originalSeats: 1,
    price: 40,
    status: 'Active',
    joinedRiders: []
  });

  // Sneha's ride today
  const post4 = await RidePost.create({
    scheduleId: sched3._id,
    driverId: user4._id,
    rideDate: todayStr,
    departureTime: '08:15',
    pickup: 'Rajouri Garden Metro',
    destination: 'Miranda House, Delhi University',
    seatsAvailable: 3,
    originalSeats: 3,
    price: 80,
    status: 'Active',
    joinedRiders: []
  });

  console.log('[Seed] Seeding RidePosts: Today and Tomorrow active posts.');

  // 5. Create Bookings
  // Rohan booked Aarav's ride for today (Accepted)
  const booking1 = await Booking.create({
    riderId: user3._id,
    rideId: post1._id,
    seatsBooked: 2,
    paymentStatus: 'Paid',
    paymentDetails: {
      upiId: 'rohan@okaxis',
      transactionId: 'TXN-CAMPUS-98271'
    },
    status: 'Accepted'
  });

  // Add rider details to Aarav's ride post 1
  await RidePost.findByIdAndUpdate(post1._id, {
    $push: {
      joinedRiders: {
        riderId: user3._id,
        bookingId: booking1._id,
        seatsBooked: 2
      }
    }
  });

  // Rohan requested Sneha's ride for today (Pending)
  const booking2 = await Booking.create({
    riderId: user3._id,
    rideId: post4._id,
    seatsBooked: 1,
    paymentStatus: 'Pending',
    paymentDetails: { upiId: '', transactionId: '' },
    status: 'Pending'
  });

  console.log('[Seed] Seeding Bookings: Rohan joined Aarav (Accepted, Paid) and Sneha (Pending)');

  // 6. Create Message histories
  const chatId = [user1._id, user3._id].sort().join('_');
  await Message.create({
    chatId,
    senderId: user3._id,
    receiverId: user1._id,
    text: 'Hey Aarav! Can I join your ride from Powai Vihar tomorrow morning?',
    isSeen: true
  });

  await Message.create({
    chatId,
    senderId: user1._id,
    receiverId: user3._id,
    text: 'Hey Rohan! Sure, I have 4 seats available. Feel free to request it.',
    isSeen: true
  });

  await Message.create({
    chatId,
    senderId: user3._id,
    receiverId: user1._id,
    text: 'Requested! Let me know when you accept so I can pay the fuel share via UPI.',
    isSeen: true
  });

  await Message.create({
    chatId,
    senderId: user1._id,
    receiverId: user3._id,
    text: 'Approved! You should see the payment QR on your dashboard now.',
    isSeen: false
  });

  console.log('[Seed] Seeding Chat History: Rohan <=> Aarav messages.');

  console.log('[Seed] Seed script execution finished successfully!');
};

// Check if running from command line directly
if (require.main === module) {
  (async () => {
    await connectDB();
    await seed();
    process.exit(0);
  })();
}

module.exports = seed;
