
/**
 * Platform detection utility to distinguish between PC and Mobile environments.
 */
export const isPC = (): boolean => {
  const userAgent = navigator.userAgent.toLocaleLowerCase();
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // Also check for touch capability and screen width as a fallback
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isWideScreen = window.innerWidth > 1024;

  return !mobileRegex.test(userAgent) && (isWideScreen || !isTouchDevice);
};

export const isNative = (): boolean => {
  // If running on local machine as a file or local server (common for compiled apps)
  // or if we have a specific indicator injected by the build tool
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.protocol === 'file:';
};

export const getPlatformMode = (): 'PC_LOCAL_FIRST' | 'MOBILE_DIRECT_ONLINE' => {
  return isPC() ? 'PC_LOCAL_FIRST' : 'MOBILE_DIRECT_ONLINE';
};
