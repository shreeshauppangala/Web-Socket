export interface UserI {
  username: string;
  email: string;
  password: string;
  isOnline: boolean;
  lastSeen: Date;
  comparePassword?: (candidatePassword: string) => Promise<boolean>;
}

export interface MessageI {
  sender: UserI;
  content: string;
  room: string;
  messageType: 'text' | 'system';
}