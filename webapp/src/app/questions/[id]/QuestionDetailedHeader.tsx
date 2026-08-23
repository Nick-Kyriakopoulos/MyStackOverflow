import {Question} from "@/lib/types";
import {Button, Chip} from "@heroui/react";
import Link from "next/link";
import {formatDistanceToNow} from "date-fns";
import QuestionOwnerActions from "@/app/questions/[id]/QuestionOwnerActions";
import Panel from "@/components/layout/Panel";

type Props = {
    question: Question;
    isOwner: boolean;
}

export default function QuestionDetailedHeader({question, isOwner}: Props) {
    return (
        <Panel variant={'header'}>
            <div className={'flex flex-col gap-6'}>
                <div className={'flex flex-col gap-4 md:flex-row md:items-start md:justify-between'}>
                    <div className={'space-y-3'}>
                        <Chip className={'border border-green-200 bg-green-100 text-green-900 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200'}>
                            Community question
                        </Chip>
                        <div className={'text-3xl font-bold tracking-tight first-letter:uppercase md:text-4xl'}>
                            {question.title}
                        </div>
                        <p className={'max-w-3xl text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                            Follow the discussion, review answers, and explore the related tags for this topic.
                        </p>
                    </div>
                    <div className={'flex shrink-0 flex-wrap items-start gap-2'}>
                        {isOwner && <QuestionOwnerActions questionId={question.id}/>}
                        <Link href={'/questions/ask'}>
                            <Button className={'bg-green-900 dark:bg-purple-700 text-white font-semibold shadow-sm'}>
                                Ask Question
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className={'flex flex-wrap gap-3'}>
                    <div className={'rounded-2xl bg-white/80 px-4 py-3 text-sm shadow-sm dark:bg-gray-900/70'}>
                        <span className={'block text-xs uppercase tracking-wide text-neutral-500 dark:text-gray-400'}>Asked</span>
                        <span className={'font-medium'}>{formatDistanceToNow(new Date(question.createdAt))} ago</span>
                    </div>
                    {question.updatedAt && (
                        <div className={'rounded-2xl bg-white/80 px-4 py-3 text-sm shadow-sm dark:bg-gray-900/70'}>
                            <span className={'block text-xs uppercase tracking-wide text-neutral-500 dark:text-gray-400'}>Modified</span>
                            <span className={'font-medium'}>{formatDistanceToNow(new Date(question.updatedAt))} ago</span>
                        </div>
                    )}
                    <div className={'rounded-2xl bg-white/80 px-4 py-3 text-sm shadow-sm dark:bg-gray-900/70'}>
                        <span className={'block text-xs uppercase tracking-wide text-neutral-500 dark:text-gray-400'}>Viewed</span>
                        <span className={'font-medium'}>{question.viewCount + 1} times</span>
                    </div>
                </div>
            </div>
        </Panel>
    );
}