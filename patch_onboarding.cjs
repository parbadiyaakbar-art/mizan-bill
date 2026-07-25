const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace handleOnboardingComplete to not await saveBusinessSettings and getGlobalConfig
content = content.replace(
  /const globalConfig = await getGlobalConfig\(\);\s*const trialDays = globalConfig\.trialDays \|\| 15;\s*const expiryDate = new Date\(\);\s*expiryDate\.setDate\(expiryDate\.getDate\(\) \+ trialDays\);/,
  `// Optimistic update
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 15);
      getGlobalConfig().then(config => {
        const tDays = config?.trialDays || 15;
        if (tDays !== 15) {
          const newExp = new Date();
          newExp.setDate(newExp.getDate() + tDays);
          saveBusinessSettings(user.shopId, { expiryDate: newExp.toISOString() });
        }
      }).catch(() => {});`
);

content = content.replace(
  /await saveBusinessSettings\(user\.shopId, settingsData\);/,
  `saveBusinessSettings(user.shopId, settingsData).catch(e => console.error(e));`
);

// Also set default view to sales-new
content = content.replace(/setCurrentView\('dashboard'\);/g, `setCurrentView('sales-new');`);

// Wait, we still need dashboard available, maybe just in login/onboarding success:
// But the replace will replace ALL setCurrentView('dashboard'). 
fs.writeFileSync('src/App.tsx', content);
