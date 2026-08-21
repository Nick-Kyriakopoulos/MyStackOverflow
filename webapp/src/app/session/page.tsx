import ErrorButtons from "@/app/session/ErrorButtons";
import AuthTestButton from "@/app/session/AuthTestButton";
import SessionSnippet from "@/app/session/SessionSnippet";
import {auth} from "@/auth";

export default async function Page() {
    const session = await auth();
    
    return (
        <div className={'px-6'}>
            <div className={'text-center'}>
                <h3 className={'text-3xl'}>Session dashboard</h3>
            </div>
            <SessionSnippet value={JSON.stringify(session, null, 2)}/>
            <div className={'flex items-center gap-3 justify-center mt-6'}>
                <ErrorButtons/>
                <AuthTestButton/>
            </div>
        </div>

    );
}