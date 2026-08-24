import {Skeleton} from "@heroui/react";

export default function Loading() {
    return (
        <div className={'container mx-auto px-4 py-8 md:px-6'}>
            <Skeleton className={'h-32 rounded-3xl'}/>
            <Skeleton className={'mt-6 h-96 rounded-3xl'}/>
        </div>
    );
}
