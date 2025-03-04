/**
 * Enhanced logger utility for debugging
 */
const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[INFO][${timestamp}] ${message}`);
    if (data) console.log(data);
  },
  
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`\n[ERROR][${timestamp}] ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`${error.message}`);
        console.error(error.stack);
      } else {
        console.error(error);
      }
    }
  },
  
  transaction: (stage, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`\n[TRANSACTION][${timestamp}][${stage}]`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }
};

module.exports = logger;
