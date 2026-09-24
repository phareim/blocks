---
name: verify
description: Start the dev server, verify it responds correctly, then stop it. Use to check the game works after changes.
---

Verify the Block Blast game is working:

Port 3000 on Sleeper belongs to `sleeper-www`, so use 3100.

1. Start the server in background: `PORT=3100 node server.js &` and note its PID (`$!`)
2. Wait 1 second for startup
3. Fetch `http://localhost:3100` and check:
   - Response status is 200
   - HTML contains the game board markup
4. Kill that PID
5. Report pass/fail with any errors found
