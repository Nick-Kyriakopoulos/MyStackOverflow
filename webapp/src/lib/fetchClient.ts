import {notFound} from "next/navigation";
import {auth} from "@/auth";

export async function fetchClient<T>(url: string,
                    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
                    options: Omit<RequestInit, 'body'> & {body?: unknown} = {}):
                    Promise<{data: T | null, error?: { message: string, status: number}}> {
    const {body, ...rest} = options;
    const apiUrl = process.env.API_URL;
    if (!apiUrl) throw new Error('Missing API URL');
    const session = await auth();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(session?.accessToken ? {Authorization: `Bearer ${session.accessToken}`} : {}),
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
    // ASP.NET returns plain strings (e.g. Ok("You are authorized!")) as
    // text/plain, so read the body as text and only JSON.parse when the
    // content type says to - otherwise those responses are dropped.
    const raw = await response.text();
    const parsed = raw ? (isJson ? JSON.parse(raw) : raw) : null;

    if (!response.ok) {
        if (response.status === 404) return notFound();
        if (response.status === 500) throw new Error('Server error. Please try again later.');

        let message = '';
        
        if (response.status === 401) {
            const authHeader = response.headers.get('WWW-Authenticate');
            if (authHeader?.includes('error_description')) {
                const match = authHeader.match(/error_description="(.+?)"/);
                if (match) {
                    message = match[1];
                }else {
                    message = 'Authentication required. Please log in.';
                }
            }
        }
        
        if (!message) {
            if (typeof parsed === 'string') {
                message = parsed;
            } else if (parsed?.message) {
                message = parsed.message;
            }else {
                message = getFallbackMessage(response.status);
            }
        }

        return {data: null, error: {message, status: response.status}};
    }

    return {data: parsed as T, error: undefined};
}

function getFallbackMessage(status: number) {
    switch (status) {
        case 400: return 'Bad request. Please check your input.';
        case 403: return 'Access denied.';
        case 500: return 'Server error. Please try again later.';
        default: return 'An unexpected error occurred. Please try again.';
    }
}