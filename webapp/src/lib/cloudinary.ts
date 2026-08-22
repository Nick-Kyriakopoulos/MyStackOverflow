import {v2 as cloudinary} from 'cloudinary';

// Server-only. None of these are NEXT_PUBLIC_ on purpose: the api secret signs
// upload and destroy calls, so it must never reach the browser. Shared limits
// live in imageRules.ts, which the client toolbar can safely import.
export function getCloudinary() {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;

    if (!cloud_name || !api_key || !api_secret) {
        throw new Error(
            'Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, ' +
            'CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local'
        );
    }

    cloudinary.config({cloud_name, api_key, api_secret, secure: true});

    return cloudinary;
}
