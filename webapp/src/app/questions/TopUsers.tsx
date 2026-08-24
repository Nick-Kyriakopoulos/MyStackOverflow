import Link from "next/link";
import {Avatar} from "@heroui/react";
import {getTopUsers} from "@/lib/actions/stats-actions";
import Panel from "@/components/layout/Panel";

export default async function TopUsers() {
    const {data: users} = await getTopUsers();

    return (
        <Panel>
            <h2 className={'text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-gray-400'}>
                Top users this week
            </h2>

            {!users || users.length === 0 ? (
                <p className={'mt-3 text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                    Nobody has earned reputation this week yet. Answer a question to be the first.
                </p>
            ) : (
                <ul className={'mt-3 flex flex-col'}>
                    {users.map(({profile, gained}) => (
                        <li key={profile.id}>
                            <Link
                                href={`/profiles/${profile.id}`}
                                className={'flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-stone-100 dark:hover:bg-gray-800'}
                            >
                                <Avatar className={'size-8'}>
                                    {profile.imageUrl && <Avatar.Image src={profile.imageUrl} alt={''}/>}
                                    <Avatar.Fallback className={'bg-green-900 text-[11px] font-semibold text-white dark:bg-purple-700'}>
                                        {profile.displayName.charAt(0).toUpperCase()}
                                    </Avatar.Fallback>
                                </Avatar>
                                <span className={'min-w-0 flex-1 truncate font-medium text-green-800 dark:text-purple-300'}>
                                    {profile.displayName}
                                </span>
                                {/* The gain, not the total - that is on their profile. */}
                                <span className={'shrink-0 text-neutral-500 dark:text-gray-400'}>
                                    +{gained.toLocaleString()}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}
