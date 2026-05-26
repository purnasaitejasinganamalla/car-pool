/**
 * Calculates YYYY-MM-DD date string in the local system timezone.
 * Enforces local date mapping instead of falling back to UTC.
 */
const getLocalDateString = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

module.exports = {
  getLocalDateString
};
