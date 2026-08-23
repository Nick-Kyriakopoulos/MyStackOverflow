import {notFound, redirect} from "next/navigation";
import {getProfile} from "@/lib/actions/profile-actions";
import {getValidSession} from "@/lib/session";
import ProfileForm from "@/components/profiles/ProfileForm";
import Panel from "@/components/layout/Panel";

type Params = Promise<{id: string}>

export default async function EditProfilePage({params}: {params: Params}) {
    const {id} = await params;
    const session = await getValidSession();

    if (!session) redirect(`/api/auth/signin?callbackUrl=/profiles/${id}/edit`);

    // The API only ever updates the caller's own profile, so editing someone
    // else's is not a permission error - there is simply nothing to show.
    if (session.user.id !== id) redirect(`/profiles/${id}`);

    const {data: profile, error} = await getProfile(id);

    if (error) throw error;
    if (!profile) return notFound();

    return (
        <div className={'mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pt-6'}>
            <Panel variant={'header'}>
                <h1 className={'text-3xl font-bold tracking-tight md:text-4xl'}>Edit your profile</h1>
                <p className={'mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                    Your name and picture appear on every question and answer you post.
                </p>
            </Panel>

            <Panel>
                <ProfileForm profile={profile}/>
            </Panel>
        </div>
    );
}
