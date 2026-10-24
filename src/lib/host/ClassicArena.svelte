<script lang="ts">
  // Classic on the projector: each question with its timer and how many have
  // answered, then the answer with how many chose each (never who). At the
  // end, the Report: the class's results per question, and each student's
  // results behind a button, since the board is on show to the class.
  // With no student devices there are no answers to count: the timer is a guide,
  // the teacher shows the answer, and the end is just the end.
  import Rich from '../rich/Rich.svelte';
  import AnswerBlock from '../components/AnswerBlock.svelte';
  import TimerRing from '../components/TimerRing.svelte';
  import { host } from '../host.svelte';
  import { hostKey } from './keys';
  import { spacedCode } from '../protocol';
  import { plural } from '../words';

  const v = $derived(host.classicView!);
  const s = $derived(host.classic!);
  const q = $derived(v.question);
  let showStudents = $state(false);
  const pct = (n: number, of: number) => (of ? Math.round((100 * n) / of) : 0);
  // With no student devices nothing moves when time's up, so watch the clock here.
  let now = $state(Date.now());
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 250);
    return () => clearInterval(timer);
  });
  const timeUp = $derived(v.phase === 'QUESTION' && s.deadline !== null && now >= s.deadline);

  function onkeydown(event: KeyboardEvent) {
    if (hostKey(event)?.kind !== 'next') return;
    event.preventDefault();
    if (v.phase === 'QUESTION') host.runClassic((e) => e.lock());
    else if (v.phase === 'REVEAL') host.runClassic((e) => e.next());
  }
</script>

<svelte:window {onkeydown} />

