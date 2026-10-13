<script lang="ts">
  // A student's phone during Classic: the question and its answers, then
  // whether they got it, and their own results at the end. Nothing about
  // anyone else.
  import type { ClassicView } from '../game/classic/views';
  import { student } from '../student.svelte';
  import AnswerBlock from './AnswerBlock.svelte';
  import Avatar from './Avatar.svelte';
  import Shape from './Shape.svelte';

  let { view, seconds }: { view: ClassicView; seconds: number | null } = $props();

  const me = $derived(view.me!);
  const q = $derived(view.question);
  const letter = (i: number | null) => (i === null ? '' : String.fromCharCode(65 + i));
  const mood = $derived(view.phase === 'REVEAL' && me.right !== null ? (me.right ? 'good' : 'bad') : 'night');
</script>

<div class="classic {mood}">
  <header class="strip">
    <Avatar name={me.nickname} size={30} />
    <span class="me">{me.nickname}</span>
    <span class="spacer"></span>
    {#if view.phase === 'QUESTION' && seconds !== null}<span class="secs">{seconds}</span>{/if}
    <span class="pts">{view.scoring ? me.points : `${me.correctSoFar}/${me.asked}`}</span>
  </header>

  <section class="screen">
    {#if view.phase === 'LOBBY'}
      <div class="moment">
        <Avatar name={me.nickname} size={96} />
        <h1>You’re in!</h1>
        <p>See your name on the screen?</p>
      </div>
    {:else if view.phase === 'QUESTION' && q}
      {#if me.canAnswer}
        <p class="prompt">{q.prompt}</p>
        <div class="pad" class:four={q.choices.length === 4}>
          {#each q.choices as text, i (i)}
            <AnswerBlock index={i} {text} big onclick={() => student.classicAnswer(i)} />
          {/each}
        </div>
      {:else}
        <div class="moment">
          {#if me.answer !== null}<div class="stamp"><Shape index={me.answer} size={72} /></div>{/if}
          <h1>{me.answer !== null ? 'Locked in!' : 'Hang tight'}</h1>
          <p>{me.answer !== null ? `${q.answered} of ${q.answering} answered` : 'You’ll answer the next question.'}</p>
        </div>
      {/if}
    {:else if view.phase === 'REVEAL' && q}
      <div class="moment">
        {#if me.right === null}
          <h1>No answer</h1>
        {:else}
          <h1 class="shout">{me.right ? 'Correct!' : 'Not quite'}</h1>
        {/if}
        {#if q.correct !== null}<p>The answer was <b>{letter(q.correct)}: {q.choices[q.correct]}</b></p>{/if}
        {#if q.explanation}<p class="note">{q.explanation}</p>{/if}
      </div>
    {:else}
      <div class="moment">
        <p class="score">{me.correctSoFar} / {me.asked}</p>
        <h1>{me.correctSoFar === me.asked && me.asked ? 'A perfect round!' : 'Well fought!'}</h1>
        {#if view.scoring}<p>{me.points} points</p>{/if}
        <p>{view.phase === 'ENDED' ? 'Thanks for playing!' : 'Look at the board.'}</p>
      </div>
    {/if}
  </section>
</div>

<style>
  .classic {
    flex: 1;
    display: flex;
    flex-direction: column;
    transition: background 0.4s;
  }
  .classic.good {
    background: var(--vert);
  }
  .classic.bad {
    background: var(--gules);
  }
  .strip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.75rem;
    background: rgb(0 0 0 / 0.25);
  }
  .me {
    font-weight: 800;
    max-width: 10rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
  .score {
    font-family: var(--display);
    font-size: 4.5rem !important;
    line-height: 1;
    color: var(--paper) !important;
  }
  .note {
    font-style: italic;
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
    background: var(--paper);
    color: var(--ink);
    font-family: var(--serif);
    font-weight: 700;
    font-size: 1.2rem;
    text-align: center;
    padding: 0.8rem 1rem;
    border-radius: 12px;
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
  .pad :global(.block .text) {
    flex: none;
    font-size: 1.5rem;
  }
</style>
