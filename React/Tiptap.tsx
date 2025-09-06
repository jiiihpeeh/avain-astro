

import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
//import { EditorContent, useEditor, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React from 'react'

// Define the types for MenuBar props
interface MenuBarProps {
  editor: Editor | null
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex space-x-4 p-4 bg-gray-800 text-white">
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        H3
      </button>
      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`p-2 rounded ${editor.isActive('paragraph') ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        Kappale
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded ${editor.isActive('bold') ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        Lihavoi
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded ${editor.isActive('italic') ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        Kursivoi
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded ${editor.isActive('strike') ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        Läpi
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-2 rounded ${editor.isActive('highlight') ? 'bg-yellow-500' : 'bg-gray-700'}`}
      >
        Alleviivaa
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        Vasen
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        Keskelle
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        Oikea
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`p-2 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-500' : 'bg-gray-700'}`}
      >
        Tasaus
      </button>
    </div>
  )
}

const Tiptap: React.FC = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
    ],
    content: `

    `,
  })

  return (
    <div className="p-8 ml-60">
      <MenuBar editor={editor} />
      <div className="editor-container p-4 bg-white border border-gray-200 rounded-md shadow-md mt-4 text-left">
        <EditorContent editor={editor} />
      </div>
    </div>
  )

}

export default Tiptap
