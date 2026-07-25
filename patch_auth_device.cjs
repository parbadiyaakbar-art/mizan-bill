const fs = require('fs');
let content = fs.readFileSync('src/services/AuthService.ts', 'utf8');

// Ensure we import saveUserProfile
if (!content.includes('saveUserProfile')) {
  content = content.replace(/import \{ getUserProfile \} from '\.\/FirebaseService';/, "import { getUserProfile, saveUserProfile } from './FirebaseService';\nimport { isNative } from '../utils/platform';");
}

// Ensure platform is imported
if (!content.includes('isNative')) {
    content = content.replace(/import \{ getUserProfile, saveUserProfile \} from '\.\/FirebaseService';/, "import { getUserProfile, saveUserProfile } from './FirebaseService';\nimport { isNative } from '../utils/platform';");
}


// Add a helper function to record user login details
const recordLogin = `
const recordLogin = async (firebaseUser: any, role: string, shopId: string) => {
  try {
    const deviceType = isNative() ? 'mobile' : 'desktop'; // Or more specific detection
    const profile = {
      email: firebaseUser.email || '',
      role: role,
      shopId: shopId,
      deviceType: deviceType,
      lastLogin: new Date().toISOString()
    };
    await saveUserProfile(firebaseUser.uid, profile);
  } catch(e) {
    console.error('Failed to record login', e);
  }
};
`;

if (!content.includes('const recordLogin')) {
  content = content.replace(/export const subscribeToAuth/, recordLogin + '\nexport const subscribeToAuth');
}

// Add recordLogin to login methods
content = content.replace(/return \{\n\s*id: firebaseUser.uid,/g, 'recordLogin(firebaseUser, "Owner", firebaseUser.uid);\n  return {\n    id: firebaseUser.uid,');

// Same for register
content = content.replace(/return \{\n\s*id: userCredential.user.uid,/g, 'recordLogin(userCredential.user, "Owner", userCredential.user.uid);\n  return {\n    id: userCredential.user.uid,');

fs.writeFileSync('src/services/AuthService.ts', content);
console.log('AuthService patched for deviceType logging');
