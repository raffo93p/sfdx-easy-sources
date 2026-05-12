// Increase the max listeners limit to avoid MaxListenersExceededWarning
// when running many oclif commands in sequence within the same test process.
process.setMaxListeners(100);
