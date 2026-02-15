'use client';

import React, { useEffect } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

interface BlockNoteRendererProps {
    content: any;
}

const BlockNoteRenderer: React.FC<BlockNoteRendererProps> = ({ content }) => {
    const editor = useCreateBlockNote({
        initialContent: undefined,
    });

    useEffect(() => {
        if (content) {
            const blocks = typeof content === 'string' ? JSON.parse(content) : content;
            editor.replaceBlocks(editor.document, blocks);
        }
    }, [content]);

    return <BlockNoteView editor={editor} editable={false} theme="light" />;
};

export default BlockNoteRenderer;
