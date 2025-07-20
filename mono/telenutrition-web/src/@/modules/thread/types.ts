export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  parent: string;
  replies?: Comment[];
}

export interface UseThreadReturn {
  root: Comment;
  updateID: string | null;
  replyID: string | null;
  setUpdateID: (id: string | null) => void;
  setReplyID: (id: string | null) => void;
  setCommentByID: (id: string, content: string) => void;
  addComment: (parent: string, content: string) => void;
}
