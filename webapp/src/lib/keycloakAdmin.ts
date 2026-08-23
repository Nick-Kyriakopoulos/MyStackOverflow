// Server-side helper for Keycloak's Admin REST API. Only ever called from
// 'use server' actions - never import this from a client component, since it
// reads the admin service-account secret from process.env.

type AdminTokenResponse = {
    access_token: string;
};

function getIssuerParts() {
    const issuer = process.env.AUTH_KEYCLOACK_ISSUER;
    if (!issuer) throw new Error('Missing AUTH_KEYCLOACK_ISSUER');

    const issuerUrl = new URL(issuer);
    const realm = issuerUrl.pathname.split('/').filter(Boolean).pop();
    if (!realm) throw new Error('Could not determine realm from AUTH_KEYCLOACK_ISSUER');

    return { issuer, baseUrl: issuerUrl.origin, realm };
}

async function getAdminAccessToken(): Promise<string> {
    const { issuer } = getIssuerParts();
    const clientId = process.env.AUTH_KEYCLOACK_ADMIN_CLIENT_ID;
    const clientSecret = process.env.AUTH_KEYCLOACK_ADMIN_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('Missing AUTH_KEYCLOACK_ADMIN_CLIENT_ID / AUTH_KEYCLOACK_ADMIN_CLIENT_SECRET');
    }

    const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to obtain a Keycloak admin access token');
    }

    const data = await response.json() as AdminTokenResponse;
    return data.access_token;
}

export type CreateKeycloakUserInput = {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
};

export type KeycloakAdminError = {
    status: number;
    message: string;
    field?: 'username' | 'email';
};

export async function createKeycloakUser(
    input: CreateKeycloakUserInput
): Promise<{ error?: KeycloakAdminError }> {
    const { baseUrl, realm } = getIssuerParts();
    const token = await getAdminAccessToken();

    const response = await fetch(`${baseUrl}/admin/realms/${realm}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            username: input.username,
            email: input.email,
            // Keycloak's default user profile marks these required, and the
            // token's "name" claim - which the app shows as the display name -
            // is built from them.
            firstName: input.firstName,
            lastName: input.lastName,
            enabled: true,
            emailVerified: false,
            credentials: [{ type: 'password', value: input.password, temporary: false }],
        }),
    });

    if (response.status === 201) return {};

    let errorMessage: string | undefined;
    try {
        const body = await response.json();
        errorMessage = body?.errorMessage;
    } catch {
        // Admin API sometimes returns an empty body - fall through to the default message below.
    }

    if (response.status === 409) {
        const isEmailConflict = errorMessage?.toLowerCase().includes('email');
        return {
            error: {
                status: 409,
                field: isEmailConflict ? 'email' : 'username',
                message: isEmailConflict
                    ? 'That email is already registered.'
                    : 'That username is already taken.',
            },
        };
    }

    return {
        error: {
            status: response.status,
            message: errorMessage || 'Registration failed. Please try again.',
        },
    };
}
