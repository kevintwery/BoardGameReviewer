"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import { ReportButton } from "@/components/forum/ReportButton";
import { AuthorName } from "@/components/ui/AuthorName";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: { displayName: string };
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  category: "RULE_CLARIFICATION" | "HOUSE_RULES" | "STRATEGY";
  isPostAuthor: boolean;
  acceptedCommentId: string | null;
  onCommentsChanged: () => void;
}

/**
 * Renders replies to a post, plus a reply box for signed-in users. The
 * "mark as accepted" control only appears for RULE_CLARIFICATION posts,
 * and only to the post's original author — see the comment on the
 * /api/forum/[postId]/accept route for why that's enforced server-side too.
 */
export function CommentSection({
  postId,
  comments,
  category,
  isPostAuthor,
  acceptedCommentId,
  onCommentsChanged,
}: CommentSectionProps) {
  const { isSignedIn } = useAuth();
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    await fetch(`/api/forum/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyText }),
    });
    setIsSubmitting(false);
    setReplyText("");
    onCommentsChanged();
  }

  async function markAsAccepted(commentId: string) {
    const isCurrentlyAccepted = acceptedCommentId === commentId;
    await fetch(`/api/forum/${postId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: isCurrentlyAccepted ? null : commentId }),
    });
    onCommentsChanged();
  }

  const canMarkAccepted = isPostAuthor && category === "RULE_CLARIFICATION";

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">
        {comments.length} {comments.length === 1 ? "Reply" : "Replies"}
      </h2>

      <ul className="mt-3 space-y-3">
        {comments.map((comment) => {
          const isAccepted = comment.id === acceptedCommentId;
          return (
            <li
              key={comment.id}
              className={
                isAccepted
                  ? "rounded-lg border-2 border-green-400 p-3 dark:border-green-600"
                  : "rounded-lg border border-slate-200 p-3 dark:border-slate-700"
              }
            >
              {isAccepted && (
                <p className="mb-1 text-xs font-medium text-green-700 dark:text-green-400">
                  ✓ Accepted answer
                </p>
              )}
              <p className="text-sm">{comment.body}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                <AuthorName name={comment.user.displayName} />
              </p>

              {canMarkAccepted && (
                <button
                  onClick={() => markAsAccepted(comment.id)}
                  className="mt-2 text-xs font-medium text-brand-600 hover:underline dark:text-brand-500"
                >
                  {isAccepted ? "Unmark as accepted" : "Mark as accepted answer"}
                </button>
              )}

              <div className="mt-2">
                <ReportButton contentType="COMMENT" contentId={comment.id} />
              </div>
            </li>
          );
        })}
      </ul>

      <SignedIn>
        <form onSubmit={submitReply} className="mt-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            placeholder="Write a reply…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {isSubmitting ? "Posting…" : "Reply"}
          </button>
        </form>
      </SignedIn>
      <SignedOut>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          <SignInButton>
            <button className="font-medium text-brand-600 hover:underline dark:text-brand-500">
              Sign in
            </button>
          </SignInButton>{" "}
          to reply.
        </p>
      </SignedOut>
    </section>
  );
}
