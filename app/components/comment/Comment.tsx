import React, { useEffect, useState } from "react";
import { comment, users } from "@prisma/client";
import { Avatar } from "../cards/ProfileCard";
import { Form, useFetcher } from "react-router";
import {
  ArrowBendUpLeft,
  Check,
  PaperPlane,
  PencilSimple,
  TrashSimple,
} from "@phosphor-icons/react";

/** Extended comment type including user and nested replies */
interface CommentType extends Omit<comment, "user" | "replies"> {
  user: users & {
    signedProfilePictureUrl?: string | null;
  };
  replies: CommentType[];
}

/** Props for the Comment component */
interface CommentProps {
  comment: CommentType;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  currentUserId: string;
  depth?: number;
  isCommentPending?: (id: string) => boolean;
}

/** Props for the CommentList component */
interface CommentListProps {
  comments: CommentType[];
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  currentUserId: string;
  isCommentPending: (id: string) => boolean;
}

/** Props for the NewCommentForm component */
interface NewCommentFormProps {
  onSubmit: (content: string) => void;
}

/** Props for the CommentSection component */
interface CommentSectionProps {
  taskId: string;
  currentUser: users;
}

/**
 * Individual comment component that supports editing, replying, and deletion
 * Handles nested replies up to MAX_DEPTH levels
 */
export default function Comment({
  comment,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
  depth = 0,
  isCommentPending,
}: CommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState("");
  const MAX_DEPTH = 3;

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(comment.id, editContent);
    setIsEditing(false);
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    onReply(comment.id, replyContent);
    setReplyContent("");
    setIsReplying(false);
  };

  const timeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000,
    );

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div
      className={`flex flex-col gap-4 ${
        depth > 0
          ? "ml-8 border-l-2 border-baseSecondary/20 pl-4 transition-all duration-200 hover:border-baseSecondary/40"
          : ""
      }`}
    >
      <div className="flex gap-4 group">
        {/* Avatar container */}
        <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
          <div className="w-10 h-10 rounded-full bg-baseSecondary/10 text-basePrimary flex items-center justify-center overflow-hidden ring-2 ring-baseSecondary/20 group-hover:ring-baseSecondary/40 transition-all duration-200">
            <Avatar
              src={comment.user.signedProfilePictureUrl || undefined}
              name={comment.user.name}
            />
          </div>
        </div>

        {/* Comment content container */}
        <div className="flex-grow space-y-3">
          <div className="bg-basePrimaryLight rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
            {/* Comment Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-baseSecondary hover:text-baseSecondary/90 transition-colors duration-200">
                  {comment.user.name}
                </span>
                <span className="text-sm text-baseSecondary/60 font-light">
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              {currentUserId === comment.user.id && (
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-sm text-baseSecondary/60 hover:text-baseSecondary transition-colors duration-200 flex items-center gap-1"
                  >
                    <PencilSimple className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-sm text-dangerPrimary hover:text-dangerPrimary/80 transition-colors duration-200 flex items-center gap-1"
                  >
                    <TrashSimple className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Comment Body */}
            {isEditing ? (
              <form onSubmit={handleSubmitEdit} className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 rounded-lg bg-basePrimary text-baseSecondary border border-baseSecondary/20 focus:border-baseSecondary focus:ring-2 focus:ring-baseSecondary/20 transition-all duration-200 resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-baseSecondary text-basePrimary rounded-lg hover:bg-baseSecondary/90 transition-colors duration-200 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    className="px-4 py-2 bg-dangerPrimary/20 text-dangerPrimary rounded-lg hover:bg-dangerPrimary/30 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-baseSecondary whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </p>
            )}
          </div>

          {/* Reply section */}
          {depth < MAX_DEPTH && (
            <div className="mt-2">
              {!isReplying ? (
                <button
                  onClick={() => setIsReplying(true)}
                  className="text-sm text-baseSecondary/60 hover:text-baseSecondary transition-colors duration-200 flex items-center gap-1"
                >
                  <ArrowBendUpLeft className="w-4 h-4" />
                  Reply
                </button>
              ) : (
                <form onSubmit={handleSubmitReply} className="space-y-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full p-3 rounded-lg bg-basePrimary text-baseSecondary border border-baseSecondary/20 focus:border-baseSecondary focus:ring-2 focus:ring-baseSecondary/20 transition-all duration-200 resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!replyContent.trim()}
                      className="px-4 py-2 bg-baseSecondary text-basePrimary rounded-lg hover:bg-baseSecondary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ArrowBendUpLeft className="w-4 h-4" />
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsReplying(false);
                        setReplyContent("");
                      }}
                      className="px-4 py-2 bg-dangerPrimary/20 text-dangerPrimary rounded-lg hover:bg-dangerPrimary/30 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies with smooth height transition */}
      <div className="space-y-4 transition-all duration-300">
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                currentUserId={currentUserId}
                depth={depth + 1}
                isCommentPending={isCommentPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Displays a list of comments with proper spacing and hierarchy
 */
const CommentList = ({
  comments,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
  isCommentPending,
}: CommentListProps) => {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          currentUserId={currentUserId}
          isCommentPending={isCommentPending}
        />
      ))}
    </div>
  );
};

