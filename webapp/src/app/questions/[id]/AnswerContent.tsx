import {Answer} from "@/lib/types";
import VotingButtons from "@/app/questions/[id]/VotingButtons";
import AnswerFooter from "@/app/questions/[id]/AnswerFooter";

type Props = {
    answer: Answer;
}

export default function AnswerContent({answer}: Props) {
    return (
        <div className={'flex border-b border-neutral-300 dark:border-gray-700 pb-3 px-6'}>
            <VotingButtons accepted={answer.accepted}/>
            <div className={'flex flex-col'}>
                <div
                    className={'flex-1 mt-4 ml-6 max-w-none text-gray-900 dark:text-gray-100 [&_p]:mb-4'}
                    dangerouslySetInnerHTML={{__html: answer.content}}
                />
                <AnswerFooter answer={answer}/>
            </div>
        </div>
    );
}