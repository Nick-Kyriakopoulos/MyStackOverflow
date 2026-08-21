'use client';

import {Button} from "@heroui/react";
import {handleError, successToast} from "@/lib/util";
import {testAuth} from "@/lib/actions/auth-actions";

export default function AuthTestButton() {
    const onClick = async () => {
        const {data,error} = await testAuth();
        if (error) handleError(error);
        if (data) successToast('Auth test successful');
    };
    
    return (
        <Button
            onPress={onClick}
            className="bg-success text-success-foreground hover:bg-success-hover"
        >
            Test Auth
        </Button>
    );
}