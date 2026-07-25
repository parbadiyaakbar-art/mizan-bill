const fs = require('fs');
let content = fs.readFileSync('src/views/About.tsx', 'utf8');

// Add missing imports
if (!content.includes('useState')) {
  content = content.replace(/import React from 'react';/, "import React, { useState, useEffect } from 'react';\nimport { doc, getDoc } from 'firebase/firestore';\nimport { db } from '../lib/firebase';");
}

// Add state and fetch logic inside the component
const fetchLogic = `
  const [adminConfig, setAdminConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'config', 'admin_config'));
        if (docSnap.exists()) {
          setAdminConfig(docSnap.data());
        }
      } catch (err) {
        console.error('Failed to load admin config', err);
      }
    };
    fetchConfig();
  }, []);
`;

content = content.replace(/export default function About\(\) \{/, 'export default function About() {\n' + fetchLogic);

// Replace WhatsApp handler
const whatsAppHandler = `
  const handleWhatsApp = () => {
    const defaultPhone = "919016142750";
    let phone = adminConfig?.contact?.phone || defaultPhone;
    phone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent("Hi, I need support regarding the Mizan Bill App.");
    const url = \`https://wa.me/\${phone}?text=\${message}\`;
    window.open(url, '_blank');
  };
`;

content = content.replace(/const handleWhatsApp = \(\) => \{[\s\S]*?\};/, whatsAppHandler.trim());

// Add Contact info section
const contactInfoUI = `
          {adminConfig?.contact && (
            <div className="bg-black/20 rounded-xl p-6 border border-zinc-800/50">
              <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between border-b border-zinc-800/50 pb-3">
                  <span className="text-zinc-500">Phone</span>
                  <span className="text-zinc-300 font-medium text-right">{adminConfig.contact.phone}</span>
                </div>
                <div className="flex items-start justify-between border-b border-zinc-800/50 pb-3">
                  <span className="text-zinc-500">Email</span>
                  <span className="text-zinc-300 font-medium text-right">{adminConfig.contact.email}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-zinc-500">Address</span>
                  <span className="text-zinc-300 font-medium text-right max-w-[200px]">{adminConfig.contact.address}</span>
                </div>
              </div>
            </div>
          )}
`;

content = content.replace(/(<div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-zinc-800">)/, contactInfoUI + '\n          $1');

fs.writeFileSync('src/views/About.tsx', content);
console.log('About page updated');
