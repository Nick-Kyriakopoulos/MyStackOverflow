import {Question} from "@/lib/types";
import {Chip} from "@heroui/react";
import Link from "next/link";
import clsx from "clsx";
import {CheckIcon} from "@heroicons/react/24/outline";

type Props = {
    question: Question;
}

export default function QuestionCard({question}: Props) {
    return (
        <div className={'flex gap-6 px-6 py-4 border-b border-neutral-300 dark:border-gray-700'}>
            <div className={'flex flex-col items-end text-sm gap-3 min-w-24'}>
                <div>{question.votes} {question.votes === 1 ? 'vote' : 'votes'}</div>
                <div
                    className={clsx('flex justify-end rounded', {
                        'border-2 border-green-600 dark:border-purple-500': question.answerCount > 0,
                        'border-2 border-success bg-green-600 dark:bg-purple-600 text-white': question.hasAcceptedAnswer
                    })}
                >
                    <span
                        className={clsx('flex items-center gap-2', {
                        'p-1': question.answerCount > 0
                        })}
                    >
                        {question.hasAcceptedAnswer && (
                            <CheckIcon className="h-4 w-4" strokeWidth={4} />
                            )}
                        {question.answerCount} {question.answerCount === 1 ? 'answer' : 'answers'}
                    </span>
                </div>
                <div>{question.viewCount} {question.viewCount === 1 ? 'view' : 'views'}</div>
            </div>
            <div className={'flex flex-1 min-h-32 gap-4'}>
                <div className={'flex flex-col gap-2 flex-1 min-w-0'}>
                    <Link
                        href={`/questions/${question.id}`}
                        className={'text-green-700 dark:text-purple-400 font-semibold hover:underline first-letter:uppercase'}
                    >
                        {question.title}
                    </Link>
                    <div
                        className={'line-clamp-2'}
                        dangerouslySetInnerHTML={{__html: question.content}}
                    />
                    <div className={'flex gap-2 pt-2 mt-auto'}>
                        {question.tagSlugs.map(slug => (
                            <Link key={slug} href={`/questions?tag=${slug}`}>
                                <Chip
                                    variant={'soft'}
                                    color={'default'}
                                    size={'sm'}
                                    className={'bg-gray-300 dark:bg-gray-700 dark:text-gray-200 py-1'}
                                >
                                    {slug}
                                </Chip>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className={'text-sm flex flex-col items-end justify-end gap-1 shrink-0 pb-2'}>
                    <div className={'flex items-center gap-2'}>
                        <div className={'w-7 h-7 rounded-full bg-green-900 dark:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center shrink-0'}>
                            {question.askerDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <Link href={`/profiles/${question.askerId}`} className={'hover:underline whitespace-nowrap'}>
                            {question.askerDisplayName}
                        </Link>
                    </div>
                    <span className={'text-gray-500 dark:text-gray-400 whitespace-nowrap'}>
                        Asked {question.createdAt}
                    </span>
                </div>
            </div>
        </div>
    );
}