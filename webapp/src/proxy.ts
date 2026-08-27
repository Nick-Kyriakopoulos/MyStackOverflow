import {NextResponse} from "next/server";
import {auth} from "@/auth";

// Formerly middleware.ts - Next 16 deprecated that file convention in favour of proxy.
//
// A fast redirect for signed-out visitors, so protected pages never start rendering.
// It is not the security boundary: this runs before rendering and cannot tell that a
// session's refresh token has died, nor who owns a question. The page-level
// getValidSession() and ownership checks still do that work.
export default auth(req => {
    if (req.auth) return;

    const signIn = new URL('/api/auth/signin', req.nextUrl.origin);
    signIn.searchParams.set('callbackUrl', req.nextUrl.href);

    return NextResponse.redirect(signIn);
});

export const config = {
    // Viewing a profile stays public - the question list already shows who asked
    // what to anonymous visitors, so only editing one is gated.
    matcher: ['/questions/ask', '/questions/:id/edit', '/profiles/:id/edit'],
};
