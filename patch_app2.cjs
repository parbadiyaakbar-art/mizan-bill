const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /supabase\.auth\.getSession\(\)\.then\(\(\{\s*data:\s*\{\s*session\s*\}\s*\}\)\s*=>\s*\{[\s\S]*?setLoading\(false\);\n\s*\}\);/;

const replacement = `supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboarding(session.user);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Supabase connection error:", err);
      setLoading(false);
    });`;

if(regex.test(app)) {
  fs.writeFileSync('src/App.tsx', app.replace(regex, replacement));
} else {
  console.log("Regex didn't match");
}
