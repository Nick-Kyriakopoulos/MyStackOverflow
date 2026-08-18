import Link from "next/link";
import clsx from "clsx";
import {searchQuestions} from "@/lib/actions/question-actions";

export default async function SearchPage({searchParams}: {searchParams?: Promise<{query?: string}>}) {
    const params = await searchParams;
    const query = params?.query?.trim() ?? '';

    const {data, error} = query ? await searchQuestions(query) : {data: [], error: undefined};

    if (error) throw error;

    const questions = data ?? [];

    return (
        <div className={'container mx-auto px-4 py-8 md:px-6'}>
            <div className={'rounded-3xl border border-neutral-200/70 bg-linear-to-br from-white via-stone-50 to-green-50 p-6 shadow-sm dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950/30'}>
                <div className={'text-3xl font-bold tracking-tight md:text-4xl'}>
                    {query ? `Search results for "${query}"` : 'Search'}
                </div>
                <p className={'mt-2 text-sm font-medium text-neutral-600 dark:text-gray-300'}>
                    {questions.length} {questions.length === 1 ? 'result' : 'results'}
                </p>
            </div>
            <div className={'mt-6 flex flex-col rounded-3xl border border-neutral-200/80 bg-white/90 dark:border-gray-800 dark:bg-gray-900/90'}>
                {questions.length === 0 && (
                    <div className={'px-6 py-10 text-center text-sm text-neutral-500 dark:text-gray-400'}>
                        No questions found{query ? ` for "${query}"` : ''}.
                    </div>
                )}
                {questions.map(question => (
                    <Link
                        key={question.id}
                        href={`/questions/${question.id}`}
                        className={'flex items-start gap-4 border-b border-neutral-200/70 px-6 py-4 last:border-b-0 hover:bg-stone-50 dark:border-gray-800 dark:hover:bg-gray-800'}
                    >
                        <div
                            className={clsx('flex shrink-0 flex-col items-center rounded-lg px-3 py-2 text-xs', {
                                'bg-stone-100 dark:bg-gray-700': question.answerCount === 0,
                                'border border-green-600/40 bg-green-50 text-green-800 dark:border-purple-500/50 dark:bg-purple-500/10 dark:text-purple-200': question.answerCount > 0,
                                'border border-green-600 bg-green-600 text-white dark:border-purple-600 dark:bg-purple-600': question.hasAcceptedAnswer
                            })}
                        >
                            <span className={'text-lg font-semibold'}>{question.answerCount}</span>
                            <span>{question.answerCount === 1 ? 'answer' : 'answers'}</span>
                        </div>
                        <div className={'min-w-0 flex-1'}>
                            <div className={'text-lg font-semibold text-green-800 dark:text-purple-300'}>{question.title}</div>
                            <div
                                className={'line-clamp-2 mt-1 text-sm leading-6 text-neutral-600 dark:text-gray-300'}
                                dangerouslySetInnerHTML={{__html: question.content}}
                            />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}