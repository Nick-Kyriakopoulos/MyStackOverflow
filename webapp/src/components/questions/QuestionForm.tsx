'use client';

import type {Key} from "@heroui/react";
import {
    Autocomplete,
    Button,
    EmptyState,
    FieldError,
    Form,
    Input,
    Label,
    ListBox,
    SearchField,
    Tag as TagChip,
    TagGroup,
    TextField,
    useFilter,
} from "@heroui/react";
import {Controller, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import {Question, Tag} from "@/lib/types";
import {questionSchema, QuestionSchema} from "@/lib/schemas/questionSchema";
import {createQuestion, updateQuestion} from "@/lib/actions/question-actions";
import {handleError, successToast} from "@/lib/util";
import RichTextEditor from "@/components/editor/RichTextEditor";

type Props = {
    tags: Tag[];
    // Present when editing an existing question; absent when asking a new one.
    question?: Question;
}

export default function QuestionForm({tags, question}: Props) {
    const router = useRouter();
    const {contains} = useFilter({sensitivity: 'base'});
    const isEditing = !!question;

    const {control, handleSubmit, formState: {errors, isSubmitting}} = useForm<QuestionSchema>({
        resolver: zodResolver(questionSchema),
        // Validate as the user corrects a field rather than only on submit -
        // the rich text editor has no native validation to fall back on.
        mode: 'onTouched',
        defaultValues: {
            title: question?.title ?? '',
            content: question?.content ?? '',
            tags: question?.tagSlugs ?? [],
        },
    });

    const onSubmit = async (data: QuestionSchema) => {
        if (isEditing) {
            // A 204 carries no body, so there is nothing to read back - only the
            // absence of an error tells us the update landed.
            const {error} = await updateQuestion(question.id, data);

            if (error) return handleError(error);

            successToast('Your question has been updated.');
            router.push(`/questions/${question.id}`);
            router.refresh();
            return;
        }

        const {data: created, error} = await createQuestion(data);

        if (error) return handleError(error);

        if (created) {
            successToast('Your question has been posted.');
            router.push(`/questions/${created.id}`);
        }
    };

    return (
        <Form
            // react-hook-form owns validation here, so native HTML validation
            // must not block submission before the resolver has run.
            validationBehavior={'aria'}
            className={'flex w-full flex-col gap-6'}
            onSubmit={handleSubmit(onSubmit)}
        >
            <Controller
                name={'title'}
                control={control}
                render={({field}) => (
                    <TextField
                        className={'w-full'}
                        isInvalid={!!errors.title}
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                    >
                        <Label>Title</Label>
                        <Input placeholder={'Be specific and imagine you are asking another person'}/>
                        {errors.title && <FieldError>{errors.title.message}</FieldError>}
                    </TextField>
                )}
            />

            <Controller
                name={'content'}
                control={control}
                render={({field}) => (
                    <div className={'flex flex-col gap-1.5'}>
                        <Label>What are the details of your problem?</Label>
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

            <Controller
                name={'tags'}
                control={control}
                render={({field}) => (
                    <div className={'flex flex-col gap-1.5'}>
                        <Autocomplete
                            className={'w-full'}
                            placeholder={'Select up to 5 tags'}
                            selectionMode={'multiple'}
                            value={field.value}
                            onChange={keys => field.onChange(keys as string[])}
                            onBlur={field.onBlur}
                        >
                            <Label>Tags</Label>
                            <Autocomplete.Trigger>
                                <Autocomplete.Value>
                                    {({defaultChildren, isPlaceholder, state}) => {
                                        if (isPlaceholder || state.selectedItems.length === 0) {
                                            return defaultChildren;
                                        }

                                        const selectedKeys = state.selectedItems.map(item => item.key);

                                        return (
                                            <TagGroup
                                                size={'sm'}
                                                onRemove={(keys: Set<Key>) =>
                                                    field.onChange(field.value.filter(slug => !keys.has(slug)))}
                                            >
                                                <TagGroup.List>
                                                    {selectedKeys.map(key => {
                                                        const tag = tags.find(t => t.slug === key);
                                                        if (!tag) return null;

                                                        return (
                                                            <TagChip key={tag.slug} id={tag.slug}>
                                                                {tag.name}
                                                            </TagChip>
                                                        );
                                                    })}
                                                </TagGroup.List>
                                            </TagGroup>
                                        );
                                    }}
                                </Autocomplete.Value>
                                <Autocomplete.ClearButton/>
                                <Autocomplete.Indicator/>
                            </Autocomplete.Trigger>
                            <Autocomplete.Popover>
                                <Autocomplete.Filter filter={contains}>
                                    <SearchField autoFocus name={'search'} variant={'secondary'}>
                                        <SearchField.Group>
                                            <SearchField.SearchIcon/>
                                            <SearchField.Input placeholder={'Search tags...'}/>
                                            <SearchField.ClearButton/>
                                        </SearchField.Group>
                                    </SearchField>
                                    <ListBox renderEmptyState={() => <EmptyState>No tags found</EmptyState>}>
                                        {tags.map(tag => (
                                            <ListBox.Item key={tag.slug} id={tag.slug} textValue={tag.name}>
                                                {tag.name}
                                                <ListBox.ItemIndicator/>
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Autocomplete.Filter>
                            </Autocomplete.Popover>
                        </Autocomplete>
                        {errors.tags && (
                            <p className={'text-sm text-danger'}>{errors.tags.message}</p>
                        )}
                    </div>
                )}
            />

            <div className={'flex justify-end gap-3'}>
                <Button type={'button'} variant={'outline'} onPress={() => router.back()}>
                    Cancel
                </Button>
                <Button
                    type={'submit'}
                    isDisabled={isSubmitting}
                    className={'bg-green-900 dark:bg-purple-700 text-white shadow-sm'}
                >
                    {isSubmitting
                        ? (isEditing ? 'Saving...' : 'Posting...')
                        : (isEditing ? 'Save changes' : 'Post your question')}
                </Button>
            </div>
        </Form>
    );
}
