import { writable } from 'svelte/store';

// Modalità Docente: mostra formule e soluzioni. Si attiva/disattiva con Ctrl+Shift+D (gestito in App.svelte).
export const teacherMode = writable(false);
