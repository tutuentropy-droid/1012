import { create } from 'zustand';
import type { User, ChineseColor } from '@/types';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  chineseColors: ChineseColor[];
  isLoading: boolean;

  setAuth: (token: string, user: User) => void;
  logout: () => void;
  restoreAuth: () => void;
  setChineseColors: (colors: ChineseColor[]) => void;
  setUser: (user: User) => void;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('henji_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useUserStore = create<UserState>((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('henji_token'),
  isAuthenticated: !!localStorage.getItem('henji_token'),
  chineseColors: [],
  isLoading: false,

  setAuth: (token, user) => {
    localStorage.setItem('henji_token', token);
    localStorage.setItem('henji_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('henji_token');
    localStorage.removeItem('henji_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  restoreAuth: () => {
    const token = localStorage.getItem('henji_token');
    const user = getStoredUser();
    if (token && user) {
      set({ token, user, isAuthenticated: true });
    }
  },

  setChineseColors: (colors) => set({ chineseColors: colors }),

  setUser: (user) => {
    localStorage.setItem('henji_user', JSON.stringify(user));
    set({ user });
  },
}));
