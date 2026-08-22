import {redirect} from "next/navigation";
import {getTags} from "@/lib/actions/tag-actions";
import {getValidSession} from "@/lib/session";
import QuestionForm from "@/components/questions/QuestionForm";

export default async function Page() {
    // getValidSession, not auth(): an expired session still exists as a cookie,
    // and letting the user write a whole question before the POST 401s loses
    // everything they typed.
    const session = await getValidSession();

    if (!session) redirect('/api/auth/signin?callbackUrl=/questions/ask');

    const {data: tags} = await getTags();

    return (
        <div className={'mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pt-6'}>
            <div className={'rounded-3xl border border-neutral-200/70 bg-linear-to-br from-white via-stone-50 to-green-50 p-6 shadow-sm dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950/30'}>
                <h1 className={'text-3xl font-bold tracking-tight md:text-4xl'}>Ask a question</h1>
                <p className={'mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                    Be specific, describe what you have already tried, and tag your question so the
                    right people can find it.
                </p>
            </div>

            <div className={'rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/90'}>
                <QuestionForm tags={tags ?? []}/>
            </div>
        </div>
    );
}
