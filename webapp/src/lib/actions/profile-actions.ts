'use server';

import {revalidatePath, updateTag} from "next/cache";
import {Profile} from "@/lib/types";
import {fetchClient} from "@/lib/fetchClient";
import {profileSchema, ProfileSchema} from "@/lib/schemas/profileSchema";

// Display names and avatars change rarely, but this runs on every question list
// render - so the batch lookup is cached and dropped explicitly on edit.
const PROFILE_CACHE_TAG = 'profiles';

export async function getProfile(id: string) {
    return fetchClient<Profile>(`/profiles/${id}`, 'GET', {
        cache: 'force-cache',
        next: {revalidate: 300, tags: [PROFILE_CACHE_TAG]},
    });
}

// The API takes one comma-separated list and answers 200 with whatever it found,
// so an author without a profile shortens the array instead of failing the call.
export async function getProfiles(ids: string[]) {
    if (ids.length === 0) return {data: [] as Profile[], error: undefined};

    return fetchClient<Profile[]>(`/profiles/batch?ids=${encodeURIComponent(ids.join(','))}`, 'GET', {
        cache: 'force-cache',
        next: {revalidate: 300, tags: [PROFILE_CACHE_TAG]},
    });
}

export async function updateMyProfile(input: ProfileSchema) {
    const parsed = profileSchema.safeParse(input);

    if (!parsed.success) {
        return {data: null, error: {message: 'Invalid profile data', status: 400}};
    }

    const result = await fetchClient<null>('/profiles/me', 'PUT', {
        body: {
            displayName: parsed.data.displayName,
            imageUrl: parsed.data.imageUrl || null,
        },
    });

    if (!result.error) {
        // The name is stamped onto every question and answer this user wrote, so
        // the cached batch lookups have to go, not just the profile page. updateTag
        // rather than revalidateTag: someone who just renamed themselves should see
        // the new name straight away, not one render later.
        updateTag(PROFILE_CACHE_TAG);
        revalidatePath('/questions');
    }

    return result;
}
