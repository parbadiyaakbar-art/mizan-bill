const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /case 'admin':\s*if \(user\.email !== 'parbadiyaakbar@gmail\.com'\) \{[\s\S]*?return <Dashboard.*?\n\s*\}\s*return <AdminPanel \/>;/g,
  "case 'admin':\n          return <AdminPanel />;"
);

// Also remove the isAdminRoute signout block so normal users don't get signed out if they know the shortcut
content = content.replace(
  /const isAdminRoute = window\.location\.pathname === '\/mizan-owner-control' \|\| window\.location\.hostname === 'admin\.mizanbill\.com';\s*if \(isAdminRoute && mappedUser\.email !== 'parbadiyaakbar@gmail\.com'\) \{[\s\S]*?return;\s*\}/,
  "// Admin route check removed to allow secret credential login for any user"
);

fs.writeFileSync('src/App.tsx', content);
console.log('Admin auth checks patched in App.tsx');
