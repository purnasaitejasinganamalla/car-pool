const { RideSchedule, RidePost } = require('../models/Schemas');
const { getLocalDateString } = require('../utils/dateHelper');

/**
 * Parses a date string into a Date object correctly using local timezone.
 */
const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Core Scheduler Logic: Examines all active schedules and posts active rides for the target date.
 * Also expires past rides.
 */
const runScheduler = async (targetDateStr) => {
  console.log(`[Scheduler] Starting scheduler processing for target date: ${targetDateStr}`);
  
  try {
    const activeSchedules = await RideSchedule.find({ isActive: true });
    console.log(`[Scheduler] Found ${activeSchedules.length} active schedules.`);

    const targetDate = parseLocalDate(targetDateStr);
    const targetDayOfWeek = targetDate.getDay(); // 0 (Sun) to 6 (Sat)

    let createdCount = 0;
    let skippedCount = 0;

    for (const schedule of activeSchedules) {
      let shouldPost = false;

      // 1. Check if the date is explicitly excluded (holidays/exams)
      if (schedule.excludedDates && schedule.excludedDates.includes(targetDateStr)) {
        console.log(`[Scheduler] Schedule ${schedule._id} excluded for date ${targetDateStr}. Skipping.`);
        skippedCount++;
        continue;
      }

      // 2. Evaluate recurrence type
      switch (schedule.repeatType) {
        case 'Today':
          // One-off for the day of creation (handled instantly during POST, but check if match)
          const creationDate = getLocalDateString(new Date(schedule.createdAt));
          shouldPost = (creationDate === targetDateStr);
          break;

        case 'Tomorrow':
          // One-off tomorrow (check if target date is 1 day after creation)
          const scheduleDate = new Date(schedule.createdAt);
          scheduleDate.setDate(scheduleDate.getDate() + 1);
          const tomorrowStr = getLocalDateString(scheduleDate);
          shouldPost = (tomorrowStr === targetDateStr);
          break;

        case 'EveryDay':
          shouldPost = true;
          break;

        case 'Weekly':
          // selectedDays holds numbers 0-6
          shouldPost = schedule.selectedDays.includes(targetDayOfWeek);
          break;

        case 'Calendar':
          // selectedDates holds list of specific days ["YYYY-MM-DD"]
          shouldPost = schedule.selectedDates.includes(targetDateStr);
          break;

        default:
          shouldPost = false;
      }

      if (shouldPost) {
        // Check if a post already exists for this schedule on this date
        const existingPost = await RidePost.findOne({
          scheduleId: schedule._id,
          rideDate: targetDateStr
        });

        if (!existingPost) {
          // Check if there is a custom time override for this date
          // If not, default to the schedule time
          await RidePost.create({
            scheduleId: schedule._id,
            driverId: schedule.userId,
            rideDate: targetDateStr,
            departureTime: schedule.time,
            pickup: schedule.pickup,
            destination: schedule.destination,
            seatsAvailable: schedule.seats,
            originalSeats: schedule.seats,
            price: schedule.price,
            phone: schedule.phone || '',
            instagramId: schedule.instagramId || '',
            vehicleType: schedule.vehicleType || 'Car',
            vehicleModel: schedule.vehicleModel || '',
            status: 'Active',
            joinedRiders: []
          });
          console.log(`[Scheduler] Generated RidePost for Driver ${schedule.userId} from Schedule ${schedule._id}`);
          createdCount++;
        } else {
          console.log(`[Scheduler] RidePost for Schedule ${schedule._id} on ${targetDateStr} already exists. Skipping.`);
        }
      }
    }

    // 3. Expire past rides
    // Find all Active posts where the ride date and time have passed.
    const now = new Date();
    const activePosts = await RidePost.find({ status: 'Active' });
    let expiredCount = 0;

    for (const post of activePosts) {
      const [hours, minutes] = post.departureTime.split(':').map(Number);
      const postDate = parseLocalDate(post.rideDate);
      postDate.setHours(hours, minutes, 0, 0);

      if (postDate < now) {
        await RidePost.findByIdAndUpdate(post._id, { status: 'Completed' });
        console.log(`[Scheduler] Completed/Expired RidePost ${post._id} for driver ${post.driverId}`);
        expiredCount++;
      }
    }

    console.log(`[Scheduler] Finished run. Created: ${createdCount}, Skipped Exclusions: ${skippedCount}, Expired: ${expiredCount}`);
    return { createdCount, skippedCount, expiredCount };

  } catch (error) {
    console.error('[Scheduler] Error in ride scheduler run:', error);
    throw error;
  }
};

module.exports = {
  runScheduler
};
