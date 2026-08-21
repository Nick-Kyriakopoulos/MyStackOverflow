'use client';

import type {Editor} from '@tiptap/core';
import {useEditorState} from '@tiptap/react';
import clsx from 'clsx';

type Props = {
    // Non-nullable on purpose: the parent only mounts this once the editor
    // exists. Accepting null here means useEditorState subscribes to nothing on
    // the first render, and with reactCompiler enabled that empty result gets
    // memoized - the toolbar then never appears.
    editor: Editor;
}

export default function MenuBar({editor}: Props) {
    // TipTap mutates the editor instance rather than replacing it, so React has
    // no reason to re-render on its own - useEditorState subscribes to the
    // transactions that change which marks are active.
    const state = useEditorState({
        editor,
        selector: ({editor}) => ({
            isBold: editor.isActive('bold'),
            isItalic: editor.isActive('italic'),
            isStrike: editor.isActive('strike'),
            isCode: editor.isActive('code'),
            isH2: editor.isActive('heading', {level: 2}),
            isH3: editor.isActive('heading', {level: 3}),
            isBulletList: editor.isActive('bulletList'),
            isOrderedList: editor.isActive('orderedList'),
            isBlockquote: editor.isActive('blockquote'),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
        }),
    });

    const buttons = [
        {label: 'B', title: 'Bold', isActive: state.isBold, className: 'font-bold',
            onPress: () => editor.chain().focus().toggleBold().run()},
        {label: 'I', title: 'Italic', isActive: state.isItalic, className: 'italic',
            onPress: () => editor.chain().focus().toggleItalic().run()},
        {label: 'S', title: 'Strikethrough', isActive: state.isStrike, className: 'line-through',
            onPress: () => editor.chain().focus().toggleStrike().run()},
        {label: '</>', title: 'Inline code', isActive: state.isCode, className: 'font-mono text-xs',
            onPress: () => editor.chain().focus().toggleCode().run()},
        {label: 'H2', title: 'Heading 2', isActive: state.isH2, className: 'font-semibold',
            onPress: () => editor.chain().focus().toggleHeading({level: 2}).run()},
        {label: 'H3', title: 'Heading 3', isActive: state.isH3, className: 'font-semibold',
            onPress: () => editor.chain().focus().toggleHeading({level: 3}).run()},
        {label: '• List', title: 'Bullet list', isActive: state.isBulletList,
            onPress: () => editor.chain().focus().toggleBulletList().run()},
        {label: '1. List', title: 'Numbered list', isActive: state.isOrderedList,
            onPress: () => editor.chain().focus().toggleOrderedList().run()},
        {label: '❝', title: 'Blockquote', isActive: state.isBlockquote,
            onPress: () => editor.chain().focus().toggleBlockquote().run()},
        {label: '↶', title: 'Undo', isDisabled: !state.canUndo,
            onPress: () => editor.chain().focus().undo().run()},
        {label: '↷', title: 'Redo', isDisabled: !state.canRedo,
            onPress: () => editor.chain().focus().redo().run()},
    ];

    return (
        <div className={'flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-stone-50 px-2 py-2 dark:border-gray-800 dark:bg-gray-900'}>
            {buttons.map(button => (
                <button
                    key={button.title}
                    // Buttons inside a form default to type="submit" - without
                    // this, clicking Bold would submit the question.
                    type={'button'}
                    title={button.title}
                    disabled={button.isDisabled}
                    onClick={button.onPress}
                    className={clsx(
                        'min-w-8 rounded-md px-2 py-1 text-sm transition-colors',
                        button.className,
                        button.isDisabled && 'cursor-not-allowed opacity-40',
                        button.isActive
                            ? 'bg-green-900 text-white dark:bg-purple-700'
                            : 'text-neutral-700 hover:bg-stone-200 dark:text-gray-300 dark:hover:bg-gray-800',
                    )}
                >
                    {button.label}
                </button>
            ))}
        </div>
    );
}
