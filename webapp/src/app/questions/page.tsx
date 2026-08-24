import {getQuestions} from "@/lib/actions/question-actions";
import QuestionCard from "@/app/questions/QuestionCard";
import QuestionsHeader from "@/app/questions/QuestionsHeader";
import TrendingTags from "@/app/questions/TrendingTags";
import TopUsers from "@/app/questions/TopUsers";

export default async function QuestionsPage({searchParams}: {searchParams?: Promise<{tag?: string}>}) {
    const params = await searchParams;
    const {data: questions, error} = await getQuestions(params?.tag);

    if (error) throw error;

    return (
        <div className={'container mx-auto px-4 py-8 md:px-6'}>
            <QuestionsHeader tag={params?.tag ?? ''} total={questions?.length || 0} />

            {/* The sidebar drops below the list on narrow screens rather than
                squeezing both - the questions are what people came for. */}
            <div className={'mt-6 flex flex-col gap-6 lg:flex-row lg:items-start'}>
                <div className={'flex min-w-0 flex-1 flex-col gap-5'}>
                    {questions?.map(question => (
                        <QuestionCard key={question.id} question={question} />
                    ))}
                </div>
                <aside className={'flex w-full shrink-0 flex-col gap-5 lg:w-72'}>
                    <TrendingTags/>
                    <TopUsers/>
                </aside>
            </div>
        </div>
    );
}
