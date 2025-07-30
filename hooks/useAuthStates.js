import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";


export const useAuthState = () => {
  const {
    user,
    userInfo = {},
    authState,
    error,
    isSigningIn = false,
    isSigningOut = false,
    getCapabilities = () => ({}),
  } = useAuth();

  const capabilities = useMemo(() => getCapabilities() || {}, [getCapabilities]);

  const isAuthenticated = !!user;
  const isAnonymous = userInfo?.isAnonymous ?? false;

  const isLoading = isSigningIn || isSigningOut;

  const canLinkAccount = capabilities?.canLinkWithGoogle ?? false;
  const canUpdateProfile = capabilities?.canUpdateProfile ?? false;

  return {
    isAuthenticated,
    isAnonymous,
    isSigningIn,
    isSigningOut,
    isLoading,
    canLinkAccount,
    canUpdateProfile,
    userInfo,
    error,
    authState,
  };
};
