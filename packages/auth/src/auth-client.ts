import { createAuthClient } from "better-auth/react";
import { genericOAuthClient, oneTapClient } from "better-auth/client/plugins";

const resolvedBaseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "";

export const authClient = createAuthClient({
  baseURL: resolvedBaseURL,
  basePath: "/api/auth",
  plugins: [
    genericOAuthClient(),
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      autoSelect: true,
      cancelOnTapOutside: true,
      context: "signin",
      additionalOptions: {},
      promptOptions: {
        baseDelay: 500,
        maxAttempts: 5,
        fedCM: false,
      },
    }),
  ],
});

export const signInWithGoogle = async (options?: { callbackURL?: string }) => {
  const data = await authClient.signIn.social({
    provider: "google",
    callbackURL: options?.callbackURL,
  });
  return data;
};

export const signInWithTikTok = async (options?: { callbackURL?: string; scopes?: string[] }) => {
  const data = await authClient.signIn.social({
    provider: "tiktok",
    callbackURL: options?.callbackURL,
    scopes: options?.scopes,
  });
  return data;
};

export const signOut = async () => {
  const data = await authClient.signOut();
  return data;
};

export const signInWithOneTap = async (options?: { callbackURL?: string }) => {
  await (authClient.oneTap as (params?: { callbackURL?: string }) => Promise<unknown>)({
    callbackURL: options?.callbackURL,
  });
};

export const signInWithEmail = async (email: string, password: string) => {
  const data = await authClient.signIn.email({
    email,
    password,
  });
  return data;
};

export const signUp = async (email: string, password: string, name: string) => {
  const data = await authClient.signUp.email({
    email,
    password,
    name,
  });
  return data;
}

export const signInWithInstagram = async (options?: { callbackURL?: string }) => {
  const response = await authClient.signIn.oauth2({
    providerId: "instagram",
    callbackURL: options?.callbackURL || "/a/acme/integrations?connected=true",
  });
  return response;
}

export const linkInstagram = async (options?: { callbackURL?: string }) => {
  const response = await authClient.linkSocial({
    provider: "instagram",
    callbackURL: options?.callbackURL || "/a/acme/integrations?connected=true",
  });
  return response;
}

export const linkTikTok = async (options?: { callbackURL?: string; scopes?: string[] }) => {
  const response = await authClient.linkSocial({
    provider: "tiktok",
    callbackURL: options?.callbackURL,
    scopes: options?.scopes,
  } as {
    provider: "tiktok";
    callbackURL?: string;
    scopes?: string[];
  });
  return response;
}

export const useSession = authClient.useSession;