import {getQuestionsById} from "@/lib/actions/question-actions";
import {getMyVotes} from "@/lib/actions/vote-actions";
import {getValidSession} from "@/lib/session";
import {notFound} from "next/navigation";
import Link from "next/link";
import AnswerForm from "@/components/questions/AnswerForm";
import QuestionDetailedHeader from "@/app/questions/[id]/QuestionDetailedHeader";
import QuestionContent from "@/app/questions/[id]/QuestionContent";
import AnswerContent from "@/app/questions/[id]/AnswerContent";
import AnswersHeader from "@/app/questions/[id]/AnswersHeader";

type Params = Promise<{id:string}>

export default async function QuestionDetailedPage({params}: {params: Params}) {
    const {id} = await params;
    const [{data: question, error}, session] = await Promise.all([
        getQuestionsById(id),
        getValidSession(),
    ]);

    if (error) throw error;
    if (!question) return notFound();

    const isOwner = question.askerId === session?.user.id;

    // One call for the question and every answer, rather than one per voting control.
    // Anonymous visitors skip it entirely - the endpoint requires a token.
    const {data: votes} = session
        ? await getMyVotes([question.id, ...question.answers.map(a => a.id)])
        : {data: []};

    const voteFor = (targetId: string) => votes?.find(v => v.targetId === targetId);

    return (
        <div className={'container mx-auto w-full px-4 py-8 md:px-6'}>
            <QuestionDetailedHeader question={question} isOwner={isOwner} />
            <QuestionContent
                question={question}
                myVote={voteFor(question.id)}
                isSignedIn={!!session}
                isAuthor={isOwner}
            />
            {question.answers.length > 0 && (
                <AnswersHeader answerCount={question.answers.length} />
            )}
            <div className={'mt-5 flex flex-col gap-5'}>
                {question.answers.map(answer => (
                    <AnswerContent
                        answer={answer}
                        questionId={question.id}
                        isOwner={!!session && answer.userId === session.user.id}
                        myVote={voteFor(answer.id)}
                        isSignedIn={!!session}
                        canAccept={isOwner && !question.hasAcceptedAnswer}
                        key={answer.id}
                    />
                ))}
            </div>

            <div className={'mt-8 rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/90'}>
                {session ? (
                    <AnswerForm questionId={question.id}/>
                ) : (
                    <p className={'text-sm text-neutral-600 dark:text-gray-300'}>
                        <Link href={'/api/auth/signin'} className={'font-semibold text-green-700 hover:underline dark:text-purple-400'}>
                            Sign in
                        </Link>
                        {' '}to answer this question.
                    </p>
                )}
            </div>
        </div>
    );
}