/**
 * Form component for creating new top-level comments
 */
const NewCommentForm: React.FC<NewCommentFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent("");
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-4 rounded-xl bg-basePrimary text-baseSecondary border border-baseSecondary/20 focus:border-baseSecondary focus:ring-2 focus:ring-baseSecondary/20 transition-all duration-200 resize-none"
          rows={3}
        />
        <div className="absolute bottom-3 right-3">
          <button
            type="submit"
            disabled={!content.trim()}
            className="px-6 py-2 bg-baseSecondary text-basePrimary rounded-lg hover:bg-baseSecondary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <PaperPlane className="w-4 h-4" />
            Post Comment
          </button>
        </div>
      </div>
    </Form>
  );
};

/**
 * Loading indicator for comments
 */
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-6">
    <div className="relative">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-baseSecondary"></div>
      <div className="absolute top-0 left-0 h-8 w-8 border-2 border-baseSecondary/20 rounded-full"></div>
    </div>
  </div>
);

/**
 * Main comment section component that manages comment state and interactions
 * Handles optimistic updates and real-time comment synchronization
 */

export const CommentSection = ({
  taskId,
  currentUser,
}: CommentSectionProps) => {
  const fetchComments = useFetcher();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [optimisticComments, setOptimisticComments] = useState<Set<string>>(
    new Set(),
  );

  // Load initial comments when component mounts or taskId changes
  useEffect(() => {
    const loadComments = () => {
      fetchComments.load(`/api/comments/${taskId}`);
    };
    loadComments();
  }, [taskId]);

  // Handle updates from the fetcher
  useEffect(() => {
    if (fetchComments.data?.success) {
      // Remove optimistic IDs that were replaced with real comments
      if (fetchComments.data.comment) {
        setOptimisticComments((prev) => {
          const newSet = new Set(prev);
          newSet.delete(`temp-${fetchComments.data.comment.id}`);
          return newSet;
        });
      }

      if (fetchComments.data.comments) {
        setComments(fetchComments.data.comments);
        setIsInitialLoading(false);
      }
    }
  }, [fetchComments.data]);

  /**
   * Creates a new top-level comment with optimistic update
   * @param content - The content of the new comment
   */
  const handleNewComment = (content: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticComment: CommentType = {
      id: tempId,
      content,
      taskId,
      userId: currentUser.id,
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: currentUser.id,
        name: currentUser.name,
        profilePicture: currentUser.profilePicture,
        signedProfilePictureUrl: currentUser.profilePicture,
        email: currentUser.email, // Required by users type
      },
      replies: [],
    };

    // Track optimistic comment
    setOptimisticComments((prev) => new Set(prev).add(tempId));

    // Add optimistic comment to state
    setComments((prevComments) => [optimisticComment, ...prevComments]);

    // Submit the actual comment
    fetchComments.submit(
      {
        _action: "createComment",
        newCommentData: JSON.stringify({
          content,
          taskId,
          userId: currentUser.id,
          parentId: null,
        }),
      },
      { method: "post", action: `/api/comments/${taskId}` },
    );
  };

  /**
   * Updates an existing comment with optimistic update
   * @param commentId - ID of the comment to edit
   * @param content - New content for the comment
   */
  const handleEdit = (commentId: string, content: string) => {
    // Don't allow editing of optimistic comments
    if (optimisticComments.has(commentId)) return;

    const editData = {
      commentId,
      content,
    };

    // Optimistic update
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, content };
        }
        return {
          ...comment,
          replies: comment.replies?.map((reply) =>
            reply.id === commentId ? { ...reply, content } : reply,
          ),
        };
      }),
    );

    fetchComments.submit(
      {
        _action: "editComment",
        editData: JSON.stringify(editData),
      },
      {
        method: "post",
        action: `/api/comments/${taskId}`,
      },
    );
  };

  /**
   * Creates a new reply to an existing comment with optimistic update
   * @param parentId - ID of the parent comment
   * @param content - Content of the reply
   */
  const handleReply = (parentId: string, content: string) => {
    // Don't allow replies to optimistic comments
    if (optimisticComments.has(parentId)) return;

    const tempId = `temp-reply-${Date.now()}`;
    const optimisticReply: CommentType = {
      id: tempId,
      content,
      taskId,
      userId: currentUser.id,
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: currentUser.id,
        name: currentUser.name,
        profilePicture: currentUser.profilePicture,
        signedProfilePictureUrl: currentUser.profilePicture,
        email: currentUser.email, // Required by users type
      },
      replies: [],
    };

    // Track optimistic reply
    setOptimisticComments((prev) => new Set(prev).add(tempId));

    // Add optimistic reply to state
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), optimisticReply],
          };
        }
        return comment;
      }),
    );

    fetchComments.submit(
      {
        _action: "createReply",
        replyData: JSON.stringify({
          content,
          taskId,
          userId: currentUser.id,
          parentId,
        }),
      },
      {
        method: "post",
        action: `/api/comments/${taskId}`,
      },
    );
  };

  const handleDelete = (commentId: string) => {
    // Don't allow deleting optimistic comments
    if (optimisticComments.has(commentId)) return;

    // Optimistic deletion by recursively removing the comment and its replies
    setComments((prevComments) => {
      const removeComment = (comments: CommentType[]): CommentType[] => {
        return comments.filter((comment) => {
          if (comment.id === commentId) {
            return false;
          }
          // Recursively filter replies
          if (comment.replies?.length) {
            comment.replies = removeComment(comment.replies);
          }
          return true;
        });
      };

      return removeComment(prevComments);
    });

    // Track the deletion in optimistic updates
    setOptimisticComments((prev) => new Set(prev).add(commentId));

    // Submit the actual deletion
    fetchComments.submit(
      {
        _action: "deleteComment",
        commentId,
      },
      {
        method: "post",
        action: `/api/comments/${taskId}`,
      },
    );
  };
  /**
   * Checks if a comment is in pending state
   * @param id - ID of the comment to check
   * @returns boolean indicating if the comment is pending
   */
  const isCommentPending = (id: string): boolean => {
    return optimisticComments.has(id) && fetchComments.state === "submitting";
  };

  return (
    <div className="space-y-8">
      <h2
        id="comments-heading"
        className="text-lg ml-2 font-semibold tracking-wide text-baseSecondary"
      >
        Comments
      </h2>

      <NewCommentForm onSubmit={handleNewComment} />

      {isInitialLoading ? (
        <LoadingSpinner />
      ) : comments.length > 0 ? (
        <CommentList
          comments={comments}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentUserId={currentUser.id}
          isCommentPending={isCommentPending}
        />
      ) : (
        <p className="text-baseSecondary text-center py-4">No comments yet.</p>
      )}
    </div>
  );
};
