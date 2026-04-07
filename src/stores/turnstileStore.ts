import { create } from 'zustand';

interface TurnstileStore {
  isOpen: boolean;
  resolvePromise: ((token: string) => void) | null;
  rejectPromise: ((reason: any) => void) | null;
  requestChallenge: () => Promise<string>;
  closeModal: () => void;
}

export const useTurnstileStore = create<TurnstileStore>((set, get) => ({
  isOpen: false,
  resolvePromise: null,
  rejectPromise: null,
  
  requestChallenge: () => {
    return new Promise<string>((resolve, reject) => {
      set({
        isOpen: true,
        resolvePromise: resolve,
        rejectPromise: reject,
      });
    });
  },

  closeModal: () => {
    const { rejectPromise } = get();
    if (rejectPromise) {
      rejectPromise(new Error('Challenge cancelled by user'));
    }
    set({
      isOpen: false,
      resolvePromise: null,
      rejectPromise: null,
    });
  },
}));