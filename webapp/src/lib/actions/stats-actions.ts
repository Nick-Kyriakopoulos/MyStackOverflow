'use server';

import {RankedUser, TopUser, TrendingTag} from "@/lib/types";
import {fetchClient} from "@/lib/fetchClient";
import {getProfiles} from "@/lib/actions/profile-actions";

// Trending is a rolling seven-day figure, so it barely moves within an hour and it
// renders on every question list. Cached rather than recomputed per request.
export async function getTrendingTags() {
    return fetchClient<TrendingTag[]>('/stats/trending-tags', 'GET', {
        cache: 'force-cache',
        next: {revalidate: 300},
    });
}

// StatsService returns ids and scores; the names live in ProfileService. Same batched
// enrichment as question authors, so the sidebar costs one extra call, not five.
export async function getTopUsers() {
    const {data: rows, error} = await fetchClient<TopUser[]>('/stats/top-users', 'GET', {
        cache: 'force-cache',
        next: {revalidate: 300},
    });

    if (!rows || rows.length === 0) return {data: [] as RankedUser[], error};

    const {data: profiles} = await getProfiles(rows.map(r => r.userId));
    const byId = new Map((profiles ?? []).map(p => [p.id, p]));

    const ranked = rows.map(row => ({
        gained: row.gained,
        profile: byId.get(row.userId)
            ?? {id: row.userId, displayName: 'Unknown user', reputation: 0, createdAt: ''},
    }));

    return {data: ranked, error: undefined};
}
