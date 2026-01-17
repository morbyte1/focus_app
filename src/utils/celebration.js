import confetti from 'canvas-confetti';

/**
 * Dispara uma celebração visual (confetes) e auditiva (som de sucesso).
 */
export const triggerCelebration = () => {
  // 1. Efeito Sonoro (Short Success Pop)
  // Usando um som curto e agradável de domínio público/CDN confiável
  try {
    const audio = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3');
    audio.volume = 0.5; // Volume a 50% para não assustar o usuário
    audio.play().catch((e) => console.warn("Reprodução automática de áudio bloqueada pelo navegador", e));
  } catch (error) {
    console.error("Erro ao tocar som de celebração", error);
  }

  // 2. Efeito de Confete (Explosão Realista)
  const count = 200;
  const defaults = { origin: { y: 0.7 } };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};