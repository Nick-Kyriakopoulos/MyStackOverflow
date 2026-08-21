'use client';

import {Button} from "@heroui/react";
import {signIn} from "next-auth/react";

export default function LoginButton() {
    return (
        <Button 
            className={'dark:text-purple-400 dark:border-purple-400 ' +
                'hover:bg-green-900 hover:text-white ' +
                'dark:hover:bg-purple-700 dark:hover:text-white ' +
                'transition-colors duration-200'} 
            variant={'outline'}
            type={'button'}
            onPress={() => signIn('keycloak', {redirectTo: '/questions'})}
        >
            Login
        </Button>
    );
}
