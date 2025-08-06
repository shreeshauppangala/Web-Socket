export interface UserI {
  _id: string;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface RegisterFormI {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormI {
  email: string;
  password: string;
}

export interface MessageI {
  _id?: string;
  sender?: {
    username: string;
    _id: string;
  };
  content: string;
  room?: string;
  messageType: 'text' | 'system';
  createdAt?: string;
  updatedAt?: string;
}