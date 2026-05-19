import {Answer} from "@/lib/types";
import Link from "next/link";
import {formatDistanceToNow} from "date-fns";

type Props = {
    answer: Answer;
}

export default function AnswerFooter({answer}: Props) {
    return (
        <div className={'flex justify-end mt-4'}>
            <div className={'flex items-center gap-3 text-sm bg-gray-300 dark:bg-gray-700 rounded-xl px-4 py-3'}>
                <div className={'w-8 h-8 rounded-full bg-green-900 dark:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center'}>
                    {answer.userDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className={'flex flex-col'}>
                    <Link href={`/profiles/${answer.userId}`} className={'hover:underline font-semibold text-green-700 dark:text-purple-400'}>
                        {answer.userDisplayName}
                    </Link>
                    <span className={'text-gray-500 dark:text-gray-400'}>answered {formatDistanceToNow(new Date(answer.createdAt))} ago</span>
                </div>
            </div>
        </div>
    );
}