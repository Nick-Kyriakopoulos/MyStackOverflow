import {Question} from "@/lib/types";
import {Chip} from "@heroui/react";
import Link from "next/link";
import {formatDistanceToNow} from "date-fns";

type Props = {
    question: Question;
}

export default function QuestionFooter({ question }: Props) {
    return (
        <div className={'mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'}>
            <div className={'flex flex-wrap gap-2'}>
                {question.tagSlugs.map(tag => (
                    <Link href={`/questions?tag=${tag}`} key={tag}>
                        <Chip
                            size={'sm'}
                            className={'border border-green-200 bg-green-100/80 text-green-900 transition-colors hover:bg-green-200 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200 dark:hover:bg-purple-500/25'}
                        >
                            {tag}
                        </Chip>
                    </Link>
                ))}
            </div>
            
            <div className={'flex items-center gap-3 self-end rounded-2xl bg-stone-100/90 px-4 py-3 text-sm dark:bg-gray-800/90'}>
                <div className={'flex h-8 w-8 items-center justify-center rounded-full bg-green-900 text-xs font-semibold text-white dark:bg-purple-700'}>
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