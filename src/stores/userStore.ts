import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  // Membership type shown to users: Free/Creator/Plus/Studio
  subscription_type: "free" | "creator" | "plus" | "studio";
  subscription_interval?: "monthly" | "yearly" | null;
  tier?: "free" | "basic" | "pro" | "max" | "ultra"; // Added tier explicitly
  subscription_expire?: number;
  created_at?: number;
  credits: number;
  is_public_default?: number;
  isWhitelisted?: boolean;
  canBuyPoints?: boolean;
  is_admin?: boolean;
  purchase_paused?: boolean;
  purchase_paused_until?: number | null;
  purchase_pause_reason?: string | null;
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
