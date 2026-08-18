import {Question} from "@/lib/types";
import VotingButtons from "@/app/questions/[id]/VotingButtons";
import QuestionFooter from "@/app/questions/[id]/QuestionFooter";

type Props = {
    question: Question;
}

export default function QuestionContent({question}: Props) {
    return (
        <div className={'mt-6 flex gap-5 rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/90'}>
            <VotingButtons/>
            <div className={'flex flex-1 flex-col'}>
                <div
                    className={'mt-2 rounded-2xl bg-stone-100/90 px-5 py-4 text-gray-900 dark:bg-gray-800/90 dark:text-gray-100 [&_p]:mb-4'}
                    dangerouslySetInnerHTML={{__html: question.content}}
                />
                <QuestionFooter question={question}/>
            </div>
        </div>
    );
}