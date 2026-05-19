import {getQuestions} from "@/lib/actions/question-actions";
import QuestionCard from "@/app/questions/QuestionCard";
import QuestionsHeader from "@/app/questions/QuestionsHeader";

export default async function QuestionsPage({searchParams}: {searchParams?: Promise<{tag?: string}>}) {
    const params = await searchParams;
    const questions = await getQuestions(params?.tag);
    
    return (
        <>
            <QuestionsHeader tag={params?.tag ?? ''} total={questions.length} />
            {questions.map(question => (
                <div key={question.id} className={'py-4 not-last:border-b w-full flex'}>
                    <QuestionCard question={question} />
                </div>
            ))}
        </>
    );
}