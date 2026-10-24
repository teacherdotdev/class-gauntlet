<script lang="ts">
  // How a Champion round with no student devices goes, as four pictograms: the champion
  // looks away, the class votes by hand, the champion answers, and the Prize
  // Pot grows (twice as much when the champion beats the class).
  let { one }: { one: string } = $props();
</script>

<ol class="steps">
  <li>
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <defs><clipPath id="step1-disc"><circle cx="64" cy="64" r="58"/></clipPath></defs>
        <circle cx="64" cy="64" r="58" fill="#fffaf3"/>
        <g clip-path="url(#step1-disc)" stroke="#332a24" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
          <path d="M26 128 C26 100 42 88 64 88 C86 88 102 100 102 128 Z" fill="#b23f2c"/>
          <circle cx="64" cy="60" r="23" fill="#f4e0cf"/>
          <path d="M47 41 L50 25 L58 34 L64 22 L70 34 L78 25 L81 41 Z" fill="#f0d27c"/>
          <path d="M58 75 Q64 79 70 75" fill="none" stroke-width="3"/>
          <path d="M34 110 L42 74" fill="none" stroke-width="14"/>
          <path d="M34 110 L42 74" fill="none" stroke="#b23f2c" stroke-width="8"/>
          <path d="M94 110 L86 74" fill="none" stroke-width="14"/>
          <path d="M94 110 L86 74" fill="none" stroke="#b23f2c" stroke-width="8"/>
          <!-- palms flat over the eyes, below a strip of forehead -->
          <path d="M38 74 L38 60 Q38 53 45 53 L50 52 Q53 48 58 49 Q64 49 65 54 L65 68 Q65 74 59 74 Z" fill="#e6bf9c"/>
          <path d="M90 74 L90 60 Q90 53 83 53 L78 52 Q75 48 70 49 Q64 49 63 54 L63 68 Q63 74 69 74 Z" fill="#e6bf9c"/>
          <path d="M53 53 V62 M75 53 V62" fill="none" stroke-width="3"/>
        </g>
        <circle cx="64" cy="64" r="58" fill="none" stroke="#b38418" stroke-width="4"/>
      </svg>
    <span>1. {one} looks away</span>
  </li>
  <li>
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <defs><clipPath id="step2-disc"><circle cx="64" cy="64" r="58"/></clipPath></defs>
        <circle cx="64" cy="64" r="58" fill="#fffaf3"/>
        <g clip-path="url(#step2-disc)" stroke="#332a24" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
          <!-- left classmate -->
          <path d="M18 104 L24 58" fill="none" stroke-width="14"/>
          <path d="M18 104 L24 58" fill="none" stroke="#3f5a7c" stroke-width="8"/>
          <rect x="17" y="44" width="14" height="16" rx="7" fill="#e6bf9c"/>
          <path d="M6 128 C6 106 16 98 30 98 C44 98 52 106 52 128 Z" fill="#3f5a7c"/>
          <circle cx="30" cy="84" r="13" fill="#f4e0cf"/>
          <!-- right classmate -->
          <path d="M110 104 L104 58" fill="none" stroke-width="14"/>
          <path d="M110 104 L104 58" fill="none" stroke="#3c7150" stroke-width="8"/>
          <rect x="97" y="44" width="14" height="16" rx="7" fill="#e6bf9c"/>
          <path d="M76 128 C76 106 84 98 98 98 C112 98 122 106 122 128 Z" fill="#3c7150"/>
          <circle cx="98" cy="84" r="13" fill="#f4e0cf"/>
          <!-- front classmate: arm from the right shoulder, clear of the head -->
          <path d="M84 108 L86 40" fill="none" stroke-width="14"/>
          <path d="M84 108 L86 40" fill="none" stroke="#2f5d8f" stroke-width="8"/>
          <rect x="79" y="24" width="15" height="18" rx="7.5" fill="#e6bf9c"/>
          <path d="M38 128 C38 108 48 100 64 100 C80 100 90 108 90 128 Z" fill="#2f5d8f"/>
          <circle cx="62" cy="82" r="15" fill="#f4e0cf"/>
        </g>
        <circle cx="64" cy="64" r="58" fill="none" stroke="#b38418" stroke-width="4"/>
      </svg>
    <span>2. The class votes with their hands</span>
  </li>
  <li>
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <defs><clipPath id="step3-disc"><circle cx="64" cy="64" r="58"/></clipPath></defs>
        <circle cx="64" cy="64" r="58" fill="#fffaf3"/>
        <g clip-path="url(#step3-disc)" stroke="#332a24" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
          <!-- the four answers, the chosen one ringed in white -->
          <rect x="58" y="34" width="20" height="16" rx="3" fill="#b23f2c"/>
          <rect x="82" y="34" width="20" height="16" rx="3" fill="#2f5d8f"/>
          <rect x="82" y="54" width="20" height="16" rx="3" fill="#3c7150"/>
          <rect x="51" y="48" width="32" height="27" rx="6" fill="#fffaf3"/>
          <rect x="55" y="52" width="24" height="19" rx="3" fill="#d9a21b"/>
          <path d="M10 128 C10 106 22 98 38 98 C54 98 64 106 64 128 Z" fill="#b23f2c"/>
          <!-- arm bent at the elbow, fingertip on the tile's edge -->
          <path d="M50 110 L64 94 L60 80" fill="none" stroke-width="14"/>
          <path d="M50 110 L64 94 L60 80" fill="none" stroke="#b23f2c" stroke-width="8"/>
          <rect x="54" y="67" width="13" height="15" rx="6.5" fill="#e6bf9c"/>
          <circle cx="36" cy="82" r="15" fill="#f4e0cf"/>
          <path d="M24 71 L26 58 L32 65 L36 55 L40 65 L46 58 L48 71 Z" fill="#f0d27c"/>
        </g>
        <circle cx="64" cy="64" r="58" fill="none" stroke="#b38418" stroke-width="4"/>
      </svg>
    <span>3. {one} answers</span>
  </li>
  <li>
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <defs><clipPath id="step4-disc"><circle cx="64" cy="64" r="58"/></clipPath></defs>
        <circle cx="64" cy="64" r="58" fill="#fffaf3"/>
        <g clip-path="url(#step4-disc)" stroke="#332a24" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
          <!-- two up-arrows: the pot grows, and grows again -->
          <path d="M30 44 V30 H23 L36 15 L49 30 H42 V44 Z" fill="#3c7150"/>
          <path d="M86 44 V34 H80 L91 22 L102 34 H96 V44 Z" fill="#3c7150"/>
          <!-- a heap of coins in a round-bellied pot -->
          <circle cx="48" cy="54" r="9" fill="#d9a21b"/>
          <circle cx="80" cy="54" r="9" fill="#d9a21b"/>
          <circle cx="57" cy="42" r="9" fill="#f0d27c"/>
          <circle cx="72" cy="42" r="9" fill="#d9a21b"/>
          <circle cx="64" cy="54" r="10" fill="#f0d27c"/>
          <path d="M42 66 C26 72 26 100 40 108 Q46 112 54 112 H74 Q82 112 88 108 C102 100 102 72 86 66 Z" fill="#4e3b2f"/>
          <rect x="36" y="60" width="56" height="11" rx="5.5" fill="#6e5b4d"/>
        </g>
        <circle cx="64" cy="64" r="58" fill="none" stroke="#b38418" stroke-width="4"/>
      </svg>
    <span>4. Right: the pot grows. Beat the class: it grows twice as much</span>
  </li>
</ol>

<style>
  .steps {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: clamp(0.75rem, 2vw, 1.5rem);
    max-width: 56rem;
    margin: 1.25rem auto 0;
  }
  li {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 0.6rem;
    text-align: center;
  }
  svg {
    width: clamp(5.5rem, 11vw, 8.5rem);
    height: auto;
  }
  span {
    font-size: 1.1rem;
    color: rgb(255 250 243 / 0.85);
  }
  @media (max-width: 40rem) {
    .steps {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
