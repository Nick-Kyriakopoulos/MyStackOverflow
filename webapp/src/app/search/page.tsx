import Link from "next/link";
import clsx from "clsx";
import {searchQuestions} from "@/lib/actions/question-actions";
import {answerCountStyles} from "@/lib/answerCountStyles";
import Panel from "@/components/layout/Panel";

export default async function SearchPage({searchParams}: {searchParams?: Promise<{query?: string}>}) {
    const params = await searchParams;
    const query = params?.query?.trim() ?? '';

    const {data, error} = query ? await searchQuestions(query) : {data: [], error: undefined};

    if (error) throw error;

    const questions = data ?? [];

    return (
        <div className={'container mx-auto px-4 py-8 md:px-6'}>
            <Panel variant={'header'}>
                <div className={'text-3xl font-bold tracking-tight md:text-4xl'}>
                    {query ? `Search results for "${query}"` : 'Search'}
                </div>
                <p className={'mt-2 text-sm font-medium text-neutral-600 dark:text-gray-300'}>
                    {questions.length} {questions.length === 1 ? 'result' : 'results'}
                </p>
            </Panel>
            <Panel padded={false} className={'mt-6 flex flex-col overflow-hidden'}>
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
                            className={clsx('flex shrink-0 flex-col items-center rounded-lg px-3 py-2 text-xs', answerCountStyles(question.answerCount, question.hasAcceptedAnswer))}
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
            </Panel>
        </div>
    );
}