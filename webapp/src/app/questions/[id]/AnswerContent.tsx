'use client';

import {useState} from "react";
import {useRouter} from "next/navigation";
import {AlertDialog, Button} from "@heroui/react";
import {PencilSquareIcon, TrashIcon} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {Answer} from "@/lib/types";
import VotingButtons from "@/app/questions/[id]/VotingButtons";
import AnswerFooter from "@/app/questions/[id]/AnswerFooter";
import AnswerForm from "@/components/questions/AnswerForm";
import {deleteAnswer} from "@/lib/actions/answer-actions";
import {handleError, successToast} from "@/lib/util";

type Props = {
    answer: Answer;
    questionId: string;
    isOwner: boolean;
}

export default function AnswerContent({answer, questionId, isOwner}: Props) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const onDelete = async () => {
        setIsDeleting(true);

        try {
            const {error} = await deleteAnswer(questionId, answer.id);

            if (error) return handleError(error);

            setIsConfirmOpen(false);
            successToast('Your answer has been deleted.');
            router.refresh();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={clsx('flex items-stretch gap-5 rounded-3xl border bg-white/90 p-6 shadow-sm dark:bg-gray-900/90', {
            'border-neutral-200/80 dark:border-gray-800': !answer.accepted,
            'border-green-300 bg-green-50/60 dark:border-purple-500/50 dark:bg-purple-950/20': answer.accepted,
        })}>
            <div className={'self-start'}>
                <VotingButtons accepted={answer.accepted}/>
            </div>
            <div className={'flex flex-1 flex-col'}>
                {isEditing ? (
                    <div className={'mt-2'}>
                        <AnswerForm
                            questionId={questionId}
                            answer={answer}
                            onFinished={() => setIsEditing(false)}
                        />
                    </div>
                ) : (
                    <>
                        <div
                            className={'mt-2 rounded-2xl bg-stone-100/90 px-5 py-4 text-gray-900 dark:bg-gray-800/90 dark:text-gray-100 [&_p]:mb-4'}
                            dangerouslySetInnerHTML={{__html: answer.content}}
                        />
                        {isOwner && (
                            <div className={'mt-3 flex gap-2'}>
                                <Button size={'sm'} variant={'outline'} className={'gap-2'}
                                        onPress={() => setIsEditing(true)}>
                                    <PencilSquareIcon className={'size-4'}/>
                                    Edit
                                </Button>
                                {/* The API refuses to delete an accepted answer, so
                                    the control is hidden rather than left to fail. */}
                                {!answer.accepted && (
                                    <Button size={'sm'} variant={'outline'} className={'gap-2 text-danger'}
                                            onPress={() => setIsConfirmOpen(true)}>
                                        <TrashIcon className={'size-4'}/>
                                        Delete
                                    </Button>
                                )}
                            </div>
                        )}
                        <AnswerFooter answer={answer}/>
                    </>
                )}
            </div>

            <AlertDialog.Backdrop isOpen={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialog.Container>
                    <AlertDialog.Dialog className={'sm:max-w-[440px]'}>
                        <AlertDialog.CloseTrigger/>
                        <AlertDialog.Header>
                            <AlertDialog.Icon status={'danger'}/>
                            <AlertDialog.Heading>Delete this answer?</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p>This permanently removes your answer from the question. This cannot be undone.</p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button slot={'close'} variant={'tertiary'} isDisabled={isDeleting}>
                                Cancel
                            </Button>
                            <Button variant={'danger'} isDisabled={isDeleting} onPress={onDelete}>
                                {isDeleting ? 'Deleting...' : 'Delete answer'}
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog.Backdrop>
        </div>
    );
}
