<script lang="ts">
  // Champion's title tile: a crowned shield over crossed swords in a laurel, on a red-rayed plaque.
  // Drawn as SVG and checked by eye at tile size; regenerate from the art
  // scratch files rather than editing by hand.
  let { size = 480 }: { size?: number } = $props();
</script>

<svg width={size} height={size * 0.625} role="img" aria-label="Champion" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300">
<defs>
  <linearGradient id="champ-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dd8e"/><stop offset="0.45" stop-color="#d9a93a"/><stop offset="1" stop-color="#8f6612"/></linearGradient>
  <radialGradient id="champ-nail" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#fff6d6"/><stop offset="0.45" stop-color="#e2b23f"/><stop offset="1" stop-color="#7d5a10"/></radialGradient>
  <radialGradient id="champ-field" cx="0.5" cy="0.4" r="0.75"><stop offset="0" stop-color="#cf5238"/><stop offset="0.55" stop-color="#a23826"/><stop offset="1" stop-color="#6e2216"/></radialGradient>
  <radialGradient id="champ-glow" cx="0.5" cy="0.5"><stop offset="0" stop-color="#ffe9a0" stop-opacity="0.75"/><stop offset="0.55" stop-color="#f0d27c" stop-opacity="0.22"/><stop offset="1" stop-color="#f0d27c" stop-opacity="0"/></radialGradient>
  <linearGradient id="champ-azure" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f84bd"/><stop offset="0.5" stop-color="#2f5d8f"/><stop offset="1" stop-color="#1d3d62"/></linearGradient>
  <linearGradient id="champ-steel" x1="0" x2="1"><stop offset="0" stop-color="#8f949c"/><stop offset="0.42" stop-color="#e3e5e8"/><stop offset="1" stop-color="#868b93"/></linearGradient>
  <linearGradient id="champ-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset="0.45" stop-color="#e8b840"/><stop offset="1" stop-color="#9c7214"/></linearGradient>
  <linearGradient id="champ-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dd8e"/><stop offset="0.5" stop-color="#d9a93a"/><stop offset="1" stop-color="#9c7214"/></linearGradient>
  <radialGradient id="champ-pommel" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff0b8"/><stop offset="0.5" stop-color="#e2b23f"/><stop offset="1" stop-color="#8f6612"/></radialGradient>
  <radialGradient id="champ-ruby" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ee8064"/><stop offset="0.5" stop-color="#b23f2c"/><stop offset="1" stop-color="#6e2216"/></radialGradient>
  <radialGradient id="champ-sapphire" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#8fb6e0"/><stop offset="0.5" stop-color="#2f5d8f"/><stop offset="1" stop-color="#1a3556"/></radialGradient>
  <radialGradient id="champ-emerald" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#9fd3ad"/><stop offset="0.5" stop-color="#3c7150"/><stop offset="1" stop-color="#22422e"/></radialGradient>
  <linearGradient id="champ-grip" x1="0" x2="1"><stop offset="0" stop-color="#5a2c1c"/><stop offset="0.45" stop-color="#9f5037"/><stop offset="1" stop-color="#4a2416"/></linearGradient>
  <linearGradient id="champ-ribbon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf3"/><stop offset="0.7" stop-color="#f3e6cf"/><stop offset="1" stop-color="#e2cfaa"/></linearGradient>
  <linearGradient id="champ-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e2a1a"/><stop offset="0.6" stop-color="#6e1f12"/><stop offset="1" stop-color="#4a150c"/></linearGradient><linearGradient id="champ-tailr" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#8e2a1a"/><stop offset="0.6" stop-color="#6e1f12"/><stop offset="1" stop-color="#4a150c"/></linearGradient>
  <linearGradient id="champ-bow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2694d"/><stop offset="0.55" stop-color="#b23f2c"/><stop offset="1" stop-color="#7a2618"/></linearGradient>
  <linearGradient id="champ-letter" x1="0" y1="-72" x2="0" y2="4" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff1bf"/><stop offset="0.5" stop-color="#f0d27c"/><stop offset="1" stop-color="#d9a93a"/></linearGradient><linearGradient id="champ-band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e2a1a"/><stop offset="0.5" stop-color="#7a1f12"/><stop offset="1" stop-color="#5a170c"/></linearGradient>
  <clipPath id="champ-clip"><rect x="22" y="40" width="436" height="238" rx="18"/></clipPath>
