import React from 'react';
import { Comment } from './types';

import ThreadReply from './thread-reply';
import { useThreadContext } from './context';
import NewComment from './new-comment';
import Section, { SectionDivider } from '@/ui-components/section';

const ThreadRenderer = () => {
  const { root, addComment } = useThreadContext();

  return (
    <div className="p-2 pb-4 space-y-2 rounded-lg border">
      <Section>
        {root?.replies?.map((comment: Comment) => (
          <ThreadReply key={comment.id} comment={comment} />
        ))}
      </Section>
      <SectionDivider />
      <Section>
        <NewComment onAdd={c => addComment("", c)} />
      </Section>
    </div>
  );
};

export default ThreadRenderer;
