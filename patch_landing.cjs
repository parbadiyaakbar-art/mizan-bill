const fs = require('fs');
let content = fs.readFileSync('src/views/LandingPage.tsx', 'utf8');

// Add adminConfig to props
content = content.replace(
  'interface LandingPageProps {',
  'interface LandingPageProps {\n  adminConfig?: any;'
);

content = content.replace(
  'export default function LandingPage({ onLogin, onViewReleases, onViewPrivacy, onViewTerms }: LandingPageProps) {',
  'export default function LandingPage({ onLogin, onViewReleases, onViewPrivacy, onViewTerms, adminConfig }: LandingPageProps) {'
);

// Replace logo usage
content = content.replace(
  /<img src="\/Mizan_Bill_3D_Logo.png" alt="Mizan Bill Logo"/g,
  '<img src={adminConfig?.branding?.logo || "/Mizan_Bill_3D_Logo.png"} alt="Mizan Bill Logo"'
);

// Find hero section start and add tagline
content = content.replace(
  /<h1 className="text-xl font-bold tracking-tight">Mizan Bill<\/h1>/,
  '<h1 className="text-xl font-bold tracking-tight">Mizan Bill</h1><p className="text-xs text-zinc-500 font-medium ml-4 hidden md:block border-l border-zinc-800 pl-4">{adminConfig?.branding?.tagline}</p>'
);

// Add contact info in footer
content = content.replace(
  /© 2026 Mizan Bill Software\. All rights reserved\./,
  `© 2026 Mizan Bill Software. All rights reserved.
            {adminConfig?.contact && (
              <div className="flex gap-4 mt-2">
                {adminConfig.contact.phone && <span>{adminConfig.contact.phone}</span>}
                {adminConfig.contact.email && <span>{adminConfig.contact.email}</span>}
              </div>
            )}`
);

fs.writeFileSync('src/views/LandingPage.tsx', content);
console.log('LandingPage patched');
