import { authClient, signInWithGoogle as sharedSignInWithGoogle, signOut as sharedSignOut } from "@shopvendly/auth/client";

export async function signIn(email: string, password: string) {
    const data = await authClient.signIn.email({
        email,
        password,
    });

    return data;
}

export async function signUp(email: string, password: string, name: string) {
    const data = await authClient.signUp.email({
        email,
        password,
        name,
    });
    return data;
}

export async function signInWithGoogle(redirectTo?: string) {
    return await sharedSignInWithGoogle({ callbackURL: redirectTo || "/super-admin" });
}

export async function signOut() {
    return await sharedSignOut();
}

export async function getSession() {
    const data = await authClient.getSession();
    return data;
}