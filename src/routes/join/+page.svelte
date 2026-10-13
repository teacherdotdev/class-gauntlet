<script lang="ts">
  import Rich from '#lib/rich/Rich.svelte';
  import { page } from '$app/state';
  import AnswerBlock from '#lib/components/AnswerBlock.svelte';
  import Avatar from '#lib/components/Avatar.svelte';
  import Gauntlet from '#lib/components/Gauntlet.svelte';
  import LifelineIcon from '#lib/components/LifelineIcon.svelte';
  import ClassicPhone from '#lib/components/ClassicPhone.svelte';
  import PerilPhone from '#lib/components/PerilPhone.svelte';
  import Shape from '#lib/components/Shape.svelte';
  import { NICKNAME_MAX } from '#lib/game/engine.ts';
  import type { Help } from '#lib/game/types.ts';
  import { cleanRoomCode, spacedCode } from '#lib/protocol.ts';
  import { student } from '#lib/student.svelte.ts';
  import { endHeadline, helpBlurb, helpName } from '#lib/words.ts';

  const pinFromLink = cleanRoomCode(page.url.searchParams.get('code') ?? '');
  let code = $state(pinFromLink);
  let step = $state<'pin' | 'name'>(pinFromLink.length === 6 ? 'name' : 'pin');
  let nickname = $state('');
  let powerOpen = $state(false);
  let polling = $state(false);
  let confirmLeave = $state(false);

  // Coming back to a game this device was already in: go straight back in.
  let autoTried = false;
  $effect.pre(() => {
    if (!autoTried && code.length === 6 && student.status === 'idle') {
      autoTried = true;
      const seat = student.savedSeat(code);
      if (seat) void student.join(code, seat.nickname);
    }
  });

  function submitPin(event: SubmitEvent) {
    event.preventDefault();
    if (cleanRoomCode(code).length === 6) step = 'name';
  }

  function submitName(event: SubmitEvent) {
    event.preventDefault();
    if (!nickname.trim()) return;
    history.replaceState(history.state, '', `/join?code=${code}`);
    void student.join(code, nickname);
  }

  const view = $derived(student.view);
  const me = $derived(view?.self);
  const q = $derived(view?.question ?? null);
  const phase = $derived(view?.phase);
  const iAmOne = $derived(me?.role === 'one');
  const one = $derived(view?.game?.one.nickname ?? 'The champion');
  const letter = (i: number | null | undefined) => (i == null ? '' : String.fromCharCode(65 + i));
  const tincture = (i: number | null | undefined) => ['var(--gules)', 'var(--azure)', 'var(--or)', 'var(--vert)'][i ?? 0];

  const answering = $derived(phase === 'PHASE_A' && !view?.paused && !!me?.eligible && !iAmOne && me?.myAnswer === null);
  const oneAnswering = $derived(phase === 'PHASE_B' && !view?.paused && iAmOne && q?.oneAnswer === null);
  const helps = $derived(view?.game?.helpsAvailable);
  const canPower = $derived(oneAnswering && !q?.helpUsed && !!helps && (helps.poll || helps.ask || helps.trust));
  let seconds = $state<number | null>(null);
  $effect(() => {
    const timer = setInterval(() => {
      seconds = student.deadline === null ? null : Math.max(0, Math.ceil((student.deadline - Date.now()) / 1000));
    }, 250);
    return () => clearInterval(timer);
  });

  function useHelp(help: Help, choice?: number) {
    student.help(help, choice);
    powerOpen = false;
    polling = false;
  }

  // The full-screen colour behind the current moment.
  const mood = $derived.by(() => {
    if (!view || !me) return 'night';
    if (phase === 'REVEAL' && q?.reveal) {
      if (iAmOne) return q.reveal.oneCorrect ? 'good' : 'bad';
      if (me.myAnswer === null) return 'night';
      return me.myAnswer === q.reveal.correct ? 'good' : 'bad';
    }
    if ((phase === 'PHASE_A' || phase === 'PHASE_A_LOCKED') && me.myAnswer !== null && !iAmOne) return 'chosen';
    if (phase === 'ONE_LOCKED' && iAmOne) return 'chosen';
    return 'night';
  });
