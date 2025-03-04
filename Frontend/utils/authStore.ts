import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export const authStore = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  removeToken: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};
