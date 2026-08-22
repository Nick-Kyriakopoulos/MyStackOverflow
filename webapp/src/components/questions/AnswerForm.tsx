'use client';

import {Button, Form, Label} from "@heroui/react";
import {Controller, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import {Answer} from "@/lib/types";
import {answerSchema, AnswerSchema} from "@/lib/schemas/answerSchema";
import {createAnswer, updateAnswer} from "@/lib/actions/answer-actions";
import {handleError, successToast} from "@/lib/util";
import RichTextEditor from "@/components/editor/RichTextEditor";

type Props = {
    questionId: string;
    // Present when editing an existing answer; absent when posting a new one.
    answer?: Answer;
    onFinished?: () => void;
}

export default function AnswerForm({questionId, answer, onFinished}: Props) {
    const router = useRouter();
    const isEditing = !!answer;

    const {control, handleSubmit, reset, formState: {errors, isSubmitting}} = useForm<AnswerSchema>({
        resolver: zodResolver(answerSchema),
        mode: 'onTouched',
        defaultValues: {content: answer?.content ?? ''},
    });

    const onSubmit = async (data: AnswerSchema) => {
        const {error} = isEditing
            ? await updateAnswer(questionId, answer.id, data)
            : await createAnswer(questionId, data);

        if (error) return handleError(error);

        successToast(isEditing ? 'Your answer has been updated.' : 'Your answer has been posted.');

        // The action already revalidated the page's cache; refresh pulls the
        // freshly rendered server component into this client.
        router.refresh();
        if (!isEditing) reset({content: ''});
        onFinished?.();
    };

    return (
        <Form
            validationBehavior={'aria'}
            className={'flex w-full flex-col gap-4'}
            onSubmit={handleSubmit(onSubmit)}
        >
            <Controller
                name={'content'}
                control={control}
                render={({field}) => (
                    <div className={'flex flex-col gap-1.5'}>
                        {!isEditing && <Label>Your answer</Label>}
                        <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            isInvalid={!!errors.content}
                        />
                        {errors.content && (
                            <p className={'text-sm text-danger'}>{errors.content.message}</p>
                        )}
                    </div>
                )}
            />

            <div className={'flex justify-end gap-3'}>
                {isEditing && (
                    <Button type={'button'} variant={'outline'} isDisabled={isSubmitting} onPress={onFinished}>
                        Cancel
                    </Button>
                )}
                <Button
                    type={'submit'}
                    isDisabled={isSubmitting}
                    className={'bg-green-900 dark:bg-purple-700 text-white shadow-sm'}
                >
                    {isSubmitting
                        ? (isEditing ? 'Saving...' : 'Posting...')
                        : (isEditing ? 'Save changes' : 'Post your answer')}
                </Button>
            </div>
        </Form>
    );
}
