const fs = require('fs');
let login = fs.readFileSync('src/views/Login.tsx', 'utf8');
login = login.replace(/import React from 'react';/, "import React, { FormEvent } from 'react';");
login = login.replace(/e: React\.FormEvent/g, 'e: FormEvent');
fs.writeFileSync('src/views/Login.tsx', login);
