import {Question} from "@/lib/types";
import {Chip} from "@heroui/react";
import Link from "next/link";
import clsx from "clsx";
import {CheckIcon} from "@heroicons/react/24/outline";
import {formatDistanceToNow} from "date-fns";

type Props = {
    question: Question;
}

export default function QuestionCard({question}: Props) {
    return (
        <div className={'flex flex-col gap-6 rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-green-300 hover:bg-white hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/90 dark:hover:border-purple-500/60 dark:hover:bg-gray-900 md:flex-row'}>
            <div className={'flex min-w-28 flex-row gap-3 text-sm md:flex-col md:items-end'}>
                <div className={'rounded-2xl bg-stone-100 px-3 py-2 text-right dark:bg-gray-800'}>
                    <div className={'text-lg font-semibold'}>{question.votes}</div>
                    <div className={'text-xs text-neutral-500 dark:text-gray-400'}>{question.votes === 1 ? 'vote' : 'votes'}</div>
                </div>
                <div
                    className={clsx('rounded-2xl px-3 py-2 text-right', {
                        'bg-stone-100 dark:bg-gray-800': question.answerCount === 0,
                        'border border-green-600/40 bg-green-50 text-green-800 dark:border-purple-500/50 dark:bg-purple-500/10 dark:text-purple-200': question.answerCount > 0,
                        'border border-green-600 bg-green-600 text-white dark:border-purple-600 dark:bg-purple-600': question.hasAcceptedAnswer
                    })}
                >
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
                    <div className={'text-xs text-neutral-500 dark:text-gray-400'}>{question.viewCount === 1 ? 'view' : 'views'}</div>
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
                            <Link key={slug} href={`/questions?tag=${slug}`}>
                                <Chip
                                    size={'sm'}
                                    className={'border border-green-200 bg-green-100/80 py-1 text-green-900 transition-colors hover:bg-green-200 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200 dark:hover:bg-purple-500/25'}
                                >
                                    {slug}
                                </Chip>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className={'mt-auto flex shrink-0 self-end flex-col items-end gap-1.5 rounded-xl bg-stone-100/80 px-2.5 py-2 text-xs dark:bg-gray-800/80'}>
                    <div className={'flex items-center gap-1.5'}>
                        <div className={'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-900 text-[11px] font-semibold text-white dark:bg-purple-700'}>
                            {question.askerDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <Link href={`/profiles/${question.askerId}`} className={'whitespace-nowrap font-medium hover:underline'}>
                            {question.askerDisplayName}
                        </Link>
                    </div>
                    <span className={'whitespace-nowrap text-[11px] text-neutral-700 dark:text-gray-400'}>
                        Asked {formatDistanceToNow(new Date(question.createdAt))}
                    </span>
                </div>
            </div>
        </div>
    );
}