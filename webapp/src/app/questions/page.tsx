import {getQuestions} from "@/lib/actions/question-actions";
import QuestionCard from "@/app/questions/QuestionCard";
import QuestionsHeader from "@/app/questions/QuestionsHeader";

export default async function QuestionsPage({searchParams}: {searchParams?: Promise<{tag?: string}>}) {
    const params = await searchParams;
    const {data: questions, error} = await getQuestions(params?.tag);
    
    if (error) throw error;
    
    return (
        <div className={'container mx-auto px-4 py-8 md:px-6'}>
            <QuestionsHeader tag={params?.tag ?? ''} total={questions?.length || 0} />
            <div className={'mt-6 flex flex-col gap-5'}>
                {questions?.map(question => (
                    <QuestionCard key={question.id} question={question} />
                ))}
            </div>
        </div>
    );
}