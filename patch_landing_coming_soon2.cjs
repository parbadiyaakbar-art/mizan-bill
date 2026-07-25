const fs = require('fs');
let content = fs.readFileSync('src/views/LandingPage.tsx', 'utf8');

const regex = /(<div className="mt-32">[\s\S]*?<h3 className="text-3xl md:text-4xl font-bold mt-4">Coming Soon to Mizan Bill<\/h3>[\s\S]*?<\/div>\s*<\/div>)/;
content = content.replace(regex, '{adminConfig?.branding?.showComingSoon !== false && (\n            $1\n          )}');

fs.writeFileSync('src/views/LandingPage.tsx', content);
console.log('LandingPage updated for Coming Soon toggle');
