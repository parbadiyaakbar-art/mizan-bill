import React from 'react';
import { Shield, FileText, AlertTriangle, Database, Scale, Lock, RefreshCw } from 'lucide-react';

export const LEGAL_CONTENT = {
  terms: {
    title: "Terms of Service (Beta Phase)",
    sections: [
      {
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        heading: "1. Beta Stage & Service Availability",
        text: "The application is currently in its Beta Testing Phase. The service is provided on an 'As-Is' and 'As-Available' basis. We reserve the absolute right to interrupt, halt, or suspend the service for maintenance, system updates, or technical fixes for extended periods without prior notice. The platform and its owners shall not be held liable for any business interruption, data inaccuracy, financial losses, or operational delays."
      },
      {
        icon: <Database className="w-5 h-5 text-blue-500" />,
        heading: "2. Mandatory User Data Backup",
        text: "It is the sole and absolute responsibility of each user to manually download and maintain local backups of their billing, sales, purchases, and inventory logs regularly. In the event of server failures, cyber-attacks, or data loss, our liability is strictly limited. Users must rely entirely on their own downloaded backup files."
      },
      {
        icon: <RefreshCw className="w-5 h-5 text-green-500" />,
        heading: "3. Database & Hosting Migration",
        text: "Users acknowledge that the platform may undergo infrastructure migrations (e.g., moving from Firebase to custom hosting). We are not liable for temporary data sync issues or inadvertent data loss occurring during such backend migrations."
      },
      {
        icon: <Shield className="w-5 h-5 text-purple-500" />,
        heading: "4. Right to Modify & Data Resets",
        text: "We reserve the right to modify, replace, or remove any features at any time. During major upgrades, database structures might change, occasionally requiring system resets or data clearing. Users must keep secondary records outside the app."
      },
      {
        icon: <Lock className="w-5 h-5 text-red-500" />,
        heading: "5. Intellectual Property & Termination",
        text: "All source code, designs, and UI/UX layouts are exclusive property of the platform owners. We reserve the right to suspend or terminate accounts for non-payment, fraudulent practices, or attempts to reverse-engineer the application."
      },
      {
        icon: <Scale className="w-5 h-5 text-zinc-400" />,
        heading: "6. Governing Law",
        text: "Any legal disputes shall be subject exclusively to the local courts of Palanpur, Gujarat, India."
      }
    ]
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        icon: <Shield className="w-5 h-5 text-green-500" />,
        heading: "1. Data Isolation",
        text: "All commercial data (Sales, Purchases, Inventory, Expenses) is strictly isolated using secure multi-tenant filtering. Your data will never be visible to any other account."
      },
      {
        icon: <Lock className="w-5 h-5 text-blue-500" />,
        heading: "2. Zero Third-Party Selling",
        text: "We enforce a strict policy against selling, renting, or trading your business metrics, transaction logs, or customer contacts to any third parties or advertisers."
      },
      {
        icon: <FileText className="w-5 h-5 text-zinc-400" />,
        heading: "3. Data Erasure",
        text: "Upon account deletion requests, all associated records will be permanently purged from our primary database servers within a standard billing cycle."
      }
    ]
  }
};
