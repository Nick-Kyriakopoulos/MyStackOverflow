import {Question} from "@/lib/types";
import VotingButtons from "@/app/questions/[id]/VotingButtons";
import QuestionFooter from "@/app/questions/[id]/QuestionFooter";

type Props = {
    question: Question;
}

export default function QuestionContent({question}: Props) {
    return (
        <div className={'flex border-b border-neutral-300 dark:border-gray-700 pb-3 px-6'}>
            <VotingButtons/>
            <div className={'flex flex-col'}>
                <div
                    className={'flex-1 mt-4 ml-6 max-w-none text-gray-900 dark:text-gray-100 [&_p]:mb-4'}
                    dangerouslySetInnerHTML={{__html: question.content}}
                />
                <QuestionFooter question={question}/>
            </div>
        </div>
    );
}