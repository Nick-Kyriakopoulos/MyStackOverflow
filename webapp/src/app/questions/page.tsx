import {getQuestions} from "@/lib/actions/question-actions";
import {QuestionSort} from "@/lib/types";
import QuestionCard from "@/app/questions/QuestionCard";
import QuestionsHeader from "@/app/questions/QuestionsHeader";
import TrendingTags from "@/app/questions/TrendingTags";
import TopUsers from "@/app/questions/TopUsers";
import Pagination from "@/components/layout/Pagination";

const SORTS: QuestionSort[] = ['newest', 'active', 'unanswered'];

type Search = Promise<{tag?: string; sort?: string; page?: string}>

export default async function QuestionsPage({searchParams}: {searchParams?: Search}) {
    const params = await searchParams;

    // The query string comes from the address bar, so neither value is trusted: an
    // unknown sort falls back to newest and a bad page to the first.
    const sort = SORTS.includes(params?.sort as QuestionSort)
        ? params?.sort as QuestionSort
        : 'newest';
    const page = Math.max(Number(params?.page) || 1, 1);

    const {data, error} = await getQuestions({tag: params?.tag, sort, page});

    if (error) throw error;

    const questions = data?.items ?? [];

    return (
        <div className={'container mx-auto px-4 py-8 md:px-6'}>
            <QuestionsHeader
                tag={params?.tag ?? ''}
                total={data?.totalCount ?? 0}
                sort={sort}
            />

            {/* The sidebar drops below the list on narrow screens rather than
                squeezing both - the questions are what people came for. */}
            <div className={'mt-6 flex flex-col gap-6 lg:flex-row lg:items-start'}>
                <div className={'flex min-w-0 flex-1 flex-col gap-5'}>
                    {questions.length === 0 ? (
                        <p className={'rounded-3xl border border-neutral-200/80 bg-white/90 p-6 text-sm text-neutral-600 shadow-sm dark:border-gray-800 dark:bg-gray-900/90 dark:text-gray-300'}>
                            {sort === 'unanswered'
                                ? 'Every question here has an answer. Try another tab.'
                                : 'No questions yet. Be the first to ask one.'}
                        </p>
                    ) : (
                        questions.map(question => (
                            <QuestionCard key={question.id} question={question}/>
                        ))
                    )}

                    {data && (
                        <Pagination
                            page={data.page}
                            pageSize={data.pageSize}
                            totalCount={data.totalCount}
                        />
                    )}
                </div>
                <aside className={'flex w-full shrink-0 flex-col gap-5 lg:w-72'}>
                    <TrendingTags/>
                    <TopUsers/>
                </aside>
            </div>
        </div>
    );
}
