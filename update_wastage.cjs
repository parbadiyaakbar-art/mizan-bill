const fs = require('fs');
let code = fs.readFileSync('src/views/StockWastage.tsx', 'utf8');

code = code.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';\nimport { auth } from '../lib/firebase';\nimport * as db from '../services/FirebaseService';");

code = code.replace(/const \[wastages, setWastages\] = useState\(\[[\s\S]*?\]\);/, `const [wastages, setWastages] = useState<any[]>([]);\n\n  const fetchWastages = async () => {\n    const user = auth.currentUser;\n    if (!user) return;\n    try {\n      const data = await db.getStockWastages(user.uid);\n      setWastages(data);\n    } catch (e) { console.error(e); }\n  };\n\n  useEffect(() => { fetchWastages(); }, []);`);

code = code.replace(/const handleSave = \(\) => \{[\s\S]*?setNewWastage/, `const handleSave = async () => {\n    if (!newWastage.item || !newWastage.lossAmount) return;\n    const user = auth.currentUser;\n    if (!user) return;\n    await db.saveStockWastage(user.uid, {\n      date: newWastage.date,\n      item: newWastage.item,\n      reason: newWastage.reason,\n      qty: newWastage.qty,\n      lossAmount: parseFloat(newWastage.lossAmount)\n    });\n    setIsCreating(false);\n    fetchWastages();\n    setNewWastage`);

fs.writeFileSync('src/views/StockWastage.tsx', code);
