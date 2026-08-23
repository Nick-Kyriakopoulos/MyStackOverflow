'use client';

import {useRef, useState} from "react";
import {Avatar, Button, FieldError, Form, Input, Label, TextField} from "@heroui/react";
import {Controller, useForm, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import {Profile} from "@/lib/types";
import {profileSchema, ProfileSchema} from "@/lib/schemas/profileSchema";
import {updateMyProfile} from "@/lib/actions/profile-actions";
import {uploadImage} from "@/lib/actions/image-actions";
import {ALLOWED_IMAGE_TYPES, PROFILE_UPLOAD_FOLDER} from "@/lib/imageRules";
import {errorToast, handleError, successToast} from "@/lib/util";

type Props = {
    profile: Profile;
}

export default function ProfileForm({profile}: Props) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const {control, handleSubmit, setValue, formState: {errors, isSubmitting}} = useForm<ProfileSchema>({
        resolver: zodResolver(profileSchema),
        mode: 'onTouched',
        defaultValues: {
            displayName: profile.displayName,
            imageUrl: profile.imageUrl ?? '',
        },
    });

    // useWatch rather than watch(): watch() returns a fresh function every render,
    // so the React Compiler refuses to memoize this component at all.
    const imageUrl = useWatch({control, name: 'imageUrl'});
    const displayName = useWatch({control, name: 'displayName'});

    const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Reset immediately so picking the same file twice still fires onChange.
        event.target.value = '';
        if (!file) return;

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const {data, error} = await uploadImage(formData, PROFILE_UPLOAD_FOLDER);

            if (error) return errorToast(error);
            if (!data) return;

            // Only staged in the form - nothing is saved until the user submits.
            setValue('imageUrl', data.url, {shouldDirty: true});
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: ProfileSchema) => {
        const {error} = await updateMyProfile(data);

        if (error) return handleError(error);

        successToast('Your profile has been updated.');
        router.push(`/profiles/${profile.id}`);
        router.refresh();
    };

    return (
        <Form
            validationBehavior={'aria'}
            className={'flex w-full flex-col gap-6'}
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className={'flex flex-col gap-1.5'}>
                <Label>Picture</Label>
                <div className={'flex items-center gap-5'}>
                    <Avatar className={'size-20'}>
                        {imageUrl && <Avatar.Image src={imageUrl} alt={''}/>}
                        <Avatar.Fallback className={'bg-green-900 text-2xl font-semibold text-white dark:bg-purple-700'}>
                            {(displayName || profile.displayName).charAt(0).toUpperCase()}
                        </Avatar.Fallback>
                    </Avatar>
                    <div className={'flex flex-wrap gap-2'}>
                        <Button
                            type={'button'}
                            variant={'outline'}
                            isDisabled={isUploading}
                            onPress={() => fileInputRef.current?.click()}
                        >
                            {isUploading ? 'Uploading...' : imageUrl ? 'Replace picture' : 'Upload a picture'}
                        </Button>
                        {imageUrl && (
                            <Button
                                type={'button'}
                                variant={'outline'}
                                onPress={() => setValue('imageUrl', '', {shouldDirty: true})}
                            >
                                Remove picture
                            </Button>
                        )}
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type={'file'}
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    className={'hidden'}
                    onChange={onFileSelected}
                />
            </div>

            <Controller
                name={'displayName'}
                control={control}
                render={({field}) => (
                    <TextField
                        className={'w-full'}
                        isInvalid={!!errors.displayName}
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                    >
                        <Label>Display name</Label>
                        <Input placeholder={'The name shown on your questions and answers'}/>
                        {errors.displayName && <FieldError>{errors.displayName.message}</FieldError>}
                    </TextField>
                )}
            />

            <div className={'flex justify-end gap-3'}>
                <Button type={'button'} variant={'outline'} onPress={() => router.back()}>
                    Cancel
                </Button>
                <Button
                    type={'submit'}
                    isDisabled={isSubmitting || isUploading}
                    className={'bg-green-900 text-white shadow-sm dark:bg-purple-700'}
                >
                    {isSubmitting ? 'Saving...' : 'Save changes'}
                </Button>
            </div>
        </Form>
    );
}
