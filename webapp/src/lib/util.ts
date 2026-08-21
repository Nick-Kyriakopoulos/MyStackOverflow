import {toast} from "@heroui/react";

export function errorToast(error: {message: string, status?: number}) {
    return toast.danger(`Error ${error.status}` || 'Error', {
        description: error.message || 'Something went wrong',
    });
}

export function successToast(message: string, title?: string) {
    return toast.success(title || 'Success', {
        description: message,
    });
}

export function handleError(error: {message: string, status?: number}){
    if (error.status === 500) {
        throw error
    } else {
        return errorToast(error)
    }
}