</script>

<svelte:head><title>{view || student.perilView || student.classicView ? `${student.nickname} · Class Gauntlet` : 'Join a game · Class Gauntlet'}</title></svelte:head>

<main class="phone {mood}" style="--chosen: {tincture(iAmOne ? q?.oneAnswer : me?.myAnswer)}">
  {#if ((!view || !me) && !student.perilView?.me && !student.classicView?.me) || student.status === 'idle' || student.status === 'denied' || student.status === 'connecting' || student.status === 'removed'}
    <section class="join">
      <div class="art"><Gauntlet size={120} /></div>
      <h1>Class Gauntlet</h1>
      {#if student.status === 'removed'}
        <p class="sub">Your teacher removed you from that game.</p>
      {/if}
      {#if step === 'pin'}
        <form onsubmit={submitPin}>
          <input
            class="big-input pin"
            bind:value={code}
            oninput={() => (code = cleanRoomCode(code))}
            inputmode="numeric"
            autocomplete="off"
            placeholder="Game PIN"
            aria-label="Game PIN"
          />
          <button class="go" disabled={code.length !== 6}>Enter</button>
        </form>
      {:else}
        <form onsubmit={submitName}>
          <button type="button" class="pin-chip" onclick={() => { step = 'pin'; student.leaveQuietly(); }}>PIN {spacedCode(code)} ✎</button>
          <input
            class="big-input"
            bind:value={nickname}
            maxlength={NICKNAME_MAX}
            autocomplete="nickname"
            placeholder="Your name"
            aria-label="Your name"
          />
          <button class="go" disabled={!nickname.trim() || student.status === 'connecting'}>
            {student.status === 'connecting' ? 'Joining…' : 'Join'}
          </button>
        </form>
      {/if}
      {#if student.status === 'connecting'}
        <p class="sub" role="status">
          Finding the game…{#if student.slow}<br />Still trying. Double-check the PIN on the board.{/if}
        </p>
      {/if}
      {#if student.problem}<p class="problem" role="alert">{student.problem}</p>{/if}
      {#if student.status === 'reconnecting' && student.slow}
        <button class="link" onclick={() => student.leaveQuietly()}>Join a different game</button>
      {/if}
      <p class="fine"><a href="/about">About</a> · <a href="/privacy">Privacy</a></p>
    </section>
  {:else if student.classicView?.me}
    {#if student.status === 'reconnecting'}<p class="banner">Reconnecting… your answers are safe.</p>{/if}
    <ClassicPhone view={student.classicView} {seconds} />
    {#if student.classicView.phase === 'LOBBY' || student.classicView.phase === 'ENDED'}
      <footer class="leave">
        {#if confirmLeave}
          <button class="link" onclick={() => student.leave()}>Yes, leave</button>
          <button class="link" onclick={() => (confirmLeave = false)}>Stay</button>
        {:else}
          <button class="link" onclick={() => (confirmLeave = true)}>Leave game</button>
        {/if}
      </footer>
    {/if}
  {:else if student.perilView?.me}
    {#if student.status === 'reconnecting'}<p class="banner">Reconnecting… your points are safe.</p>{/if}
    <PerilPhone view={student.perilView} {seconds} />
    {#if student.perilView.phase === 'LOBBY' || student.perilView.phase === 'ENDED'}
      <footer class="leave">
        {#if confirmLeave}
          <button class="link" onclick={() => student.leave()}>Yes, leave</button>
          <button class="link" onclick={() => (confirmLeave = false)}>Stay</button>
        {:else}
          <button class="link" onclick={() => (confirmLeave = true)}>Leave game</button>
        {/if}
      </footer>
    {/if}
  {:else if view && me}
    <header class="strip">
      <Avatar name={me.nickname} size={30} />
      <span class="me">{me.nickname}</span>
      {#if me.role === 'crowd'}<span class="tag">Comeback Crew</span>{/if}
      {#if iAmOne}<span class="tag gold">Champion</span>{/if}
      <span class="spacer"></span>
      {#if phase === 'PHASE_A' && seconds !== null && !iAmOne}<span class="secs">{seconds}</span>{/if}
      <span class="pts">{me.points}</span>
      {#if canPower}
        <button class="power" onclick={() => (powerOpen = true)} aria-label="Lifelines">⚡</button>
      {/if}
    </header>
    {#if student.status === 'reconnecting'}<p class="banner">Reconnecting… your points are safe.</p>{/if}

    <section class="screen">
      {#if phase === 'LOBBY'}
        <div class="moment">
          <Avatar name={me.nickname} size={96} />
          <h1>You’re in!</h1>
          <p>See your name on the screen?</p>
        </div>
      {:else if phase === 'BETWEEN'}
        <div class="moment">
          {#if iAmOne}
            <Gauntlet size={130} />
            <h1>The spotlight is on you!</h1>
            <p>The class answers first. Then it’s your turn, with lifelines behind ⚡.</p>
          {:else}
            <Avatar name={one} size={84} />
            <h1>{one} takes up the gauntlet</h1>
            <p>{me.role === 'crowd' ? 'You’re on the Comeback Crew.' : `You’re up against ${one}. Answer right to stay standing.`}</p>
          {/if}
        </div>
      {:else if phase === 'PHASE_A' || phase === 'PHASE_A_LOCKED'}
        {#if iAmOne}
          <div class="moment">
            <h1>Eyes on the big screen</h1>
            <p>Your classmates are answering. Your question is next!</p>
            <p class="count">{q?.answered} / {q?.eligible}</p>
          </div>
        {:else if answering && q?.choices}
          <div class="prompt"><Rich rich={q.rich?.prompt} text={q.prompt ?? ''} /></div>
          <div class="pad" class:four={q.choices.length === 4}>
            {#each q.choices as text, i (i)}
              <AnswerBlock index={i} {text} rich={q.rich?.choices[i]} big onclick={() => student.answer(i)} />
            {/each}
          </div>
        {:else if me.myAnswer !== null}
          <div class="moment">
            <div class="stamp"><Shape index={me.myAnswer} size={72} /></div>
            <h1>Locked in!</h1>
            <p>{q?.answered} of {q?.eligible} answered</p>
          </div>
        {:else if phase === 'PHASE_A_LOCKED'}
          <div class="moment"><h1>Time’s up!</h1><p>No answer this round. You’ll get the next one.</p></div>
        {:else}
          <div class="moment"><h1>Hang tight</h1><p>You’ll jump in on the next question.</p></div>
        {/if}
      {:else if phase === 'PHASE_B' || phase === 'ONE_LOCKED'}
        {#if oneAnswering && q?.choices}
          <div class="prompt"><Rich rich={q.rich?.prompt} text={q.prompt ?? ''} /></div>
          {#if q.helpResult}
            <p class="help-note">
              {#if q.helpResult.type === 'poll'}
                <b>Poll:</b> {q.helpResult.count} of {q.helpResult.total} chose {letter(q.helpResult.choice)}.
              {:else if q.helpResult.type === 'ask'}
                <b>Ask Two:</b> listen to {q.helpResult.speakers.map((s) => s.nickname).join(' and ')}.
              {/if}
            </p>
          {/if}
          <div class="pad" class:four={q.choices.length === 4}>
            {#each q.choices as text, i (i)}
              <AnswerBlock index={i} {text} rich={q.rich?.choices[i]} big onclick={() => student.oneAnswer(i)} />
            {/each}
          </div>
        {:else if iAmOne}
          <div class="moment">
            <div class="stamp"><Shape index={q?.oneAnswer ?? 0} size={72} /></div>
            <h1>Final answer: {letter(q?.oneAnswer)}</h1>
            <p>Look at the big screen…</p>
          </div>
        {:else}
          <div class="moment">
            {#if me.isSpeaker}
              <h1 class="shout">Speak up!</h1>
              <p>Tell {one} out loud why you chose <b>{letter(me.myAnswer)}</b>.</p>
            {:else}
              <Avatar name={one} size={84} />
              <h1>{phase === 'ONE_LOCKED' ? `${one} has answered…` : `${one} is thinking…`}</h1>
              <p>{me.myAnswer !== null ? `You said ${letter(me.myAnswer)}.` : 'Watch the big screen.'}</p>
            {/if}
          </div>
        {/if}
      {:else if phase === 'REVEAL' && q?.reveal}
        <div class="moment">
          {#if iAmOne}
            <h1 class="shout">{q.reveal.oneCorrect ? 'You’re right!' : 'Not this time'}</h1>
            <p>{q.reveal.oneCorrect ? `+${me.delta} points, and the Prize Pot grows.` : 'You lost a chance.'}</p>
          {:else if me.myAnswer === null}
            <h1>No answer</h1>
            <p>The answer was {letter(q.reveal.correct)}.</p>
          {:else if me.myAnswer === q.reveal.correct}
            <h1 class="shout">Correct!</h1>
            <p class="plus">+{me.delta}</p>
            {#if me.streak > 1}<p>{me.streak} in a row</p>{/if}
          {:else}
            <h1 class="shout">Not quite</h1>
            <p>The answer was {letter(q.reveal.correct)}.</p>
          {/if}
          {#if me.demoted}<p class="crew-note">You fall to the Comeback Crew.</p>{/if}
          {#if view.game?.result}
            <p class="over">{endHeadline(view.game.result.reason, one, view.game.result.bankedByOne)}</p>
            {#if me.payout > 0}<p class="plus">+{me.payout} in the finish!</p>{/if}
          {/if}
        </div>
      {:else if phase === 'LEADERBOARD' || phase === 'ENDED'}
        <div class="moment">
          <p class="rank">#{me.rank}</p>
          <h1>{me.points} points</h1>
          {#if phase === 'LEADERBOARD' && view.pendingNextOne?.id === me.id}
            <p class="crew-note">You’re the next champion!</p>
          {:else}
            <p>{phase === 'ENDED' ? 'Thanks for playing!' : 'Next round coming up.'}</p>
          {/if}
        </div>
      {/if}
    </section>

    {#if phase === 'LOBBY' || phase === 'ENDED'}
      <footer class="leave">
        {#if confirmLeave}
          <button class="link" onclick={() => student.leave()}>Yes, leave</button>
          <button class="link" onclick={() => (confirmLeave = false)}>Stay</button>
        {:else}
          <button class="link" onclick={() => (confirmLeave = true)}>Leave game</button>
        {/if}
      </footer>
    {/if}

    {#if view.paused}
      <div class="veil" role="status"><h1>Paused</h1><p>{view.pauseReason === 'one_disconnected' ? `Waiting for ${one}…` : 'Hold on a moment.'}</p></div>
    {/if}
  {/if}

  {#if powerOpen && helps && q?.choices}
    <div class="sheet-back" onclick={() => (powerOpen = false)} role="presentation"></div>
    <div class="sheet" role="dialog" aria-label="Lifelines">
      <h2>Lifelines <small>one per question</small></h2>
      {#if polling}
        <p>Which answer should the class tell you about?</p>
        <div class="poll-pick">
          {#each q.choices as _, i (i)}
            <button style="background: {tincture(i)}" onclick={() => useHelp('poll', i)} aria-label="Poll answer {letter(i)}"><Shape index={i} size={30} /></button>
          {/each}
        </div>
        <button class="link" onclick={() => (polling = false)}>Back</button>
      {:else}
        {#each ['poll', 'ask', 'trust'] as const as h (h)}
          <button class="life" disabled={!helps[h]} onclick={() => (h === 'poll' ? (polling = true) : useHelp(h))}>
            <span class="ico"><LifelineIcon help={h} /></span>
            <span><strong>{helpName[h]}</strong><small>{helps[h] ? helpBlurb[h] : 'Already used this round'}</small></span>
          </button>
        {/each}
      {/if}
    </div>
  {/if}

  {#if student.notice}<p class="toast" role="status">{student.notice}</p>{/if}
</main>

<style>
  .phone {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    color: var(--paper);
    background:
      radial-gradient(ellipse 90% 40% at 50% -5%, rgb(240 170 90 / 0.22), transparent 70%),
      var(--night);
    transition: background 0.4s;
  }
  .phone.chosen {
    background: var(--chosen);
  }
  .phone.good {
    background: var(--vert);
  }
  .phone.bad {
    background: var(--gules);
  }

  /* Joining */
  .join {
    flex: 1;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 1rem;
    padding: 2rem 1.25rem;
    text-align: center;
  }
  .join h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 3rem;
    line-height: 1;
  }
  .join form {
    width: min(22rem, 100%);
    display: grid;
    gap: 0.7rem;
  }
  .big-input {
    width: 100%;
    padding: 0.9rem;
    border: none;
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-weight: 800;
    font-size: 1.4rem;
    text-align: center;
  }
  .big-input.pin {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2.2rem;
    letter-spacing: 0.15em;
  }
  .big-input::placeholder {
    color: #a8998a;
    letter-spacing: normal;
  }
  .go {
    padding: 0.9rem;
    border: none;
    border-radius: 10px;
    background: var(--accent);
    color: var(--paper);
    font: inherit;
    font-weight: 800;
    font-size: 1.3rem;
    box-shadow: inset 0 -5px 0 rgb(0 0 0 / 0.2);
  }
  .go:disabled {
    opacity: 0.5;
  }
  .pin-chip {
    justify-self: center;
    background: rgb(255 250 243 / 0.12);
    color: var(--paper);
    border: none;
    border-radius: 999px;
    padding: 0.3rem 0.9rem;
    font: inherit;
    font-weight: 700;
  }
  .sub {
    color: rgb(255 250 243 / 0.75);
  }
  .fine {
    margin-top: 1rem;
    font-size: 0.82rem;
    color: rgb(255 250 243 / 0.5);
  }
  .fine a {
    color: inherit;
  }
  .problem {
    background: var(--paper);
    color: var(--bad);
    font-weight: 700;
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
    max-width: 22rem;
  }
  .link {
    background: none;
    border: none;
    color: rgb(255 250 243 / 0.75);
    text-decoration: underline;
    font: inherit;
    padding: 0.5rem;
  }

  /* In the game */
  .strip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.75rem;
    background: rgb(0 0 0 / 0.25);
  }
  .me {
    font-weight: 800;
    max-width: 9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tag {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    background: rgb(255 250 243 / 0.15);
  }
  .tag.gold {
    background: var(--amber-strong);
    color: var(--night);
  }
  .spacer {
    flex: 1;
  }
  .secs {
    font-family: var(--display);
    font-size: 1.5rem;
    min-width: 2rem;
    text-align: center;
  }
  .pts {
    font-family: var(--display);
    font-size: 1.5rem;
    background: var(--paper);
    color: var(--ink);
    padding: 0 0.6rem;
    border-radius: 8px;
  }
  .power {
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    border: none;
    background: var(--amber-strong);
    font-size: 1.3rem;
    box-shadow: 0 0 0 0 rgb(240 210 124 / 0.6);
    animation: glow 1.6s infinite;
  }
  @keyframes glow {
    70% {
      box-shadow: 0 0 0 12px rgb(240 210 124 / 0);
    }
  }
  .banner {
    background: var(--amber);
    color: #6b4a00;
    font-weight: 700;
    text-align: center;
    padding: 0.4rem;
  }
  .screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    gap: 0.75rem;
  }
  .moment {
    flex: 1;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 0.6rem;
    text-align: center;
    padding: 1rem;
    animation: pop 0.35s both;
  }
  .moment h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2.6rem;
    line-height: 1.05;
  }
  .moment p {
    font-size: 1.15rem;
    color: rgb(255 250 243 / 0.85);
  }
  .shout {
    font-size: 3.4rem !important;
  }
  .plus {
    font-family: var(--display);
    font-size: 2.6rem !important;
    color: var(--paper) !important;
    background: rgb(0 0 0 / 0.2);
    padding: 0 1rem;
    border-radius: 10px;
  }
  .count,
  .rank {
    font-family: var(--display);
    font-size: 3rem !important;
    color: var(--paper) !important;
  }
  .rank {
    font-size: 4.5rem !important;
    line-height: 1;
  }
  .crew-note,
  .over {
    background: rgb(0 0 0 / 0.22);
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
    font-weight: 700;
  }
  .stamp {
    display: grid;
    place-items: center;
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    background: rgb(0 0 0 / 0.18);
  }
  .prompt {
    --picture-max: 30vh;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--serif);
    font-weight: 700;
    font-size: 1.2rem;
    text-align: center;
    padding: 0.8rem 1rem;
    border-radius: 12px;
  }
  .help-note {
    background: var(--amber);
    color: #4a3300;
    padding: 0.5rem 0.8rem;
    border-radius: 10px;
  }
  .pad {
    flex: 1;
    display: grid;
    gap: 0.6rem;
    grid-auto-rows: 1fr;
  }
  .pad.four {
    grid-template-columns: 1fr 1fr;
  }
  .pad :global(.block) {
    min-height: 5.5rem;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    gap: 0.5rem;
  }
  .pad :global(.block .mark svg) {
    width: 3.2rem;
    height: 3.2rem;
  }
  .pad :global(.block .text) {
    flex: none;
    font-size: 1.5rem;
  }
  .leave {
    display: flex;
    justify-content: center;
    padding-bottom: 1rem;
  }
  .veil {
    position: fixed;
    inset: 0;
    display: grid;
    place-content: center;
    text-align: center;
    background: rgb(20 14 10 / 0.85);
  }
  .veil h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 3rem;
  }

  /* Lifelines sheet */
  .sheet-back {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.5);
  }
  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: grid;
    gap: 0.6rem;
    padding: 1.25rem 1rem calc(1.25rem + env(safe-area-inset-bottom));
    background: var(--paper);
    color: var(--ink);
    border-radius: 18px 18px 0 0;
    animation: rise 0.25s both;
  }
  .sheet h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2rem;
  }
  .sheet h2 small {
    font-family: var(--sans);
    font-size: 0.85rem;
    color: var(--muted);
  }
  .life {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    text-align: left;
    padding: 0.8rem;
    border-radius: 12px;
    border: 1px solid var(--line-strong);
    background: #fff;
    font: inherit;
    color: inherit;
  }
  .life:disabled {
    opacity: 0.45;
  }
  .life span:last-child {
    display: grid;
  }
  .life small {
    color: var(--muted);
  }
  .ico {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    background: var(--amber-strong);
    color: var(--night);
    flex: none;
  }
  .poll-pick {
    display: grid;
    grid-auto-flow: column;
    gap: 0.5rem;
  }
  .poll-pick button {
    display: grid;
    place-items: center;
    height: 4rem;
    border: none;
    border-radius: 10px;
  }
  .sheet .link {
    color: var(--muted);
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 1rem;
    transform: translateX(-50%);
    background: var(--paper);
    color: var(--ink);
    font-weight: 700;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    box-shadow: var(--shadow-dialog);
    max-width: calc(100% - 2rem);
  }
</style>
