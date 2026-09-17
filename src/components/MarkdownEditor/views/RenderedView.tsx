import { EditorContent, type Editor } from "@tiptap/react";

export interface RenderedViewProps {
  editor: Editor | null;
}

export function RenderedView({ editor }: RenderedViewProps) {
  return <EditorContent editor={editor} />;
}
