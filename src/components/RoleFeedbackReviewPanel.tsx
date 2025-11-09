import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import {
  MessageSquare,
  Star,
  CheckCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  Filter,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { getUserFriendlyError, formatErrorMessage } from "~/utils/errorMessages";

interface FeedbackItemProps {
  feedback: any;
  onResolve: (feedbackId: number, isResolved: boolean) => void;
  onAddNote: (feedbackId: number, note: string) => void;
  isPending: boolean;
}

function FeedbackItem({
  feedback,
  onResolve,
  onAddNote,
  isPending,
}: FeedbackItemProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState(feedback.adminNotes || "");
  const [expandedPermissions, setExpandedPermissions] = useState(false);

  const handleSaveNote = () => {
    onAddNote(feedback.id, noteText);
    setShowNoteInput(false);
  };

  const permissionsFeedback = feedback.permissionsFeedback || [];
  const needsAttention = permissionsFeedback.filter(
    (pf: any) => pf.hasPermission !== pf.shouldHave
  );

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="text-base font-semibold text-white">
              {feedback.user.name}
            </h4>
            <span className="px-2 py-0.5 text-xs bg-cinematic-blue-500/20 text-cinematic-blue-400 rounded">
              {feedback.roleName}
            </span>
            {feedback.isResolved ? (
              <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Resolved
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">{feedback.user.email}</div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`h-4 w-4 ${
                value <= feedback.rating
                  ? "fill-cinematic-gold-400 text-cinematic-gold-400"
                  : "text-gray-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Feedback Text */}
      <div className="mb-3">
        <p className="text-sm text-gray-300">{feedback.feedback}</p>
      </div>

      {/* Permission Feedback Summary */}
      {needsAttention.length > 0 && (
        <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
              <AlertCircle className="h-4 w-4" />
              {needsAttention.length} permission
              {needsAttention.length !== 1 ? "s" : ""} need attention
            </div>
            <button
              onClick={() => setExpandedPermissions(!expandedPermissions)}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              {expandedPermissions ? "Hide" : "Show"} details
            </button>
          </div>

          {expandedPermissions && (
            <div className="space-y-2 mt-3">
              {needsAttention.map((pf: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-xs bg-gray-800/50 rounded p-2"
                >
                  {pf.shouldHave ? (
                    <ThumbsUp className="h-3 w-3 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ThumbsDown className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="text-gray-300 font-medium">
                      {pf.permissionName}
                    </div>
                    <div className="text-gray-500">
                      {pf.hasPermission
                        ? "Currently has, but shouldn't"
                        : "Currently missing, but should have"}
                    </div>
                    {pf.comment && (
                      <div className="text-gray-400 mt-1 italic">
                        "{pf.comment}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Notes */}
      {(feedback.adminNotes || showNoteInput) && (
        <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-xs font-medium text-blue-400 mb-2">
            Admin Notes
          </div>
          {showNoteInput ? (
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add notes about how this feedback will be addressed..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNote}
                  disabled={isPending}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  Save Note
                </button>
                <button
                  onClick={() => setShowNoteInput(false)}
                  className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-300">{feedback.adminNotes}</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          Submitted{" "}
          {new Date(feedback.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div className="flex gap-2">
          {!showNoteInput && (
            <button
              onClick={() => setShowNoteInput(true)}
              className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              {feedback.adminNotes ? "Edit Note" : "Add Note"}
            </button>
          )}
          <button
            onClick={() => onResolve(feedback.id, !feedback.isResolved)}
            disabled={isPending}
            className={`px-3 py-1 text-xs rounded transition-colors disabled:opacity-50 ${
              feedback.isResolved
                ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
            }`}
          >
            {feedback.isResolved ? "Reopen" : "Mark Resolved"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoleFeedbackReviewPanel() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const [includeResolved, setIncludeResolved] = useState(false);

  const feedbackQuery = useQuery(
    trpc.getRoleTemplateFeedback.queryOptions({
      token: token || "",
      includeResolved,
    })
  );

  const updateMutation = useMutation(
    trpc.updateRoleTemplateFeedback.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.getRoleTemplateFeedback.queryKey(),
        });
        toast.success("Feedback updated successfully");
      },
      onError: (error) => {
        const errorInfo = getUserFriendlyError(error);
        toast.error(formatErrorMessage(errorInfo), { duration: 6000 });
      },
    })
  );

  const handleResolve = (feedbackId: number, isResolved: boolean) => {
    updateMutation.mutate({
      token: token || "",
      feedbackId,
      isResolved,
    });
  };

  const handleAddNote = (feedbackId: number, note: string) => {
    updateMutation.mutate({
      token: token || "",
      feedbackId,
      adminNotes: note,
    });
  };

  if (feedbackQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (feedbackQuery.error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-400 mb-1">
              Error Loading Feedback
            </h3>
            <p className="text-sm text-red-300">
              {getUserFriendlyError(feedbackQuery.error).message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { feedback, stats } = feedbackQuery.data || {
    feedback: [],
    stats: {
      total: 0,
      unresolved: 0,
      averageRating: 0,
      byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-cinematic-blue-500/20 p-2 rounded-lg">
              <MessageSquare className="h-5 w-5 text-cinematic-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Feedback</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.unresolved}
              </div>
              <div className="text-sm text-gray-400">Pending Review</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-cinematic-gold-500/20 p-2 rounded-lg">
              <Star className="h-5 w-5 text-cinematic-gold-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">Average Rating</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.total - stats.unresolved}
              </div>
              <div className="text-sm text-gray-400">Resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      {stats.total > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-200 mb-3">
            Rating Distribution
          </h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.byRating[rating as keyof typeof stats.byRating];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm text-gray-400">{rating}</span>
                    <Star className="h-3 w-3 fill-cinematic-gold-400 text-cinematic-gold-400" />
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cinematic-gold-400 h-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Feedback Items</h3>
        <button
          onClick={() => setIncludeResolved(!includeResolved)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700 transition-colors"
        >
          <Filter className="h-4 w-4" />
          {includeResolved ? "Hide Resolved" : "Show Resolved"}
        </button>
      </div>

      {/* Feedback List */}
      {feedback.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-2xl mb-4">
            <MessageSquare className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            No Feedback Yet
          </h3>
          <p className="text-gray-500">
            {includeResolved
              ? "No feedback has been submitted"
              : "All feedback has been resolved"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item: any) => (
            <FeedbackItem
              key={item.id}
              feedback={item}
              onResolve={handleResolve}
              onAddNote={handleAddNote}
              isPending={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
