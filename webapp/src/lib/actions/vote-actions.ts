'use server';

import {revalidatePath} from "next/cache";
import {VoteRecord} from "@/lib/types";
import {fetchClient} from "@/lib/fetchClient";

export async function castVote(
    targetId: string,
    targetType: 'question' | 'answer',
    voteValue: 1 | -1,
    questionId: string
) {
    const result = await fetchClient<null>('/votes', 'POST', {
        body: {targetId, targetType, voteValue},
    });

    if (!result.error) {
        // The tally is updated by QuestionService reacting to an event, so it is not
        // guaranteed to be current the instant this returns. Revalidating anyway keeps
        // the common case - a single voter on a quiet page - correct.
        revalidatePath(`/questions/${questionId}`);
        revalidatePath('/questions');
    }

    return result;
}

// Which of these targets the signed-in user has already voted on. Never cached: it is
// per-user, and a stale answer would re-enable buttons that the API will reject.
export async function getMyVotes(targetIds: string[]) {
    if (targetIds.length === 0) return {data: [] as VoteRecord[], error: undefined};

    return fetchClient<VoteRecord[]>(
        `/votes/mine?targetIds=${encodeURIComponent(targetIds.join(','))}`,
        'GET',
        {cache: 'no-store'}
    );
}
