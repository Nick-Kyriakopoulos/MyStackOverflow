'use client';

import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import clsx from 'clsx';
import MenuBar from '@/components/editor/MenuBar';

type Props = {
    value: string;
    onChange: (html: string) => void;
    onBlur?: () => void;
    isInvalid?: boolean;
    placeholder?: string;
}

export default function RichTextEditor({value, onChange, onBlur, isInvalid}: Props) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: value,
        // The page is server-rendered first, and TipTap builds different DOM on
        // the client - rendering immediately would cause a hydration mismatch.
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'w-full px-4 py-3 min-h-60 prose dark:prose-invert max-w-none',
            },
        },
        onUpdate: ({editor}) => onChange(editor.getHTML()),
        onBlur: () => onBlur?.(),
    });

    return (
        <div
            className={clsx(
                'overflow-hidden rounded-xl border bg-white transition-colors dark:bg-gray-950',
                isInvalid
                    ? 'border-danger'
                    : 'border-neutral-200 dark:border-gray-800',
            )}
        >
            {editor && <MenuBar editor={editor}/>}
            <EditorContent editor={editor}/>
        </div>
    );
}
