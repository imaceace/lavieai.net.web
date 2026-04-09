import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  subscription_type: "free" | "creator" | "plus" | "ultra";
  tier?: "free" | "basic" | "pro" | "max" | "ultra"; // Added tier explicitly
  subscription_expire?: number;
  created_at?: number;
  credits: number;
  is_public_default?: number;
  isWhitelisted?: boolean;
  is_admin?: boolean;
}

interface UserStore {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  setUser: (user: User | null) => void;
  setCredits: (credits: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  logout: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  isLoginModalOpen: false,
  setUser: (user) =>
    set({
      user,
      isLoggedIn: !!user,
      isLoading: false,
    }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setCredits: (credits) =>
    set((state) => ({
      user: state.user ? { ...state.user, credits } : null,
    })),
  logout: () => set({ user: null, isLoggedIn: false, isLoading: false }),
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
}));
