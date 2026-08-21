import {auth} from "@/auth";

// When the refresh token is spent, the session cookie is still there and
// auth() keeps returning a Session - but its access token is dead, so every
// authenticated API call comes back 401. Treating that session as "signed in"
// is what leaves the nav showing a user while nothing actually works, so
// everything that cares about being authenticated goes through here instead.
export async function getValidSession() {
    const session = await auth();

    if (!session || session.error === 'RefreshAccessTokenError') return null;

    return session;
}
