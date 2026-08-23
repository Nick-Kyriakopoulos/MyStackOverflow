import {Profile} from "@/lib/types";
import {Avatar} from "@heroui/react";
import Link from "next/link";
import clsx from "clsx";
import {formatDistanceToNow} from "date-fns";

type Props = {
    profile: Profile;
    // What this person did to the thing being displayed, e.g. 'Asked' or 'Answered'.
    action: string;
    timestamp: string;
    // 'sm' is for the question list, where the badge sits beside a card summary.
    size?: 'sm' | 'md';
}

export default function UserBadge({profile, action, timestamp, size = 'md'}: Props) {
    const small = size === 'sm';

    return (
        <div className={clsx('flex items-center gap-2.5 rounded-2xl bg-stone-100/90 dark:bg-gray-800/90', {
            'px-2.5 py-2 text-xs': small,
            'px-4 py-3 text-sm': !small,
        })}>
            <Avatar className={small ? 'size-7' : 'size-9'}>
                {profile.imageUrl && <Avatar.Image src={profile.imageUrl} alt={''}/>}
                <Avatar.Fallback className={clsx('bg-green-900 font-semibold text-white dark:bg-purple-700', {
                    'text-[11px]': small,
                })}>
                    {profile.displayName.charAt(0).toUpperCase()}
                </Avatar.Fallback>
            </Avatar>
            <div className={'flex min-w-0 flex-col'}>
                <Link
                    href={`/profiles/${profile.id}`}
                    className={'truncate font-semibold text-green-800 hover:underline dark:text-purple-300'}
                >
                    {profile.displayName}
                </Link>
                <span className={'whitespace-nowrap text-neutral-600 dark:text-gray-400'}>
                    {profile.reputation > 0 && (
                        <span className={'font-medium text-neutral-700 dark:text-gray-300'}>
                            {profile.reputation.toLocaleString()} rep{' · '}
                        </span>
                    )}
                    {action} {formatDistanceToNow(new Date(timestamp))} ago
                </span>
            </div>
        </div>
    );
}
