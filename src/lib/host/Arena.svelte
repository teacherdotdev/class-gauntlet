<script lang="ts">
  // The game on the big screen. Everything here is safe to project: it is
  // built from the public view, so the question stays hidden while the class
  // answers and the right answer stays hidden until the reveal. Inside a
  // question the game moves itself along; the teacher taps Next in between.
  // With no student devices, the champion looks away while the
  // class sees the question and votes by hand, the teacher taps the Class
  // Majority, and the champion answers by tapping up here.
  import Rich from '../rich/Rich.svelte';
  import Avatar from '../components/Avatar.svelte';
  import AnswerBlock from '../components/AnswerBlock.svelte';
  import ChampionSteps from '../components/art/ChampionSteps.svelte';
  import Crowd, { type CrowdMember } from '../components/Crowd.svelte';
  import LifelineIcon from '../components/LifelineIcon.svelte';
  import SpotlightSweep from '../components/SpotlightSweep.svelte';
  import TimerRing from '../components/TimerRing.svelte';
  import { CLASS_ID } from '../game/engine';
  import { host } from '../host.svelte';
  import { choiceOf, hostKey } from './keys';
  import { spacedCode } from '../protocol';
  import { endDetail, endHeadline, helpName, plural } from '../words';

  let { onsettings }: { onsettings: () => void } = $props();

  const view = $derived(host.view!);
  const s = $derived(host.session!);
  const game = $derived(view.game);
  const q = $derived(view.question);
  const phase = $derived(view.phase);
  const one = $derived(game?.one.nickname ?? 'The champion');
  const oneId = $derived(game?.one.id ?? '');
  const deadline = $derived(q?.remainingMs != null ? Date.now() + q.remainingMs : null);
  const rescueDeadline = $derived(view.rescue?.remainingMs != null ? Date.now() + view.rescue.remainingMs : null);
  const spotlightPicks = $derived(s.settings.championPick === 'spotlight');
  const name = (id: string) => view.roster.find((p) => p.id === id)?.nickname ?? 'Someone';
  const noDevices = $derived(view.noDevices);
  const classPoints = $derived(view.roster.find((p) => p.id === CLASS_ID)?.points ?? 0);

  const spotOnOne = $derived(['PHASE_B', 'ONE_LOCKED', 'REVEAL'].includes(phase));
  const crowdLit = $derived(['PHASE_A', 'PHASE_A_LOCKED', 'REVEAL'].includes(phase));
  const crowd = $derived<CrowdMember[]>(
    view.roster
      .filter((p) => p.id !== oneId)
      .map((p) => ({
        ...p,
        answered: phase === 'PHASE_A' || phase === 'PHASE_A_LOCKED' ? !!q?.answeredIds.includes(p.id) : false,
        fell: phase === 'REVEAL' && !!q?.reveal?.demoted.includes(p.id),
      }))
      .sort((a, b) => Number(a.role === 'crowd') - Number(b.role === 'crowd')),
  );
  const everyone = $derived<CrowdMember[]>(view.roster.map((p) => ({ ...p })));

  // The round the spotlight last landed in. With reduced motion it lands while
  // it mounts, before any effect here could reset a plain flag, so each round
  // is compared instead of reset.
  let landedOrdinal = $state(0);
  const landed = $derived(!!game && (noDevices || landedOrdinal === game.ordinal));

  let menuOpen = $state(false);

  function blockState(i: number): 'idle' | 'chosen' | 'correct' | 'wrong' | 'faded' {
    if (!q) return 'idle';
    if (q.reveal) return i === q.reveal.correct ? 'correct' : i === q.oneAnswer ? 'wrong' : 'faded';
    if (q.oneAnswer !== null) return i === q.oneAnswer ? 'chosen' : 'faded';
    return 'idle';
  }

  // Confetti when a round ends, once per round.
  let celebrated = '';
  $effect(() => {
    const result = game?.result;
    if (phase !== 'REVEAL' || !result || !game) return;
    const key = `${view.code}:${game.ordinal}`;
    if (celebrated === key) return;
    celebrated = key;
    void import('canvas-confetti').then(({ default: confetti }) => {
      const shared = {
        particleCount: result.reason === 'mob_emptied' ? 90 : 60,
        spread: 75,
        ticks: 200,
        colors: ['#b23f2c', '#f0d27c', '#2f5d8f', '#fffaf3', '#3c7150'],
        disableForReducedMotion: true,
      };
      confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.8 } });
      confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.8 } });
    });
  });

  const next = $derived.by(() => {
    if (phase === 'BETWEEN') return landed ? { label: 'Begin', run: () => host.run((e) => e.openQuestion()) } : null;
    if (phase === 'PHASE_A' && q?.peeking) return { label: 'Show the class', run: () => host.run((e) => e.showToClass()) };
    if (phase === 'PHASE_A') return { label: 'Skip', run: () => host.run((e) => e.skip()), quiet: true };
    if (phase === 'PHASE_A_LOCKED' && noDevices) return { label: `Show ${one} the question`, run: () => host.run((e) => e.showToOne()) };
    if (phase === 'REVEAL')
      return { label: game?.result ? 'Scoreboard' : 'Next question', run: () => host.run((e) => e.next()) };
    if (phase === 'RESCUE' && view.rescue?.settled) return { label: 'Next question', run: () => host.run((e) => e.next()) };
    if (phase === 'RESCUE') return { label: 'Close the vote', run: () => host.run((e) => e.closeRescue()) };
    if (phase === 'LEADERBOARD' && noDevices) return { label: 'Next round', run: () => host.run((e) => e.startNamedRound(nextName)) };
    if (phase === 'LEADERBOARD') return { label: 'Next round', run: () => host.run((e) => e.startGame()) };
    return null;
  });

  // The champion can also stand at the front and tap their answer (or a
  // lifeline) right here on the big screen instead of on their phone.
  let pollMode = $state(false);
  const frontTaps = $derived(phase === 'PHASE_B' && !view.paused && q?.oneAnswer === null);
  $effect(() => {
    if (!frontTaps) pollMode = false;
  });
  function tapAnswer(i: number) {
    if (pollMode) {
      host.run((e) => e.helpPoll(oneId, i));
      pollMode = false;
    } else host.run((e) => e.answerForOne(i));
  }
  function tapLifeline(h: 'poll' | 'ask' | 'trust') {
    // With no student devices, Poll the Class just shows the Class Majority.
    if (h === 'poll' && noDevices) host.run((e) => e.helpPoll(oneId, 0));
    else if (h === 'poll') pollMode = !pollMode;
    else host.run((e) => (h === 'ask' ? e.helpAsk(oneId) : e.helpTrust(oneId)));
  }
  const crowdSize = $derived(crowd.length <= 12 ? 50 : crowd.length <= 24 ? 40 : 32);

  // With no student devices the teacher taps the answer most of the class chose.
  const classTaps = $derived(noDevices && phase === 'PHASE_A' && !view.paused && !!q?.choices);

  let nextOne = $state('');
  let nextName = $state('');
  $effect(() => {
    if (phase === 'LEADERBOARD') {
      nextOne = s.pendingNextOneId ?? '';
      nextName = `Champion ${(game?.ordinal ?? 0) + 1}`;
    }
  });

  function onkeydown(event: KeyboardEvent) {
    const key = hostKey(event);
    if (!key) return;
    if (key.kind === 'next') {
      if (!next) return;
      next.run();
    } else {
      const choice = choiceOf(key, q?.choices?.length ?? 0);
      if (choice === null || !(classTaps || frontTaps)) return;
      if (classTaps) host.run((e) => e.classAnswer(choice));
      else tapAnswer(choice);
    }
    event.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

<div class="arena dark">
  <header class="top">
    {#if game && phase !== 'LEADERBOARD' && phase !== 'ENDED'}
      <span class="where">Round {game.ordinal} · Question {Math.max(1, game.questionIndex)} of {game.deckSize}</span>
    {:else}
      <span class="where">{phase === 'ENDED' ? 'Final standings' : 'Scoreboard'}</span>
      <span></span>
    {/if}
    <div class="tools">
      {#if !noDevices && host.status !== 'open' && host.status !== 'closed'}<span class="conn" role="status">Reconnecting…</span>{/if}
      {#if noDevices}<span class="pin">No student devices</span>{:else}<span class="pin">PIN <strong>{spacedCode(view.code)}</strong></span>{/if}
      {#if phase === 'PHASE_A' || phase === 'PHASE_B'}
        <button class="tool" onclick={() => host.run((e) => (view.paused ? e.resume() : e.pause()))} aria-label={view.paused ? 'Resume' : 'Pause'}>
          {view.paused ? '▶' : '❚❚'}
        </button>
      {/if}
      <div class="menu-wrap">
        <button class="tool" onclick={() => (menuOpen = !menuOpen)} aria-expanded={menuOpen} aria-label="Menu">⋯</button>
        {#if menuOpen}
          <div class="menu">
            <button onclick={() => { menuOpen = false; onsettings(); }}>Settings</button>
            {#if game && !['LEADERBOARD', 'ENDED'].includes(phase)}
              <button onclick={() => { menuOpen = false; host.run((e) => e.endGame()); }}>End this round</button>
            {/if}
            {#if phase !== 'ENDED'}
              <button class="danger" onclick={() => { menuOpen = false; host.finish(); }}>End the game</button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </header>

  {#if phase === 'BETWEEN' && game}
    <section class="intro">
      {#if !noDevices}<SpotlightSweep people={everyone} targetId={oneId} onlanded={() => (landedOrdinal = game.ordinal)} />{/if}
      <div class="intro-text" class:show={landed}>
        <h1>{one} takes up the gauntlet!</h1>
        {#if noDevices}
          <p>Everyone else is the class.</p>
          <ChampionSteps {one} />
        {:else}
          <p>
            Everyone else is the class. The class answers first, then {one} answers alone. Each time {one} is right, classmates
            who missed fall to the Comeback Crew and the Prize Pot grows.
          </p>
        {/if}
      </div>
    </section>
  {:else if phase === 'LEADERBOARD' || phase === 'ENDED'}
    <section class="board-wrap">
      {#if game?.result && phase === 'LEADERBOARD'}
        <p class="kicker">Round {game.ordinal}: {endHeadline(game.result.reason, one, game.result.bankedByOne)}</p>
      {/if}
      <h1 class="big-title">{phase === 'ENDED' ? 'Champions of the realm' : 'Scoreboard'}</h1>
      {#if phase === 'ENDED'}
        <div class="podium">
          {#each view.standings.slice(0, 3) as row, i (row.playerId)}
            <div class="step s{i + 1}">
              <Avatar name={row.nickname} size={i === 0 ? 96 : 72} />
              <strong>{row.nickname}</strong>
              <span>{row.points}</span>
              <div class="plinth">{i + 1}</div>
            </div>
          {/each}
        </div>
      {/if}
      <ol class="scores">
        {#each view.standings.slice(phase === 'ENDED' ? 3 : 0, phase === 'ENDED' ? 7 : 6) as row (row.playerId)}
          <li>
            <span class="rank">{row.rank}</span>
            <Avatar name={row.nickname} size={40} />
            <span class="who">{row.nickname}</span>
            <span class="pts">{row.points}</span>
          </li>
        {/each}
      </ol>
      {#if phase === 'LEADERBOARD' && noDevices}
        <form class="next-up" onsubmit={(event) => { event.preventDefault(); next?.run(); }}>
          <span class="label">Next champion</span>
          <input bind:value={nextName} maxlength="24" aria-label="Next champion’s name" />
        </form>
      {:else if phase === 'LEADERBOARD'}
        <div class="next-up">
          <span class="label">Next champion</span>
          {#if view.pendingNextOne}<Avatar name={view.pendingNextOne.nickname} size={40} />{/if}
          <select bind:value={nextOne} onchange={() => host.run((e) => e.chooseNextOne(nextOne || null))} aria-label="Next champion">
            {#if spotlightPicks}<option value="">The spotlight chooses</option>{:else}<option value="" disabled>Choose…</option>{/if}
            {#each view.roster as p (p.id)}
              <option value={p.id}>{p.nickname}{p.hasBeenOne ? ' (had a turn)' : ''}</option>
            {/each}
          </select>
        </div>
      {:else}
        <a class="btn-primary big again" href="/games" onclick={() => host.close()}>Play again</a>
      {/if}
    </section>
  {:else if game}
    <section class="versus">
      <div class="champion" class:lit={spotOnOne}>
        <div class="beam" aria-hidden="true"></div>
        <div class="who">
          <Avatar name={one} size={120} />
          <div>
            <span class="label">Champion</span>
            <strong class="name">{one}</strong>
            {#if !noDevices && !game.one.connected}<span class="offline">offline</span>{/if}
            <div class="purse">
              <span title="{plural(game.strikes, 'chance')} left">
                {#each Array.from({ length: Math.max(game.baseStrikes, game.strikes) }, (_, i) => i) as i (i)}
                  <b class="shield" class:lost={i >= game.strikes} aria-hidden="true"></b>
                {/each}
              </span>
              <span title="Prize Pot"><b class="coin" aria-hidden="true"></b> {game.bank}</span>
            </div>
            <div class="lifelines" aria-label="Lifelines">
              {#each ['poll', 'ask', 'trust'] as const as h (h)}
                <button
                  class:used={!game.helpsAvailable[h]}
                  class:armed={pollMode && h === 'poll'}
                  disabled={!frontTaps || !game.helpsAvailable[h] || !!q?.helpUsed}
                  onclick={() => tapLifeline(h)}
                  title="{helpName[h]}{game.helpsAvailable[h] ? '' : ' (used)'}"
                  aria-label={helpName[h]}
                >
                  <LifelineIcon help={h} size={20} />
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div class="vs" aria-hidden="true"><span>VS</span></div>

      {#if noDevices}
        <div class="horde the-class" class:lit={crowdLit}>
          <Avatar name="The Class" size={110} />
          <div>
            <span class="label">The Class</span>
            <strong class="name">{classPoints}</strong>
            <span class="label">points won</span>
          </div>
        </div>
      {:else}
        <div class="horde" class:lit={crowdLit}>
          <div class="horde-head">
            <span><strong>{game.mobCount}</strong> in the class</span>
            {#if game.crowdCount}<span class="crew-count"><strong>{game.crowdCount}</strong> in the Comeback Crew</span>{/if}
            {#if game.classStreak}
              {@const streak = game.classStreak}
              <span class="streak" title="Class Streak: {streak.length} right in a row earns a Rescue">
                {#each Array.from({ length: streak.length }, (_, i) => i) as i (i)}
                  <b class="pip" class:on={i < streak.count % streak.length} aria-hidden="true"></b>
                {/each}
                {#if streak.saved}<span class="saved">+{streak.saved} Rescue saved</span>{/if}
              </span>
            {/if}
          </div>
          <Crowd people={crowd} size={crowdSize} names={crowd.length <= 24} />
        </div>
      {/if}
    </section>

    <main class="center">
      {#if phase === 'RESCUE' && view.rescue}
        {@const rescue = view.rescue}
        <div class="rescue">
          {#if rescue.settled}
            <div class="boom" aria-hidden="true">🛟</div>
            {#if rescue.rescued}
              <h1>{rescue.rescued.nickname} is back in the class!</h1>
              <p>The class voted them out of the Comeback Crew.</p>
            {:else}
              <h1>Nobody to bring back</h1>
              <p>The Comeback Crew emptied before the vote closed.</p>
            {/if}
          {:else}
            <div class="rescue-head">
              <div>
                <span class="label">Rescue</span>
                <h1>Class, vote someone back in!</h1>
                <p>Pick one of the Comeback Crew on your device. <span class="tally"><strong>{rescue.voted}</strong> of {rescue.voters} voted</span></p>
              </div>
              <TimerRing deadline={rescueDeadline} totalMs={s.settings.rescueSeconds * 1000} paused={false} size={110} />
            </div>
            <ul class="candidates">
              {#each rescue.candidates as c (c.id)}
                <li>
                  <Avatar name={c.nickname} size={44} />
                  <span class="who">{c.nickname}</span>
                  <span class="bar" style:--share={rescue.voted ? c.votes / rescue.voted : 0}></span>
                  <strong>{c.votes}</strong>
                </li>
              {/each}
            </ul>
            <button class="skip-rescue" onclick={() => host.run((e) => e.skipRescue())}>Skip the Rescue</button>
          {/if}
        </div>
      {:else if phase === 'PHASE_A' && q?.peeking}
        <div class="callout">
          <div class="eyes" aria-hidden="true">👀</div>
          <div>
            <h1>{one}, close your eyes or turn around…</h1>
            <p>No peeking! The class sees the question first.</p>
          </div>
        </div>
      {:else if phase === 'PHASE_A_LOCKED' && noDevices}
        <div class="callout">
          <div class="eyes" aria-hidden="true">👀</div>
          <div><h1>{one}, you can look now!</h1><p>The class has voted. Your turn.</p></div>
        </div>
      {:else if phase === 'PHASE_A' && noDevices && q?.choices}
        <div class="class-head">
          <h2 class="question"><Rich rich={q.rich?.prompt} text={q.prompt ?? ''} /></h2>
          <TimerRing {deadline} totalMs={s.settings.timerSeconds * 1000} paused={view.paused} size={110} />
        </div>
        <div class="blocks" class:three={q.choices.length === 3}>
          {#each q.choices as text, i (i)}
            <AnswerBlock index={i} {text} rich={q.rich?.choices[i]} big onclick={classTaps ? () => host.run((e) => e.classAnswer(i)) : undefined} />
          {/each}
        </div>
        <p class="hint">Class, hands up for your answer! Then tap the answer most of the class chose.</p>
      {:else if phase === 'PHASE_A' && q}
        <div class="callout">
          <TimerRing {deadline} totalMs={s.settings.timerSeconds * 1000} paused={view.paused} size={150} />
          <div>
            <h1>Class, answer on your device!</h1>
            <p>{one}, eyes up here. Your turn is next. <span class="tally"><strong>{q.answered}</strong> of {q.eligible} answered</span></p>
          </div>
        </div>
      {:else if phase === 'PHASE_A_LOCKED' && q}
        <div class="callout"><div><h1>Answers are in!</h1><p>The question passes to {one}…</p></div></div>
      {:else if q?.choices}
        <h2 class="question"><Rich rich={q.rich?.prompt} text={q.prompt ?? ''} /></h2>
        <div class="blocks" class:three={q.choices.length === 3} class:polling={pollMode}>
          {#each q.choices as text, i (i)}
            <AnswerBlock
              index={i}
              {text} rich={q.rich?.choices[i]}
              big
              state={blockState(i)}
              count={q.reveal && !noDevices ? q.reveal.counts[i] : null}
              total={q.answered}
              tag={q.oneAnswer === i ? (phase === 'ONE_LOCKED' ? 'Final answer' : one) : ''}
              onclick={frontTaps ? () => tapAnswer(i) : undefined}
            />
          {/each}
        </div>
        {#if phase === 'PHASE_B'}
          {#if pollMode}
            <p class="news">Poll the Class: tap the answer to ask the class about.</p>
          {:else if q.helpResult}
            <p class="news">
              {#if q.helpResult.type === 'majority'}
                <b>Poll the Class:</b> most of the class chose {String.fromCharCode(65 + q.helpResult.choice)}.
              {:else if q.helpResult.type === 'ask' && noDevices}
                <b>Ask Two:</b> {one}, choose two classmates to explain their answers out loud.
              {:else if q.helpResult.type === 'poll'}
                <b>Poll the Class:</b> {q.helpResult.count} of {q.helpResult.total} in the class chose {String.fromCharCode(65 + q.helpResult.choice)}.
              {:else if q.helpResult.type === 'ask'}
                <b>Ask Two:</b>
                {#each q.helpResult.speakers as sp, i (sp.playerId)}{i > 0 ? ' and ' : ''}<b>{sp.nickname}</b>{/each}, explain your answers out loud!
              {/if}
            </p>
          {:else}
            <p class="hint">{noDevices ? `${one}, tap your answer up here.` : `${one}, answer on your device or tap your answer up here.`}</p>
          {/if}
        {:else if phase === 'ONE_LOCKED'}
          <p class="hint drum">Final answer locked in…</p>
        {:else if q.reveal}
          <p class="news verdict" class:good={q.reveal.oneCorrect} class:bad={!q.reveal.oneCorrect}>
            {#if noDevices}
              {@const majority = q.reveal.classMajority}
              {#if q.reveal.oneCorrect}
                <b>{one} is right!</b>
                {majority !== null && majority !== q.reveal.correct ? `${one} beat the class, and the` : 'The'} pot grows by {q.reveal.bankDelta}.
              {:else}
                <b>{one} misses!</b> One chance lost.
              {/if}
              {#if majority !== null}The class chose {String.fromCharCode(65 + majority)}.{/if}
            {:else if q.reveal.oneCorrect}
              <b>{one} is right!</b>
              {#if q.reveal.demoted.length}
                {q.reveal.demoted.map(name).join(', ')} {q.reveal.demoted.length === 1 ? 'falls' : 'fall'} to the Comeback Crew, and the pot grows by {q.reveal.bankDelta}.
              {:else}
                The whole class stood firm.
              {/if}
            {:else}
              <b>{one} misses!</b> One chance lost.
            {/if}
            {#if q.reveal.momentumFilled}<b> On a Roll: a chance is won back!</b>{/if}
          </p>
          {#if q.reveal.rescueEarned && !game.result}
            <p class="reward" role="status">
              <span class="burst" aria-hidden="true">💥</span>
              <span>
                <b>Boom! The class has earned a reward.</b>
                {game.crowdCount
                  ? `${game.classStreak?.length ?? 3} right in a row: next, the class votes someone back from the Comeback Crew.`
                  : 'A Rescue, saved until someone falls to the Comeback Crew.'}
              </span>
            </p>
          {/if}
          {#if q.reveal.explanation}<p class="explain"><Rich rich={q.rich?.explanation} text={q.reveal.explanation} /></p>{/if}
        {/if}
      {/if}
    </main>

    {#if phase === 'REVEAL' && game.result}
      <div class="over" role="status">
        <div class="scroll">
          <span class="label">Round over</span>
          <h2>{endHeadline(game.result.reason, one, game.result.bankedByOne)}</h2>
          <p>{endDetail(game.result.reason, one, game.result.payouts.filter((p) => p.playerId !== oneId).length, noDevices)}</p>
          <div class="payouts">
            {#each game.result.payouts.slice(0, 12) as p (p.playerId)}<span>{name(p.playerId)} +{p.points}</span>{/each}
          </div>
        </div>
      </div>
    {/if}
  {/if}

  {#if next}
    <button class="next" class:quiet={next.quiet} onclick={next.run}>{next.label} <span aria-hidden="true">▸</span></button>
  {/if}

  {#if view.paused}
    <div class="paused" role="status">
      <h2>Paused</h2>
      {#if view.pauseReason === 'one_disconnected' && q?.choices}
        <p>Waiting for {one} to reconnect… If {one} says their answer out loud, tap it:</p>
        <div class="row">
          {#each q.choices as _, i (i)}
            <button class="btn-ghost" onclick={() => host.run((e) => e.answerForOne(i))}>{String.fromCharCode(65 + i)}</button>
          {/each}
        </div>
      {:else}
        <button class="btn-primary big" onclick={() => host.run((e) => e.resume())}>Resume</button>
      {/if}
    </div>
  {/if}

  {#if host.notice}<p class="toast" role="alert">{host.notice}</p>{/if}
</div>

<style>
  .arena {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 1rem clamp(1rem, 2.5vw, 2rem) 1.25rem;
    gap: 1rem;
  }
  .dark {
    color: var(--paper);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .where {
    font-weight: 700;
    color: rgb(255 250 243 / 0.75);
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .conn {
    color: var(--amber-strong);
    font-weight: 700;
    font-size: 0.9rem;
  }
  .pin {
    font-size: 0.9rem;
    color: rgb(255 250 243 / 0.7);
  }
  .pin strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.4rem;
    color: var(--paper);
    letter-spacing: 0.05em;
  }
  .arena:not(.dark) .pin,
  .arena:not(.dark) .where {
    color: var(--muted);
  }
  .arena:not(.dark) .pin strong {
    color: var(--ink);
  }
  .tool {
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 10px;
    border: 1px solid rgb(255 250 243 / 0.25);
    background: rgb(255 250 243 / 0.08);
    color: inherit;
    font-size: 1.1rem;
    cursor: pointer;
  }
  .arena:not(.dark) .tool {
    border-color: var(--line-strong);
    background: var(--paper);
  }
  .menu-wrap {
    position: relative;
  }
  .menu {
    position: absolute;
    right: 0;
    top: calc(100% + 0.4rem);
    z-index: 10;
    display: grid;
    min-width: 12rem;
    padding: 0.35rem;
    background: var(--paper);
    border-radius: 10px;
    box-shadow: var(--shadow-dialog);
  }
  .menu button {
    text-align: left;
    background: none;
    border: none;
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
    font: inherit;
    color: var(--ink);
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--paper-low);
  }
  .menu .danger {
    color: var(--bad);
  }

  /* Round intro */
  .intro {
    flex: 1;
    display: grid;
    align-content: center;
    gap: 1.5rem;
  }
  .intro-text {
    text-align: center;
    opacity: 0;
    transform: translateY(10px);
    transition: 0.5s;
  }
  .intro-text.show {
    opacity: 1;
    transform: none;
  }
  .intro h1,
  .callout h1,
  .big-title {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.4rem, 5vw, 4.4rem);
    line-height: 1.05;
  }
  .intro p {
    max-width: 46rem;
    margin: 0.6rem auto 0;
    font-size: 1.2rem;
    color: rgb(255 250 243 / 0.75);
  }

  /* Champion versus the class */
  .versus {
    display: grid;
    grid-template-columns: minmax(16rem, 0.9fr) auto minmax(0, 2fr);
    align-items: center;
    gap: clamp(0.75rem, 2vw, 1.5rem);
    padding: 1rem 1.25rem;
    border-radius: 18px;
    background: rgb(255 250 243 / 0.05);
    border: 1px solid rgb(255 250 243 / 0.1);
  }
  .champion {
    position: relative;
    padding: 0.5rem;
    transition: opacity 0.5s;
    opacity: 0.6;
  }
  .champion.lit {
    opacity: 1;
  }
  .beam {
    position: absolute;
    inset: -2rem -1rem -1rem;
    background: radial-gradient(ellipse 60% 70% at 30% 45%, rgb(255 236 180 / 0.28), transparent 70%);
    opacity: 0;
    transition: opacity 0.6s;
    pointer-events: none;
  }
  .lit .beam {
    opacity: 1;
  }
  .champion .who {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .lit .who > :global(svg) {
    filter: drop-shadow(0 0 18px rgb(255 220 150 / 0.7));
  }
  .champion .name {
    display: block;
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.2rem, 3.6vw, 3.4rem);
    line-height: 1;
  }
  .label {
    color: inherit;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.7;
  }
  .offline {
    color: #f3a28f;
    font-weight: 700;
  }
  .purse {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    margin: 0.4rem 0;
    font-family: var(--display);
    font-size: 1.5rem;
  }
  .purse span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  .coin {
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fbe7a3, #d9a93a 60%, #a87d17);
    box-shadow: 0 0 0 2px rgb(0 0 0 / 0.2);
  }
  .shield {
    width: 1.1rem;
    height: 1.3rem;
    background: var(--gules);
    clip-path: polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%);
  }
  .shield.lost {
    background: rgb(255 250 243 / 0.2);
  }
  .lifelines {
    display: flex;
    gap: 0.45rem;
  }
  .lifelines button {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: none;
    background: var(--amber-strong);
    color: var(--night);
    cursor: pointer;
  }
  .lifelines button:disabled {
    cursor: default;
  }
  .lifelines button.used {
    background: rgb(255 250 243 / 0.12);
    color: rgb(255 250 243 / 0.35);
  }
  .lifelines button.armed {
    outline: 3px solid var(--paper);
    animation: pulse 0.8s infinite;
  }
  .vs span {
    display: grid;
    place-items: center;
    width: 4.2rem;
    height: 4.8rem;
    font-family: var(--display);
    font-size: 2.2rem;
    color: var(--night);
    background: var(--or);
    clip-path: polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%);
    padding-bottom: 0.8rem;
  }
  .horde {
    min-width: 0;
    display: grid;
    gap: 0.6rem;
    transition: opacity 0.5s;
    opacity: 0.6;
  }
  .horde.lit {
    opacity: 1;
  }
  .horde-head {
    display: flex;
    gap: 1rem;
    justify-content: center;
    font-size: 1.05rem;
  }
  .horde-head strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.5rem;
  }
  .crew-count {
    opacity: 0.6;
  }
  /* The Class Streak: a pip for each right answer toward the next Rescue. */
  .streak {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .pip {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    border: 1.5px solid rgb(240 210 124 / 0.7);
  }
  .pip.on {
    background: #f0d27c;
  }
  .saved {
    margin-left: 0.35rem;
    color: #f0d27c;
    font-size: 0.85rem;
  }
  .reward {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.8rem 1.1rem;
    border-radius: 14px;
    background: rgb(240 210 124 / 0.22);
    border: 2px solid #f0d27c;
    font-size: 1.15rem;
    animation: pop 500ms ease-out both;
  }
  .reward b {
    display: block;
    font-size: 1.4rem;
  }
  .burst {
    font-size: 2.6rem;
    line-height: 1;
  }
  .rescue {
    display: grid;
    gap: 1rem;
    justify-items: center;
    text-align: center;
  }
  .rescue h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2rem, 4vw, 3.2rem);
  }
  .rescue p {
    font-size: 1.2rem;
    color: rgb(255 250 243 / 0.75);
  }
  .boom {
    font-size: clamp(4rem, 9vw, 6rem);
    line-height: 1;
    animation: pop 500ms ease-out both;
  }
  .rescue-head {
    display: flex;
    align-items: center;
    gap: 2rem;
    text-align: left;
  }
  .candidates {
    list-style: none;
    display: grid;
    gap: 0.5rem;
    width: min(40rem, 100%);
    padding: 0;
  }
  .candidates li {
    display: grid;
    grid-template-columns: auto 9rem 1fr auto;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.2rem;
    text-align: left;
  }
  .candidates .who {
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .candidates .bar {
    height: 0.8rem;
    border-radius: 999px;
    background: linear-gradient(90deg, #f0d27c calc(var(--share) * 100%), rgb(255 250 243 / 0.12) 0);
  }
  .skip-rescue {
    border: 0;
    background: none;
    color: rgb(255 250 243 / 0.6);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }

  .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    min-width: 0;
    padding-bottom: 3.5rem;
  }
  .callout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
  }
  .eyes {
    font-size: clamp(4rem, 9vw, 7rem);
    line-height: 1;
  }
  .class-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }
  .class-head .question {
    flex: 1;
  }
  .the-class {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
  .the-class .name {
    display: block;
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.2rem, 3.6vw, 3.4rem);
  }
  .next-up input {
    font: inherit;
    font-weight: 700;
    font-size: 1.15rem;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    border: none;
  }
  .callout p {
    font-size: 1.25rem;
    color: rgb(255 250 243 / 0.75);
    margin-top: 0.5rem;
  }
  .tally {
    margin-left: 0.75rem;
    color: var(--paper);
  }
  .tally strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: 2rem;
  }
  .question {
    --picture-max: 38vh;
    background: var(--paper);
    color: var(--ink);
    padding: 1rem 1.5rem;
    border-radius: 14px;
    font-size: clamp(1.5rem, 2.8vw, 2.6rem);
    font-weight: 700;
    text-align: center;
    box-shadow: 0 8px 30px rgb(0 0 0 / 0.35);
    animation: pop 0.4s both;
  }
  .blocks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .blocks.three > :global(:last-child) {
    grid-column: 1 / -1;
  }
  .blocks.polling :global(.block) {
    outline: 3px dashed var(--paper);
    outline-offset: -6px;
  }
  .news,
  .hint,
  .explain {
    font-size: 1.2rem;
    text-align: center;
  }
  .hint {
    color: rgb(255 250 243 / 0.7);
  }
  .drum {
    animation: pulse 0.6s infinite;
  }
  .news {
    padding: 0.7rem 1rem;
    border-radius: 12px;
    background: rgb(240 210 124 / 0.18);
    border: 1px solid rgb(240 210 124 / 0.5);
  }
  .verdict.good {
    background: rgb(63 106 71 / 0.45);
    border-color: #7fb08a;
  }
  .verdict.bad {
    background: rgb(163 50 31 / 0.4);
    border-color: #e0806c;
  }
  .explain {
    font-family: var(--serif);
    font-style: italic;
    color: rgb(255 250 243 / 0.8);
  }

  /* Round over */
  .over {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgb(20 14 10 / 0.6);
    animation: rise 0.5s both;
  }
  .scroll {
    width: min(44rem, calc(100% - 2rem));
    display: grid;
    gap: 0.6rem;
    justify-items: center;
    text-align: center;
    padding: 2rem 2.5rem;
    background: var(--paper);
    color: var(--ink);
    border-radius: 16px;
    border: 4px double var(--or);
    box-shadow: 0 20px 60px rgb(0 0 0 / 0.5);
    animation: pop 0.5s both;
  }
  .scroll h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.2rem, 4vw, 3.4rem);
    color: var(--accent-dark);
  }
  .scroll p {
    font-size: 1.15rem;
    color: var(--ink-soft);
  }
  .payouts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
  }
  .payouts span {
    background: var(--good-wash);
    color: var(--good);
    font-weight: 800;
    border-radius: 999px;
    padding: 0.2rem 0.75rem;
  }

  /* Scoreboard */
  .board-wrap {
    flex: 1;
    display: grid;
    align-content: start;
    justify-items: center;
    gap: 1.25rem;
    padding-top: 1rem;
  }
  .kicker {
    color: var(--amber-strong);
    font-weight: 700;
  }
  .scores {
    list-style: none;
    width: min(46rem, 100%);
    display: grid;
    gap: 0.5rem;
  }
  .scores li {
    display: grid;
    grid-template-columns: 2.2rem auto 1fr auto;
    align-items: center;
    gap: 0.9rem;
    padding: 0.55rem 1.1rem;
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font-size: 1.35rem;
    animation: rise 0.4s both;
  }
  .scores li:nth-child(2) {
    animation-delay: 0.08s;
  }
  .scores li:nth-child(3) {
    animation-delay: 0.16s;
  }
  .scores li:nth-child(4) {
    animation-delay: 0.24s;
  }
  .scores .rank {
    font-family: var(--display);
    color: var(--accent);
    font-size: 1.6rem;
    text-align: center;
  }
  .scores .who {
    font-weight: 800;
  }
  .scores .pts {
    font-family: var(--display);
    font-size: 1.8rem;
  }
  .star {
    color: var(--accent);
  }
  .next-up {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.9rem;
    border-radius: 14px;
    background: rgb(240 210 124 / 0.15);
    border: 1px solid rgb(240 210 124 / 0.4);
  }
  .next-up select {
    font: inherit;
    font-weight: 700;
    font-size: 1.15rem;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    border: none;
    background: var(--paper);
    color: var(--ink);
  }
  .podium {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 12rem));
    align-items: end;
    gap: 1rem;
  }
  .step {
    display: grid;
    justify-items: center;
    gap: 0.25rem;
    text-align: center;
    animation: rise 0.6s both;
  }
  .step strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.8rem;
  }
  .plinth {
    width: 100%;
    display: grid;
    place-items: center;
    font-family: var(--display);
    font-size: 2.6rem;
    color: var(--paper);
    background: var(--accent);
    border-radius: 10px 10px 0 0;
    box-shadow: inset 0 -6px 0 rgb(0 0 0 / 0.15);
  }
  .s1 {
    order: 2;
  }
  .s1 .plinth {
    height: 9rem;
    background: var(--or);
  }
  .s2 {
    order: 1;
    animation-delay: 0.2s;
  }
  .s2 .plinth {
    height: 6.5rem;
    background: #8f949c;
  }
  .s3 {
    order: 3;
    animation-delay: 0.35s;
  }
  .s3 .plinth {
    height: 4.5rem;
    background: #a0623e;
  }
  .again {
    margin-top: 0.5rem;
  }

  .next {
    position: fixed;
    right: clamp(1rem, 2.5vw, 2rem);
    bottom: 1.25rem;
    z-index: 5;
    font: inherit;
    font-weight: 800;
    font-size: 1.3rem;
    padding: 0.85rem 1.8rem;
    border: none;
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    box-shadow:
      inset 0 -5px 0 rgb(0 0 0 / 0.18),
      0 8px 24px rgb(0 0 0 / 0.35);
    animation: pop 0.35s both;
  }
  .next.quiet {
    font-size: 1rem;
    padding: 0.6rem 1.2rem;
    background: rgb(255 250 243 / 0.15);
    color: var(--paper);
    box-shadow: none;
  }
  .paused {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 1rem;
    text-align: center;
    background: rgb(20 14 10 / 0.8);
    color: var(--paper);
  }
  .paused h2 {
    font-family: var(--display);
    font-weight: 400;
    font-size: 4rem;
  }
  .paused .row {
    display: flex;
    gap: 0.6rem;
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 1.25rem;
    transform: translateX(-50%);
    z-index: 30;
    background: var(--paper);
    color: var(--bad);
    font-weight: 700;
    padding: 0.6rem 1rem;
    border-radius: 10px;
  }
  @media (max-width: 52rem) {
    .stage {
      grid-template-columns: 1fr;
    }
    .champion {
      grid-template-columns: auto auto;
      padding: 0.5rem;
    }
    .callout {
      flex-direction: column;
      text-align: center;
    }
    .blocks {
      grid-template-columns: 1fr;
    }
  }
</style>
