import {notFound} from "next/navigation";
import Link from "next/link";
import {Avatar, Button} from "@heroui/react";
import {format} from "date-fns";
import {getProfile} from "@/lib/actions/profile-actions";
import {getValidSession} from "@/lib/session";
import Panel from "@/components/layout/Panel";

type Params = Promise<{id: string}>

export default async function ProfilePage({params}: {params: Params}) {
    const {id} = await params;

    const [{data: profile, error}, session] = await Promise.all([
        getProfile(id),
        getValidSession(),
    ]);

    if (error) throw error;
    if (!profile) return notFound();

    const isMe = session?.user.id === profile.id;

    return (
        <div className={'mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pt-6'}>
            <Panel variant={'header'}>
                <div className={'flex flex-col gap-6 md:flex-row md:items-center md:justify-between'}>
                    <div className={'flex items-center gap-5'}>
                        <Avatar className={'size-20'}>
                            {profile.imageUrl && <Avatar.Image src={profile.imageUrl} alt={''}/>}
                            <Avatar.Fallback className={'bg-green-900 text-2xl font-semibold text-white dark:bg-purple-700'}>
                                {profile.displayName.charAt(0).toUpperCase()}
                            </Avatar.Fallback>
                        </Avatar>
                        <div className={'min-w-0'}>
                            <h1 className={'truncate text-3xl font-bold tracking-tight md:text-4xl'}>
                                {profile.displayName}
                            </h1>
                            <p className={'mt-2 text-sm text-neutral-600 dark:text-gray-300'}>
                                Member since {format(new Date(profile.createdAt), 'MMMM yyyy')}
                            </p>
                        </div>
                    </div>
                    {isMe && (
                        <Link href={`/profiles/${profile.id}/edit`} className={'shrink-0'}>
                            <Button className={'bg-green-900 text-white shadow-sm dark:bg-purple-700'}>
                                Edit profile
                            </Button>
                        </Link>
                    )}
                </div>
            </Panel>

            <Panel>
                <div className={'text-xs uppercase tracking-wide text-neutral-500 dark:text-gray-400'}>
                    Reputation
                </div>
                <div className={'mt-1 text-3xl font-semibold'}>
                    {profile.reputation.toLocaleString()}
                </div>
                <p className={'mt-2 text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                    {isMe
                        ? 'You earn reputation when the community finds your answers useful.'
                        : `${profile.displayName} earns reputation when the community finds their answers useful.`}
                </p>
            </Panel>
        </div>
    );
}
