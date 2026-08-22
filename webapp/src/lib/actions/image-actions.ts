'use server';

import {getCloudinary} from "@/lib/cloudinary";
import {
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_BYTES,
    publicIdFromUrl,
    UPLOAD_FOLDER,
} from "@/lib/imageRules";
import {getValidSession} from "@/lib/session";

export type UploadedImage = {
    url: string;
    publicId: string;
};

export async function uploadImage(
    formData: FormData
): Promise<{data: UploadedImage | null, error?: {message: string, status: number}}> {
    // Server actions are public endpoints - without this anyone could fill the
    // Cloudinary account by POSTing to it.
    const session = await getValidSession();
    if (!session) return {data: null, error: {message: 'You must be signed in to upload images.', status: 401}};

    const file = formData.get('file');
    if (!(file instanceof File)) {
        return {data: null, error: {message: 'No file was provided.', status: 400}};
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {data: null, error: {message: 'Only JPEG, PNG, GIF and WebP images are allowed.', status: 400}};
    }

    if (file.size > MAX_IMAGE_BYTES) {
        return {data: null, error: {message: 'Images must be 4MB or smaller.', status: 400}};
    }

    try {
        // The SDK's uploader takes a data URI or a path, not a web File.
        const bytes = Buffer.from(await file.arrayBuffer());
        const dataUri = `data:${file.type};base64,${bytes.toString('base64')}`;

        const result = await getCloudinary().uploader.upload(dataUri, {
            folder: UPLOAD_FOLDER,
            resource_type: 'image',
        });

        return {data: {url: result.secure_url, publicId: result.public_id}};
    } catch (error) {
        console.error('Cloudinary upload failed', error);
        return {data: null, error: {message: 'Upload failed. Please try again.', status: 500}};
    }
}

// Best-effort cleanup of images no longer referenced by any question. A failure
// here leaves an orphan in Cloudinary, which is not worth failing the user's
// edit or delete over - so this never throws.
export async function deleteImagesByUrl(urls: string[]) {
    const publicIds = urls
        .map(publicIdFromUrl)
        .filter((id): id is string => !!id && id.startsWith(`${UPLOAD_FOLDER}/`));

    if (publicIds.length === 0) return;

    await Promise.all(publicIds.map(async id => {
        const {error} = await deleteImage(id);
        if (error) console.error(`Could not delete image ${id}: ${error.message}`);
    }));
}

export async function deleteImage(publicId: string) {
    const session = await getValidSession();
    if (!session) return {error: {message: 'You must be signed in.', status: 401}};

    // Anything outside our own folder is not ours to delete, and publicId comes
    // from markup the user could have edited.
    if (!publicId.startsWith(`${UPLOAD_FOLDER}/`)) {
        return {error: {message: 'Refusing to delete an image outside the upload folder.', status: 400}};
    }

    try {
        await getCloudinary().uploader.destroy(publicId, {resource_type: 'image'});
        return {};
    } catch (error) {
        console.error('Cloudinary delete failed', error);
        return {error: {message: 'Could not delete the image.', status: 500}};
    }
}
