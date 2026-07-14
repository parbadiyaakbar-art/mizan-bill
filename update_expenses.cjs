const fs = require('fs');
let code = fs.readFileSync('src/views/ShopExpenses.tsx', 'utf8');

code = code.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';\nimport { auth } from '../lib/firebase';\nimport * as db from '../services/FirebaseService';");

code = code.replace(/const \[expenses, setExpenses\] = useState\(\[[\s\S]*?\]\);/, `const [expenses, setExpenses] = useState<any[]>([]);\n\n  const fetchExpenses = async () => {\n    const user = auth.currentUser;\n    if (!user) return;\n    try {\n      const data = await db.getShopExpenses(user.uid);\n      setExpenses(data);\n    } catch (e) { console.error(e); }\n  };\n\n  useEffect(() => { fetchExpenses(); }, []);`);

code = code.replace(/const handleSave = \(\) => \{[\s\S]*?setNewExpense/, `const handleSave = async () => {\n    if (!newExpense.name || !newExpense.amount) return;\n    const user = auth.currentUser;\n    if (!user) return;\n    await db.saveShopExpense(user.uid, {\n      date: newExpense.date,\n      category: newExpense.category,\n      name: newExpense.name,\n      amount: parseFloat(newExpense.amount),\n      payment_mode: newExpense.mode,\n    });\n    setIsCreating(false);\n    fetchExpenses();\n    setNewExpense`);

code = code.replace(/<td className="px-6 py-4">{expense.mode}<\/td>/g, `<td className="px-6 py-4">{expense.payment_mode || expense.mode}</td>`);

fs.writeFileSync('src/views/ShopExpenses.tsx', code);
