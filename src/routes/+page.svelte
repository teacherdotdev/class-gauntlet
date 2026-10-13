<script lang="ts">
  import { goto } from '$app/navigation';
  import Avatar from '#lib/components/Avatar.svelte';
  import Brand from '#lib/components/Brand.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import HeroArt from '#lib/components/HeroArt.svelte';
  import LifelineIcon from '#lib/components/LifelineIcon.svelte';
  import { cleanRoomCode } from '#lib/protocol.ts';

  let pin = $state('');
  function join(event: SubmitEvent) {
    event.preventDefault();
    goto(pin.length === 6 ? `/join?code=${pin}` : '/join');
  }

  const crowd = ['Ava', 'Leo', 'Priya', 'Sam', 'Noor', 'Eli', 'Mateo', 'June', 'Kai', 'Rosa', 'Theo', 'Zara'];
</script>

<svelte:head><title>Class Gauntlet · A review game where nobody gets knocked out</title></svelte:head>

<div class="landing">
  <header class="nav">
    <Brand />
    <nav>
      <a href="#how">How it works</a>
      <a href="/banks">Question banks</a>
      <a href="/join">Join a game</a>
      <a class="cta small" href="/games">Host a game <span aria-hidden="true">→</span></a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="copy">
        <p class="eyebrow">A classroom review game</p>
        <h1>Throw down the gauntlet.</h1>
        <p class="lede">
          One student takes on the whole class. Miss a question and you don’t sit out: you join the Comeback Crew and keep
          answering until the very last question.
        </p>
        <div class="actions">
          <a class="cta" href="/games">Host a game <span aria-hidden="true">→</span></a>
          <form class="pin" onsubmit={join}>
            <input
              bind:value={pin}
              oninput={() => (pin = cleanRoomCode(pin))}
              inputmode="numeric"
              placeholder="Game PIN"
              aria-label="Game PIN"
            />
            <button disabled={pin.length !== 6}>Join</button>
          </form>
        </div>
        <p class="fineprint">Free. Runs in your browser. No accounts, nothing to install.</p>
      </div>
      <HeroArt />
    </section>

    <div class="divider" aria-hidden="true"><span>⚔</span></div>

    <section class="band" id="how" aria-labelledby="how-heading">
      <div class="section">
        <p class="eyebrow">Ready before the bell</p>
        <h2 id="how-heading">Three steps to the joust.</h2>
        <ol class="steps">
          <li>
            <span class="num">I</span>
            <h3>Pick your questions</h3>
            <p>Write your own, paste them from a spreadsheet, or start with the sample set.</p>
          </li>
          <li>
            <span class="num">II</span>
            <h3>The class joins with a PIN</h3>
            <p>Put this screen on the projector. Students type the PIN on their phones or scan the code.</p>
          </li>
          <li>
            <span class="num">III</span>
            <h3>The spotlight picks a champion</h3>
            <p>The class answers first. Then the champion answers alone, with three lifelines up their sleeve.</p>
          </li>
        </ol>

        <div class="crowd-card">
          <ul class="mini-crowd" aria-hidden="true">
            {#each crowd as n, i (n)}
              <li class:lit={i === 4} class:crew={i === 2 || i === 9 || i === 10}><Avatar name={n} size={36} /></li>
            {/each}
          </ul>
          <div>
            <h3>Nobody gets knocked out</h3>
            <p>
              When the champion is right, classmates who missed fall to the Comeback Crew and keep answering from there. The
              champion’s Prize Pot grows with every classmate they outlast.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="ends-heading">
      <p class="eyebrow">How a round ends</p>
      <h2 id="ends-heading">Three ways to win the day.</h2>
      <div class="ends">
        <article class="end gules">
          <h3>The champion falls</h3>
          <p>Out of chances. The class splits the Prize Pot.</p>
        </article>
        <article class="end azure">
          <h3>The champion survives</h3>
          <p>Every question cleared. They bank the pot, and the team still standing gets a bonus.</p>
        </article>
        <article class="end or">
          <h3>Jackpot!</h3>
          <p>The whole class is outlasted. The pot pays out one and a half times.</p>
        </article>
      </div>
      <ul class="lifelines">
        <li><span class="ico"><LifelineIcon help="poll" /></span><span><b>Poll the Class</b> See how many classmates chose an answer.</span></li>
        <li><span class="ico"><LifelineIcon help="ask" /></span><span><b>Ask Two</b> One classmate who was right and one who wasn’t explain out loud.</span></li>
        <li><span class="ico"><LifelineIcon help="trust" /></span><span><b>Go with the Class</b> Lock in the most popular answer.</span></li>
      </ul>
    </section>

    <section class="section">
      <div class="closer">
        <div>
          <p class="eyebrow">Private by default</p>
          <h2>Your castle, your rules.</h2>
          <p>
            Your question sets stay in your own browser, and students’ phones talk straight to your computer. There are no
            accounts, no tracking and no ads.
          </p>
        </div>
        <div class="closer-actions">
          <a class="cta" href="/games">Host a game <span aria-hidden="true">→</span></a>
          <a class="cta secondary" href="/banks/edit?new=1">Write questions</a>
        </div>
      </div>
    </section>
  </main>

  <Footer />
</div>

<style>
  .landing {
    min-height: 100vh;
    background:
      radial-gradient(circle at 85% 8%, rgb(217 169 58 / 0.22), transparent 28rem),
      radial-gradient(circle at 0% 40%, rgb(178 63 44 / 0.08), transparent 26rem),
      linear-gradient(180deg, #fbf4e8 0%, var(--ground) 70%);
  }
  .nav,
  .hero,
  .section {
    width: min(1120px, calc(100% - 32px));
    margin: 0 auto;
  }
  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.1rem 0;
  }
  nav {
    display: flex;
    align-items: center;
    gap: 1.4rem;
  }
  nav a:not(.cta) {
    color: var(--ink-soft);
    text-decoration: none;
    font-weight: 600;
  }
  nav a:not(.cta):hover {
    color: var(--accent);
  }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.85rem 1.5rem;
    border-radius: 12px;
    background: var(--accent);
    color: var(--paper);
    font-weight: 700;
    font-size: 1.1rem;
    text-decoration: none;
    box-shadow:
      inset 0 -4px 0 rgb(0 0 0 / 0.18),
      0 8px 20px rgb(159 80 55 / 0.25);
  }
  .cta:hover {
    background: var(--accent-dark);
  }
  .cta.small {
    padding: 0.55rem 1rem;
    font-size: 0.95rem;
    box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.18);
  }
  .cta.secondary {
    background: transparent;
    color: var(--accent-dark);
    border: 2px solid var(--accent);
    box-shadow: none;
  }
  .eyebrow {
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.6rem;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    align-items: center;
    gap: clamp(2rem, 6vw, 4.5rem);
    padding: 2.5rem 0 3.5rem;
  }
  .hero :global(.art) {
    justify-self: center;
  }
  h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(3.4rem, 7.5vw, 6.2rem);
    line-height: 0.95;
    margin-bottom: 1.25rem;
    color: var(--ink);
  }
  .lede {
    font-size: clamp(1.05rem, 1.6vw, 1.25rem);
    line-height: 1.6;
    color: var(--muted);
    max-width: 33rem;
    margin-bottom: 1.75rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    align-items: center;
  }
  .pin {
    display: flex;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid var(--line-strong);
    background: #fff;
  }
  .pin input {
    width: 8.5rem;
    border: none;
    padding: 0.7rem 0.9rem;
    font-family: var(--display);
    font-size: 1.4rem;
    letter-spacing: 0.08em;
    background: transparent;
  }
  .pin input:focus {
    outline: none;
  }
  .pin input::placeholder {
    font-family: var(--sans);
    font-size: 1rem;
    letter-spacing: normal;
    color: #a8998a;
  }
  .pin:focus-within {
    border-color: var(--accent);
  }
  .pin button {
    border: none;
    padding: 0 1.1rem;
    background: var(--ink-soft);
    color: var(--paper);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  .pin button:disabled {
    background: #cdbfae;
    cursor: default;
  }
  .fineprint {
    margin-top: 0.9rem;
    color: var(--muted);
    font-size: 0.88rem;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: min(1120px, calc(100% - 32px));
    margin: 0 auto;
    color: var(--or);
    font-size: 1.4rem;
  }
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--line-strong), transparent);
  }

  .section {
    padding: 4rem 0;
  }
  .section h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.2rem, 4vw, 3.2rem);
    line-height: 1;
    margin-bottom: 1.75rem;
  }
  .steps {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.1rem;
  }
  .steps li,
  .crowd-card,
  .end {
    padding: 1.5rem;
    border-radius: 16px;
    border: 1px solid var(--line);
    background: var(--paper);
    box-shadow: var(--shadow-rest);
  }
  .num {
    display: inline-grid;
    place-items: center;
    width: 2.6rem;
    height: 2.9rem;
    margin-bottom: 0.9rem;
    font-family: var(--display);
    font-size: 1.4rem;
    color: var(--paper);
    background: var(--accent);
    clip-path: polygon(0 0, 100% 0, 100% 62%, 50% 100%, 0 62%);
  }
  .steps h3,
  .crowd-card h3,
  .end h3 {
    font-size: 1.2rem;
    margin-bottom: 0.4rem;
  }
  .steps p,
  .crowd-card p,
  .end p {
    color: var(--muted);
    line-height: 1.6;
  }
  .crowd-card {
    display: flex;
    align-items: center;
    gap: 1.75rem;
    margin-top: 1.1rem;
    background: #fff6dc;
    border-color: #ecd3ac;
  }
  .mini-crowd {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(6, 36px);
    gap: 0.45rem;
    flex: none;
    padding: 0.75rem;
    border-radius: 12px;
    background: var(--night);
  }
  .mini-crowd li {
    opacity: 0.5;
  }
  .mini-crowd li.lit {
    opacity: 1;
    filter: drop-shadow(0 0 8px rgb(255 220 150 / 0.9));
  }
  .mini-crowd li.crew {
    filter: grayscale(1);
  }

  .ends {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.1rem;
  }
  .end {
    position: relative;
    padding-top: 2.4rem;
    overflow: hidden;
  }
  .end::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 0.9rem;
    background: var(--c);
  }
  .gules {
    --c: var(--gules);
  }
  .azure {
    --c: var(--azure);
  }
  .or {
    --c: var(--or);
  }
  .end h3 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.8rem;
    color: var(--c);
  }
  .lifelines {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.1rem;
    margin-top: 1.5rem;
  }
  .lifelines li {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    color: var(--muted);
    line-height: 1.5;
  }
  .lifelines b {
    display: block;
    color: var(--ink);
  }
  .ico {
    display: grid;
    place-items: center;
    flex: none;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    background: var(--amber-strong);
    color: var(--night);
  }

  .closer {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 2.25rem 2.5rem;
    border-radius: 20px;
    background:
      radial-gradient(circle at 100% 0%, rgb(217 169 58 / 0.25), transparent 20rem),
      var(--night);
    color: var(--paper);
  }
  .closer h2 {
    margin-bottom: 0.75rem;
  }
  .closer p:not(.eyebrow) {
    color: rgb(255 250 243 / 0.75);
    max-width: 36rem;
    line-height: 1.6;
  }
  .closer .eyebrow {
    color: var(--amber-strong);
  }
  .closer-actions {
    display: grid;
    gap: 0.6rem;
    flex: none;
  }
  .closer .cta.secondary {
    color: var(--paper);
    border-color: rgb(255 250 243 / 0.5);
    justify-content: center;
  }

  @media (max-width: 52rem) {
    nav a:not(.cta) {
      display: none;
    }
    .hero {
      grid-template-columns: 1fr;
      padding-top: 1rem;
    }
    .steps,
    .ends,
    .lifelines {
      grid-template-columns: 1fr;
    }
    .crowd-card,
    .closer {
      flex-direction: column;
      align-items: flex-start;
    }
    .closer {
      padding: 1.75rem;
    }
  }
</style>
