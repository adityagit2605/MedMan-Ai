import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth store — persists user session in localStorage.
 * Stores: user object, accessToken, refreshToken.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      getRole: () => {
        const user = get().user;
        return user?.role?.replace('ROLE_', '')?.toLowerCase() || null;
      },
    }),
    {
      name: 'healthcare-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
