function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function toRelativeUnix(date) {
  return Math.floor(date.getTime() / 1000);
}

module.exports = { addMinutes, toRelativeUnix };
