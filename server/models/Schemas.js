const mongoose = require('mongoose');
const { getModel } = require('../config/db');

// 1. User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  college: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, default: '' },
  instagramId: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  vehicleDetails: {
    type: { type: String, enum: ['Bike', 'Car', 'None'], default: 'None' },
    model: { type: String, default: '' },
    number: { type: String, default: '' }
  },
  isVerified: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  emergencyContact: { type: String, default: '' },
  ratings: [{
    reviewerId: String,
    rating: Number,
    review: String,
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 5 },
  savedFuelEstimate: { type: Number, default: 0 }
}, { timestamps: true });

// 2. Ride Schedule Schema (Advanced Scheduler)
const RideScheduleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  pickup: { type: String, required: true },
  destination: { type: String, required: true },
  landmark: { type: String, default: '' },
  routeDescription: { type: String, default: '' },
  time: { type: String, required: true }, // "HH:MM"
  repeatType: { type: String, enum: ['Today', 'Tomorrow', 'EveryDay', 'Weekly', 'Calendar'], required: true },
  selectedDays: [{ type: Number }], // 0-6 (Sunday-Saturday) for Weekly
  selectedDates: [{ type: String }], // ["YYYY-MM-DD"] for Calendar selection
  excludedDates: [{ type: String }], // ["YYYY-MM-DD"] holidays/exams to skip
  seats: { type: Number, required: true },
  price: { type: Number, required: true }, // fuel sharing money
  genderPreference: { type: String, enum: ['Any', 'Male', 'Female'], default: 'Any' },
  phone: { type: String, default: '' },
  instagramId: { type: String, default: '' },
  vehicleType: { type: String, enum: ['Bike', 'Car', 'None'], default: 'Car' },
  vehicleModel: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// 3. Ride Post Schema (Live Ride instances)
const RidePostSchema = new mongoose.Schema({
  scheduleId: { type: String, default: null }, // Null if created as an ad-hoc one-off today/tomorrow
  driverId: { type: String, required: true },
  rideDate: { type: String, required: true }, // "YYYY-MM-DD"
  departureTime: { type: String, required: true }, // "HH:MM"
  pickup: { type: String, required: true },
  destination: { type: String, required: true },
  seatsAvailable: { type: Number, required: true },
  originalSeats: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Active', 'Completed', 'Cancelled'], default: 'Active' },
  overrideTime: { type: String, default: null }, // To edit today/tomorrow leave time only
  phone: { type: String, default: '' },
  instagramId: { type: String, default: '' },
  vehicleType: { type: String, enum: ['Bike', 'Car', 'None'], default: 'Car' },
  vehicleModel: { type: String, default: '' },
  joinedRiders: [{
    riderId: String,
    bookingId: String,
    seatsBooked: Number
  }]
}, { timestamps: true });

// 4. Booking Schema
const BookingSchema = new mongoose.Schema({
  riderId: { type: String, required: true },
  rideId: { type: String, required: true },
  seatsBooked: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paymentDetails: {
    upiId: String,
    transactionId: String
  },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

// 5. Message Schema
const MessageSchema = new mongoose.Schema({
  chatId: { type: String, required: true }, // "user1_user2"
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  text: { type: String, required: true },
  isSeen: { type: Boolean, default: false }
}, { timestamps: true });

// Register mongoose models if not using mock
if (mongoose.models.User) {
  // Avoid recompilation error
} else {
  mongoose.model('User', UserSchema);
  mongoose.model('RideSchedule', RideScheduleSchema);
  mongoose.model('RidePost', RidePostSchema);
  mongoose.model('Booking', BookingSchema);
  mongoose.model('Message', MessageSchema);
}

// Export wrapped models
module.exports = {
  User: getModel('User', UserSchema),
  RideSchedule: getModel('RideSchedule', RideScheduleSchema),
  RidePost: getModel('RidePost', RidePostSchema),
  Booking: getModel('Booking', BookingSchema),
  Message: getModel('Message', MessageSchema)
};
