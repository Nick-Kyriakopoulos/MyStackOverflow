// Deliberately free of any cloudinary import: the toolbar is a client component
// and needs these limits, but pulling in the server SDK would ship the upload
// signing code (and its config) to the browser.

export const UPLOAD_FOLDER = 'mystackoverflow/questions';

// Kept below next.config.ts's serverActions.bodySizeLimit - a file over that
// limit is rejected by Next before the action runs, with an opaque error.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Cloudinary URLs look like
//   https://res.cloudinary.com/<cloud>/image/upload/v123456/<folder>/<name>.jpg
// and destroy() wants "<folder>/<name>" - no version, no extension.
export function publicIdFromUrl(url: string) {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    return match ? match[1] : null;
}

export function extractImageUrls(html: string) {
    return [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(match => match[1]);
}

// Images that were in the old content but are not in the new one. Anything
// still referenced must survive - an image can legitimately appear twice.
export function orphanedImageUrls(previousHtml: string, nextHtml: string) {
    const stillUsed = new Set(extractImageUrls(nextHtml));

    return [...new Set(extractImageUrls(previousHtml))].filter(url => !stillUsed.has(url));
}
