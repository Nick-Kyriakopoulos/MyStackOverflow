'use client';

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button, Tooltip} from "@heroui/react";
import {ArrowDownCircleIcon, ArrowUpCircleIcon, CheckIcon} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {castVote} from "@/lib/actions/vote-actions";
import {acceptAnswer} from "@/lib/actions/answer-actions";
import {handleError, successToast} from "@/lib/util";

type Props = {
    targetId: string;
    targetType: 'question' | 'answer';
    questionId: string;
    votes: number;
    // The value this user already cast, if any. Votes are final, so its presence
    // disables both buttons rather than highlighting one to toggle.
    myVote?: number;
    isSignedIn: boolean;
    isAuthor: boolean;
    accepted?: boolean;
    // Only the asker can accept, and only while no answer has been accepted yet.
    canAccept?: boolean;
}

export default function VotingButtons({
    targetId, targetType, questionId, votes, myVote,
    isSignedIn, isAuthor, accepted, canAccept,
}: Props) {
    const router = useRouter();
    const [isBusy, setIsBusy] = useState(false);

    const hasVoted = myVote !== undefined;

    const reason = !isSignedIn ? 'Sign in to vote'
        : isAuthor ? 'You cannot vote on your own post'
        : hasVoted ? 'You have already voted on this'
        : undefined;

    // The cases we can explain are marked aria-disabled rather than disabled. A
    // genuinely disabled button fires no pointer events and cannot take focus, so
    // the tooltip explaining *why* it is disabled never opened - in exactly the
    // situations it exists for. aria-disabled conveys the same thing to assistive
    // tech while leaving the button hoverable and focusable; onPress guards itself.
    const blocked = reason !== undefined;
    // Only the transient busy state is a real disable. Styling greys out both.
    const disabled = isBusy || blocked;

    const onVote = async (value: 1 | -1) => {
        setIsBusy(true);

        try {
            const {error} = await castVote(targetId, targetType, value, questionId);

            if (error) return handleError(error);

            successToast(value > 0 ? 'Upvoted.' : 'Downvoted.');
            router.refresh();
        } finally {
            setIsBusy(false);
        }
    };

    const onAccept = async () => {
        setIsBusy(true);

        try {
            const {error} = await acceptAnswer(questionId, targetId);

            if (error) return handleError(error);

            successToast('Answer accepted.');
            router.refresh();
        } finally {
            setIsBusy(false);
        }
    };

    const arrow = (direction: 1 | -1) => {
        const Icon = direction > 0 ? ArrowUpCircleIcon : ArrowDownCircleIcon;
        const label = direction > 0 ? 'Upvote' : 'Downvote';

        const button = (
            <Button
                isIconOnly
                variant={'ghost'}
                aria-label={label}
                isDisabled={isBusy}
                aria-disabled={blocked || undefined}
                onPress={() => {
                    if (blocked) return;
                    void onVote(direction);
                }}
                className={clsx('border-0', {
                    'text-green-900 hover:text-green-700 dark:text-purple-400 dark:hover:text-purple-300': !disabled,
                    'text-neutral-400 dark:text-gray-600': disabled,
                    // The direction they actually chose stays coloured.
                    'text-green-700 dark:text-purple-300': hasVoted && myVote === direction,
                })}
            >
                <Icon className={'h-12 w-12'}/>
            </Button>
        );

        return reason
            ? (
                <Tooltip>
                    <Tooltip.Trigger>{button}</Tooltip.Trigger>
                    <Tooltip.Content>{reason}</Tooltip.Content>
                </Tooltip>
            )
            : button;
    };

    return (
        <div className={'flex h-full shrink-0 flex-col items-center justify-start gap-3 rounded-2xl bg-stone-100/80 px-2 py-3 dark:bg-gray-800/80'}>
            {arrow(1)}
            <span className={'text-xl font-semibold'}>{votes}</span>
            {arrow(-1)}

            {accepted && (
                <CheckIcon
                    className={'size-10 text-green-600 dark:text-purple-400'}
                    strokeWidth={4}
                    aria-label={'Accepted answer'}
                />
            )}

            {!accepted && canAccept && (
                <Tooltip>
                    <Tooltip.Trigger>
                        <Button
                            isIconOnly
                            variant={'ghost'}
                            aria-label={'Accept this answer'}
                            isDisabled={isBusy}
                            onPress={onAccept}
                            className={'border-0 text-neutral-400 hover:text-green-600 dark:text-gray-600 dark:hover:text-purple-400'}
                        >
                            <CheckIcon className={'size-10'} strokeWidth={4}/>
                        </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>Accept this answer</Tooltip.Content>
                </Tooltip>
            )}
        </div>
    );
}
