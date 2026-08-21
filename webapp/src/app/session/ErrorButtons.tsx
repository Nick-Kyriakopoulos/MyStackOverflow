'use client';

import {Button, Spinner} from "@heroui/react";
import {triggerError} from "@/lib/actions/error-actions";
import {useState, useTransition} from "react";
import {handleError} from "@/lib/util";

const SPINNER_DELAY_MS = 700;

export default function ErrorButtons() {
    const [pending , startTransition] = useTransition();
    const [target, setTarget] = useState(0);

    const onClick = (code: number)=> {
        setTarget(code);
        startTransition(async () => {
            const {error} = await triggerError(code);
            await new Promise((resolve) => setTimeout(resolve, SPINNER_DELAY_MS));

            if (error) handleError(error);
            setTarget(0)
        })
    }

    return (
        <div className={'flex gap-3'}>
            {[400, 401, 403, 404, 500].map(code =>(
                <Button
                    onPress={ () => onClick(code) }
                    key={code}
                    type={'button'}
                    isPending={pending && target === code}
                    isDisabled={pending}
                >
                    {pending && target === code
                        ? <><Spinner size={'sm'} color={'current'} /> Loading...</>
                        : `Test ${code}`
                    }
                </Button>
            ))}
        </div>
    );
}