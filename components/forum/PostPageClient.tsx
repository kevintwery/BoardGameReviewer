"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { VoteButtons } from "@/components/forum/VoteButtons";
import { CategoryBadge } from "@/components/forum/CategoryBadge";
import { CommentSection } from "@/components/forum/CommentSection";
import { ReportButton } from "@/components/forum/ReportButton";
import { AuthorName } from "@/components/ui/AuthorName";

interface PostPageClientProps {
  postId: string;
}

export function PostPageClient({ postId }: PostPageClientProps) {
  const { userId } = useAuth();
  const [post, setPost] = useState<any | null>(null);

  const loadPost = useCallback(async () => {
    const response = await fetch(`/api/forum/${postId}`);
    if (response.ok) {
      const data = await response.json();
      setPost(data.post);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  if (post === null) {
    return <main className="mx-auto max-w-3xl px-4 py-6 text-sm text-slate-500">Loading…</main>;
  }

  const netVotes = post.voteScore;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href={`/games/${post.game.slug}/forum`}
        className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-500"
      >
        ← Back to {post.game.name} forum
      </Link>

      <div className="mt-3 flex gap-4">
        <VoteButtons postId={post.id} initialNetVotes={netVotes} />

        <div>
          <CategoryBadge category={post.category} />
          <h1 className="mt-1 text-xl font-bold">{post.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            <AuthorName name={post.user.displayName} />
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
            {post.body}
          </p>
          <div className="mt-2">
            <ReportButton contentType="POST" contentId={post.id} />
          </div>
        </div>
      </div>

      <CommentSection
        postId={post.id}
        comments={post.comments}
        category={post.category}
        isPostAuthor={post.userId === userId}
        acceptedCommentId={post.acceptedCommentId}
        onCommentsChanged={loadPost}
      />
    </main>
  );
}
