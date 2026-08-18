import {getQuestionsById} from "@/lib/actions/question-actions";
import {notFound} from "next/navigation";
import QuestionDetailedHeader from "@/app/questions/[id]/QuestionDetailedHeader";
import QuestionContent from "@/app/questions/[id]/QuestionContent";
import AnswerContent from "@/app/questions/[id]/AnswerContent";
import AnswersHeader from "@/app/questions/[id]/AnswersHeader";

type Params = Promise<{id:string}>

export default async function QuestionDetailedPage({params}: {params: Params}) {
    const {id} = await params;
    const {data: question,error} = await getQuestionsById(id);
    
    if (error) throw error;
    if (!question) return notFound();
    
    return (
        <div className={'container mx-auto w-full px-4 py-8 md:px-6'}>
            <QuestionDetailedHeader question={question} />
            <QuestionContent question={question} />
            {question.answers.length > 0 && (
                <AnswersHeader answerCount={question.answers.length} />
            )}
            <div className={'mt-5 flex flex-col gap-5'}>
                {question.answers.map(answer => (
                    <AnswerContent answer={answer} key={answer.id} />
                ))}
            </div>
        </div>
    );
}