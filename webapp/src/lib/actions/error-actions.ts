'use server';

import {fetchClient} from "@/lib/fetchClient";

export async function triggerError(code: number){
    return await fetchClient(`/Questions/errors?code=${code}`, 'GET')
}