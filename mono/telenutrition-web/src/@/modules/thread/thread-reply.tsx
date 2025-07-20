import React, { useState, ReactNode, useEffect } from 'react';
import { Comment } from './types';
import { cn } from '@/utils';
import { PenBoxIcon, CornerUpLeft } from 'lucide-react';
import { Button } from '@/ui-components/button';
import EditableReply from './editable-reply';
import { useThreadContext } from './context';
import Icon from '@/ui-components/icons/Icon';

interface ThreadReplyProps {
  comment: Comment;
}

const Root = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-row space-x-1 w-full">{children}</div>;
};

interface ExpanderProps {
  isOpen: boolean;
  setIsOpen: (newState: boolean) => void;
}

const Expander = ({ isOpen, setIsOpen }: ExpanderProps) => {
  return (
    <div className="flex flex-col pt-3 items-center" style={{ height: 'inherit' }}>
      <div className="h-4 w-4">
        <Icon
          onClick={() => setIsOpen(!isOpen)}
          name="chevron-right"
          className={cn('rotate-0', isOpen && 'rotate-90')}
        />
      </div>
      {isOpen && <div className="w-px h-full border-l" />}
    </div>
  );
};

const Header = ({ comment }: { comment: Comment }) => {
  const context = useThreadContext();
  const { setReplyID, setUpdateID } = context;
  return (
    <div className="group flex flex-row justify-between items-center w-full">
      <div className="flex flex-row items-center gap-x-2">
        <p className="font-bold text-gray-900">{comment.author}</p>
        <div className="flex flex-row invisible gap-x-2 group-hover:visible">
          <Button
            size="sm"
            variant={'tertiary'}
            className="min-w-0"
            onClick={() => {
              setReplyID(comment.id);
              setUpdateID(null);
            }}
          >
            <CornerUpLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={'tertiary'}
            className="min-w-0"
            onClick={() => {
              setUpdateID(comment.id);
              setReplyID(null);
            }}
          >
            <PenBoxIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-400">{new Date(comment.timestamp).toLocaleString()}</p>
    </div>
  );
};

const Body = ({ comment }: { comment: Comment }) => {
  const context = useThreadContext();
  const { updateID, setUpdateID, setCommentByID } = context;
  const isUpdating = updateID === comment.id;
  return !isUpdating ? (
    <p className="text-gray-900">{comment.content}</p>
  ) : (
    <div className="mt-2">
      <EditableReply
        type="update"
        defaultValue={comment.content}
        onCancel={() => setUpdateID(null)}
        onSave={(content) => {
          setCommentByID(comment.id, content);
          setUpdateID(null);
        }}
      />
    </div>
  );
};

const Children = ({ comment }: { comment: Comment }) => {
  const context = useThreadContext();
  const { replyID, setReplyID, addComment } = context;

  const isNew = replyID === comment.id;

  return (
    <div className="ml-2">
      {comment.replies?.map((reply) => (
        <ThreadReply key={reply.id} comment={reply} />
      ))}
      {isNew && (
        <div className="mt-4">
          <EditableReply
            type="new"
            onCancel={() => setReplyID(null)}
            onSave={(content) => {
              addComment(comment.id, content);
              setReplyID(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

const ThreadReply = (props: ThreadReplyProps) => {
  const context = useThreadContext();
  const [isOpen, setIsOpen] = useState(false);
  const { replyID, updateID } = context;

  const { comment } = props;

  useEffect(() => {
    if (comment.id === replyID || comment.id === updateID) setIsOpen(true);
  }, [replyID, updateID]);

  return (
    <Root>
      <Expander isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="space-y-1 w-full">
        <div className="p-2 pb-0 w-full">
          <Header comment={comment} />
          {isOpen && <Body comment={comment} />}
        </div>
        {isOpen && !!comment.replies?.length && (
          <p className="px-2 text-sm text-gray-400">{comment.replies.length} replies</p>
        )}
        {isOpen && <Children comment={comment} />}
      </div>
    </Root>
  );
};

export default ThreadReply;
