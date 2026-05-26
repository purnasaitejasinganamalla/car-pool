-- CampusRide Supabase (PostgreSQL) Database Schema
-- Run these statements in the Supabase SQL Editor to initialize the database tables.

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS "messages";
DROP TABLE IF EXISTS "bookings";
DROP TABLE IF EXISTS "rideposts";
DROP TABLE IF EXISTS "rideschedules";
DROP TABLE IF EXISTS "users";

-- 1. Users Table
CREATE TABLE "users" (
    "_id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT DEFAULT '',
    "instagramId" TEXT DEFAULT '',
    "profilePhoto" TEXT DEFAULT '',
    "vehicleDetails" JSONB DEFAULT '{"type": "None", "model": "", "number": ""}',
    "isVerified" BOOLEAN DEFAULT false,
    "isBanned" BOOLEAN DEFAULT false,
    "emergencyContact" TEXT DEFAULT '',
    "ratings" JSONB DEFAULT '[]',
    "averageRating" NUMERIC DEFAULT 5.0,
    "savedFuelEstimate" NUMERIC DEFAULT 0.0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ride Schedules Table
CREATE TABLE "rideschedules" (
    "_id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pickup" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "landmark" TEXT DEFAULT '',
    "routeDescription" TEXT DEFAULT '',
    "time" TEXT NOT NULL,
    "repeatType" TEXT NOT NULL,
    "selectedDays" JSONB DEFAULT '[]',
    "selectedDates" JSONB DEFAULT '[]',
    "excludedDates" JSONB DEFAULT '[]',
    "seats" INTEGER NOT NULL,
    "price" NUMERIC NOT NULL,
    "genderPreference" TEXT DEFAULT 'Any',
    "phone" TEXT DEFAULT '',
    "instagramId" TEXT DEFAULT '',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES "users"("_id") ON DELETE CASCADE
);

-- 3. Ride Posts Table
CREATE TABLE "rideposts" (
    "_id" TEXT PRIMARY KEY,
    "scheduleId" TEXT DEFAULT NULL,
    "driverId" TEXT NOT NULL,
    "rideDate" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "pickup" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "seatsAvailable" INTEGER NOT NULL,
    "originalSeats" INTEGER NOT NULL,
    "price" NUMERIC NOT NULL,
    "status" TEXT DEFAULT 'Active',
    "overrideTime" TEXT DEFAULT NULL,
    "phone" TEXT DEFAULT '',
    "instagramId" TEXT DEFAULT '',
    "joinedRiders" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_driver FOREIGN KEY ("driverId") REFERENCES "users"("_id") ON DELETE CASCADE
);

-- 4. Bookings Table
CREATE TABLE "bookings" (
    "_id" TEXT PRIMARY KEY,
    "riderId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "seatsBooked" INTEGER NOT NULL,
    "paymentStatus" TEXT DEFAULT 'Pending',
    "paymentDetails" JSONB DEFAULT '{"upiId": "", "transactionId": ""}',
    "status" TEXT DEFAULT 'Pending',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rider FOREIGN KEY ("riderId") REFERENCES "users"("_id") ON DELETE CASCADE,
    CONSTRAINT fk_ride FOREIGN KEY ("rideId") REFERENCES "rideposts"("_id") ON DELETE CASCADE
);

-- 5. Messages Table (Retained for schema compatibility, though in-app chat is disabled)
CREATE TABLE "messages" (
    "_id" TEXT PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isSeen" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disable Row-Level Security (RLS) on all tables to allow anonymous REST CRUD operations
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "rideschedules" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "rideposts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" DISABLE ROW LEVEL SECURITY;
