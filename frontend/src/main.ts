import { GameEngine } from './engine/GameEngine';
import { TitleScreen } from './ui/TitleScreen';
import { VocationType } from './types/api';
import { soundFX } from './audio/AudioSystem';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Game canvas element #game-canvas not found.');
    return;
  }

  // Audio unlock listener on first user interaction
  const unlockAudio = () => {
    soundFX.init();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  // Audio Mute/Unmute Toggle Button
  const audioBtn = document.getElementById('audio-toggle-btn');
  if (audioBtn) {
    const updateAudioBtnUI = () => {
      const isMuted = soundFX.getMuted();
      audioBtn.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
      if (isMuted) {
        audioBtn.classList.add('muted');
      } else {
        audioBtn.classList.remove('muted');
      }
    };
    updateAudioBtnUI();

    audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      soundFX.init();
      soundFX.toggleMute();
      soundFX.playClick();
      updateAudioBtnUI();
    });
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

  // Show Atmospheric Title Screen
  const titleScreen = new TitleScreen('modal-overlay', async (vocation: VocationType, isContinue?: boolean) => {
    soundFX.init();
    soundFX.playClick();
    await engine.initializeSession(vocation, isContinue);
  });

  titleScreen.show();
});
