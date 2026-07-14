import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * SecurityService
 * Handles proactive threat detection logging and security monitoring.
 */

// Basic client-side rate limiting to prevent UI-level spamming
const requestTracker: Record<string, number[]> = {};
const RATE_LIMIT_THRESHOLD = 60; // 60 requests
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export const checkRateLimit = (action: string): boolean => {
  const now = Date.now();
  if (!requestTracker[action]) {
    requestTracker[action] = [];
  }

  // Clear old requests
  requestTracker[action] = requestTracker[action].filter(time => now - time < RATE_LIMIT_WINDOW);

  if (requestTracker[action].length >= RATE_LIMIT_THRESHOLD) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { action, count: requestTracker[action].length });
    return false;
  }

  requestTracker[action].push(now);
  return true;
};

/**
 * Logs suspicious activities or behavioral anomalies to Firestore for monitoring.
 * In a production environment, this should also trigger Cloud Alerts.
 */
export const logSecurityEvent = async (type: string, details: any = {}) => {
  try {
    await addDoc(collection(db, 'security_alerts'), {
      type,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      url: window.location.href
    });
    
    // Console warning for development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[SECURITY ALERT] ${type}:`, details);
    }
  } catch (err) {
    console.error('Failed to log security event:', err);
  }
};

/**
 * Validates data patterns to prevent common injection or malformed input attempts.
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  // Basic sanitization: remove potential script tags and excessive special characters
  return input
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
    .replace(/[<>]/g, '')
    .trim();
};
