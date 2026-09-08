import { GameEngine } from './engine/GameEngine';
import { CharacterSelect } from './ui/CharacterSelect';
import { VocationType } from './types/api';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Game canvas element #game-canvas not found.');
    return;
  }

  // Adjust canvas buffer size based on container
  const resizeCanvas = () => {
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Initialize GameEngine
  const engine = new GameEngine(
    canvas,
    'paperdoll-container',
    'backpack-container',
    'status-bars-container',
    'hotbar-container',
    'combat-log-container'
  );

  // Show Character Selection Modal
  const charSelect = new CharacterSelect('modal-overlay', async (vocation: VocationType) => {
    await engine.initializeSession(vocation);
  });

  charSelect.show();
});
