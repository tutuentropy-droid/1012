import { create } from 'zustand';
import type { User, ChineseColor, BindingPreferences, PaperTexture, InkLevel, SealStyle } from '@/types';
import { DEFAULT_BINDING } from '@/types';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  chineseColors: ChineseColor[];
  isLoading: boolean;
  binding: BindingPreferences;

  setAuth: (token: string, user: User) => void;
  logout: () => void;
  restoreAuth: () => void;
  setChineseColors: (colors: ChineseColor[]) => void;
  setUser: (user: User) => void;
  setPaperTexture: (texture: PaperTexture) => void;
  setInkLevel: (level: InkLevel) => void;
  setSealStyle: (style: SealStyle) => void;
  setBinding: (binding: BindingPreferences) => void;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('henji_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredBinding = (): BindingPreferences => {
  try {
    const raw = localStorage.getItem('henji_binding');
    if (raw) {
      return { ...DEFAULT_BINDING, ...JSON.parse(raw) };
    }
  } catch {}
  const user = getStoredUser();
  if (user?.preferences?.binding) {
    return { ...DEFAULT_BINDING, ...user.preferences.binding };
  }
  return DEFAULT_BINDING;
};

const persistBinding = (binding: BindingPreferences) => {
  localStorage.setItem('henji_binding', JSON.stringify(binding));
};

export const useUserStore = create<UserState>((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem('henji_token'),
  isAuthenticated: !!localStorage.getItem('henji_token'),
  chineseColors: [],
  isLoading: false,
  binding: getStoredBinding(),

  setAuth: (token, user) => {
    localStorage.setItem('henji_token', token);
    localStorage.setItem('henji_user', JSON.stringify(user));
    const storedBinding = getStoredBinding();
    const userBinding = user?.preferences?.binding || {};
    const merged = { ...DEFAULT_BINDING, ...userBinding, ...storedBinding };
    persistBinding(merged);
    set({ token, user, isAuthenticated: true, binding: merged });
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
      const storedBinding = getStoredBinding();
      const userBinding = user?.preferences?.binding || {};
      const merged = { ...DEFAULT_BINDING, ...userBinding, ...storedBinding };
      persistBinding(merged);
      set({ token, user, isAuthenticated: true, binding: merged });
    }
  },

  setChineseColors: (colors) => set({ chineseColors: colors }),

  setUser: (user) => {
    localStorage.setItem('henji_user', JSON.stringify(user));
    set({ user });
  },

  setPaperTexture: (texture) => {
    const binding = { ...get().binding, paperTexture: texture };
    persistBinding(binding);
    set({ binding });
  },

  setInkLevel: (level) => {
    const binding = { ...get().binding, inkLevel: level };
    persistBinding(binding);
    set({ binding });
  },

  setSealStyle: (style) => {
    const binding = { ...get().binding, sealStyle: style };
    persistBinding(binding);
    set({ binding });
  },

  setBinding: (newBinding) => {
    const binding = { ...DEFAULT_BINDING, ...newBinding };
    persistBinding(binding);
    set({ binding });
  },
}));
