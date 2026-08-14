import Link from "next/link";
import { VoteButtons } from "@/components/forum/VoteButtons";
import { CategoryBadge } from "@/components/forum/CategoryBadge";
import { ReportButton } from "@/components/forum/ReportButton";
import { AuthorName } from "@/components/ui/AuthorName";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    category: "RULE_CLARIFICATION" | "HOUSE_RULES" | "STRATEGY";
    createdAt: string;
    voteScore: number;
    user: { displayName: string };
    _count: { comments: number };
    acceptedComment: { id: string } | null;
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="flex gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <VoteButtons postId={post.id} initialNetVotes={post.voteScore} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={post.category} />
          {post.acceptedComment && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              ✓ Answered
            </span>
          )}
        </div>

        <Link href={`/forum/posts/${post.id}`} className="mt-1 block font-medium hover:underline">
          {post.title}
        </Link>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          <AuthorName name={post.user.displayName} /> · {post._count.comments}{" "}
          {post._count.comments === 1 ? "reply" : "replies"}
        </p>

        <div className="mt-1">
          <ReportButton contentType="POST" contentId={post.id} />
        </div>
      </div>
    </div>
  );
}
