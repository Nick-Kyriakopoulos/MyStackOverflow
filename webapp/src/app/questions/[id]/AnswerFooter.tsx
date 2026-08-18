import {Answer} from "@/lib/types";
import Link from "next/link";
import {formatDistanceToNow} from "date-fns";

type Props = {
    answer: Answer;
}

export default function AnswerFooter({answer}: Props) {
    return (
        <div className={'flex justify-end mt-4'}>
            <div className={'flex items-center gap-3 rounded-2xl bg-stone-100/90 px-4 py-3 text-sm dark:bg-gray-800/90'}>
                <div className={'flex h-8 w-8 items-center justify-center rounded-full bg-green-900 text-xs font-semibold text-white dark:bg-purple-700'}>
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