const fs = require('fs');
let content = fs.readFileSync('src/views/LandingPage.tsx', 'utf8');

const regex = /(<div className="mt-32 max-w-6xl mx-auto px-6" id="coming-soon">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>)/;
content = content.replace(regex, '{adminConfig?.branding?.showComingSoon !== false && (\n            $1\n          )}');

fs.writeFileSync('src/views/LandingPage.tsx', content);
console.log('LandingPage updated for Coming Soon toggle');
