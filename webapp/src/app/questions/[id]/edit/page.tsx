import {notFound, redirect} from "next/navigation";
import {getQuestionsById} from "@/lib/actions/question-actions";
import {getTags} from "@/lib/actions/tag-actions";
import {getValidSession} from "@/lib/session";
import QuestionForm from "@/components/questions/QuestionForm";

type Params = Promise<{id: string}>

export default async function EditQuestionPage({params}: {params: Params}) {
    const {id} = await params;
    const session = await getValidSession();

    if (!session) redirect(`/api/auth/signin?callbackUrl=/questions/${id}/edit`);

    const [{data: question, error}, {data: tags}] = await Promise.all([
        getQuestionsById(id),
        getTags(),
    ]);

    if (error) throw error;
    if (!question) return notFound();

    // The API returns 403 for a non-owner anyway; this keeps someone who typed
    // the URL from filling in a form they were never going to be able to save.
    if (question.askerId !== session.user.id) redirect(`/questions/${id}`);

    return (
        <div className={'mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pt-6'}>
            <div className={'rounded-3xl border border-neutral-200/70 bg-linear-to-br from-white via-stone-50 to-green-50 p-6 shadow-sm dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950/30'}>
                <h1 className={'text-3xl font-bold tracking-tight md:text-4xl'}>Edit your question</h1>
                <p className={'mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-gray-300'}>
                    Clarify the wording or add what you have tried since. Everyone following the
                    question will see the update.
                </p>
            </div>

            <div className={'rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/90'}>
                <QuestionForm tags={tags ?? []} question={question}/>
            </div>
        </div>
    );
}
