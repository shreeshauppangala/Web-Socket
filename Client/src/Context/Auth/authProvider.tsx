import { useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState, type ReactNode } from "react";
import type { LoginFormI, RegisterFormI, UserI } from "../../Constants/interface";
import { authAPI } from "../../Services/api";
// import { useNavigate } from "react-router-dom";
import { AuthContext } from ".";

interface ProvideAuthI {
  children: ReactNode;
}

const useAuthFunc = () => {
  const [user, setUser] = useState<UserI | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // const navigate = useNavigate();

  const queryClient = useQueryClient();


  const { mutate: mutateSignUp, isPending: isSignUpLoading } = useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => {
      queryClient.clear();
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const onSignUp = (data: RegisterFormI) => {
    mutateSignUp(data);
  };

  const { mutate: mutateSignIn, isPending: isSigningIn } = useMutation({
    mutationFn: authAPI.login,
    onSuccess: ({ data }) => {
      localStorage.setItem("user", JSON.stringify({ ...data.data }));
      setUser({ ...data.data });
      // navigate("/chat");
      queryClient.setQueryData(["user"], data.data);
      localStorage.setItem("token", data.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      queryClient.clear();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const onSignIn = (data: LoginFormI) => {
    mutateSignIn(data);
  };

  const { mutate: mutateSignOut, isPending: isSigningOut } = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      localStorage.clear();
      queryClient.clear();
      setUser(null);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const onSignOut = () => {
    mutateSignOut();
  };

//   /**
//  * Custom hook that uses the `useQuery` hook from a query library to fetch profile data.
//  * @returns An object containing the profile data.
//  */
//   const UseGetProfileData = () =>
//     useQuery({
//       queryKey: ['profile'],
//       queryFn: () => getProfileData(),
//       select: ({ data }) => data,
//     });

  return { user, onSignUp, onSignIn, onSignOut, isSigningIn, isSigningOut, isSignUpLoading };

}

export const AuthProvider = ({ children }: ProvideAuthI) => {
  const AuthValue = useAuthFunc();

  return (
    <AuthContext.Provider value={AuthValue}>{children}</AuthContext.Provider>
  );
};