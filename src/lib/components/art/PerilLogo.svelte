<script lang="ts">
  // Peril!'s title tile: a winged dragon peeking over a board of tiles, beside an open treasure chest.
  // Drawn as SVG and checked by eye at tile size; regenerate from the art
  // scratch files rather than editing by hand.
  let { size = 480 }: { size?: number } = $props();
</script>

<svg width={size} height={size * 0.625} role="img" aria-label="Peril!" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300">
<defs>
<linearGradient id="peril-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dd8e"/><stop offset="0.5" stop-color="#d4a434"/><stop offset="1" stop-color="#8f6612"/></linearGradient>
<radialGradient id="peril-field" cx="0.3" cy="0.3" r="0.9"><stop offset="0" stop-color="#6e4d34"/><stop offset="0.6" stop-color="#55392a"/><stop offset="1" stop-color="#3f2b20"/></radialGradient>
<radialGradient id="peril-nail" cx="0.35" cy="0.32" r="0.7"><stop offset="0" stop-color="#fff3c8"/><stop offset="0.5" stop-color="#d9a93a"/><stop offset="1" stop-color="#7d5a10"/></radialGradient>
<linearGradient id="peril-wood" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#a8703e"/><stop offset="1" stop-color="#5e3b1e"/></linearGradient>
<linearGradient id="peril-tile" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#5384ba"/><stop offset="1" stop-color="#244a74"/></linearGradient>
<linearGradient id="peril-gold" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset="0.45" stop-color="#e8b840"/><stop offset="1" stop-color="#9c7214"/></linearGradient>
<linearGradient id="peril-skin" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#7fbb8e"/><stop offset="0.45" stop-color="#4b8a5f"/><stop offset="1" stop-color="#2a5138"/></linearGradient>
<linearGradient id="peril-skin2" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#5f9e72"/><stop offset="0.5" stop-color="#3c7150"/><stop offset="1" stop-color="#244632"/></linearGradient>
<linearGradient id="peril-jaw" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#4b8a5f"/><stop offset="1" stop-color="#25472f"/></linearGradient>
<linearGradient id="peril-belly" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6e2a2"/><stop offset="1" stop-color="#c9a24c"/></linearGradient>
<linearGradient id="peril-horn" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stop-color="#fffaf3"/><stop offset="0.5" stop-color="#e3cfa8"/><stop offset="1" stop-color="#9c825a"/></linearGradient>
<linearGradient id="peril-frill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9634a"/><stop offset="1" stop-color="#8a2c1d"/></linearGradient>
<radialGradient id="peril-eye" cx="0.4" cy="0.4" r="0.7"><stop offset="0" stop-color="#fff2b0"/><stop offset="0.6" stop-color="#f0c040"/><stop offset="1" stop-color="#c07818"/></radialGradient>
<linearGradient id="peril-gules" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2694d"/><stop offset="0.5" stop-color="#b23f2c"/><stop offset="1" stop-color="#6e2216"/></linearGradient>
<radialGradient id="peril-dot" cx="0.35" cy="0.32" r="0.75"><stop offset="0" stop-color="#e2694d"/><stop offset="0.5" stop-color="#b23f2c"/><stop offset="1" stop-color="#6e2216"/></radialGradient>
<linearGradient id="peril-iron" x1="0" x2="1"><stop offset="0" stop-color="#c9ccd1"/><stop offset="0.5" stop-color="#8f949c"/><stop offset="1" stop-color="#5f646b"/></linearGradient>
<linearGradient id="peril-lidin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2e18"/><stop offset="0.6" stop-color="#8a5a2c"/><stop offset="1" stop-color="#d9a64a"/></linearGradient>
<radialGradient id="peril-glow" cx="0.5" cy="0.62" r="0.5"><stop offset="0" stop-color="#ffe9a0" stop-opacity="0.9"/><stop offset="0.5" stop-color="#f0d27c" stop-opacity="0.3"/><stop offset="1" stop-color="#f0d27c" stop-opacity="0"/></radialGradient>
<radialGradient id="peril-coin" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff0b8"/><stop offset="0.5" stop-color="#e8b840"/><stop offset="1" stop-color="#9c7214"/></radialGradient>
<g id="peril-d1"><path d="M2.5 3.5 L6 1 V15"/></g>
<g id="peril-d2"><path d="M1.2 4.5 Q1.5 1 5 1 Q8.8 1 8.8 4.5 Q8.8 7.2 5.2 10.2 L1.2 15 H9"/></g>
<g id="peril-d3"><path d="M1.2 3 Q2.8 1 5 1 Q8.8 1 8.8 4.2 Q8.8 7.6 4.6 7.8 Q9.4 8 9.4 11.6 Q9.4 15 5 15 Q2.4 15 1 13"/></g>
<g id="peril-d0"><ellipse cx="5" cy="8" rx="4" ry="7"/></g>
<linearGradient id="peril-ray" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe9a0" stop-opacity="0.75"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></linearGradient>
<linearGradient id="peril-skinlite" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#9bd3a8"/><stop offset="0.5" stop-color="#5f9e72"/><stop offset="1" stop-color="#36654a"/></linearGradient>
<linearGradient id="peril-torso" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stop-color="#7cb98c"/><stop offset="0.55" stop-color="#4f8c64"/><stop offset="1" stop-color="#2f5a3f"/></linearGradient>
<clipPath id="peril-fieldclip"><rect x="26" y="46" width="428" height="228" rx="10"/></clipPath>
</defs>
<g stroke="#332a24" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
<rect x="10" y="30" width="460" height="260" rx="26" fill="url(#peril-frame)"/>
<rect x="24" y="44" width="432" height="232" rx="12" fill="url(#peril-field)" stroke-width="4"/>
<circle cx="22.6" cy="42.6" r="3.1" fill="url(#peril-nail)" stroke-width="2"/>
<circle cx="21.400000000000002" cy="41.4" r="1.1" fill="#fffaf3" stroke="none"/>
<circle cx="457.4" cy="42.6" r="3.1" fill="url(#peril-nail)" stroke-width="2"/>
<circle cx="456.2" cy="41.4" r="1.1" fill="#fffaf3" stroke="none"/>
<circle cx="22.6" cy="277.4" r="3.1" fill="url(#peril-nail)" stroke-width="2"/>
<circle cx="21.400000000000002" cy="276.2" r="1.1" fill="#fffaf3" stroke="none"/>
<circle cx="457.4" cy="277.4" r="3.1" fill="url(#peril-nail)" stroke-width="2"/>
<circle cx="456.2" cy="276.2" r="1.1" fill="#fffaf3" stroke="none"/>
<path d="M268 128 Q254 96 252 58 L240 72 Q244.2 76.2 240 100 Q246.2 93.1 246 124 Q253.3 103.5 262 132 Z" fill="url(#peril-frill)"/>
<path d="M252 58 L240 100 L246 124 Z" fill="#241c17" opacity="0.18" stroke="none"/>
<path d="M252 58 L240 72" fill="none" stroke-width="3"/>
<path d="M252 58 L240 100" fill="none" stroke-width="3"/>
<path d="M252 58 L246 124" fill="none" stroke-width="3"/>
<path d="M268 128 Q254 96 252 58" fill="none" stroke-width="10"/>
<path d="M268 128 Q254 96 252 58" fill="none" stroke="#5f9e72" stroke-width="5"/>
<path d="M249 60 L252 49 L255 60 Z" fill="url(#peril-horn)" stroke-width="2.5"/>
<path d="M412 126 Q428 94 426 56 L448 70 Q441.6 74.8 452 100 Q440.9 93.0 446 126 Q432.5 104.1 426 134 Z" fill="url(#peril-frill)"/>
<path d="M426 56 L452 100 L446 126 Z" fill="#241c17" opacity="0.18" stroke="none"/>
<path d="M426 56 L448 70" fill="none" stroke-width="3"/>
<path d="M426 56 L452 100" fill="none" stroke-width="3"/>
<path d="M426 56 L446 126" fill="none" stroke-width="3"/>
<path d="M412 126 Q428 94 426 56" fill="none" stroke-width="10"/>
<path d="M412 126 Q428 94 426 56" fill="none" stroke="#5f9e72" stroke-width="5"/>
<path d="M423 58 L426 47 L429 58 Z" fill="url(#peril-horn)" stroke-width="2.5"/>
<path d="M242 138 C242 114 258 102 278 104 C296 106 308 118 308 138 Z" fill="url(#peril-torso)"/>
<path d="M250 114 C258 106 270 104 282 106" fill="none" stroke="#bfe6c6" stroke-width="2.5" opacity="0.7"/>
<path d="M380 138 C382 116 400 104 418 106 C436 108 446 120 446 138 Z" fill="url(#peril-torso)"/>
<path d="M396 112 C406 106 418 105 428 108" fill="none" stroke="#bfe6c6" stroke-width="2.5" opacity="0.7"/>
<path d="M308 140 C326 112 364 96 398 92 C420 92 436 110 440 140 Z" fill="url(#peril-torso)"/>
<path d="M424 104 C430 116 432 128 432 138" fill="none" stroke="#bfe6c6" stroke-width="2.5" opacity="0.7"/>
<g fill="none" stroke-width="3" opacity="0.4"><path d="M404 118 q7 -6 14 0"/><path d="M398 132 q7 -6 14 0"/></g>
<rect x="244" y="134" width="198" height="136" rx="8" fill="none" stroke-width="14"/>
<rect x="244" y="134" width="198" height="136" rx="8" fill="none" stroke="#f0d27c" stroke-width="10"/>
<rect x="244" y="134" width="198" height="136" rx="8" fill="url(#peril-wood)"/>
<g fill="none" stroke-width="2.5" opacity="0.35"><path d="M300 142 Q350 140 400 143"/><path d="M280 265 Q340 267 410 264"/></g>
<rect x="256" y="156" width="54" height="30" rx="4" fill="url(#peril-tile)" stroke-width="3.5"/>
<path d="M261 181 V162 Q261 160 264 160 H288" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.3"/>
<use href="#peril-d1" x="267.5" y="163" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="278.0" y="163" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="288.5" y="163" fill="none" stroke-width="5.5"/>
<use href="#peril-d1" x="267.5" y="163" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="278.0" y="163" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="288.5" y="163" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<rect x="316" y="156" width="54" height="30" rx="4" fill="url(#peril-tile)" stroke-width="3.5"/>
<path d="M321 181 V162 Q321 160 324 160 H348" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.3"/>
<use href="#peril-d1" x="327.5" y="163" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="338.0" y="163" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="348.5" y="163" fill="none" stroke-width="5.5"/>
<use href="#peril-d1" x="327.5" y="163" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="338.0" y="163" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="348.5" y="163" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<rect x="376" y="156" width="54" height="30" rx="4" fill="url(#peril-tile)" stroke-width="3.5"/>
<path d="M381 181 V162 Q381 160 384 160 H408" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.3"/>
<use href="#peril-d1" x="387.5" y="163" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="398.0" y="163" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="408.5" y="163" fill="none" stroke-width="5.5"/>
<use href="#peril-d1" x="387.5" y="163" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="398.0" y="163" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="408.5" y="163" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<rect x="256" y="192" width="54" height="30" rx="4" fill="url(#peril-tile)" stroke-width="3.5"/>
<path d="M261 217 V198 Q261 196 264 196 H288" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.3"/>
<use href="#peril-d2" x="267.5" y="199" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="278.0" y="199" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="288.5" y="199" fill="none" stroke-width="5.5"/>
<use href="#peril-d2" x="267.5" y="199" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="278.0" y="199" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="288.5" y="199" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<rect x="316" y="192" width="54" height="30" rx="4" fill="url(#peril-tile)" stroke-width="3.5"/>
<path d="M321 217 V198 Q321 196 324 196 H348" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.3"/>
<use href="#peril-d2" x="327.5" y="199" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="338.0" y="199" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="348.5" y="199" fill="none" stroke-width="5.5"/>
<use href="#peril-d2" x="327.5" y="199" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="338.0" y="199" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="348.5" y="199" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<rect x="376" y="192" width="54" height="30" rx="4" fill="url(#peril-tile)" stroke-width="3.5"/>
<path d="M381 217 V198 Q381 196 384 196 H408" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.3"/>
<use href="#peril-d2" x="387.5" y="199" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="398.0" y="199" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="408.5" y="199" fill="none" stroke-width="5.5"/>
<use href="#peril-d2" x="387.5" y="199" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="398.0" y="199" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="408.5" y="199" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<rect x="256" y="228" width="54" height="30" rx="4" fill="url(#peril-tile)" stroke-width="3.5"/>
<path d="M261 253 V234 Q261 232 264 232 H288" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.3"/>
<use href="#peril-d3" x="267.5" y="235" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="278.0" y="235" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="288.5" y="235" fill="none" stroke-width="5.5"/>
<use href="#peril-d3" x="267.5" y="235" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="278.0" y="235" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="288.5" y="235" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<rect x="316" y="228" width="54" height="30" rx="4" fill="url(#peril-tile)" stroke-width="3.5"/>
<path d="M321 253 V234 Q321 232 324 232 H348" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.3"/>
<use href="#peril-d3" x="327.5" y="235" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="338.0" y="235" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="348.5" y="235" fill="none" stroke-width="5.5"/>
<use href="#peril-d3" x="327.5" y="235" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="338.0" y="235" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="348.5" y="235" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<rect x="376" y="228" width="54" height="30" rx="4" fill="url(#peril-tile)" stroke-width="3.5"/>
<path d="M381 253 V234 Q381 232 384 232 H408" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.3"/>
<use href="#peril-d3" x="387.5" y="235" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="398.0" y="235" fill="none" stroke-width="5.5"/>
<use href="#peril-d0" x="408.5" y="235" fill="none" stroke-width="5.5"/>
<use href="#peril-d3" x="387.5" y="235" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="398.0" y="235" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<use href="#peril-d0" x="408.5" y="235" fill="none" stroke="#f0d27c" stroke-width="2.6"/>
<circle cx="250" cy="145" r="3.1" fill="url(#peril-nail)" stroke-width="2"/>
<circle cx="248.8" cy="143.8" r="1.1" fill="#fffaf3" stroke="none"/>
<circle cx="436" cy="145" r="3.1" fill="url(#peril-nail)" stroke-width="2"/>
<circle cx="434.8" cy="143.8" r="1.1" fill="#fffaf3" stroke="none"/>
<circle cx="250" cy="264" r="3.1" fill="url(#peril-nail)" stroke-width="2"/>
<circle cx="248.8" cy="262.8" r="1.1" fill="#fffaf3" stroke="none"/>
<circle cx="436" cy="264" r="3.1" fill="url(#peril-nail)" stroke-width="2"/>
<circle cx="434.8" cy="262.8" r="1.1" fill="#fffaf3" stroke="none"/>
<g transform="translate(8 0) scale(0.9)">
<path d="M418 56 C428 38 444 26 464 22 C454 32 446 46 440 62 Z" fill="url(#peril-horn)"/>
<path d="M390 54 C394 32 408 16 432 6 C424 20 418 36 414 54 Z" fill="url(#peril-horn)"/>
<g fill="none" stroke-width="3" opacity="0.5"><path d="M397 38 Q406 40 414 36"/><path d="M405 24 Q412 26 420 22"/><path d="M429 44 Q436 46 442 42"/></g>
<path d="M424 110 L452 102 L440 120 L452 134 L432 132 L438 150 L414 138 Z" fill="url(#peril-frill)"/>
<path d="M300 104 L406 114 L408 120 L318 132 Z" fill="#5e1c12" stroke-width="4"/>
<path d="M316 128 C344 126 380 122 406 116 L426 118 C424 132 412 140 396 142 C368 146 340 146 322 142 C314 140 312 134 316 128 Z" fill="url(#peril-jaw)"/>
<path d="M320.5 127.0 L325 116.0 L329.5 127.0 Z" fill="#fffaf3" stroke-width="2.5"/>
<path d="M341.5 124.9 L346 117.9 L350.5 124.9 Z" fill="#fffaf3" stroke-width="2.5"/>
<path d="M361.5 122.9 L366 116.9 L370.5 122.9 Z" fill="#fffaf3" stroke-width="2.5"/>
<path d="M330 136 Q360 136 392 132" fill="none" stroke="#fffaf3" stroke-width="3" opacity="0.25"/>
<path d="M303 74 L312 50 L324 76 Z" fill="url(#peril-horn)" stroke-width="4"/>
<path d="M292 92 C288 80 296 70 308 70 C316 70 320 74 326 76 C336 76 344 74 350 70 C356 58 372 48 392 44 C424 40 450 58 450 86 C450 102 442 112 430 116 L404 116 C376 112 330 108 304 106 C294 104 292 98 292 92 Z" fill="url(#peril-skin)"/>
<path d="M305.5 105.0 L310 118.0 L314.5 106.0 Z" fill="#fffaf3" stroke-width="2.5"/>
<path d="M321.5 106.1 L326 115.1 L330.5 107.1 Z" fill="#fffaf3" stroke-width="2.5"/>
<path d="M337.5 107.2 L342 116.2 L346.5 108.2 Z" fill="#fffaf3" stroke-width="2.5"/>
<path d="M353.5 108.4 L358 116.4 L362.5 109.4 Z" fill="#fffaf3" stroke-width="2.5"/>
<path d="M369.5 109.5 L374 117.5 L378.5 110.5 Z" fill="#fffaf3" stroke-width="2.5"/>
<path d="M450 86 C450 102 442 112 430 116 L404 116 C420 108 432 94 434 76 C442 72 450 76 450 86 Z" fill="#241c17" opacity="0.22" stroke="none"/>
<path d="M342 68 C352 54 374 46 398 52 C401 58 397 63 388 63 C372 63 358 68 348 74 C341 75 339 72 342 68 Z" fill="url(#peril-jaw)" stroke-width="4"/>
<path d="M352 78 C358 70 374 68 386 74 C380 84 364 86 352 78 Z" fill="url(#peril-eye)" stroke-width="3.5"/>
<ellipse cx="361" cy="78" rx="2.4" ry="6" fill="#241c17" stroke="none"/>
<circle cx="365" cy="74.5" r="2" fill="#fffaf3" stroke="none"/>
<path d="M298 84 Q303 78 309 81" fill="none" stroke-width="4"/>
<g fill="none" stroke="#fffaf3" stroke-width="3.5" opacity="0.4"><path d="M300 78 Q304 73 310 73"/><path d="M328 81 Q338 80 346 77"/><path d="M378 55 Q394 49 412 50"/></g>
<g fill="none" stroke-width="3" opacity="0.4"><path d="M404 84 q7 -6 14 0"/><path d="M414 98 q7 -6 14 0"/><path d="M398 100 q7 -6 14 0"/></g>
</g>
<path d="M245 136 C245 122 257 114 271 114 C285 114 297 122 297 136 Z" fill="url(#peril-skin2)"/>
<path d="M255 121 Q265 116 277 117" fill="none" stroke="#bfe6c6" stroke-width="2.5" opacity="0.6"/>
<g transform="translate(256 128) rotate(10)">
<path d="M-5 15 C-5.5 23 -2 26 3 28 C2 22 5 21 5 15 Z" fill="url(#peril-horn)" stroke-width="3"/>
<path d="M-8.5 3 C-8.5 -5.5 8.5 -5.5 8.5 3 C8.5 10.5 5 19 0 19 C-5 19 -8.5 10.5 -8.5 3 Z" fill="url(#peril-skin)" stroke-width="4"/>
<path d="M-4.5 9.5 Q0 12.0 4.5 9.5" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M-4.5 -1 Q-1 -3.5 3 -2.5" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.55"/>
</g>
<g transform="translate(271 128) rotate(0)">
<path d="M-5 19 C-5.5 27 -2 31 3 33 C2 27 5 25 5 19 Z" fill="url(#peril-horn)" stroke-width="3"/>
<path d="M-8.5 3 C-8.5 -5.5 8.5 -5.5 8.5 3 C8.5 12.7 5 23 0 23 C-5 23 -8.5 12.7 -8.5 3 Z" fill="url(#peril-skin)" stroke-width="4"/>
<path d="M-4.5 11.5 Q0 14.0 4.5 11.5" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M-4.5 -1 Q-1 -3.5 3 -2.5" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.55"/>
</g>
<g transform="translate(286 128) rotate(-8)">
<path d="M-5 15 C-5.5 23 -2 26 3 28 C2 22 5 21 5 15 Z" fill="url(#peril-horn)" stroke-width="3"/>
<path d="M-8.5 3 C-8.5 -5.5 8.5 -5.5 8.5 3 C8.5 10.5 5 19 0 19 C-5 19 -8.5 10.5 -8.5 3 Z" fill="url(#peril-skin)" stroke-width="4"/>
<path d="M-4.5 9.5 Q0 12.0 4.5 9.5" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M-4.5 -1 Q-1 -3.5 3 -2.5" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.55"/>
</g>
<path d="M389 138 C389 124 401 116 415 116 C429 116 441 124 441 138 Z" fill="url(#peril-skin2)"/>
<path d="M399 123 Q409 118 421 119" fill="none" stroke="#bfe6c6" stroke-width="2.5" opacity="0.6"/>
<g transform="translate(400 130) rotate(6)">
<path d="M-5 15 C-5.5 23 -2 26 3 28 C2 22 5 21 5 15 Z" fill="url(#peril-horn)" stroke-width="3"/>
<path d="M-8.5 3 C-8.5 -5.5 8.5 -5.5 8.5 3 C8.5 10.5 5 19 0 19 C-5 19 -8.5 10.5 -8.5 3 Z" fill="url(#peril-skin)" stroke-width="4"/>
<path d="M-4.5 9.5 Q0 12.0 4.5 9.5" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M-4.5 -1 Q-1 -3.5 3 -2.5" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.55"/>
</g>
<g transform="translate(415 130) rotate(-3)">
<path d="M-5 18 C-5.5 26 -2 30 3 32 C2 26 5 24 5 18 Z" fill="url(#peril-horn)" stroke-width="3"/>
<path d="M-8.5 3 C-8.5 -5.5 8.5 -5.5 8.5 3 C8.5 12.1 5 22 0 22 C-5 22 -8.5 12.1 -8.5 3 Z" fill="url(#peril-skin)" stroke-width="4"/>
<path d="M-4.5 11.0 Q0 13.5 4.5 11.0" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M-4.5 -1 Q-1 -3.5 3 -2.5" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.55"/>
</g>
<g transform="translate(430 130) rotate(-12)">
<path d="M-5 14 C-5.5 22 -2 25 3 27 C2 21 5 20 5 14 Z" fill="url(#peril-horn)" stroke-width="3"/>
<path d="M-8.5 3 C-8.5 -5.5 8.5 -5.5 8.5 3 C8.5 9.9 5 18 0 18 C-5 18 -8.5 9.9 -8.5 3 Z" fill="url(#peril-skin)" stroke-width="4"/>
<path d="M-4.5 9.0 Q0 11.5 4.5 9.0" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M-4.5 -1 Q-1 -3.5 3 -2.5" fill="none" stroke="#fffaf3" stroke-width="2.5" opacity="0.55"/>
</g>
<path d="M26 262 H240 V274 H26 Z" fill="#241c17" opacity="0.35" stroke="none"/>
<path d="M28 262 H240" fill="none" stroke-width="2.5" opacity="0.5"/>
<ellipse cx="125" cy="268" rx="66" ry="5" fill="#120d0a" opacity="0.85" stroke="none"/>
<g transform="translate(125 268) scale(0.85) translate(-365 -266)">
<ellipse cx="366" cy="196" rx="80" ry="58" fill="url(#peril-glow)" stroke="none"/>
<path d="M298 214 L304 178 Q366 162 428 178 L434 214 Z" fill="url(#peril-lidin)"/>
<path d="M308 182 Q366 168 424 182" fill="none" stroke-width="3" opacity="0.5"/>
<g fill="none" stroke-width="2.5" opacity="0.4"><path d="M340 174 L338 212"/><path d="M392 174 L394 212"/></g>
<ellipse cx="366" cy="208" rx="66" ry="22" fill="url(#peril-glow)" stroke="none"/>
<path d="M298 218 C304 204 318 198 330 202 C340 192 356 190 366 198 C378 188 396 190 404 200 C416 196 430 204 434 218 Z" fill="url(#peril-gold)"/>
<ellipse cx="328" cy="208" rx="7" ry="4" fill="url(#peril-coin)" stroke-width="2.5"/>
<ellipse cx="350" cy="201" rx="7" ry="4" fill="url(#peril-coin)" stroke-width="2.5"/>
<ellipse cx="388" cy="199" rx="7" ry="4" fill="url(#peril-coin)" stroke-width="2.5"/>
<ellipse cx="412" cy="207" rx="7" ry="4" fill="url(#peril-coin)" stroke-width="2.5"/>
<ellipse cx="366" cy="208" rx="7" ry="4" fill="url(#peril-coin)" stroke-width="2.5"/>
<path d="M374 196 L382 190 L390 196 L382 206 Z" fill="url(#peril-gules)" stroke-width="2.5"/>
<path d="M378 195 L382 192" stroke="#fffaf3" stroke-width="2" opacity="0.8"/>
<rect x="294" y="214" width="142" height="52" rx="5" fill="url(#peril-wood)"/>
<g fill="none" stroke-width="3" opacity="0.45"><path d="M296 236 H434"/><path d="M296 252 H434"/></g>
<g fill="none" stroke-width="2" opacity="0.3"><path d="M334 228 q8 -3 16 0"/><path d="M380 245 q8 3 16 0"/><path d="M334 260 q10 -3 20 0"/></g>
<rect x="292" y="212" width="146" height="10" rx="3" fill="url(#peril-iron)" stroke-width="4"/>
<rect x="310" y="212" width="14" height="54" rx="2" fill="url(#peril-iron)" stroke-width="4"/>
<circle cx="317" cy="229" r="2.6" fill="#c9ccd1" stroke-width="2"/>
<circle cx="317" cy="256" r="2.6" fill="#c9ccd1" stroke-width="2"/>
<rect x="406" y="212" width="14" height="54" rx="2" fill="url(#peril-iron)" stroke-width="4"/>
<circle cx="413" cy="229" r="2.6" fill="#c9ccd1" stroke-width="2"/>
<circle cx="413" cy="256" r="2.6" fill="#c9ccd1" stroke-width="2"/>
<path d="M354 216 H376 V234 Q376 242 365 246 Q354 242 354 234 Z" fill="url(#peril-gold)" stroke-width="4"/>
<circle cx="365" cy="228" r="3" fill="#241c17" stroke="none"/><path d="M363 229 L362 237 H368 L367 229 Z" fill="#241c17" stroke="none"/>
</g>
<ellipse cx="216" cy="270" rx="26" ry="4" fill="#120d0a" opacity="0.8" stroke="none"/>
<ellipse cx="198" cy="267" rx="9" ry="4.5" fill="url(#peril-coin)" stroke-width="2.5"/>
<ellipse cx="216" cy="269" rx="9" ry="4.5" fill="url(#peril-coin)" stroke-width="2.5"/>
<path d="M222 263 L227 256 L235 256 L240 263 L231 270 Z" fill="#2f5d8f" stroke-width="2.5"/>
<path d="M227 260 L230 257" stroke="#fffaf3" stroke-width="2" opacity="0.8"/>
<path transform="translate(32 150) scale(1.05)" d="M17 -70.1Q28 -76.8 29.6 -76.8Q31.2 -76.8 34.7 -72.7Q38.1 -68.6 38.1 -65.3V-34.2Q38.1 -33.5 30.2 -30.3Q22.2 -27.1 17 -25.5V-15.4Q17 -11.7 17.8 -10.1Q18.6 -8.5 21.1 -8.5V-5.4L0.6 3.2L-1 0Q1.2 0 3.2 -2.6Q5 -5.1 5 -10.2V-62Q5 -68.1 0.9 -68.9V-71.1L11 -76.8Q13 -76 15 -73.9Q17 -71.8 17 -70.1ZM20.9 -67.2Q19.1 -67.2 17 -65.7V-30.2Q19.6 -30.2 22.8 -31.9Q26 -33.5 26 -35.3V-59.8Q26 -67.2 20.9 -67.2ZM71.6 -57Q72.1 -57 74.1 -55.5Q76.1 -53.9 78.1 -51.2Q80.1 -48.4 80.1 -45.8V-29Q80.1 -27.2 74.8 -24.6Q69.5 -22 64.5 -20.4Q59.6 -18.7 59.2 -18.7Q59.2 -11 65.9 -9.2Q69.2 -8.4 73.8 -8.4V-5.5Q57.4 0 56.3 0Q53.3 0 50.2 -4.2Q47.1 -8.5 47.1 -14.2V-47.8Q47.1 -48.5 58.5 -52.8Q69.9 -57 71.6 -57ZM59.1 -46.3V-23.2Q68.1 -25.7 68.1 -34V-41.1Q68.1 -43.9 66.8 -45.9Q65.5 -47.8 63.5 -47.8Q61.5 -47.8 59.1 -46.3ZM84.7 -51 95.7 -57Q96.4 -56.8 97.4 -56.5Q98.3 -56.1 100 -54.5Q101.6 -52.9 101.6 -50.9Q102.1 -51.1 106.4 -54Q110.6 -57 111.8 -57Q115 -57 117.8 -52.8Q120.6 -48.6 120.6 -45.1V-40.2L110.3 -34.4L108.6 -35.8Q108.6 -44.2 107 -45.4Q105.2 -46.7 101.6 -46.7V-14.8Q101.6 -8.7 105.7 -7.9V-5.7L95.6 0Q93.4 -0.9 91.5 -3Q89.6 -5 89.6 -6.8V-40Q89.6 -44.4 88.1 -46.6Q86.5 -48.8 84.7 -48.8ZM139.6 -50.2V-14.8Q139.6 -8.7 143.7 -7.9V-5.7L133.6 0Q131.4 -0.9 129.5 -3Q127.6 -5 127.6 -6.8V-42.2Q127.6 -48.3 123.5 -49.1V-51.3L133.6 -57Q135.8 -56.1 137.7 -54Q139.6 -52 139.6 -50.2ZM126.1 -69.5V-75.6Q126.1 -75.9 130.2 -77.5Q134.4 -79 135.1 -79Q135.7 -79 137 -77.3Q138.2 -75.6 138.2 -73.8V-66.5Q138.2 -66.2 134.2 -64.7Q130.2 -63.1 129.3 -63.1Q128.4 -63.1 127.2 -64.9Q126.1 -66.6 126.1 -69.5ZM161.6 -70.1V-14.8Q161.6 -8.7 165.7 -7.9V-5.7L155.6 0Q153.4 -0.9 151.5 -3Q149.6 -5 149.6 -6.8V-62.1Q149.6 -68.2 145.5 -69V-71.2L155.6 -76.9Q157.8 -76 159.7 -74Q161.6 -71.9 161.6 -70.1Z" fill="url(#peril-gold)" stroke-width="11" paint-order="stroke"/>
<path d="M211 68 L238 68 L228 124 L221 124 Z" fill="url(#peril-gules)"/>
<path d="M217 75 L220 100" stroke="#fffaf3" stroke-width="3.5" opacity="0.5"/>
<circle cx="224.5" cy="139" r="9" fill="url(#peril-dot)"/>
<circle cx="221.5" cy="136" r="2.8" fill="#fffaf3" stroke="none" opacity="0.7"/>
</g></svg>
