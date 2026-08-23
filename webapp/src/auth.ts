import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import type { JWT } from "next-auth/jwt"

const KEYCLOAK_TOKEN_ENDPOINT = `${process.env.AUTH_KEYCLOACK_ISSUER}/protocol/openid-connect/token`;

// Refresh token rotation: exchanges the stored refresh token for a new
// access/refresh token pair against Keycloak's token endpoint.
async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        if (!token.refreshToken) throw new Error("Missing refresh token");

        const response = await fetch(KEYCLOAK_TOKEN_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.AUTH_KEYCLOACK_ID!,
                client_secret: process.env.AUTH_KEYCLOACK_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            }),
        });

        const refreshed = await response.json();
        if (!response.ok) throw refreshed;

        return {
            ...token,
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token ?? token.refreshToken,
            expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
            error: undefined,
        };
    } catch (error) {
        console.error("Error refreshing access token", error);
        return { ...token, error: "RefreshAccessTokenError" };
    }
}

// Keycloak owns registration and publishes nothing to RabbitMQ, so sign-in is the
// only moment the app learns a user exists. The call is idempotent server-side, and
// deliberately swallows its errors: a ProfileService outage must not block signing in.
async function ensureProfile(accessToken?: string) {
    if (!accessToken || !process.env.API_URL) return;

    try {
        const response = await fetch(`${process.env.API_URL}/profiles/ensure`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        // fetch only rejects on network failures, so a 401 or 400 would otherwise
        // pass silently here - and the only symptom would be every author on the
        // site rendering as "Unknown user", with nothing in the log to explain it.
        if (!response.ok) {
            console.error(
                `Could not create the user's profile: ${response.status} ${await response.text()}`
            );
        }
    } catch (error) {
        console.error("Could not reach the profile service at sign-in", error);
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Keycloak({
            // Passed explicitly rather than relying on Auth.js's implicit
            // AUTH_KEYCLOAK_* env var convention, since this project's env
            // vars use the "KEYCLOACK" spelling (matching the AppHost/docker
            // compose config) instead of the provider's default "KEYCLOAK" id.
            clientId: process.env.AUTH_KEYCLOACK_ID,
            clientSecret: process.env.AUTH_KEYCLOACK_SECRET,
            issuer: process.env.AUTH_KEYCLOACK_ISSUER,
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            // Initial sign-in: persist the tokens Keycloak issued.
            if (account) {
                await ensureProfile(account.access_token);

                return {
                    ...token,
                    // Keycloak's own user id. Without an adapter Auth.js puts a
                    // freshly generated uuid in token.sub, which matches nothing
                    // server-side - the API records this sub as AskerId.
                    userId: profile?.sub ?? token.userId,
                    accessToken: account.access_token ?? token.accessToken,
                    refreshToken: account.refresh_token ?? token.refreshToken,
                    idToken: account.id_token ?? token.idToken,
                    expiresAt: account.expires_at ?? token.expiresAt,
                };
            }

            // Existing token that's still valid.
            if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
                return token;
            }

            // A failed refresh is terminal: the refresh token is spent, expired
            // or revoked, and expiresAt stays in the past. Without this guard
            // every subsequent request retries a call that cannot succeed.
            if (token.error === 'RefreshAccessTokenError') {
                return token;
            }

            // Expired - attempt to refresh it.
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.idToken = token.idToken;
            session.error = token.error;
            // Deliberately not token.sub - see the jwt callback. Sessions issued
            // before userId existed fall back to it and simply won't match,
            // which fails closed: no edit/delete controls rather than wrong ones.
            session.user.id = token.userId ?? token.sub ?? '';
            return session;
        },
    },
})