</defs>
<g stroke="#332a24" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
<rect x="8" y="26" width="464" height="266" rx="28" fill="url(#champ-frame)"/>
<rect x="12" y="30" width="456" height="258" rx="24" fill="none" stroke="#fff6d6" stroke-width="2" opacity="0.6"/>
<rect x="22" y="40" width="436" height="238" rx="18" fill="url(#champ-field)" stroke-width="4"/>
<circle cx="21.7" cy="39.7" r="4.5" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="20.3" cy="38.1" r="1.2" fill="#fff" stroke="none"/>
<circle cx="458.3" cy="39.7" r="4.5" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="456.9" cy="38.1" r="1.2" fill="#fff" stroke="none"/>
<circle cx="21.7" cy="278.3" r="4.5" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="20.3" cy="276.7" r="1.2" fill="#fff" stroke="none"/>
<circle cx="458.3" cy="278.3" r="4.5" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="456.9" cy="276.7" r="1.2" fill="#fff" stroke="none"/>
<g clip-path="url(#champ-clip)" stroke="none">
<g fill="#ffe9a0" opacity="0.2"><path d="M456 152.2 L240 118 L456 118 Z"/><path d="M456 237.7 L240 118 L456 196.6 Z"/><path d="M377.3 276 L240 118 L428.3 276 Z"/><path d="M300.7 276 L240 118 L331.2 276 Z"/><path d="M242.8 276 L240 118 L267.9 276 Z"/><path d="M185.6 276 L240 118 L212.1 276 Z"/><path d="M112.1 276 L240 118 L148.8 276 Z"/><path d="M24 276 L24 247.8 L240 118 L51.7 276 Z"/><path d="M24 160 L240 118 L24 196.6 Z"/><path d="M24 83.8 L240 118 L24 118 Z"/><path d="M102.9 42 L240 118 L31.2 42 Z"/><path d="M173.9 42 L240 118 L149.4 42 Z"/><path d="M210.8 42 L240 118 L196.1 42 Z"/><path d="M238.7 42 L240 118 L226.6 42 Z"/><path d="M266.2 42 L240 118 L253.4 42 Z"/><path d="M301.5 42 L240 118 L283.9 42 Z"/><path d="M366.5 42 L240 118 L330.6 42 Z"/><path d="M456 42 L456 76 L240 118 L448.8 42 Z"/></g>
<ellipse cx="240" cy="122" rx="150" ry="110" fill="url(#champ-glow)"/>
</g>
<path d="M235.7 182.6 L228.3 183.1 L220.7 183.3 L213.2 183.2 L205.7 182.7 L198.3 182 L190.9 180.9 L183.6 179.5 L176.4 177.8 L169.4 175.9 L162.6 173.6 L156 171 L149.6 168.1 L143.4 164.8 L137.5 161.3 L132 157.5 L126.7 153.4 L121.8 149 L117.3 144.3 L113.2 139.3 L109.5 134.1 L106.3 128.5 L103.5 122.6 L101.2 116.4 L99.5 109.9 L98.3 103.1 L97.6 96 L97.6 88.6 L98.2 80.8 L99.5 72.8 L101.4 64.4 L98.6 63.6 L96.4 72.1 L95 80.4 L94.2 88.4 L94.1 96.1 L94.7 103.5 L95.8 110.7 L97.5 117.5 L99.8 124.1 L102.6 130.4 L105.9 136.3 L109.7 142 L113.9 147.3 L118.6 152.3 L123.6 157.1 L129 161.5 L134.8 165.6 L140.9 169.3 L147.2 172.8 L153.8 175.9 L160.7 178.7 L167.7 181.2 L174.9 183.4 L182.3 185.3 L189.8 186.8 L197.5 188.1 L205.2 189 L212.9 189.6 L220.7 189.8 L228.5 189.8 L236.3 189.4 Z" fill="#4a3a22" stroke-width="2.5"/>
<path d="M207.7 186 C207.2 201.5 190.7 210.8 176.7 207.9 C179.4 191.7 193.9 179 207.7 186 Z" fill="#3c7150" stroke-width="3"/>
<path d="M205.1 187.6 Q193.4 195.4 183.4 202.8" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M199.3 185.2 C188.4 188.6 179.3 177.7 179.2 165.6 C189.8 165.1 200.8 173.9 199.3 185.2 Z" fill="#62a074" stroke-width="3"/>
<path d="M197.6 183.8 Q190 176.7 183.5 170.1" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M189.4 183.7 C188 199.9 171.3 205.7 157.8 199.2 C161.6 183.4 176.6 173.7 189.4 183.7 Z" fill="#62a074" stroke-width="3"/>
<path d="M186.8 184.8 Q175 190.4 164.6 195.7" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M180.4 181.8 C166.4 182.4 160.5 167.5 165.5 153.9 C178 156.5 187 169.5 180.4 181.8 Z" fill="#3c7150" stroke-width="3"/>
<path d="M179.1 179.7 Q173.3 169.5 168.5 160.2" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M167.1 178.1 C162.6 193.1 144.4 196.7 131.7 189.1 C138.6 174.6 155.8 167.1 167.1 178.1 Z" fill="#3c7150" stroke-width="3"/>
<path d="M164.2 178.8 Q151.1 182.7 139.4 186.5" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M166.2 177.8 C153.2 178.1 147.1 163.4 151.3 150.2 C162.9 153 171.7 165.9 166.2 177.8 Z" fill="#62a074" stroke-width="3"/>
<path d="M164.8 175.7 Q159.1 165.6 154.3 156.4" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M155.2 173.6 C151.3 187 134.6 190.7 122.8 184.5 C129 171.5 144.7 164.4 155.2 173.6 Z" fill="#62a074" stroke-width="3"/>
<path d="M152.6 174.3 Q140.5 178.2 129.9 181.9" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M151.4 171.9 C139.6 169.4 137.5 155.2 144.3 144.4 C154.1 149.4 159.1 162.6 151.4 171.9 Z" fill="#3c7150" stroke-width="3"/>
<path d="M150.6 169.7 Q147.7 159.7 145.6 150.5" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M143.1 167.6 C137.6 182.5 120.1 184.1 108.7 174.9 C116.4 160.8 133.3 155.1 143.1 167.6 Z" fill="#3c7150" stroke-width="3"/>
<path d="M140.3 168 Q127.5 170.5 116.2 173.1" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M136 163.3 C122.8 159.9 121.7 144.7 130.3 133.9 C141.4 139.7 145.9 154 136 163.3 Z" fill="#62a074" stroke-width="3"/>
<path d="M135.4 161 Q133.1 150.2 131.4 140.4" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M127.7 157.3 C119.8 169.4 104.2 167.1 96.1 156.5 C105.8 145.7 121.7 144.2 127.7 157.3 Z" fill="#62a074" stroke-width="3"/>
<path d="M125.2 157.1 Q113.5 156.7 103.1 156.5" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M125 155.1 C112.4 152.4 111.2 138.1 119.2 127.4 C129.5 132.6 134 145.9 125 155.1 Z" fill="#3c7150" stroke-width="3"/>
<path d="M124.3 152.9 Q121.9 142.8 120.2 133.6" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M117.8 148.3 C108.9 159.7 92.9 156.8 85.2 146.2 C96 135.6 112.6 134.7 117.8 148.3 Z" fill="#3c7150" stroke-width="3"/>
<path d="M115.3 147.9 Q103.2 146.8 92.4 146.4" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M115.2 145.3 C105.3 137.5 110.2 123.6 121.9 117.1 C128.6 126.2 126.9 140.6 115.2 145.3 Z" fill="#62a074" stroke-width="3"/>
<path d="M115.5 143 Q117.7 132.5 120.1 123.2" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M112.5 142.1 C104.2 154.6 88.4 152.6 80.6 142.1 C90.8 130.1 107 128.1 112.5 142.1 Z" fill="#62a074" stroke-width="3"/>
<path d="M110 141.8 Q98.2 141.4 87.7 141.7" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M107.6 135.1 C99.4 128 103.5 115.1 113.3 108.8 C119 117.2 117.5 130.5 107.6 135.1 Z" fill="#3c7150" stroke-width="3"/>
<path d="M107.9 133 Q109.8 123.2 111.8 114.6" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M104.6 129.8 C94.1 136.6 82.5 129.2 79.9 117.9 C91.4 112.8 104.5 117.2 104.6 129.8 Z" fill="#3c7150" stroke-width="3"/>
<path d="M102.7 128.7 Q93.6 124.2 85.4 120.4" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M101.4 122.9 C94.4 114.3 100.9 102.1 111.7 97.7 C116 107.1 112.2 120.1 101.4 122.9 Z" fill="#62a074" stroke-width="3"/>
<path d="M102.1 120.8 Q105.7 111.4 109.3 103.2" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M98.5 114 C86.9 122.5 73.4 114.9 69.8 102.3 C82.7 95.5 97.8 99.6 98.5 114 Z" fill="#62a074" stroke-width="3"/>
<path d="M96.3 112.9 Q85.8 108.4 76.2 104.7" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M97.1 107.8 C90.3 97.4 98.7 87 111 85.4 C115.1 96 109.6 108.1 97.1 107.8 Z" fill="#3c7150" stroke-width="3"/>
<path d="M98.2 106 Q103.2 97.6 107.8 90.2" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M96.3 102.2 C84.9 104.8 76 94.7 76.4 84.1 C88.7 83 99.8 91 96.3 102.2 Z" fill="#3c7150" stroke-width="3"/>
<path d="M94.9 100.7 Q87.7 93.8 80.9 87.9" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M95.8 93.9 C91.1 84.9 99.2 76.1 109.7 74.9 C111.7 83.8 105.9 94 95.8 93.9 Z" fill="#62a074" stroke-width="3"/>
<path d="M96.8 92.2 Q101.7 85.1 106.5 78.9" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M96.4 82.3 C84.3 84.4 75.8 73.6 77 62.7 C89.8 62.1 100.8 70.8 96.4 82.3 Z" fill="#62a074" stroke-width="3"/>
<path d="M95 80.6 Q88 73.2 81.5 66.9" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M96.5 81.7 C95.4 70.3 107.3 65.8 118.4 70.2 C116.7 80.1 106.6 87.1 96.5 81.7 Z" fill="#3c7150" stroke-width="3"/>
<path d="M98.1 80.6 Q106.1 76.1 113.4 72.5" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M100 64 C95.3 58.6 98.9 50.2 105.5 46.8 C108.7 53 106.8 61.8 100 64 Z" fill="#4f8a62" stroke-width="3"/>
<path d="M100.4 62.6 Q102.3 56.2 104.2 50.6" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M244.3 182.6 L251.7 183.1 L259.3 183.3 L266.8 183.2 L274.3 182.7 L281.7 182 L289.1 180.9 L296.4 179.5 L303.6 177.8 L310.6 175.9 L317.4 173.6 L324 171 L330.4 168.1 L336.6 164.8 L342.5 161.3 L348 157.5 L353.3 153.4 L358.2 149 L362.7 144.3 L366.8 139.3 L370.5 134.1 L373.7 128.5 L376.5 122.6 L378.8 116.4 L380.5 109.9 L381.7 103.1 L382.4 96 L382.4 88.6 L381.8 80.8 L380.5 72.8 L378.6 64.4 L381.4 63.6 L383.6 72.1 L385 80.4 L385.8 88.4 L385.9 96.1 L385.3 103.5 L384.2 110.7 L382.5 117.5 L380.2 124.1 L377.4 130.4 L374.1 136.3 L370.3 142 L366.1 147.3 L361.4 152.3 L356.4 157.1 L351 161.5 L345.2 165.6 L339.1 169.3 L332.8 172.8 L326.2 175.9 L319.3 178.7 L312.3 181.2 L305.1 183.4 L297.7 185.3 L290.2 186.8 L282.5 188.1 L274.8 189 L267.1 189.6 L259.3 189.8 L251.5 189.8 L243.7 189.4 Z" fill="#4a3a22" stroke-width="2.5"/>
<path d="M272.9 186 C286.6 179.6 298.8 191.5 299.6 206.7 C285.8 209.8 271.3 201 272.9 186 Z" fill="#3c7150" stroke-width="3"/>
<path d="M275.1 187.6 Q285.1 195.1 293.8 202" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M278.2 185.5 C276 174.6 286.2 166.5 296.7 167.2 C297.2 178.5 288.9 188.7 278.2 185.5 Z" fill="#62a074" stroke-width="3"/>
<path d="M279.8 184.1 Q286.7 177.4 292.7 171.3" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M290.1 183.8 C301.8 175.8 315.6 185 319.4 198.8 C306.9 203.7 291.5 197.9 290.1 183.8 Z" fill="#62a074" stroke-width="3"/>
<path d="M292.5 184.9 Q303.4 190.3 313 195.4" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M304.7 180.5 C299.3 170.4 306.7 159 317 156.2 C321 167.5 316.2 180.4 304.7 180.5 Z" fill="#3c7150" stroke-width="3"/>
<path d="M305.8 178.7 Q310.5 169.8 314.5 161.7" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M308.3 179.5 C320.9 167.2 337.4 176.5 342.8 193.7 C329.2 201.7 311.2 196.9 308.3 179.5 Z" fill="#3c7150" stroke-width="3"/>
<path d="M311.1 180.4 Q324 185.4 335.3 190.2" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M316.5 176.8 C312.1 166.2 320.7 155.8 331.3 154.2 C334.2 165.8 328 178 316.5 176.8 Z" fill="#62a074" stroke-width="3"/>
<path d="M317.8 175.1 Q323.4 166.8 328.2 159.3" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M326.1 173 C335.2 161.8 349.6 167.9 355.6 181.4 C345.3 189.1 330.2 186.8 326.1 173 Z" fill="#62a074" stroke-width="3"/>
<path d="M328.5 173.5 Q339.5 176.3 349.2 179.3" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M328.2 172.1 C321.2 163 326.1 151 335.2 146.8 C341.7 157.4 339.6 170.5 328.2 172.1 Z" fill="#3c7150" stroke-width="3"/>
<path d="M329 170.1 Q331.9 160.9 334 152.5" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M339.6 166.1 C349.4 156.7 363.8 163.3 369.5 175.8 C358.6 182.3 343.3 179.1 339.6 166.1 Z" fill="#3c7150" stroke-width="3"/>
<path d="M342.1 166.7 Q353.2 170.2 363 173.5" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M345.2 162.5 C336.3 153.7 340.5 139.7 350.5 133.6 C358.3 143.9 357.2 158.7 345.2 162.5 Z" fill="#62a074" stroke-width="3"/>
<path d="M345.8 160.2 Q347.9 149.6 349.5 140" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M351.3 158.1 C362 146.4 377.8 154.2 383.9 169.8 C372.2 177.2 355.4 173.4 351.3 158.1 Z" fill="#62a074" stroke-width="3"/>
<path d="M354 158.8 Q366.2 162.7 376.9 166.8" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M356.4 153.9 C347.8 146 351.5 132.8 360.9 127 C368.2 136.3 367.4 150 356.4 153.9 Z" fill="#3c7150" stroke-width="3"/>
<path d="M356.8 151.7 Q358.6 141.8 360 132.9" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M357.8 152.6 C363.3 140.1 378.7 142.2 388.2 153.3 C380.5 162.4 365.5 163.9 357.8 152.6 Z" fill="#3c7150" stroke-width="3"/>
<path d="M360.2 152.4 Q371.4 152.2 381.4 152.7" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M364.8 145.4 C351.7 141.2 350 126.7 357.8 117 C370.3 123.1 375.6 136.9 364.8 145.4 Z" fill="#62a074" stroke-width="3"/>
<path d="M364.4 143.1 Q362 132.5 359.6 123.2" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M368.2 141.2 C371.4 129.5 386 128.2 396.6 135.5 C391 145 377.2 149.3 368.2 141.2 Z" fill="#62a074" stroke-width="3"/>
<path d="M370.4 140.5 Q380.8 138.2 390.3 136.5" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M374.6 131.3 C363.2 129.4 359 117.4 363.3 108.2 C375 111.5 382.1 122.5 374.6 131.3 Z" fill="#3c7150" stroke-width="3"/>
<path d="M373.9 129.4 Q370 120.7 366.1 113.2" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M375.1 130.3 C378.1 115.7 394.7 114.4 407.2 123.9 C401.2 135.7 385.8 140.7 375.1 130.3 Z" fill="#3c7150" stroke-width="3"/>
<path d="M377.6 129.5 Q389.3 126.8 400 125" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M379.2 121.3 C368.2 118.2 364.9 105.3 369.6 96.3 C380.9 101 387.1 113.1 379.2 121.3 Z" fill="#62a074" stroke-width="3"/>
<path d="M378.6 119.2 Q375.4 109.9 372 101.7" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M382.2 110.9 C380 97.8 393.1 91.6 406.3 95.8 C405.3 107.5 394.3 116.4 382.2 110.9 Z" fill="#62a074" stroke-width="3"/>
<path d="M384 109.5 Q392.7 103.7 400.8 98.9" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M382.5 109.6 C371.9 108.7 367.6 98.1 371.4 89.5 C382.4 91.8 389.2 101.3 382.5 109.6 Z" fill="#3c7150" stroke-width="3"/>
<path d="M381.8 108 Q377.9 100.4 374.1 93.9" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M383.6 102.5 C382.2 88.5 396.6 81.9 410.3 86.3 C408.5 98.9 396.3 108.5 383.6 102.5 Z" fill="#3c7150" stroke-width="3"/>
<path d="M385.7 101 Q395.4 94.8 404.3 89.6" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M384.2 91.5 C374.1 92.9 368.2 83.9 370.2 75.2 C380.6 75.1 388.7 82.5 384.2 91.5 Z" fill="#62a074" stroke-width="3"/>
<path d="M383.2 90.1 Q378.2 83.9 373.4 78.6" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M383.9 85.9 C380.6 73.7 392.6 66.6 405.6 69.3 C405.6 80.4 395.9 89.9 383.9 85.9 Z" fill="#62a074" stroke-width="3"/>
<path d="M385.5 84.4 Q393.3 78 400.6 72.7" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M383.4 80.3 C374.2 82.4 366.6 74.3 366.4 65.7 C376.3 64.7 385.6 71.2 383.4 80.3 Z" fill="#3c7150" stroke-width="3"/>
<path d="M382.1 79 Q376 73.5 370.3 68.8" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M380 64 C373.2 61.8 371.3 53 374.5 46.8 C381.1 50.2 384.7 58.6 380 64 Z" fill="#4f8a62" stroke-width="3"/>
<path d="M379.6 62.6 Q377.7 56.2 375.8 50.6" fill="none" stroke="#1f3b29" stroke-width="2" opacity="0.6"/>
<path d="M-10.5 6 L-9 176 L0 204 L9 176 L10.5 6 Z" fill="url(#champ-steel)" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-2.5 14 L-2 166 L0 174 L2 166 L2.5 14 Z" fill="#6a6f77" stroke-width="2.5" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-6.5 16 L-5.5 172" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.7" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-27 4 Q0 -4 27 4" fill="none" stroke-width="12" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-27 4 Q0 -4 27 4" fill="none" stroke="#e2b23f" stroke-width="6" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-22 1.5 Q-12 -1 -4 -1.2" fill="none" stroke="#fff0b8" stroke-width="2" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="-28" cy="5" r="5" fill="url(#champ-pommel)" stroke-width="3" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="28" cy="5" r="5" fill="url(#champ-pommel)" stroke-width="3" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M0 -8 L8 2 L0 13 L-8 2 Z" fill="url(#champ-gold)" stroke-width="3" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="0" cy="2.5" r="3.2" fill="#b23f2c" stroke-width="2" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<rect x="-7.5" y="-46" width="15" height="40" rx="4" fill="url(#champ-grip)" stroke-width="4" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-6.5 -39 L6.5 -34 M-6.5 -30 L6.5 -25 M-6.5 -21 L6.5 -16 M-6.5 -12 L6.5 -7" fill="none" stroke-width="2.5" opacity="0.75" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-3.5 -41 V-11" fill="none" stroke="#fff" stroke-width="2" opacity="0.3" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<rect x="-9.5" y="-11" width="19" height="7" rx="2.5" fill="url(#champ-gold)" stroke-width="3" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<rect x="-9" y="-51" width="18" height="7" rx="2.5" fill="url(#champ-gold)" stroke-width="3" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="0" cy="-61" r="11" fill="url(#champ-pommel)" stroke-width="4" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="0" cy="-61" r="4.5" fill="url(#champ-ruby)" stroke-width="2.5" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="-4" cy="-65" r="2" fill="#fff" stroke="none" opacity="0.8" transform="translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-10.5 6 L-9 176 L0 204 L9 176 L10.5 6 Z" fill="url(#champ-steel)" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-2.5 14 L-2 166 L0 174 L2 166 L2.5 14 Z" fill="#6a6f77" stroke-width="2.5" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-6.5 16 L-5.5 172" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.7" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-27 4 Q0 -4 27 4" fill="none" stroke-width="12" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-27 4 Q0 -4 27 4" fill="none" stroke="#e2b23f" stroke-width="6" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-22 1.5 Q-12 -1 -4 -1.2" fill="none" stroke="#fff0b8" stroke-width="2" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="-28" cy="5" r="5" fill="url(#champ-pommel)" stroke-width="3" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="28" cy="5" r="5" fill="url(#champ-pommel)" stroke-width="3" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M0 -8 L8 2 L0 13 L-8 2 Z" fill="url(#champ-gold)" stroke-width="3" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="0" cy="2.5" r="3.2" fill="#b23f2c" stroke-width="2" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<rect x="-7.5" y="-46" width="15" height="40" rx="4" fill="url(#champ-grip)" stroke-width="4" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-6.5 -39 L6.5 -34 M-6.5 -30 L6.5 -25 M-6.5 -21 L6.5 -16 M-6.5 -12 L6.5 -7" fill="none" stroke-width="2.5" opacity="0.75" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M-3.5 -41 V-11" fill="none" stroke="#fff" stroke-width="2" opacity="0.3" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<rect x="-9.5" y="-11" width="19" height="7" rx="2.5" fill="url(#champ-gold)" stroke-width="3" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<rect x="-9" y="-51" width="18" height="7" rx="2.5" fill="url(#champ-gold)" stroke-width="3" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="0" cy="-61" r="11" fill="url(#champ-pommel)" stroke-width="4" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="0" cy="-61" r="4.5" fill="url(#champ-ruby)" stroke-width="2.5" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<circle cx="-4" cy="-65" r="2" fill="#fff" stroke="none" opacity="0.8" transform="translate(480 0) scale(-1 1) translate(240 126) rotate(-50) translate(0 -102)"/>
<path d="M180 56 L300 56 L300 114 L300 116.2 L299.9 118.3 L299.7 120.5 L299.4 122.6 L299.1 124.7 L298.6 126.8 L298.2 128.8 L297.6 130.8 L297 132.8 L296.2 134.8 L295.5 136.7 L294.6 138.6 L293.7 140.5 L292.6 142.3 L291.6 144.2 L290.4 146 L289.2 147.8 L287.9 149.6 L286.5 151.3 L285 153 L283.5 154.7 L281.9 156.3 L280.2 158 L278.4 159.6 L276.6 161.2 L274.6 162.8 L272.7 164.3 L270.6 165.8 L268.5 167.3 L266.2 168.8 L264 170.2 L261.6 171.6 L259.2 173 L256.6 174.3 L254.1 175.7 L251.4 177 L248.7 178.3 L245.9 179.6 L243 180.8 L240 182 L237 180.8 L234.1 179.5 L231.3 178.3 L228.6 177 L225.9 175.7 L223.3 174.3 L220.8 173 L218.4 171.6 L216 170.2 L213.8 168.8 L211.5 167.3 L209.4 165.8 L207.3 164.3 L205.4 162.8 L203.4 161.2 L201.6 159.6 L199.8 158 L198.2 156.4 L196.5 154.7 L195 153 L193.5 151.3 L192.2 149.5 L190.8 147.8 L189.6 146 L188.4 144.2 L187.3 142.4 L186.3 140.5 L185.4 138.6 L184.5 136.7 L183.8 134.8 L183 132.8 L182.4 130.8 L181.8 128.8 L181.3 126.8 L180.9 124.7 L180.6 122.6 L180.3 120.5 L180.2 118.4 L180 116.2 L180 114 Z" fill="url(#champ-rim)"/>
<path d="M194 70 L286 70 L286 113.9 L286 115.7 L285.9 117.4 L285.7 119 L285.5 120.6 L285.3 122.2 L285 123.7 L284.6 125.3 L284.2 126.8 L283.7 128.3 L283.2 129.7 L282.6 131.2 L281.9 132.6 L281.2 134 L280.5 135.4 L279.6 136.8 L278.7 138.2 L277.8 139.6 L276.8 141 L275.7 142.4 L274.5 143.7 L273.3 145.1 L271.9 146.5 L270.6 147.8 L269.1 149.1 L267.6 150.5 L265.9 151.8 L264.2 153.1 L262.5 154.4 L260.6 155.7 L258.7 157 L256.6 158.3 L254.5 159.5 L252.4 160.7 L250.1 162 L247.8 163.2 L245.3 164.4 L242.8 165.6 L240.2 166.7 L237.6 167.9 L240 166.9 L242.4 167.9 L239.8 166.7 L237.2 165.6 L234.7 164.4 L232.2 163.2 L229.9 162 L227.6 160.7 L225.5 159.5 L223.4 158.3 L221.3 157 L219.4 155.7 L217.5 154.4 L215.8 153.1 L214.1 151.8 L212.4 150.5 L210.9 149.1 L209.4 147.8 L208.1 146.5 L206.7 145.1 L205.5 143.7 L204.3 142.4 L203.2 141 L202.2 139.6 L201.3 138.2 L200.4 136.8 L199.5 135.4 L198.8 134 L198.1 132.6 L197.4 131.2 L196.8 129.7 L196.3 128.3 L195.8 126.8 L195.4 125.3 L195 123.7 L194.7 122.2 L194.5 120.6 L194.3 119 L194.1 117.4 L194 115.7 L194 113.9 Z" fill="url(#champ-azure)" stroke-width="3.5"/>
<path d="M240 70 L286 70 286 113.9 L286 115.7 L285.9 117.4 L285.7 119 L285.5 120.6 L285.3 122.2 L285 123.7 L284.6 125.3 L284.2 126.8 L283.7 128.3 L283.2 129.7 L282.6 131.2 L281.9 132.6 L281.2 134 L280.5 135.4 L279.6 136.8 L278.7 138.2 L277.8 139.6 L276.8 141 L275.7 142.4 L274.5 143.7 L273.3 145.1 L271.9 146.5 L270.6 147.8 L269.1 149.1 L267.6 150.5 L265.9 151.8 L264.2 153.1 L262.5 154.4 L260.6 155.7 L258.7 157 L256.6 158.3 L254.5 159.5 L252.4 160.7 L250.1 162 L247.8 163.2 L245.3 164.4 L242.8 165.6 L240.2 166.7 L240 166.9 L242.4 167.9 L240 167.9 Z" fill="#1d3d62" opacity="0.25" stroke="none"/>
<path d="M201 78 V118 Q202 146 222 164" fill="none" stroke="#fff" stroke-width="5" opacity="0.35"/>
<path d="M240 83 L247.9 105.1 L271.4 105.8 L252.8 120.2 L259.4 142.7 L240 129.5 L220.6 142.7 L227.2 120.2 L208.6 105.8 L232.1 105.1 Z" fill="url(#champ-gold)" stroke-width="3.5"/>
<g stroke="none">
<path d="M240 116 L240 83 L247.9 105.1 Z" fill="#7d5a10" opacity="0.3"/>
<path d="M240 116 L271.4 105.8 L252.8 120.2 Z" fill="#7d5a10" opacity="0.3"/>
<path d="M240 116 L259.4 142.7 L240 129.5 Z" fill="#7d5a10" opacity="0.3"/>
<path d="M240 116 L220.6 142.7 L227.2 120.2 Z" fill="#7d5a10" opacity="0.3"/>
<path d="M240 116 L208.6 105.8 L232.1 105.1 Z" fill="#7d5a10" opacity="0.3"/>
</g>
<path d="M240 83 L247.9 105.1 L271.4 105.8 L252.8 120.2 L259.4 142.7 L240 129.5 L220.6 142.7 L227.2 120.2 L208.6 105.8 L232.1 105.1 Z" fill="none" stroke-width="3.5"/>
<circle cx="292.6" cy="86" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="291.6" cy="84.9" r="1" fill="#fff" stroke="none"/>
<circle cx="292.6" cy="108.6" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="291.6" cy="107.5" r="1" fill="#fff" stroke="none"/>
<circle cx="289.8" cy="130.9" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="288.8" cy="129.8" r="1" fill="#fff" stroke="none"/>
<circle cx="277.9" cy="149.9" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="276.9" cy="148.8" r="1" fill="#fff" stroke="none"/>
<circle cx="260.2" cy="163.9" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="259.2" cy="162.8" r="1" fill="#fff" stroke="none"/>
<circle cx="240" cy="174" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="239" cy="172.9" r="1" fill="#fff" stroke="none"/>
<circle cx="219.8" cy="163.9" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="218.8" cy="162.8" r="1" fill="#fff" stroke="none"/>
<circle cx="202.1" cy="149.9" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="201.1" cy="148.8" r="1" fill="#fff" stroke="none"/>
<circle cx="190.2" cy="130.9" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="189.2" cy="129.8" r="1" fill="#fff" stroke="none"/>
<circle cx="187.4" cy="108.6" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="186.4" cy="107.5" r="1" fill="#fff" stroke="none"/>
<circle cx="187.4" cy="86" r="3" fill="url(#champ-nail)" stroke-width="2"/>
<circle cx="186.4" cy="84.9" r="1" fill="#fff" stroke="none"/>
<path d="M198 52 L190 20 Q203 33 212 34 L216 24 L220 34 Q230 32 236 20 L240 12 L244 18 Q250 28 260 30 L264 22 L268 30 Q277 30 290 20 L282 52 Z" fill="url(#champ-gold)"/>
<path d="M200 48 Q240 40 280 48" fill="none" stroke-width="2.5" opacity="0.35"/>
<path d="M196 29 L200.5 45" fill="none" stroke="#fff" stroke-width="3" opacity="0.6"/>
<path d="M240 22 Q249 31 249 38 Q249 47 240 47 Q231 47 231 38 Q231 31 240 22 Z" fill="url(#champ-ruby)" stroke-width="2.5"/>
<circle cx="237.5" cy="36" r="1.8" fill="#fff" stroke="none" opacity="0.8"/>
<circle cx="190" cy="18" r="5.5" fill="url(#champ-pommel)" stroke-width="3"/>
<circle cx="188.1" cy="15.8" r="1.4" fill="#fff" stroke="none"/>
<circle cx="216" cy="20" r="4" fill="url(#champ-pommel)" stroke-width="3"/>
<circle cx="214.6" cy="18.4" r="1.4" fill="#fff" stroke="none"/>
<circle cx="240" cy="12" r="5.5" fill="url(#champ-pommel)" stroke-width="3"/>
<circle cx="238.1" cy="9.8" r="1.4" fill="#fff" stroke="none"/>
<circle cx="264" cy="20" r="4" fill="url(#champ-pommel)" stroke-width="3"/>
<circle cx="262.6" cy="18.4" r="1.4" fill="#fff" stroke="none"/>
<circle cx="290" cy="18" r="5.5" fill="url(#champ-pommel)" stroke-width="3"/>
<circle cx="288.1" cy="15.8" r="1.4" fill="#fff" stroke="none"/>
<rect x="194" y="50" width="92" height="15" rx="4" fill="url(#champ-gold)" stroke-width="4"/>
<path d="M200 54 H280" fill="none" stroke="#fff" stroke-width="2" opacity="0.6"/>
<path d="M214 51.5 L220.5 57.5 L214 63.5 L207.5 57.5 Z" fill="url(#champ-sapphire)" stroke-width="2.5"/>
<circle cx="240" cy="57.5" r="5" fill="url(#champ-ruby)" stroke-width="2.5"/>
<path d="M266 51.5 L272.5 57.5 L266 63.5 L259.5 57.5 Z" fill="url(#champ-sapphire)" stroke-width="2.5"/>
<path d="M80 184 H30 L44 216 L30 248 H80 Z" fill="url(#champ-tail)"/>
<path d="M400 184 H450 L436 216 L450 248 H400 Z" fill="url(#champ-tailr)"/>
<path d="M58 184 V216 L36 184 Z" fill="#3a120b" stroke-width="3.5"/>
<path d="M422 184 V216 L444 184 Z" fill="#3a120b" stroke-width="3.5"/>
<path d="M56 194 Q240 186 424 194 V288 Q240 280 56 288 Z" fill="url(#champ-gold)"/>
<path d="M61.5 199.5 Q240 191.5 418.5 199.5 V282.5 Q240 274.5 61.5 282.5 Z" fill="url(#champ-band)" stroke-width="3"/>
</g>
<g transform="translate(116 259.6) scale(0.72)" stroke-linejoin="round">
<path d="M18.8 -67.3Q17.8 -67.3 17 -66.3V-25Q17 -20.8 17.5 -18.2Q18 -15.7 19.7 -13.2Q23 -8.4 34.8 -8.4V-5.5Q34.3 -5.5 27.4 -2.8Q20.5 0 19 0Q14 0 9.5 -5.8Q5 -11.5 5 -17.9V-67.8Q5 -68.5 16.5 -72.8Q27.9 -77 29.6 -77Q30.2 -77 31 -74.1Q31.8 -71.2 32.9 -67.1Q33.9 -63 35 -61Q36.2 -59.1 39.4 -59.1V-57.1Q37.2 -56.1 32 -53.5Q26.7 -51 26.3 -51Q24.8 -51 22.5 -59.1Q20.2 -67.3 18.8 -67.3ZM45.4 -6.8V-56.3Q45.4 -59 44.5 -60.2Q43.6 -61.3 41.4 -61.3V-64.1Q54.4 -70.9 64.6 -76.9L66.2 -73.7Q65.2 -73.2 63.4 -71.8Q61.6 -70.3 60.4 -68.8Q57.4 -65 57.4 -60.2V-51.7Q67.7 -57 69.4 -57Q72.6 -57 75.5 -53Q78.4 -49 78.4 -44.2V-14.8Q78.4 -9.3 83.3 -8.3V-6.1L72.4 0Q70.2 -0.9 68.3 -3Q66.4 -5 66.4 -6.8V-35.8Q66.4 -45.6 62.8 -46.9Q61.1 -47.5 57.4 -47.5V-14.8Q57.4 -8.7 61.5 -7.9V-5.7L51.4 0Q49.2 -0.9 47.3 -3Q45.4 -5 45.4 -6.8ZM119.4 -43.8V-15.5Q119.4 -11.8 120.6 -10.4Q121.8 -8.9 124.3 -8.3V-6.1L113.4 0Q111.2 -0.9 109.3 -3Q107.4 -5 107.4 -6.7L94.9 0Q94.6 -0.2 94 -0.6Q93.4 -0.9 92 -2.1Q90.5 -3.2 89.4 -4.5Q86.4 -7.8 86.4 -12V-28.4Q86.4 -30 91.6 -32.5Q96.8 -35 102 -36.6L107.3 -38.3Q107.3 -44 104.3 -46.2Q101.3 -48.5 92.7 -48.5V-51.5Q108.2 -57 110.1 -57Q113.4 -57 116.4 -52.7Q119.4 -48.4 119.4 -43.8ZM107.4 -11.2V-33.8Q104.9 -32.9 103.7 -32.3Q102.4 -31.7 101 -30.4Q98.4 -28 98.4 -22.1V-15.6Q98.4 -13 100 -11.4Q101.5 -9.7 103.4 -9.7Q105.3 -9.7 107.4 -11.2ZM129.4 -6.8V-40.7Q129.4 -44 128 -46.4Q126.6 -48.8 124.5 -48.8V-51Q125.2 -51.1 135.4 -57.1Q136.1 -56.9 137.1 -56.6Q138.1 -56.2 139.8 -54.6Q141.4 -53 141.4 -50.9Q142 -51.2 144.8 -52.8Q152.2 -57 154 -57Q155.7 -57 157.9 -55.2Q160 -53.4 161.1 -50.9Q161.3 -51 165.2 -53Q173 -57 174.6 -57Q177.8 -57 180.6 -52.8Q183.4 -48.6 183.4 -45.1V-14.8Q183.4 -9.3 188.3 -8.3V-6.1L177.4 0Q175.2 -0.9 173.3 -3Q171.4 -5 171.4 -6.8V-36.3Q171.4 -42.8 169.7 -45Q168 -47.1 165.3 -47.1L162.4 -46.5V-14.8Q162.4 -9.3 167.3 -8.3V-6.1L156.4 0Q154.2 -0.9 152.3 -3Q150.4 -5 150.4 -6.8V-35.8Q150.4 -47.3 144.9 -47.3L141.4 -46.7V-14.8Q141.4 -8.7 145.5 -7.9V-5.7L135.4 0Q133.2 -0.9 131.3 -3Q129.4 -5 129.4 -6.8ZM209.4 -47.7Q207.5 -47.7 205.5 -46.1V-6.4Q208.1 -6.4 211.3 -8.1Q214.5 -9.8 214.5 -11.7V-40.3Q214.5 -47.7 209.4 -47.7ZM193.4 11V-41.6Q193.4 -43.9 192.2 -46.1Q190.9 -48.3 188.6 -48.6V-50.8Q189.3 -50.9 199.5 -56.9Q201.8 -55.9 203.7 -54Q205.5 -52 205.5 -50.3Q216.2 -56.9 218 -56.9Q218.7 -56.9 220.7 -55.4Q222.6 -53.8 224.6 -50.9Q226.5 -47.9 226.5 -44.8V-9.2Q226.5 -8.5 217.7 -5Q208.8 -1.6 205.4 -0.7V3Q205.4 9.1 209.5 9.9V12.1L199.4 17.8Q197.2 16.9 195.3 14.9Q193.4 12.8 193.4 11ZM248.4 -50.2V-14.8Q248.4 -8.7 252.5 -7.9V-5.7L242.4 0Q240.2 -0.9 238.3 -3Q236.4 -5 236.4 -6.8V-42.2Q236.4 -48.3 232.3 -49.1V-51.3L242.4 -57Q244.6 -56.1 246.5 -54Q248.4 -52 248.4 -50.2ZM234.9 -69.5V-75.6Q234.9 -75.9 239.1 -77.5Q243.2 -79 243.9 -79Q244.5 -79 245.8 -77.3Q247 -75.6 247 -73.8V-66.5Q247 -66.2 243 -64.7Q239 -63.1 238.1 -63.1Q237.2 -63.1 236.1 -64.9Q234.9 -66.6 234.9 -69.5ZM258.4 -14.6V-47.8Q258.4 -48.5 269.8 -52.8Q281.2 -57 282.9 -57Q284.6 -57 288.1 -52.9Q291.5 -48.8 291.5 -45.5V-9.3Q291.5 -8.5 280.6 -4.2Q269.6 0 267.1 0Q264.7 0 261.5 -4.3Q258.4 -8.6 258.4 -14.6ZM275.5 -9.2Q277.4 -9.2 279.4 -10.8V-40.3Q279.4 -47.7 274.3 -47.7Q272.3 -47.7 270.4 -46.2V-16.6Q270.4 -9.2 275.5 -9.2ZM301.5 -6.8V-40.7Q301.5 -44 300.1 -46.4Q298.7 -48.8 296.6 -48.8V-51Q297.3 -51.1 307.5 -57.1Q308.2 -56.9 309.2 -56.6Q310.2 -56.2 311.9 -54.6Q313.5 -53 313.5 -50.9Q314.1 -51.2 316.9 -52.8Q324.3 -57 325.7 -57Q328.9 -57 331.7 -52.8Q334.5 -48.6 334.5 -45.1V-14.8Q334.5 -9.3 339.4 -8.3V-6.1L328.5 0Q326.3 -0.9 324.4 -3Q322.5 -5 322.5 -6.8V-35.8Q322.5 -41.4 321.2 -44.4Q320 -47.3 316.8 -47.3L313.5 -46.7V-14.8Q313.5 -8.7 317.6 -7.9V-5.7L307.5 0Q305.3 -0.9 303.4 -3Q301.5 -5 301.5 -6.8Z" fill="url(#champ-letter)" stroke="#332a24" stroke-width="13.2" paint-order="stroke"/>
</g>
</svg>
