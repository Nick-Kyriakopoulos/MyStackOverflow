'use client';

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {AlertDialog, Button} from "@heroui/react";
import {PencilSquareIcon, TrashIcon} from "@heroicons/react/24/outline";
import {deleteQuestion} from "@/lib/actions/question-actions";
import {handleError, successToast} from "@/lib/util";

type Props = {
    questionId: string;
}

export default function QuestionOwnerActions({questionId}: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const onDelete = async () => {
        setIsDeleting(true);

        try {
            const {error} = await deleteQuestion(questionId);

            if (error) return handleError(error);

            setIsOpen(false);
            successToast('Your question has been deleted.');
            router.push('/questions');
            // The questions list is a server component the router may still have
            // cached with this question in it.
            router.refresh();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Link href={`/questions/${questionId}/edit`}>
                <Button variant={'outline'} className={'gap-2'}>
                    <PencilSquareIcon className={'size-4'}/>
                    Edit
                </Button>
            </Link>

            <Button variant={'outline'} className={'gap-2 text-danger'} onPress={() => setIsOpen(true)}>
                <TrashIcon className={'size-4'}/>
                Delete
            </Button>

            <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
                <AlertDialog.Container>
                    <AlertDialog.Dialog className={'sm:max-w-[440px]'}>
                        <AlertDialog.CloseTrigger/>
                        <AlertDialog.Header>
                            <AlertDialog.Icon status={'danger'}/>
                            <AlertDialog.Heading>Delete this question?</AlertDialog.Heading>
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p>
                                This permanently deletes the question and every answer posted to it.
                                This cannot be undone.
                            </p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button slot={'close'} variant={'tertiary'} isDisabled={isDeleting}>
                                Cancel
                            </Button>
                            {/* Not slot="close": the dialog has to stay up until the
                                request comes back, or a failure closes it silently. */}
                            <Button variant={'danger'} isDisabled={isDeleting} onPress={onDelete}>
                                {isDeleting ? 'Deleting...' : 'Delete question'}
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog.Backdrop>
        </>
    );
}
