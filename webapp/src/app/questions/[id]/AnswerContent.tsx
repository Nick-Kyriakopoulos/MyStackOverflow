import {Answer} from "@/lib/types";
import VotingButtons from "@/app/questions/[id]/VotingButtons";
import AnswerFooter from "@/app/questions/[id]/AnswerFooter";
import clsx from "clsx";

type Props = {
    answer: Answer;
}

export default function AnswerContent({answer}: Props) {
    return (
        <div className={clsx('flex items-stretch gap-5 rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-gray-900/90', {
            'border-neutral-200/80 dark:border-gray-800': !answer.accepted,
            'border-green-300 bg-green-50/60 dark:border-purple-500/50 dark:bg-purple-950/20': answer.accepted,
        })}>
            <div className={'self-start'}>
                <VotingButtons accepted={answer.accepted}/>
            </div>
            <div className={'flex flex-1 flex-col'}>
                <div
                    className={'mt-2 rounded-2xl bg-stone-100/90 px-5 py-4 text-gray-900 dark:bg-gray-800/90 dark:text-gray-100 [&_p]:mb-4'}
                    dangerouslySetInnerHTML={{__html: answer.content}}
                />
                <AnswerFooter answer={answer}/>
            </div>
        </div>
    );
}