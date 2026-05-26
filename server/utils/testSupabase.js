// Script to verify Supabase connection and CRUD operations using custom db.js
const fs = require('fs');
const path = require('path');

// Manually load .env variables to bypass dotenv dependency
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        const value = trimmed.substring(index + 1).trim();
        process.env[key] = value;
      }
    });
    console.log('[Test Setup] Environment variables loaded manually from:', envPath);
  }
} catch (e) {
  console.warn('[Test Setup] Failed to read .env file:', e.message);
}

const { connectDB, getModel } = require('../config/db');

async function testSupabase() {
  console.log('--- CAMPUSRIDE SUPABASE CONNECTION TEST ---');
  console.log('Supabase URL:', process.env.SUPABASE_URL);

  // Initialize DB connection
  await connectDB();

  // Get User Model
  const User = getModel('User');

  // Test ID
  const testId = 'test_user_' + Math.random().toString(36).substring(2, 6);

  try {
    // 1. Create User
    console.log('\n[TEST 1] Creating a test user...');
    const newUser = await User.create({
      _id: testId,
      name: 'Supabase Test Student',
      college: 'PES University',
      email: `${testId}@pes.edu`,
      phone: '+91 90000 00000',
      password: 'testpassword',
      instagramId: '@test_student',
      profilePhoto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=test',
      vehicleDetails: { type: 'Car', model: 'Tesla Model 3', number: 'KA-01-XX-9999' },
      isVerified: true,
      isBanned: false
    });
    console.log('SUCCESS: Created test user with ID:', newUser._id);

    // 2. Find User
    console.log('\n[TEST 2] Finding the test user by ID...');
    const foundUser = await User.findById(testId);
    if (!foundUser) {
      throw new Error('Test user not found in database!');
    }
    console.log('SUCCESS: Found user:', foundUser.name, 'studying at', foundUser.college);

    // 3. Update User (Testing $push and regular updates)
    console.log('\n[TEST 3] Updating the test user profile & appending a rating (Mongoose style)...');
    
    // Regular update
    await User.findByIdAndUpdate(testId, { emergencyContact: '+91 911' });

    // Mongoose-style array push
    const ratingObj = { reviewerId: 'u2', rating: 5, review: 'Super fast test!' };
    const updatedUser = await User.findByIdAndUpdate(testId, {
      $push: { ratings: ratingObj }
    });

    console.log('SUCCESS: Updated user emergency contact:', updatedUser.emergencyContact);
    console.log('SUCCESS: User Ratings array length:', updatedUser.ratings.length, 'entries');

    // 4. Find all users in college
    console.log('\n[TEST 4] Searching for users in PES University...');
    const pesStudents = await User.find({ college: 'PES University' });
    console.log(`SUCCESS: Found ${pesStudents.length} user(s) in PES University.`);

    // 5. Delete User
    console.log('\n[TEST 5] Deleting the test user...');
    const delResult = await User.deleteOne({ _id: testId });
    console.log('SUCCESS: Deleted test user record. Results:', delResult);

    console.log('\n=========================================');
    console.log('ALL SUPABASE CRUD TEST RUNS COMPLETED SUCCESSFULLY!');
    console.log('=========================================');
  } catch (err) {
    console.error('\n=========================================');
    console.error('TEST FAIL: An error occurred during verification!');
    console.error(err);
    console.error('=========================================');
    process.exit(1);
  }
}

testSupabase();
