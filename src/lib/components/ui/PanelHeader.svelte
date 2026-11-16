<script>
  // Intestazione comune a briefing e terminali di calcolo.
  // step: numero fase; kicker: riga piccola sopra il titolo; onBack/onInfo opzionali.
  let { step, title, kicker = '', onBack = null, onInfo = null, infoLabel = 'Suggerimenti' } = $props();
</script>

<header class="flex items-center gap-4 border-b border-line pb-4 mb-5">
  {#if onBack}
    <button type="button" class="mc-icon-btn" onclick={onBack} title="Torna indietro" aria-label="Torna indietro">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
    </button>
  {/if}
  {#if step}
    <div class="flex-none w-12 h-12 rounded-lg border border-signal/40 bg-nasa-blue/15 flex items-center justify-center font-mono font-bold text-xl text-signal">
      {String(step).padStart(2, '0')}
    </div>
  {/if}
  <div class="flex-1 min-w-0">
    {#if kicker}<div class="mc-label">{kicker}</div>{/if}
    <h2 class="mc-title">{title}</h2>
  </div>
  {#if onInfo}
    <button type="button" class="mc-btn mc-btn-ghost !py-2 !px-3 !text-xs" onclick={onInfo} title={infoLabel}>
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
      {infoLabel}
    </button>
  {/if}
</header>
