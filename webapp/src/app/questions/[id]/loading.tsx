import {Skeleton} from "@heroui/react";

export default function Loading() {
    return (
        <div className={'container mx-auto w-full px-4 py-8 md:px-6'}>
            <Skeleton className={'h-56 rounded-3xl'}/>
            <Skeleton className={'mt-6 h-64 rounded-3xl'}/>
            <Skeleton className={'mt-6 h-24 rounded-3xl'}/>
            <div className={'mt-5 flex flex-col gap-5'}>
                <Skeleton className={'h-48 rounded-3xl'}/>
                <Skeleton className={'h-48 rounded-3xl'}/>
            </div>
        </div>
    );
}
