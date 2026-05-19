import {Question} from "@/lib/types";
import {Chip} from "@heroui/react";
import Link from "next/link";
import {formatDistanceToNow} from "date-fns";

type Props = {
    question: Question;
}

export default function QuestionFooter({ question }: Props) {
    return (
        <div className={'flex justify-between mt-4 px-6 py-3'}>
            <div className={'flex gap-2'}>
                {question.tagSlugs.map(tag => (
                    <Link href={`/questions?tag=${tag}`} key={tag}>
                        <Chip
                            variant={'soft'}
                            color={'default'}
                            size={'sm'}
                            className={'bg-gray-300 dark:bg-gray-700 dark:text-gray-200'}
                        >
                            {tag}
                        </Chip>
                    </Link>
                ))}
            </div>
            
            <div className={'flex items-center gap-3 text-sm bg-gray-300 dark:bg-gray-700 rounded-xl px-4 py-3'}>
                <div className={'w-8 h-8 rounded-full bg-green-900 dark:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center'}>
                    {question.askerDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className={'flex flex-col'}>
                    <Link href={`/profiles/${question.askerId}`} className={'hover:underline font-semibold text-green-700 dark:text-purple-400'}>
                        {question.askerDisplayName}
                    </Link>
                    <span className={'text-gray-500 dark:text-gray-400'}>asked {formatDistanceToNow(new Date(question.createdAt))} ago</span>
                </div>
            </div>
        </div>
    );
}