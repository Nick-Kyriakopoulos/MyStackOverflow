'use client';

import {useState} from "react";
import {Button, Description, FieldError, Form, Input, Label, TextField} from "@heroui/react";
import {useRouter} from "next/navigation";
import {registerUser} from "@/lib/actions/auth-actions";
import {successToast} from "@/lib/util";

export default function RegisterForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // HeroUI's <Form onSubmit> prop is still typed with React's deprecated
    // FormEvent — matching it here avoids a type mismatch with the library.
    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);
        setFieldErrors({});

        const formData = new FormData(event.currentTarget);
        const username = String(formData.get('username') ?? '').trim();
        const email = String(formData.get('email') ?? '').trim();
        const password = String(formData.get('password') ?? '');
        const confirmPassword = String(formData.get('confirmPassword') ?? '');

        if (password !== confirmPassword) {
            setFieldErrors({confirmPassword: 'Passwords do not match.'});
            return;
        }

        setIsSubmitting(true);
        try {
            const {data, error} = await registerUser({username, email, password});

            if (error) {
                if (error.field) {
                    setFieldErrors({[error.field]: error.message});
                } else {
                    setFormError(error.message);
                }
                return;
            }

            if (data) {
                successToast('Account created. You can now log in.');
                router.push('/questions');
            }
        } catch (error) {
            // registerUser throws if Keycloak is unreachable or the admin
            // client is misconfigured - without this the form would stay
            // stuck on "Creating account..." with nothing shown to the user.
            console.error('Registration failed', error);
            setFormError('Registration is unavailable right now. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form
            className={'flex w-full max-w-md flex-col gap-4'}
            validationErrors={fieldErrors}
            onSubmit={onSubmit}
        >
            <TextField isRequired name={'username'} minLength={3}>
                <Label>Username</Label>
                <Input placeholder={'jane_doe'}/>
                <FieldError/>
            </TextField>

            <TextField isRequired name={'email'} type={'email'}>
                <Label>Email</Label>
                <Input placeholder={'jane@example.com'}/>
                <FieldError/>
            </TextField>

            <TextField
                isRequired
                name={'password'}
                type={'password'}
                minLength={8}
                validate={(value) => {
                    if (value.length < 8) return 'Password must be at least 8 characters.';
                    if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
                        return 'Password must contain at least one letter and one number.';
                    }
                    return null;
                }}
            >
                <Label>Password</Label>
                <Input placeholder={'Enter a password'}/>
                <Description>At least 8 characters, with a letter and a number.</Description>
                <FieldError/>
            </TextField>

            <TextField isRequired name={'confirmPassword'} type={'password'}>
                <Label>Confirm password</Label>
                <Input placeholder={'Re-enter your password'}/>
                <FieldError/>
            </TextField>

            {formError && (
                <p className={'text-sm text-danger'}>{formError}</p>
            )}

            <Button
                type={'submit'}
                isDisabled={isSubmitting}
                className={'bg-green-900 dark:bg-purple-700 text-white shadow-sm'}
            >
                {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
        </Form>
    );
}
