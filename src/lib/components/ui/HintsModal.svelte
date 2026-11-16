<script>
  // Finestra sovrapposta con la "Guida al ragionamento". Si chiude con Esc o clic fuori.
  let { open = false, title = 'Guida al ragionamento', onClose, children } = $props();

  const onKey = (e) => {
    if (open && e.key === 'Escape') onClose?.();
  };
</script>

<svelte:window onkeydown={onKey} />

{#if open}
  <div
    class="fixed inset-0 z-[60] bg-space-black/80 flex items-center justify-center p-6"
    role="presentation"
    onclick={(e) => e.target === e.currentTarget && onClose?.()}
  >
    <div class="mc-panel mc-enter w-full max-w-xl p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div class="flex items-start justify-between gap-4 mb-4">
        <h3 class="text-lg font-bold text-white">{title}</h3>
        <button type="button" class="mc-icon-btn" onclick={onClose} aria-label="Chiudi">&times;</button>
      </div>
      <div class="space-y-4 text-[0.95rem] leading-relaxed text-lunar-gray">
        {@render children?.()}
      </div>
      <button type="button" class="mc-btn mc-btn-primary w-full mt-6" onclick={onClose}>Torniamo ai calcoli</button>
    </div>
  </div>
{/if}
