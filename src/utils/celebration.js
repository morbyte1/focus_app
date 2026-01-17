import confetti from 'canvas-confetti';

// 1. Pré-carregamento do áudio (Singleton)
// Criar a instância fora da função garante que o arquivo seja baixado antes do clique.
const successAudio = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3');
successAudio.volume = 0.5;

export const triggerCelebration = () => {
  // 2. Reset e Play imediato
  // Reinicia o áudio caso o usuário clique várias vezes rápido
  successAudio.currentTime = 0;
  successAudio.play().catch((e) => console.warn("Áudio bloqueado pelo navegador", e));

  // 3. Disparo dos Confetes (Sincronizado)
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