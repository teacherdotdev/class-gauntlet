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
6. **The reveal:** if the challenger is right, classmates who missed fall to the **Comeback Crew** (they keep answering and scoring) and the **Prize Pot** grows by 20 each. If the challenger is wrong, they lose a chance. When most of the class gets three in a row right, the class earns a **Rescue**: they vote one of the Comeback Crew back into the class.
7. The round ends when the challenger runs out of chances (the class splits the pot), clears every question (the challenger banks the pot and classmates still standing get a bonus), or outlasts the whole class (jackpot: pot × 1.5). Then a new challenger steps up.

Inside a question the game moves itself along (timer, hand-off to the challenger, drumroll, reveal); the teacher taps **Next** between questions. The scoring rules are ported unchanged from the original (`src/lib/game/scoring.ts`), including the optional **On a Roll** rule: quick answers without a lifeline win the challenger a chance back once per round.

## With no student devices

For classes without devices (or when the Wi-Fi is down), the Games page has a **Use student devices** switch above Host; turn it off. Nobody joins and nothing touches the network: the game runs on the teacher's screen alone, and the teacher taps every choice (or uses the keyboard or a presentation clicker: → / PageDown / Space move on, A–D or 1–4 pick an answer, 1–8 pick a Team).

- **Classic** becomes a class review: each question with a guide timer, answers on whiteboards or by hand, and the teacher shows the answer. No scores or Report.
- **Peril!** is played in Teams with nobody in them: the teacher taps the Team that buzzed, then the answer it gave, and types a Treasure Trove's Wager. Only the Buzz has a clock.
- **Champion**: the teacher names each Champion. The Champion looks away while the class sees the question and votes by hand; the teacher taps the Class Majority, then the Champion answers by tapping. A right answer adds 100 to the Prize Pot (200 when the class was wrong); out of chances, The Class wins the pot.

Every new Game Mode must play with no student devices too ([ADR 0001](docs/adr/0001-every-game-mode-plays-without-student-devices.md)).

## Screens

| Route | Who | What |
| --- | --- | --- |
| `/` | everyone | Start or join a game |
| `/host` | teacher, on the projector | Pick a question set, then the lobby and the game itself; rules live behind the gear |
| `/join?code=482913` | students | Join, answer, use lifelines (⚡) |
| `/questions` | teacher | Question sets: write, import a file / paste from a spreadsheet, download CSV, share by link |

## Custom questions

Question sets are saved in the teacher's browser (local storage). Ways to get questions in:

- **Write them** in the editor (`/banks/edit`): 2–4 choices per question and an optional explanation shown after the reveal. Every field takes formatting, math and Pictures (still or animated; a GIF up to 5 MB), from one toolbar at the top of the question or the / menu. An answer can be just a Picture.
- **Import a file** or **paste cells from Google Sheets/Excel**. Files are read by [Question Commons](https://questioncommons.com) (`@teacherdotdev/question-commons`), so Kahoot and Blooket spreadsheets, Moodle (XML, GIFT, Aiken), Canvas and other QTI exports, Blackboard, Brightspace, Respondus, Word documents and our own CSVs all work, and Bank Files and Test Parrot packages are read in `src/lib/questions/bank-file.ts`. Each Question Bank in the file becomes a set.
- The simplest spreadsheet has a header row `question, A, B, C, D, answer, explanation` (D and explanation optional; `answer` is a letter or the answer's text). Math between dollar signs (`$\frac{1}{2}$`, `$$…$$`, `\(…\)`) becomes math; money like `$5` stays words. The original project's CSV (`set title, subject, grade, question, choices, correct, explanation`, `choices` a JSON array) imports too, one set per title.
- The game plays only multiple choice with **one** right answer and 2–4 choices; formatting, math and Pictures come along. Every other question (several right answers, matching, more than four choices…) is left out, and the report says which and why. `src/lib/questions/import.ts` holds those rules.
- **Copy instructions for an AI** (in the paste panel) copies a prompt that tells an AI chat to turn a worksheet or PDF into CSV in the expected format, ready to paste back in. Math comes back as `$…$`. Where a question needs a graph or figure, the AI leaves a Picture Note (`[picture: …]`), and the question is marked “Needs a Picture” until one is pasted in.
- **Export all** downloads every set as one CSV (with each bank's title on every row) that imports back as the same sets, math included; Pictures become Picture Notes.
- **Share**: a bank without Pictures is copied as a Share Link. The set is compressed into the part of the link after `#`, which never reaches any server, and opening the link offers to add the set. A link can't carry Pictures, so a bank with them offers a **Bank File** to download and send instead: `<title>.parrot.zip`, in Test Parrot's package format (`docs/adr/0002-bank-files-use-the-test-parrot-package-format.md`).

## Architecture

```
student phones ──WebRTC data channels──▶ teacher's tab (runs the rules, saves to local storage)
        ▲
        └── peer.classgauntlet.com (PeerJS) introduces them; TURN relays when a
            network blocks direct connections
```

- `src/lib/game/` — the rules as plain TypeScript: `engine.ts` (commands and phases), `scoring.ts`, `views.ts` (what each screen may see: the correct answer never leaves the teacher's tab before the reveal).
- `src/lib/host.svelte.ts` — the teacher's room: registers `classgauntlet-<PIN>` on the PeerJS server, accepts students, broadcasts views, and saves the whole game after every change. Reloading the tab offers to resume, reclaims the same code, and students reconnect on their own.
- `src/lib/student.svelte.ts` — a student's link. Its seat (player id + secret) is kept in local storage, so a reload or dropped Wi-Fi puts the student back in with their points.
- `src/lib/peer.ts` — shared with Happy Hallways: picks the first of `peer.classgauntlet.com` or `peer.teacher.dev` that answers (one server), fetches TURN logins from `/api/turn`, reconnects with backoff, heartbeats.
- `api/turn.ts` — a Vercel function that hands out short-lived Cloudflare TURN logins. Needs `TURN_KEY_ID` and `TURN_KEY_API_TOKEN`. Some school filters block the name `turn.cloudflare.com`, so it also offers the plain (non-TLS) relay addresses as `turn.classgauntlet.com` and `turn.teacher.dev`: DNS-only (grey cloud) CNAMEs to `turn.cloudflare.com`, since a proxied record would break the relay.

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
