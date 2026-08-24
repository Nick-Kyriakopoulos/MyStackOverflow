import {Skeleton} from "@heroui/react";

// Mirrors QuestionCard's shape - stat column, title, excerpt, tags - so the page does
// not jump when the real content replaces it.
export default function QuestionCardSkeleton() {
    return (
        <div className={'flex flex-col gap-6 rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/90 md:flex-row'}>
            <div className={'flex min-w-28 flex-row gap-3 md:flex-col md:items-end'}>
                <Skeleton className={'h-14 w-20 rounded-2xl'}/>
                <Skeleton className={'h-14 w-20 rounded-2xl'}/>
                <Skeleton className={'h-14 w-20 rounded-2xl'}/>
            </div>
            <div className={'flex min-h-32 flex-1 flex-col gap-3'}>
                <Skeleton className={'h-6 w-3/4 rounded-lg'}/>
                <Skeleton className={'h-3 w-full rounded-lg'}/>
                <Skeleton className={'h-3 w-5/6 rounded-lg'}/>
                <div className={'mt-auto flex gap-2 pt-2'}>
                    <Skeleton className={'h-6 w-16 rounded-full'}/>
                    <Skeleton className={'h-6 w-20 rounded-full'}/>
                </div>
            </div>
        </div>
    );
}
