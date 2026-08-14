"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Report {
  id: string;
  contentType: "POST" | "COMMENT";
  reason: string;
  createdAt: string;
  reporter: { displayName: string };
  post: {
    id: string;
    title: string;
    body: string;
    isHidden: boolean;
    game: { slug: string; name: string };
  } | null;
  comment: {
    id: string;
    body: string;
    isHidden: boolean;
    post: { id: string; title: string };
  } | null;
}

/**
 * The moderation queue itself. Kept intentionally simple — a flat list
 * of pending reports, each with enough context to make a call without
 * leaving the page, and three actions: dismiss (report wasn't
 * actionable), resolve (noted, content stays up), or hide + resolve
 * (content comes down). There's no bulk actions or filtering yet; add
 * them if the queue grows large enough to need it.
 */
export function ReportQueue() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    const response = await fetch("/api/moderation/reports");
    if (response.ok) {
      const data = await response.json();
      setReports(data.reports);
    }
  }

  async function takeAction(reportId: string, status: "RESOLVED" | "DISMISSED", hideContent: boolean) {
    setPendingActionId(reportId);
    await fetch(`/api/moderation/reports/${reportId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, hideContent }),
    });
    setPendingActionId(null);
    // Simplest correct approach: refetch the queue rather than trying to
    // patch local state, since taking action always removes the item
    // from "pending" entirely.
    loadReports();
  }

  if (reports === null) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>;
  }

  if (reports.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Nothing pending — queue is clear.</p>;
  }

  return (
    <ul className="space-y-4">
      {reports.map((report) => {
        const content = report.contentType === "POST" ? report.post : report.comment;
        const isBusy = pendingActionId === report.id;

        return (
          <li key={report.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {report.contentType}
              </span>
              <span className="text-xs text-slate-400">
                Reported {new Date(report.createdAt).toLocaleString()}
              </span>
            </div>

            <p className="mt-2 text-sm">
              <span className="font-medium">Reason:</span> {report.reason}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reported by {report.reporter.displayName}
            </p>

            {content ? (
              <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800">
                {report.contentType === "POST" && report.post && (
                  <>
                    <Link
                      href={`/forum/posts/${report.post.id}`}
                      target="_blank"
                      className="font-medium text-brand-600 hover:underline dark:text-brand-500"
                    >
                      {report.post.title}
                    </Link>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{report.post.body}</p>
                  </>
                )}
                {report.contentType === "COMMENT" && report.comment && (
                  <>
                    <Link
                      href={`/forum/posts/${report.comment.post.id}`}
                      target="_blank"
                      className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-500"
                    >
                      On: {report.comment.post.title}
                    </Link>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{report.comment.body}</p>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm italic text-slate-400">
                Original content was deleted before this report was reviewed.
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => takeAction(report.id, "DISMISSED", false)}
                disabled={isBusy}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Dismiss
              </button>
              <button
                onClick={() => takeAction(report.id, "RESOLVED", false)}
                disabled={isBusy}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Resolve (leave up)
              </button>
              <button
                onClick={() => takeAction(report.id, "RESOLVED", true)}
                disabled={isBusy}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Hide content
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
