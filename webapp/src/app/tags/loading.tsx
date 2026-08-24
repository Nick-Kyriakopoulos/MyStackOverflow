import {Skeleton} from "@heroui/react";

export default function Loading() {
    return (
        <div className={'container mx-auto px-4 py-8 md:px-6'}>
            <Skeleton className={'mb-8 h-40 rounded-3xl'}/>
            <div className={'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'}>
                {Array.from({length: 6}, (_, i) => (
                    <Skeleton key={i} className={'h-52 rounded-3xl'}/>
                ))}
            </div>
        </div>
    );
}
