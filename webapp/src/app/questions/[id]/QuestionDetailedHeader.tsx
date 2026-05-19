import {Question} from "@/lib/types";
import {Button} from "@heroui/react";
import Link from "next/link";

type Props = {
    question: Question;
}

export default function QuestionDetailedHeader({question}: Props) {
    return (
        <div className={'flex flex-col w-full border-b border-neutral-300 dark:border-gray-700 gap-4 pb-4 px-6'}>
            <div className={'flex justify-between gap-4'}>
                <div className={'text-3xl font-semibold first-letter:uppercase'}>
                    {question.title}
                </div>
                <Link href={'/questions/ask'}>
                    <Button className={'bg-green-900 dark:bg-purple-700 text-white font-semibold'}>
                        Ask Question
                    </Button>
                </Link>
            </div>
            <div className={'flex items-center gap-3'}>
                <span className={'text-gray-500 dark:text-gray-400'}>Asked</span>
                <span>{question.createdAt}</span>
            </div>
            {question.updatedAt && (
                <div className={'flex items-center gap-3'}>
                    <span className={'text-gray-500 dark:text-gray-400'}>Modified</span>
                    <span>{question.updatedAt}</span>
                </div>
            )}
            <div>
                <div className={'flex items-center gap-3'}>
                    <span className={'text-gray-500 dark:text-gray-400'}>Viewed</span>
                    <span>{question.viewCount + 1} times</span>
                </div>
            </div>
        </div>
    );
}