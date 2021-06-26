const dateFormatter = new Intl.DateTimeFormat('en-us', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'America/Chicago'
});

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const logWithTimestamp = (message, logLevel = 'info', ...args) => {
  console[logLevel](`[${dateFormatter.format(new Date())}] ${message}`, ...args);
};

const performAsyncWithRetries = async (fn, errFn, retryCount) => {
  for (let i = 0; i < retryCount; i++) {
    try {
      return await fn();
    } catch (err) {
      errFn(err, i);
    }
  }

  throw new Error(`Retry limit of ${retryCount} exceeded`);
};

module.exports = { sleep, logWithTimestamp, performAsyncWithRetries };
