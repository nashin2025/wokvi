import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Mode } from '../types';

interface ModeState {
  availableModes: Mode[];
  currentMode: Mode;
  setCurrentMode: (mode: Mode) => void;
  canAccessMode: (mode: Mode) => boolean;
}

export const useModeStore = create<ModeState>()(
  devtools(
    (set, get) => ({
      availableModes: ['magic', 'guided', 'pro'],
      currentMode: 'magic',

      setCurrentMode: (mode) => {
        if (get().availableModes.includes(mode)) {
          set({ currentMode: mode });
        }
      },

      canAccessMode: (mode) => {
        const { availableModes } = get();
        return availableModes.includes(mode);
      },
    }),
    { name: 'mode-store' }
  )
);