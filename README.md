# Class Gauntlet

**A classroom review game where one student takes on the rest of the class, and nobody gets knocked out.**

A serverless rebuild of an [open-source EdTech-a-thon project](https://github.com/deadbeef101010/1v100-edtechathon) that needs no server: instead of a Docker container with Node, Socket.IO and SQLite, the **teacher's browser tab runs the game** and every student's device connects straight to it over WebRTC, through teacher.dev's peer-to-peer matchmaking server. Teachers can also write their own question sets in the app.

## How a game works

1. The teacher picks a question set and opens a game on the projector. The lobby shows the site, a six-digit PIN and a QR code.
2. Students join on their phones with the PIN and a nickname (up to 40).
3. A spotlight sweeps the room and lands on the **challenger** (or the teacher picks one). Everyone else is **the class**.
4. **The class answers first** on their phones. The question is hidden from the challenger and from the big screen.
5. **Then the challenger** sees the question and answers, on their phone or by tapping the big screen at the front of the room. Once per round each, they can use a lifeline:
   - **Poll the Class**: see how many in the class chose an answer.
   - **Ask Two**: one classmate who was right and one who wasn't explain out loud (+5 each).
   - **Go with the Class**: lock in the most popular answer.
6. **The reveal:** if the challenger is right, classmates who missed fall to the **Comeback Crew** (they keep answering and scoring) and the **Prize Pot** grows by 20 each. If the challenger is wrong, they lose a chance.
7. The round ends when the challenger runs out of chances (the class splits the pot), clears every question (the challenger banks the pot and classmates still standing get a bonus), or outlasts the whole class (jackpot: pot × 1.5). Then a new challenger steps up.

Inside a question the game moves itself along (timer, hand-off to the challenger, drumroll, reveal); the teacher taps **Next** between questions. The scoring rules are ported unchanged from the original (`src/lib/game/scoring.ts`), including the optional **On a Roll** rule: quick answers without a lifeline win the challenger a chance back once per round.

## Screens

| Route | Who | What |
| --- | --- | --- |
| `/` | everyone | Start or join a game |
| `/host` | teacher, on the projector | Pick a question set, then the lobby and the game itself; rules live behind the gear |
| `/join?code=482913` | students | Join, answer, use lifelines (⚡) |
| `/questions` | teacher | Question sets: write, import a file / paste from a spreadsheet, download CSV, share by link |

## Custom questions

Question sets are saved in the teacher's browser (local storage). Ways to get questions in:

- **Write them** in the editor (`/questions/edit`): 2–4 choices per question and an optional explanation shown after the reveal.
- **Import a file** or **paste cells from Google Sheets/Excel**. Files are read by [Question Commons](https://questioncommons.com) (`@teacherdotdev/question-commons`), so Kahoot and Blooket spreadsheets, Moodle (XML, GIFT, Aiken), Canvas and other QTI exports, Blackboard, Brightspace, Respondus, Word documents and our own CSVs all work. Each Question Bank in the file becomes a set.
- The simplest spreadsheet has a header row `question, A, B, C, D, answer, explanation` (D and explanation optional; `answer` is a letter or the answer's text). The original project's CSV (`set title, subject, grade, question, choices, correct, explanation`, `choices` a JSON array) imports too, one set per title.
- The game plays only multiple choice with **one** right answer, 2–4 text choices and no pictures. Every other question (true/false, several right answers, pictures, LaTeX math, more than four choices…) is left out, and the report says which and why. `src/lib/questions/import.ts` holds those rules.
- **Copy AI instructions** (in the paste panel) copies a prompt that tells an AI chat to turn a worksheet or PDF into CSV in the expected format, ready to paste back in.
- **Export all** downloads every set as one CSV (with set title, subject and grade on each row) that imports back as the same sets.
- **Share links**: the set is compressed into the part of the link after `#`, which never reaches any server. Opening the link offers to add the set.

## Architecture

```
student phones ──WebRTC data channels──▶ teacher's tab (runs the rules, saves to local storage)
        ▲
        └── peer.teacher.dev (PeerJS) introduces them; TURN relays when a
            network blocks direct connections
```

- `src/lib/game/` — the rules as plain TypeScript: `engine.ts` (commands and phases), `scoring.ts`, `views.ts` (what each screen may see: the correct answer never leaves the teacher's tab before the reveal).
- `src/lib/host.svelte.ts` — the teacher's room: registers `classgauntlet-<PIN>` on the PeerJS server, accepts students, broadcasts views, and saves the whole game after every change. Reloading the tab offers to resume, reclaims the same code, and students reconnect on their own.
- `src/lib/student.svelte.ts` — a student's link. Its seat (player id + secret) is kept in local storage, so a reload or dropped Wi-Fi puts the student back in with their points.
- `src/lib/peer.ts` — shared with Happy Hallways: picks `peer.teacher.dev` or `peer.happyhallways.com`, fetches TURN logins from `/api/turn`, reconnects with backoff, heartbeats.
- `api/turn.ts` — a Vercel function that hands out short-lived Cloudflare TURN logins. Needs `TURN_KEY_ID` and `TURN_KEY_API_TOKEN`.

The teacher's tab must stay open during the game; closing it ends the room (a reload resumes it).

## Development

```bash
bun install
bun run dev        # http://localhost:8000
bun test src       # rules, scoring, importing
bun run test:e2e   # plays a whole game between separate browsers via the real peer server, and imports a Kahoot workbook
bun run check
bun run build
```

Put `TURN_KEY_ID` / `TURN_KEY_API_TOKEN` in `.env.local` to test the relay locally (see `.env.example`). Without them, devices on the same network still connect directly.

## Deploying

Live at **https://classgauntlet.teacher.dev**, on Vercel (project `classgauntlet`, repo `teacherdotdev/classgauntlet`), created with the Sites scripts (`../sites`): `bun run create-site --path ../classroom-review-game --slug classgauntlet`. Pushing `main` redeploys. The Vercel project has `TURN_KEY_ID` and `TURN_KEY_API_TOKEN` set (the same Cloudflare TURN key as Happy Hallways).

## License

Apache 2.0, like the project it is adapted from: https://github.com/deadbeef101010/1v100-edtechathon (Copyright 2026 deadbeef101010 and contributors).
