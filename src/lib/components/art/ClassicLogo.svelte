<script lang="ts">
  // Classic's title tile: a question scroll over four answer shields, with a quill in an inkwell.
  // Drawn as SVG and checked by eye at tile size; regenerate from the art
  // scratch files rather than editing by hand.
  let { size = 480 }: { size?: number } = $props();
</script>

<svg width={size} height={size * 0.625} role="img" aria-label="Classic" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300">
<defs>
<linearGradient id="classic-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dd8e"/><stop offset="0.5" stop-color="#d4a434"/><stop offset="1" stop-color="#8f6612"/></linearGradient>
<radialGradient id="classic-field" cx="0.5" cy="0.3" r="0.85"><stop offset="0" stop-color="#3f74ab"/><stop offset="0.55" stop-color="#2a5583"/><stop offset="1" stop-color="#16304f"/></radialGradient>
<radialGradient id="classic-nail" cx="0.35" cy="0.32" r="0.7"><stop offset="0" stop-color="#fff3c8"/><stop offset="0.5" stop-color="#d9a93a"/><stop offset="1" stop-color="#7d5a10"/></radialGradient>
<radialGradient id="classic-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffe9a0" stop-opacity="0.55"/><stop offset="0.55" stop-color="#f0d27c" stop-opacity="0.16"/><stop offset="1" stop-color="#f0d27c" stop-opacity="0"/></radialGradient>
<linearGradient id="classic-paper" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#fffaf3"/><stop offset="0.55" stop-color="#f3e6cf"/><stop offset="1" stop-color="#dcc69e"/></linearGradient>
<linearGradient id="classic-roll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf3"/><stop offset="0.45" stop-color="#efdfc2"/><stop offset="1" stop-color="#c9ae82"/></linearGradient>
<linearGradient id="classic-rollend" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e4cfa8"/><stop offset="1" stop-color="#b89a6c"/></linearGradient>
<linearGradient id="classic-board" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#5a3d27"/><stop offset="1" stop-color="#2c1d13"/></linearGradient>
<linearGradient id="classic-gold" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset="0.45" stop-color="#e8b840"/><stop offset="1" stop-color="#9c7214"/></linearGradient>
<linearGradient gradientUnits="userSpaceOnUse" id="classic-title" x1="0" y1="-80" x2="0" y2="0"><stop offset="0" stop-color="#fff3c8"/><stop offset="0.5" stop-color="#f0d27c"/><stop offset="1" stop-color="#c8961f"/></linearGradient>
<linearGradient id="classic-t-red" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#d65f47"/><stop offset="0.5" stop-color="#b23f2c"/><stop offset="1" stop-color="#7a2618"/></linearGradient>
<linearGradient id="classic-t-blue" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#4f84bd"/><stop offset="0.5" stop-color="#2f5d8f"/><stop offset="1" stop-color="#1d3d62"/></linearGradient>
<linearGradient id="classic-t-gold" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#dcae3e"/><stop offset="0.5" stop-color="#b38418"/><stop offset="1" stop-color="#7d5a10"/></linearGradient>
<linearGradient id="classic-t-green" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#5f9e72"/><stop offset="0.5" stop-color="#3c7150"/><stop offset="1" stop-color="#244632"/></linearGradient>
<linearGradient id="classic-glass" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stop-color="#c9dcef"/><stop offset="0.5" stop-color="#8fb0cf"/><stop offset="1" stop-color="#4f6f8f"/></linearGradient>
<linearGradient id="classic-wood" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#b07a45"/><stop offset="0.5" stop-color="#8a5a30"/><stop offset="1" stop-color="#5e3b1e"/></linearGradient>
<linearGradient id="classic-post" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c48c52"/><stop offset="1" stop-color="#6e4524"/></linearGradient>
<linearGradient id="classic-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dd8e"/><stop offset="1" stop-color="#c8961f"/></linearGradient>
<linearGradient id="classic-pot" x1="0" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#9a6a45"/><stop offset="0.45" stop-color="#6a4428"/><stop offset="1" stop-color="#341f12"/></linearGradient>
<linearGradient id="classic-feather" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#fffaf3"/><stop offset="0.6" stop-color="#eadfcf"/><stop offset="1" stop-color="#b9ab98"/></linearGradient>
<radialGradient id="classic-wax" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#e2694d"/><stop offset="0.5" stop-color="#b23f2c"/><stop offset="1" stop-color="#6e2216"/></radialGradient>
<clipPath id="classic-clip"><rect x="24" y="44" width="432" height="232" rx="12"/></clipPath>
</defs>
<g stroke="#332a24" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
<rect x="10" y="30" width="460" height="260" rx="26" fill="url(#classic-frame)"/>
<rect x="14.5" y="34.5" width="451" height="251" rx="22" fill="none" stroke="#fff6d6" stroke-width="2" opacity="0.55"/>
<rect x="24" y="44" width="432" height="232" rx="12" fill="url(#classic-field)" stroke-width="4"/>
<circle cx="22.6" cy="42.6" r="4.5" fill="url(#classic-nail)" stroke-width="2.5"/>
<circle cx="21.1" cy="41.1" r="1.4" fill="#fffaf3" stroke="none"/>
<circle cx="457.4" cy="42.6" r="4.5" fill="url(#classic-nail)" stroke-width="2.5"/>
<circle cx="455.9" cy="41.1" r="1.4" fill="#fffaf3" stroke="none"/>
<circle cx="22.6" cy="277.4" r="4.5" fill="url(#classic-nail)" stroke-width="2.5"/>
<circle cx="21.1" cy="275.9" r="1.4" fill="#fffaf3" stroke="none"/>
<circle cx="457.4" cy="277.4" r="4.5" fill="url(#classic-nail)" stroke-width="2.5"/>
<circle cx="455.9" cy="275.9" r="1.4" fill="#fffaf3" stroke="none"/>
<g clip-path="url(#classic-clip)" stroke="none">
<path d="M24 260 L40 276 M24 60 L40 44 M24 224 L76 276 M24 96 L76 44 M24 188 L112 276 M24 132 L112 44 M24 152 L148 276 M24 168 L148 44 M24 116 L184 276 M24 204 L184 44 M24 80 L220 276 M24 240 L220 44 M24 44 L256 276 M24 276 L256 44 M60 44 L292 276 M60 276 L292 44 M96 44 L328 276 M96 276 L328 44 M132 44 L364 276 M132 276 L364 44 M168 44 L400 276 M168 276 L400 44 M204 44 L436 276 M204 276 L436 44 M240 44 L456 260 M240 276 L456 60 M276 44 L456 224 M276 276 L456 96 M312 44 L456 188 M312 276 L456 132 M348 44 L456 152 M348 276 L456 168 M384 44 L456 116 M384 276 L456 204 M420 44 L456 80 M420 276 L456 240" fill="none" stroke="#fffaf3" stroke-width="2" opacity="0.035"/>
<ellipse cx="230" cy="125" rx="190" ry="120" fill="url(#classic-glow)"/>
<path d="M24 56 Q24 44 36 44 H456 V52 H38 Q32 52 32 58 V276 H24 Z" fill="#0d1b2c" opacity="0.28"/>
</g>
<g transform="translate(394 272) scale(0.85) translate(-390 -272)">
<path d="M352 266 C346 246 356 230 376 226 H404 C424 230 434 246 428 266 Q428 272 420 272 H360 Q352 272 352 266 Z" fill="url(#classic-pot)"/>
<rect x="374" y="212" width="32" height="16" rx="4" fill="url(#classic-pot)"/>
<path d="M355 248 Q390 256 425 248 L427 258 Q390 266 353 258 Z" fill="url(#classic-wax)" stroke-width="3.5"/>
<path d="M366 234 Q357 242 358 252" fill="none" stroke="#fff" stroke-width="4.5" opacity="0.5"/>
<circle cx="372" cy="233" r="3.2" fill="#fff" stroke="none" opacity="0.75"/>
<rect x="369" y="203" width="42" height="12" rx="4" fill="url(#classic-gold)" stroke-width="4.5"/>
<ellipse cx="390" cy="206.5" rx="16" ry="3" fill="#1a110b" stroke="none"/>
</g>
<path d="M409.0 175.0 C402.4 140.6 414.0 97.0 440.5 88.5 C447.4 101.7 432.0 147.1 409.0 175.0 Z" fill="url(#classic-feather)"/>
<path d="M409.7 173.1 C430.1 146.4 445.6 101.0 439.1 92.3 Z" fill="#332a24" opacity="0.16" stroke="none"/>
<path d="M409.0 137.7 L414.1 150.2" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M417.0 110.8 L423.2 123.7" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M430.1 92.2 L432.4 103.6" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M433.0 131.6 L424.5 139.1" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M439.6 108.4 L432.2 116.4" fill="none" stroke-width="2.5" opacity="0.45"/>
<path d="M393.0 219.1 L438.5 94.2" fill="none" stroke-width="6"/>
<path d="M393.7 217.3 L410.4 171.2" fill="none" stroke="#efe3cc" stroke-width="2.2"/>
<g transform="translate(394 272) scale(0.85) translate(-390 -272)"><path d="M369 209.5 H411 V211 Q411 215 407 215 H373 Q369 215 369 211 Z" fill="url(#classic-gold)" stroke-width="4"/></g>
<path d="M135 31 H325 Q328 72.5 325 114 H135 Q132 72.5 135 31 Z" fill="url(#classic-paper)"/>
<path d="M138 37 H322 V45 Q230 41 138 45 Z" fill="#332a24" opacity="0.14" stroke="none"/>
<path d="M138 108 H322 V101 Q230 105 138 101 Z" fill="#332a24" opacity="0.12" stroke="none"/>
<path d="M311 43 Q319 72.5 313 101 L323 104 Q326 72.5 323 39 Z" fill="#a8885a" opacity="0.22" stroke="none"/>
<ellipse cx="161" cy="88" rx="9" ry="5" fill="#b89a6c" opacity="0.18" stroke="none"/>
<ellipse cx="291" cy="51" rx="6" ry="3.5" fill="#b89a6c" opacity="0.16" stroke="none"/>
<rect x="123" y="21" width="214" height="18" rx="4" fill="url(#classic-roll)"/>
<ellipse cx="123" cy="30.0" rx="5" ry="9.7" fill="url(#classic-rollend)" stroke-width="4"/>
<path d="M123 26.5 Q126 30.0 123 33.5" fill="none" stroke-width="2.5"/>
<ellipse cx="337" cy="30.0" rx="5" ry="9.7" fill="url(#classic-rollend)" stroke-width="4"/>
<path d="M139 25.5 H321" stroke="#fff" stroke-width="3" opacity="0.8"/>
<rect x="123" y="106" width="214" height="18" rx="4" fill="url(#classic-roll)"/>
<ellipse cx="123" cy="115.0" rx="5" ry="9.7" fill="url(#classic-rollend)" stroke-width="4"/>
<path d="M123 111.5 Q126 115.0 123 118.5" fill="none" stroke-width="2.5"/>
<ellipse cx="337" cy="115.0" rx="5" ry="9.7" fill="url(#classic-rollend)" stroke-width="4"/>
<path d="M139 110.5 H321" stroke="#fff" stroke-width="3" opacity="0.8"/>
<path transform="translate(214.7 99) scale(0.8)" d="M16.9 -66.5V-58.3Q16.9 -56 16.1 -55.1Q15.3 -54.2 14 -53.6L3.6 -48.6L2.2 -50Q4.9 -53 4.9 -56.4V-67.8Q4.9 -68.4 15.4 -72.7Q26 -77 27.9 -77Q29.7 -77 32.9 -72.6Q36.1 -68.1 36.1 -65.7V-48.4Q36.1 -45.8 31.2 -41.4Q26.4 -37 21.6 -33.9L16.8 -30.8V-28Q16.8 -24.9 17.9 -23.2Q18.9 -21.4 20 -21.2L21 -21V-18.8Q11.3 -13.1 10.6 -13.1Q9.9 -13.1 7.5 -15.3Q5 -17.5 5 -19.6V-33.1Q5 -34.2 11.6 -38.2Q18.1 -42.1 21.1 -44.7Q24.1 -47.2 24.1 -49V-60.6Q24.1 -65 23.2 -66.8Q22.4 -68.5 20.5 -68.5Q18.5 -68.5 16.9 -66.5ZM4.9 1.6V-4.5Q4.9 -4.8 9.1 -6.4Q13.2 -7.9 13.9 -7.9Q14.5 -7.9 15.8 -6.2Q17 -4.5 17 -2.7V4.6Q17 4.9 13 6.5Q9 8 8.1 8Q7.2 8 6.1 6.2Q4.9 4.5 4.9 1.6Z" fill="#332a24" stroke="none"/>
<path d="M334 38.0 L331 62.0 L336 58.0 L339 64.0 Z" fill="url(#classic-wax)" stroke-width="3"/>
<path d="M342 38.0 L350 60.0 L344 57.0 L342 63.0 Z" fill="url(#classic-wax)" stroke-width="3"/>
<path d="M350.5 32.0 L348.2 36.2 L346.8 40.8 L342.2 42.2 L338.0 44.5 L333.8 42.2 L329.2 40.8 L327.8 36.2 L325.5 32.0 L327.8 27.8 L329.2 23.2 L333.8 21.8 L338.0 19.5 L342.2 21.8 L346.8 23.2 L348.2 27.8 Z" fill="url(#classic-wax)" stroke-width="3.5"/>
<circle cx="338" cy="32.0" r="7" fill="none" stroke="#7a2618" stroke-width="2"/>
<path d="M334 27.5 Q336 25.5 339 25.5" fill="none" stroke="#f3a08a" stroke-width="2"/>
<path d="M112.5 134 Q138.5 138 164.5 134 V161.0 C164.5 179.0 148.9 188.0 138.5 194 C128.1 188.0 112.5 179.0 112.5 161.0 Z" fill="url(#classic-gold)"/>
<path d="M117.5 139 Q138.5 143 159.5 139 V161.05 C159.5 175.75 146.9 183.1 138.5 188 C130.1 183.1 117.5 175.75 117.5 161.05 Z" fill="url(#classic-t-red)" stroke-width="2.5"/>
<path d="M121.5 143.5 Q138.5 146 155.5 143.5" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.4"/>
<g transform="translate(122.8 140.5) scale(0.98)" fill="#fff" stroke="#332a24" stroke-width="3.27" paint-order="stroke"><path d="M6 3 H26 Q26.5 13 20.5 16.5 Q17.6 18 17.6 20.5 V23.5 Q21.5 24.5 23 27 V29.5 H9 V27 Q10.5 24.5 14.4 23.5 V20.5 Q14.4 18 11.5 16.5 Q5.5 13 6 3 Z"/></g>
<g transform="translate(122.8 140.5) scale(0.98)" fill="none" stroke="#332a24" stroke-opacity="0.55" stroke-width="2.45"><path d="M8 7.5 H24"/></g>
<path d="M173.5 134 Q199.5 138 225.5 134 V161.0 C225.5 179.0 209.9 188.0 199.5 194 C189.1 188.0 173.5 179.0 173.5 161.0 Z" fill="url(#classic-gold)"/>
<path d="M178.5 139 Q199.5 143 220.5 139 V161.05 C220.5 175.75 207.9 183.1 199.5 188 C191.1 183.1 178.5 175.75 178.5 161.05 Z" fill="url(#classic-t-blue)" stroke-width="2.5"/>
<path d="M182.5 143.5 Q199.5 146 216.5 143.5" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.4"/>
<g transform="translate(183.8 140.5) scale(0.98)" fill="#fff" stroke="#332a24" stroke-width="3.27" paint-order="stroke"><path d="M5 3.5 H27 V14 Q27 24.5 16 30.5 Q5 24.5 5 14 Z"/></g>
<g transform="translate(183.8 140.5) scale(0.98)" fill="none" stroke="#332a24" stroke-opacity="0.55" stroke-width="2.45"><path d="M16 6 V27 M8 13 H24"/></g>
<path d="M234.5 134 Q260.5 138 286.5 134 V161.0 C286.5 179.0 270.9 188.0 260.5 194 C250.1 188.0 234.5 179.0 234.5 161.0 Z" fill="url(#classic-gold)"/>
<path d="M239.5 139 Q260.5 143 281.5 139 V161.05 C281.5 175.75 268.9 183.1 260.5 188 C252.1 183.1 239.5 175.75 239.5 161.05 Z" fill="url(#classic-t-gold)" stroke-width="2.5"/>
<path d="M243.5 143.5 Q260.5 146 277.5 143.5" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.4"/>
<g transform="translate(244.8 140.5) scale(0.98)" fill="#fff" stroke="#332a24" stroke-width="3.27" paint-order="stroke"><path d="M3.5 23 L5 9 L11 15.5 L16 5 L21 15.5 L27 9 L28.5 23 Z"/><rect x="3.5" y="24.5" width="25" height="4.5" rx="1.2"/><circle cx="5" cy="8" r="2"/><circle cx="16" cy="4" r="2"/><circle cx="27" cy="8" r="2"/></g>
<path d="M295.5 134 Q321.5 138 347.5 134 V161.0 C347.5 179.0 331.9 188.0 321.5 194 C311.1 188.0 295.5 179.0 295.5 161.0 Z" fill="url(#classic-gold)"/>
<path d="M300.5 139 Q321.5 143 342.5 139 V161.05 C342.5 175.75 329.9 183.1 321.5 188 C313.1 183.1 300.5 175.75 300.5 161.05 Z" fill="url(#classic-t-green)" stroke-width="2.5"/>
<path d="M304.5 143.5 Q321.5 146 338.5 143.5" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.4"/>
<g transform="translate(305.8 140.5) scale(0.98)" fill="#fff" stroke="#332a24" stroke-width="3.27" paint-order="stroke"><path fill-rule="evenodd" d="M5 30 V7 H9.5 V11 H13.5 V7 H18.5 V11 H22.5 V7 H27 V30 Z M12.5 30 V23 Q16 18.5 19.5 23 V30 Z"/></g>
<path transform="translate(137.2 266) scale(0.74)" d="M18.8 -67.3Q17.8 -67.3 17 -66.3V-25Q17 -20.8 17.5 -18.2Q18 -15.7 19.7 -13.2Q23 -8.4 34.8 -8.4V-5.5Q34.3 -5.5 27.4 -2.8Q20.5 0 19 0Q14 0 9.5 -5.8Q5 -11.5 5 -17.9V-67.8Q5 -68.5 16.5 -72.8Q27.9 -77 29.6 -77Q30.2 -77 31 -74.1Q31.8 -71.2 32.9 -67.1Q33.9 -63 35 -61Q36.2 -59.1 39.4 -59.1V-57.1Q37.2 -56.1 32 -53.5Q26.7 -51 26.3 -51Q24.8 -51 22.5 -59.1Q20.2 -67.3 18.8 -67.3ZM57.4 -70.1V-14.8Q57.4 -8.7 61.5 -7.9V-5.7L51.4 0Q49.2 -0.9 47.3 -3Q45.4 -5 45.4 -6.8V-62.1Q45.4 -68.2 41.3 -69V-71.2L51.4 -76.9Q53.6 -76 55.5 -74Q57.4 -71.9 57.4 -70.1ZM98.4 -43.8V-15.5Q98.4 -11.8 99.6 -10.4Q100.8 -8.9 103.3 -8.3V-6.1L92.4 0Q90.2 -0.9 88.3 -3Q86.4 -5 86.4 -6.7L73.9 0Q73.6 -0.2 73 -0.6Q72.4 -0.9 71 -2.1Q69.5 -3.2 68.4 -4.5Q65.4 -7.8 65.4 -12V-28.4Q65.4 -30 70.6 -32.5Q75.8 -35 81 -36.6L86.3 -38.3Q86.3 -44 83.3 -46.2Q80.3 -48.5 71.7 -48.5V-51.5Q87.2 -57 89.1 -57Q92.4 -57 95.4 -52.7Q98.4 -48.4 98.4 -43.8ZM86.4 -11.2V-33.8Q83.9 -32.9 82.7 -32.3Q81.4 -31.7 80 -30.4Q77.4 -28 77.4 -22.1V-15.6Q77.4 -13 79 -11.4Q80.5 -9.7 82.4 -9.7Q84.3 -9.7 86.4 -11.2ZM113 -21.9Q110.5 -21.9 108.7 -25.7Q106.9 -29.5 106.9 -35V-45.8Q106.9 -47.7 117.4 -52.4Q127.9 -57 129.5 -57Q130.4 -57 131.1 -56Q131.8 -54.9 132.2 -54.2Q132.6 -53.6 133.5 -52Q134.3 -50.5 134.9 -49.5Q136.2 -47.1 138.2 -47.1V-45.1Q136.6 -44.4 134 -43Q127.6 -39.5 127.1 -39.5Q125.6 -39.5 123.9 -44.4Q122.1 -49.3 120.7 -49.3Q118.9 -49.3 118.9 -46.3V-34Q118.9 -30 120.7 -30Q121.1 -30 126.9 -32.6Q132.7 -35.2 133.9 -35.2Q136.3 -35.2 138.2 -31.4Q140 -27.5 140 -21.5V-10.2Q140 -8.3 128.6 -3.7Q117.1 1 115.4 1Q114.7 1 114.1 -0.2Q113.4 -1.5 112.2 -4.1Q111.1 -6.7 110 -8.5Q108.7 -10.9 106.7 -10.9V-12.9Q108.3 -13.6 111 -15Q117.3 -18.5 117.8 -18.5Q119.3 -18.5 121.6 -12.6Q123.8 -6.7 125.2 -6.7Q126.2 -6.7 127.1 -7.5Q128 -8.3 128 -9.7V-22.2Q128 -26.7 125.5 -26.7Q124.7 -26.7 119.2 -24.3Q113.7 -21.9 113 -21.9ZM153.5 -21.9Q151 -21.9 149.2 -25.7Q147.4 -29.5 147.4 -35V-45.8Q147.4 -47.7 157.9 -52.4Q168.4 -57 170 -57Q170.9 -57 171.6 -56Q172.3 -54.9 172.7 -54.2Q173.1 -53.6 174 -52Q174.8 -50.5 175.4 -49.5Q176.7 -47.1 178.7 -47.1V-45.1Q177.1 -44.4 174.5 -43Q168.1 -39.5 167.6 -39.5Q166.1 -39.5 164.4 -44.4Q162.6 -49.3 161.2 -49.3Q159.4 -49.3 159.4 -46.3V-34Q159.4 -30 161.2 -30Q161.6 -30 167.4 -32.6Q173.2 -35.2 174.4 -35.2Q176.8 -35.2 178.7 -31.4Q180.5 -27.5 180.5 -21.5V-10.2Q180.5 -8.3 169.1 -3.7Q157.6 1 155.9 1Q155.2 1 154.6 -0.2Q153.9 -1.5 152.8 -4.1Q151.6 -6.7 150.5 -8.5Q149.2 -10.9 147.2 -10.9V-12.9Q148.8 -13.6 151.5 -15Q157.8 -18.5 158.3 -18.5Q159.8 -18.5 162.1 -12.6Q164.3 -6.7 165.7 -6.7Q166.7 -6.7 167.6 -7.5Q168.5 -8.3 168.5 -9.7V-22.2Q168.5 -26.7 166 -26.7Q165.2 -26.7 159.7 -24.3Q154.2 -21.9 153.5 -21.9ZM201.4 -50.2V-14.8Q201.4 -8.7 205.5 -7.9V-5.7L195.4 0Q193.2 -0.9 191.3 -3Q189.4 -5 189.4 -6.8V-42.2Q189.4 -48.3 185.3 -49.1V-51.3L195.4 -57Q197.6 -56.1 199.5 -54Q201.4 -52 201.4 -50.2ZM187.9 -69.5V-75.6Q187.9 -75.9 192.1 -77.5Q196.2 -79 196.9 -79Q197.5 -79 198.8 -77.3Q200 -75.6 200 -73.8V-66.5Q200 -66.2 196 -64.7Q192 -63.1 191.1 -63.1Q190.2 -63.1 189.1 -64.9Q187.9 -66.6 187.9 -69.5ZM225.2 -47.3Q224.2 -47.3 223.4 -46.3V-18.7Q223.4 -11 230 -9.2Q233.4 -8.4 238.1 -8.4V-5.5Q221.7 0 220.6 0Q217.6 0 214.5 -4.2Q211.4 -8.5 211.4 -14.2V-47.8Q211.4 -48.5 222.9 -52.8Q234.3 -57 236 -57Q236.6 -57 237.4 -54.1Q238.2 -51.2 239.2 -47.1Q240.3 -43 241.5 -41Q242.6 -39.1 245.8 -39.1V-37.1Q243.6 -36.1 238.4 -33.5Q233.1 -31 232.7 -31Q231.2 -31 228.9 -39.2Q226.6 -47.3 225.2 -47.3Z" fill="url(#classic-title)" stroke="#332a24" stroke-width="16.2" paint-order="stroke"/>
</g>
</svg>
