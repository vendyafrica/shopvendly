import {
  authClient,
  signInWithGoogle as sharedSignInWithGoogle,
  signOut as sharedSignOut,
} from "@shopvendly/auth/client";

export async function signInWithGoogle(redirectTo?: string) {
  return await sharedSignInWithGoogle({ callbackURL: redirectTo || "/dashboard" });
}

export async function signOut() {
  return await sharedSignOut();
}

export async function getSession() {
  const data = await authClient.getSession();
  return data;
}
