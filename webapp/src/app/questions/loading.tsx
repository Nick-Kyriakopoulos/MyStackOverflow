import {Skeleton} from "@heroui/react";
import QuestionCardSkeleton from "@/components/layout/QuestionCardSkeleton";

// Shown while the server component fetches. Questions, their authors and both sidebars
// are separate calls, so on a cold cache this is visible for a moment.
export default function Loading() {
    return (
        <div className={'container mx-auto px-4 py-8 md:px-6'}>
            <Skeleton className={'h-44 rounded-3xl'}/>

            <div className={'mt-6 flex flex-col gap-6 lg:flex-row lg:items-start'}>
                <div className={'flex min-w-0 flex-1 flex-col gap-5'}>
                    {/* Matches the default page size, so the list does not resize. */}
                    {Array.from({length: 5}, (_, i) => <QuestionCardSkeleton key={i}/>)}
                </div>
                <aside className={'flex w-full shrink-0 flex-col gap-5 lg:w-72'}>
                    <Skeleton className={'h-48 rounded-3xl'}/>
                    <Skeleton className={'h-48 rounded-3xl'}/>
                </aside>
            </div>
        </div>
    );
}
