import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  subscription: "free" | "basic" | "pro" | "ultra";
  points: number;
}

interface UserStore {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setPoints: (points: number) => void;
  login: (user: User) => void;
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
  setPoints: (points) =>
    set((state) => ({
      user: state.user ? { ...state.user, points } : null,
    })),
  login: (user) => set({ user, isLoggedIn: true, isLoading: false }),
  logout: () => set({ user: null, isLoggedIn: false, isLoading: false }),
}));
