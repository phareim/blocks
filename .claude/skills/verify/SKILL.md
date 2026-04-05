---
name: verify
description: Start the dev server, verify it responds correctly, then stop it. Use to check the game works after changes.
---

Verify the Block Blast game is working:

1. Kill any existing server: `pkill -f "node server.js" || true`
2. Start the server in background: `node server.js &`
3. Wait 1 second for startup
4. Fetch `http://localhost:3000` and check:
   - Response status is 200
   - HTML contains the game board markup
5. Kill the server: `pkill -f "node server.js"`
6. Report pass/fail with any errors found
