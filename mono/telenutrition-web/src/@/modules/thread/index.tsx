import React, { useMemo, useState } from 'react';
import { Comment } from './types';

import { ThreadProvider } from './context';
import ThreadRenderer from './thread-renderer';

import { v4 as uuidv4 } from 'uuid';
import type { UseThreadReturn } from './types';

export const useThread = (data: Comment[]): UseThreadReturn => {
  const [comments, setComments] = useState<Comment[]>(() => data);
  const [updateID, setUpdateID] = useState<string | null>(null);
  const [replyID, setReplyID] = useState<string | null>(null);
  const setCommentByID = (id: string, content: string) => {
    setComments((_comments) =>
      _comments.map((comment) => {
        if (comment.id === id)
          return {
            ...comment,
            content,
          };
        return comment;
      }),
    );
  };
  const addComment = (parent: string, content: string) => {
    setComments([
      ...comments,
      {
        id: uuidv4(), // The new ID for a new reply should be replaced later.
        content,
        author: 'Current User', // Ther Username should be replaced later.
        parent,
        timestamp: new Date().toString(),
        replies: [],
      },
    ]);
  };
  const root = useMemo(() => {
    const graph: {
      [key: string]: Comment[];
    } = {};

    // Compose a graph
    for (const comment of comments) {
      if (!graph[comment.parent]) graph[comment.parent] = [];
      graph[comment.parent].push({ ...comment });
    }

    // Initialize a root
    const root: Comment = {
      id: '',
      author: '',
      content: '',
      timestamp: '',
      parent: '',
      replies: [],
    };

    // Construct the hierachy using BFS
    const queue: Comment[] = [root];
    while (queue.length) {
      const top = queue.pop();
      if (!top) break;
      if (!graph[top.id]) continue;
      for (let ind = 0; ind < graph[top.id].length; ind++) {
        const child = graph[top.id][ind];
        if (!top.replies) top.replies = [];
        top.replies.push(child);
        queue.push(child);
      }
    }
    return root;
  }, [comments]);
  return {
    root,
    updateID,
    replyID,
    setUpdateID,
    setReplyID,
    setCommentByID,
    addComment,
  };
};

type ThreadProp = {
  comments: Comment[];
};

const Thread = (props: ThreadProp) => {
  const threadContext = useThread(props.comments)
  return (
    <ThreadProvider {...threadContext}>
      <ThreadRenderer />
    </ThreadProvider>
  );
};

export default Thread;
