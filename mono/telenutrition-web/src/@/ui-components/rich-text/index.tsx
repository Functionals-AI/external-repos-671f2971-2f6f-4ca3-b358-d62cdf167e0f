'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import IconButton from '../button/icon';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

interface RichTextEditorProps {
  onChange: (html: string) => void;
  value: string;
}

const RichTextEditor = ({ onChange, value }: RichTextEditorProps) => {
  const editor = useEditor({
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      Underline,
      ListItem,
      BulletList.configure({
        keepMarks: true,
        keepAttributes: true,
      }),
      Document,
      Paragraph,
      Text,
    ],
    content: value ?? '',
  });

  const activeClasses =
    'bg-status-green-100 focus:bg-status-green-100 hover:bg-status-green-100 active:bg-status-green-100';

  if (!editor) return null;

  return (
    <div className="border border-neutral-150 rounded-md bg-white">
      <style>
        {`
          .tiptop-editor ul {
            list-style-type: disc;
            margin-left: 1rem;
          }
        `}
      </style>
      <div className="flex gap-x-2 p-2 border-b border-neutral-150">
        {/* TODO: doesn't work bullets */}
        <IconButton
          size="sm"
          variant={'tertiary'}
          iconName="star"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? activeClasses : ''}
        />
        <IconButton
          size="sm"
          variant="tertiary"
          iconName="bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? activeClasses : ''}
        />
        <IconButton
          size="sm"
          variant="tertiary"
          iconName="underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? activeClasses : ''}
        />
        <IconButton
          size="sm"
          variant="tertiary"
          iconName="italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? activeClasses : ''}
        />
      </div>
      <EditorContent
        placeholder="Type here..."
        editor={editor}
        style={{ minHeight: '10rem', outline: 'none', padding: '1rem' }}
        className="[&>div]:outline-none tiptop-editor"
      />
    </div>
  );
};

export default RichTextEditor;
