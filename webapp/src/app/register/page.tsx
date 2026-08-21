import RegisterForm from "@/app/register/RegisterForm";

export default function Page() {
    return (
        <div className={'flex flex-col items-center gap-6 px-6 pt-6'}>
            <div className={'text-center'}>
                <h3 className={'text-3xl'}>Create an account</h3>
                <p className={'text-sm text-neutral-600 dark:text-gray-400'}>
                    Already have an account? Use the Login button in the top navigation.
                </p>
            </div>
            <RegisterForm/>
        </div>
    );
}
