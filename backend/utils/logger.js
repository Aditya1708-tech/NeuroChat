import { env } from '../config/env.js';

export const logger = {
  info(msg, meta = {}) {
    console.log(JSON.stringify({ level: 'info', message: msg, time: new Date().toISOString(), ...meta }));
  },
  warn(msg, meta = {}) {
    console.warn(JSON.stringify({ level: 'warn', message: msg, time: new Date().toISOString(), ...meta }));
  },
  error(msg, meta = {}) {
    console.error(JSON.stringify({ level: 'error', message: msg, time: new Date().toISOString(), ...meta }));
  },
  dev(...args) {
    if (env.NODE_ENV !== 'production') {
      console.log('[DEV]', ...args);
    }
  },
};
