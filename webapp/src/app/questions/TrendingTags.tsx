import Link from "next/link";
import {getTrendingTags} from "@/lib/actions/stats-actions";
import Panel from "@/components/layout/Panel";

export default async function TrendingTags() {
    const {data: tags, error} = await getTrendingTags();

    return (
        <Panel>
            <h2 className={'text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-gray-400'}>
                Trending this week
            </h2>

            {error ? (
                <p className={'mt-3 text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                    {error.message}
                </p>
            ) : !tags || tags.length === 0 ? (
                // An empty state here is normal, not a failure: nothing has been tagged
                // in the last seven days. Say so plainly rather than showing a blank box.
                <p className={'mt-3 text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                    No tags have been used this week yet. Ask a question to start it off.
                </p>
            ) : (
                <ul className={'mt-3 flex flex-col'}>
                    {tags.map(({tag, count}) => (
                        <li key={tag}>
                            <Link
                                href={`/questions?tag=${tag}`}
                                className={'flex items-baseline justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-stone-100 dark:hover:bg-gray-800'}
                            >
                                <span className={'truncate font-medium text-green-800 dark:text-purple-300'}>
                                    {tag}
                                </span>
                                <span className={'shrink-0 text-neutral-500 dark:text-gray-400'}>
                                    {count}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}
