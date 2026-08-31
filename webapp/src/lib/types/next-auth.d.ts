// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth, {DefaultSession} from "next-auth";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {JWT} from "next-auth/jwt";

declare module 'next-auth' {
    interface Session {
        accessToken: string;
        idToken?: string;
        error?: string;
        // Widened from optional: the session callback always fills this in from
        // token.sub, and ownership checks would otherwise need a null guard.
        user: {
            id: string;
        } & DefaultSession['user'];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        // Keycloak's user id (the access token's sub), not Auth.js's generated
        // token.sub. This is what the API compares AskerId against.
        userId?: string;
        accessToken: string;
        refreshToken?: string;
        idToken?: string;
        expiresAt?: number;
        error?: string;
        // False or absent means /profiles/ensure has not succeeded yet for this
        // session, and the jwt callback keeps retrying it. Sign-in is the only
        // moment the app hears about a new user, so giving up after one failed
        // attempt strands them as "Unknown user" for the life of the session.
        profileEnsured?: boolean;
    }
}