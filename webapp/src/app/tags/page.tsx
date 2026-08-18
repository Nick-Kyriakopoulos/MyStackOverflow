import TagCard from "@/app/tags/TagCard";
import {getTags} from "@/lib/actions/tag-actions";
import {Chip} from "@heroui/react";

export default async function Page() {
    const {data: tags, error} = await getTags();
    
    if (error) throw error;
    
    return (
        <div className={'container mx-auto px-4 py-8 md:px-6'}>
            <div className={'mb-8 rounded-3xl border border-neutral-200/70 bg-linear-to-br from-white via-stone-50 to-green-50 p-6 shadow-sm dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950/30'}>
                <div className={'mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'}>
                    <div>
                        <h1 className={'text-3xl font-bold tracking-tight md:text-4xl'}>Tags</h1>
                        <p className={'mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                            Discover topics across the community and jump straight into questions for each tag.
                        </p>
                    </div>
                    <Chip className={'self-start border border-green-200 bg-green-100 text-green-900 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200'}>
                        {tags?.length ?? 0} tags
                    </Chip>
                </div>
            </div>
            <div className={'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'}>
                {tags?.map(tag => (
                    <TagCard key={tag.id} tag={tag}/>
                ))}
            </div>
        </div>
    );
}