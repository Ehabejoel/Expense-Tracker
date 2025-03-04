export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
}
