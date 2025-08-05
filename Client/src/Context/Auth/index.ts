import { createContext } from 'react';
import type { LoginFormI, RegisterFormI, UserI } from '../../Constants/interface';

interface AuthI {
  user: UserI | null;
  onSignIn: (data: LoginFormI) => void;
  onSignUp: (data: RegisterFormI) => void;
  onSignOut: () => void;
  isSigningIn: boolean;
  isSigningOut: boolean;
  isSignUpLoading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthI | undefined>(undefined);

export { AuthContext };
export type { AuthI };
