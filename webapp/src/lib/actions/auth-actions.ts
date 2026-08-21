'use server';
import {fetchClient} from "@/lib/fetchClient";
import {auth, signOut} from "@/auth";
import {createKeycloakUser} from "@/lib/keycloakAdmin";
import {redirect} from "next/navigation";

export async function testAuth() {
    return fetchClient<string>(`/test/auth`, 'GET')
}

export type RegisterInput = {
    username: string;
    email: string;
    password: string;
};

export type RegisterResult = {
    data: {success: true} | null;
    error?: {message: string, field?: 'username' | 'email'};
};

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
    const {error} = await createKeycloakUser(input);

    if (error) {
        return {data: null, error: {message: error.message, field: error.field}};
    }

    return {data: {success: true}};
}

// Clears the app's own session cookie AND ends the Keycloak SSO session.
// Without the redirect to Keycloak's end_session_endpoint, Keycloak keeps its
// own session cookie alive - the next sign-in would silently re-authenticate
// as the previous user instead of prompting for credentials again.
export async function logoutUser() {
    const session = await auth();
    const idToken = session?.idToken;

    await signOut({redirect: false});

    const issuer = process.env.AUTH_KEYCLOACK_ISSUER;
    const postLogoutRedirectUri = process.env.AUTH_URL ?? 'http://localhost:3000';

    const params = new URLSearchParams({post_logout_redirect_uri: postLogoutRedirectUri});
    if (idToken) params.set('id_token_hint', idToken);

    redirect(`${issuer}/protocol/openid-connect/logout?${params.toString()}`);
}

export async function getCurrentUser() {
    try{
        const session = await auth();
        if (!session) {
            return null;
        }
        return session.user;
    } catch (error: unknown) {
        console.log( error);
        return null;
    }
}