<div class="arena">
  <header class="top">
    {#if v.noDevices}<span class="pin">No student devices</span>{:else}<span class="pin">PIN <strong>{spacedCode(v.code)}</strong></span>{/if}
    <span class="where">{q ? `Question ${q.number} of ${q.total}` : v.title}</span>
    {#if v.phase !== 'ENDED'}<button class="quiet" onclick={() => host.finish()}>End game</button>{/if}
  </header>
  {#if host.notice}<p class="notice" role="alert">{host.notice}</p>{/if}

  {#if q}
    <section class="question">
      <div class="head">
        <h1 class="prompt"><Rich rich={q.rich?.prompt} text={q.prompt ?? ''} /></h1>
        {#if v.phase === 'QUESTION'}<TimerRing deadline={s.deadline} totalMs={s.settings.timerSeconds * 1000} size={110} />{/if}
      </div>
      <div class="choices" class:four={q.choices.length === 4}>
        {#each q.choices as text, i (i)}
          <AnswerBlock
            index={i}
            {text} rich={q.rich?.choices[i]}
            big
            state={q.correct === null ? 'idle' : i === q.correct ? 'correct' : 'faded'}
            count={q.counts && !v.noDevices ? q.counts[i] : null}
            total={q.answered}
          />
        {/each}
      </div>
      <div class="foot">
        {#if v.phase === 'QUESTION' && v.noDevices}
          <p class="status">{timeUp ? 'Time’s up! Answers up, everyone.' : 'Answer on your whiteboard or with your hand.'}</p>
          <button class="go" onclick={() => host.runClassic((e) => e.lock())}>Show the answer ▸</button>
        {:else if v.phase === 'QUESTION'}
          <p class="status"><strong>{q.answered}</strong> of {q.answering} answered</p>
          <button class="quiet" onclick={() => host.runClassic((e) => e.lock())}>Show the answer now</button>
        {:else if v.noDevices}
          <p class="status">{#if q.explanation}<Rich rich={q.rich?.explanation} text={q.explanation} />{/if}</p>
          <button class="go" onclick={() => host.runClassic((e) => e.next())}>{q.number < q.total ? 'Next question ▸' : 'Finish ▸'}</button>
        {:else}
          <p class="status">
            <strong>{pct(q.counts?.[q.correct ?? 0] ?? 0, q.answered)}%</strong> got it right{#if q.explanation} · <Rich rich={q.rich?.explanation} text={q.explanation} />{/if}
          </p>
          <button class="go" onclick={() => host.runClassic((e) => e.next())}>{q.number < q.total ? 'Next question ▸' : 'See the report ▸'}</button>
        {/if}
      </div>
    </section>
  {:else if v.noDevices && (v.phase === 'REPORT' || v.phase === 'ENDED')}
    <section class="done">
      <h1 class="big-title">That’s every question!</h1>
      <p>{plural(v.question?.total ?? s.questions.length, 'question')} reviewed together.</p>
      {#if v.phase === 'REPORT'}
        <button class="go" onclick={() => host.finish()}>End the review</button>
      {:else}
        <a class="go" href="/games" onclick={() => host.close()}>Back to games</a>
      {/if}
    </section>
  {:else if v.report}
    <section class="report">
      <h1 class="big-title">{v.phase === 'ENDED' ? 'Game over' : 'The report'}</h1>
      <ol class="questions">
        {#each v.report.questions as row, i (i)}
          {@const right = pct(row.correct, row.answered)}
          <li class:hard={right < 50}>
            <span class="n">{i + 1}</span>
            <span class="text">{row.prompt}</span>
            <span class="meter" aria-hidden="true"><span style="width: {right}%"></span></span>
            <strong>{right}%</strong>
            <small>{row.correct} of {row.answered} right</small>
          </li>
        {/each}
      </ol>
      <div class="actions">
        <button class="quiet" onclick={() => (showStudents = !showStudents)} aria-expanded={showStudents}>
          {showStudents ? 'Hide' : 'Show'} each student’s results
        </button>
        {#if v.phase === 'REPORT'}<button class="go" onclick={() => host.finish()}>Finish and save to History</button>{/if}
      </div>
      {#if showStudents}
        <table class="students">
          <thead><tr><th>Student</th><th>Right</th>{#if v.scoring}<th>Points</th>{/if}</tr></thead>
          <tbody>
            {#each v.report.students as student (student.nickname)}
              <tr>
                <td>{student.nickname}</td>
                <td>{student.correct} of {plural(student.answered, 'answer')}</td>
                {#if v.scoring}<td>{student.points}</td>{/if}
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>
  {/if}
</div>

<style>
  .arena {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem clamp(1rem, 3vw, 2.5rem) 2rem;
    color: var(--paper);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .pin {
    color: rgb(255 250 243 / 0.7);
  }
  .where {
    flex: 1;
    text-align: center;
    font-family: var(--serif);
    font-style: italic;
    color: rgb(255 250 243 / 0.75);
  }
  .quiet {
    font: inherit;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    border: 1px solid rgb(255 250 243 / 0.3);
    background: transparent;
    color: var(--paper);
    cursor: pointer;
  }
  .notice {
    text-align: center;
    color: var(--amber-strong);
  }
  .question {
    flex: 1;
    display: grid;
    align-content: center;
    gap: 1.25rem;
    max-width: 72rem;
    width: 100%;
    margin: 0 auto;
  }
  .head {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    justify-content: space-between;
  }
  .prompt {
    --picture-max: 38vh;
    font-family: var(--serif);
    font-size: clamp(1.8rem, 4vw, 3.2rem);
    line-height: 1.2;
  }
  .choices {
    display: grid;
    gap: 0.75rem;
  }
  .choices.four {
    grid-template-columns: 1fr 1fr;
  }
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .status {
    font-size: 1.4rem;
  }
  .go {
    font: inherit;
    font-weight: 800;
    font-size: 1.2rem;
    padding: 0.8rem 2rem;
    border-radius: 12px;
    border: none;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    box-shadow: inset 0 -5px 0 rgb(0 0 0 / 0.18);
  }
  .done {
    flex: 1;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 1.25rem;
    text-align: center;
    font-size: 1.3rem;
  }
  .done a.go {
    text-decoration: none;
  }
  .report {
    display: grid;
    gap: 1rem;
    max-width: 60rem;
    width: 100%;
    margin: 0 auto;
  }
  .big-title {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.4rem, 6vw, 4rem);
    text-align: center;
  }
  .questions {
    list-style: none;
    display: grid;
    gap: 0.5rem;
  }
  .questions li {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr) 10rem 3.5rem;
    gap: 0.2rem 1rem;
    align-items: center;
    padding: 0.7rem 1rem;
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
  }
  .questions li.hard {
    box-shadow: inset 4px 0 0 var(--gules);
  }
  .n {
    font-family: var(--display);
    font-size: 1.4rem;
    color: var(--accent);
  }
  .questions small {
    grid-column: 2;
    color: var(--muted);
  }
  .meter {
    height: 0.7rem;
    border-radius: 999px;
    background: var(--paper-low);
    overflow: hidden;
  }
  .meter span {
    display: block;
    height: 100%;
    background: var(--vert);
  }
  .actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  .students {
    width: 100%;
    border-collapse: collapse;
    background: var(--paper);
    color: var(--ink);
    border-radius: 12px;
    overflow: hidden;
  }
  .students th,
  .students td {
    text-align: left;
    padding: 0.55rem 1rem;
    border-bottom: 1px solid var(--line);
  }
  @media (max-width: 40rem) {
    .choices.four {
      grid-template-columns: 1fr;
    }
    .questions li {
      grid-template-columns: 2rem minmax(0, 1fr) 3.5rem;
    }
    .meter {
      display: none;
    }
  }
</style>
