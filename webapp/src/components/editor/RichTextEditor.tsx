'use client';

import {useEffect} from 'react';
import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
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
        extensions: [
            StarterKit,
            // inline: false keeps images as their own block, which matches how
            // the sanitized markup renders on the question page.
            Image.configure({inline: false, allowBase64: false}),
        ],
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

    // useEditor only reads `content` when it first builds the editor, so a value
    // changed from outside - react-hook-form's reset() after a successful post -
    // would leave the old text visible while the form state says empty.
    useEffect(() => {
        if (!editor) return;

        // Comparing against the current HTML is what stops this from looping:
        // every keystroke updates `value` too, and re-setting it here would
        // rebuild the document and drop the cursor.
        if (value !== editor.getHTML()) {
            editor.commands.setContent(value, {emitUpdate: false});
        }
    }, [editor, value]);

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
