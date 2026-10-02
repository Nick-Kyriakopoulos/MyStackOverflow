import {Question} from "@/lib/types";
import Link from "next/link";
import clsx from "clsx";
import {CheckIcon} from "@heroicons/react/24/outline";
import UserBadge from "@/components/profiles/UserBadge";
import TagLink from "@/components/tags/TagLink";
import {answerCountStyles} from "@/lib/answerCountStyles";

type Props = {
    question: Question;
}

export default function QuestionCard({question}: Props) {
    return (
        <div className={'flex flex-col gap-6 rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-green-300 hover:bg-white hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/90 dark:hover:border-purple-500/60 dark:hover:bg-gray-900 md:flex-row'}>
            <div className={'flex min-w-28 flex-row gap-3 text-sm md:flex-col md:items-end'}>
                <div className={'rounded-2xl bg-stone-100 px-3 py-2 text-right dark:bg-gray-800'}>
                    <div className={'text-lg font-semibold'}>{question.votes}</div>
                    <div className={'text-xs text-neutral-600 dark:text-gray-400'}>{question.votes === 1 ? 'vote' : 'votes'}</div>
                </div>
                <div className={clsx('rounded-2xl px-3 py-2 text-right', answerCountStyles(question.answerCount, question.hasAcceptedAnswer))}>
                    <span className={'flex items-center justify-end gap-2 text-lg font-semibold'}>
                        {question.hasAcceptedAnswer && (
                            <CheckIcon className="h-4 w-4" strokeWidth={4} />
                        )}
                        {question.answerCount}
                    </span>
                    <div className={'text-xs'}>{question.answerCount === 1 ? 'answer' : 'answers'}</div>
                </div>
                <div className={'rounded-2xl bg-stone-100 px-3 py-2 text-right dark:bg-gray-800'}>
                    <div className={'text-lg font-semibold'}>{question.viewCount}</div>
                    <div className={'text-xs text-neutral-600 dark:text-gray-400'}>{question.viewCount === 1 ? 'view' : 'views'}</div>
                </div>
            </div>
            <div className={'flex flex-1 min-h-32 gap-4'}>
                <div className={'flex min-w-0 flex-1 flex-col gap-3'}>
                    <Link
                        href={`/questions/${question.id}`}
                        className={'text-xl font-semibold tracking-tight text-green-800 transition-colors hover:text-green-700 hover:underline dark:text-purple-300 dark:hover:text-purple-200'}
                    >
                        {question.title}
                    </Link>
                    <div
                        className={'line-clamp-2 text-sm leading-6 text-neutral-600 dark:text-gray-300'}
                        dangerouslySetInnerHTML={{__html: question.content}}
                    />
                    <div className={'mt-auto flex flex-wrap gap-2 pt-2'}>
                        {question.tagSlugs.map(slug => (
                            <TagLink key={slug} slug={slug}/>
                        ))}
                    </div>
                </div>
                <div className={'mt-auto shrink-0 self-end'}>
                    <UserBadge
                        profile={question.author}
                        action={'Asked'}
                        timestamp={question.createdAt}
                        size={'sm'}
                    />
                </div>
            </div>
        </div>
    );
}
