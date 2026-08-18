import {notFound} from "next/navigation";

export async function fetchClient<T>(url: string,
                    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
                    options: Omit<RequestInit, 'body'> & {body?: unknown} = {}):
                    Promise<{data: T | null, error?: { message: string, status: number}}> {
    const {body, ...rest} = options;
    const apiUrl = process.env.API_URL;
    if (!apiUrl) throw new Error('Missing API URL');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(rest.headers || {})
    }

    const response = await fetch(apiUrl + url, {
        method,
        headers,
        ...(body ? {body: JSON.stringify(body)} : {}),
        ...rest
    });

    const contentType = response.headers.get('Content-Type');
    const isJson = contentType?.includes('application/json')
        || contentType?.includes('application/problem+json');
    const parsed = isJson ? await response.json() : null;

    if (!response.ok) {
        if (response.status === 404) return notFound();
        if (response.status === 500) throw new Error('Server error. Please try again later.');

        let message = '';

        if (typeof parsed === 'string') {
            message = parsed;
        } else if (parsed?.message) {
            message = parsed.message;
        }

        if (!message) {
            message = getFallbackMessage(response.status);
        }

        return {data: null, error: {message, status: response.status}};
    }

    return {data: parsed as T, error: undefined};
}

function getFallbackMessage(status: number) {
    switch (status) {
        case 400: return 'Bad request. Please check your input.';
        case 401: return 'You are not authorised to perform this action.';
        case 403: return 'Access denied.';
        case 500: return 'Server error. Please try again later.';
        default: return 'An unexpected error occurred. Please try again.';
    }
}
