const fs = require('fs');
let content = fs.readFileSync('src/views/Purchases.tsx', 'utf8');

content = content.replace(/<button className="text-zinc-500 hover:text-indigo-400 transition-colors ml-2"><MoreVertical size=\{18\} \/><\/button>/,
    `<button onClick={() => handleEdit(inv)} className="text-zinc-400 hover:text-indigo-400 transition-colors ml-2" title="Edit"><Edit size={16} /></button>
    <button onClick={() => handleDelete(inv.id)} className="text-zinc-400 hover:text-rose-400 transition-colors ml-2" title="Delete"><Trash2 size={16} /></button>`);

fs.writeFileSync('src/views/Purchases.tsx', content);
