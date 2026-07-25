const fs = require('fs');
let content = fs.readFileSync('src/services/FirebaseService.ts', 'utf8');

// Replace setToCache(cacheKey, res) and invalidateCacheKey
content = content.replace(/setToCache\([^,]+,\s*res\);/g, '');
content = content.replace(/invalidateCacheKey\([^)]+\);/g, '');

// Wait, the cache setup is at the top
content = content.replace(/const getFromCache = [\s\S]*?const setToCache = [^\n]+\n/, '');
content = content.replace(/export const invalidateCacheKey = [\s\S]*?}\n}\n/, '');

// Fix getBusinessSettings
content = content.replace(/const cached = getFromCache\([^)]+\);\n\s*if \(cached\) return cached;/, '');
content = content.replace(/setToCache\([^,]+, settings\);/, '');

fs.writeFileSync('src/services/FirebaseService.ts', content);
