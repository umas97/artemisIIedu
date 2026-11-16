<script>
  import { teacherMode } from '../../stores/teacherMode.js';
  // Riquadro visibile solo in Modalità Docente (Ctrl+Shift+D).
  let { children } = $props();
</script>

{#if $teacherMode}
  <section class="mc-teacher mc-enter text-sm">
    <div class="mc-label mb-2">Modalità Docente</div>
    {@render children?.()}
  </section>
{/if}
