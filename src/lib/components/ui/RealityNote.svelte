<script>
  // Nota "Nel mondo reale": distingue il modello semplificato dalla missione vera.
  let { title = 'Nella missione reale', children } = $props();
</script>

<aside class="flex gap-3 rounded-lg border border-line bg-panel-2 p-4 text-sm leading-relaxed">
  <svg class="w-5 h-5 flex-none text-signal mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  <div>
    <div class="mc-label mb-1">{title}</div>
    <div class="text-muted">{@render children?.()}</div>
  </div>
</aside>
