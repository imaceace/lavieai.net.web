import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  subscription_type: "free" | "basic" | "pro" | "ultra";
  subscription_expire?: number;
  created_at?: number;
  credits: number;
}

interface UserStore {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setCredits: (credits: number) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      isLoggedIn: !!user,
      isLoading: false,
    }),
  setCredits: (credits) =>
    set((state) => ({
      user: state.user ? { ...state.user, credits } : null,
    })),
  logout: () => set({ user: null, isLoggedIn: false, isLoading: false }),
}));
