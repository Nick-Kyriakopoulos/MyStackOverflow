'use server';

import {RankedUser, TopUser, TrendingTag} from "@/lib/types";
import {fetchClient} from "@/lib/fetchClient";
import {getProfiles} from "@/lib/actions/profile-actions";

// Trending is a rolling seven-day figure, so it barely moves within an hour and it
// renders on every question list. Cached rather than recomputed per request.
//
// Both sidebar widgets sit on the questions page with no error boundary of their own,
// and fetchClient throws on a 500. Left uncaught, a StatsService outage would crash
// the whole page over a sidebar nicety - so this degrades to an "unavailable" state
// instead of propagating the throw.
export async function getTrendingTags() {
    try {
        return await fetchClient<TrendingTag[]>('/stats/trending-tags', 'GET', {
            cache: 'force-cache',
            next: {revalidate: 300},
        });
    } catch {
        return {data: null, error: {message: 'Trending tags are unavailable right now.', status: 503}};
    }
}

// StatsService returns ids and scores; the names live in ProfileService. Same batched
// enrichment as question authors, so the sidebar costs one extra call, not five.
export async function getTopUsers() {
    const {data: rows, error} = await getTopUsersRaw();

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

function getTopUsersRaw() {
    return fetchClient<TopUser[]>('/stats/top-users', 'GET', {
        cache: 'force-cache',
        next: {revalidate: 300},
    }).catch(() => ({
        data: null,
        error: {message: 'Top users are unavailable right now.', status: 503},
    }));
}
