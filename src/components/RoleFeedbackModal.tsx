import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, MessageSquare, Star, CheckCircle, ThumbsUp, ThumbsDown } from "lucide-react";

const feedbackFormSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().min(10, "Please provide at least 10 characters of feedback"),
});

type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

interface Permission {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  category: string;
}

interface RoleFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: {
    id: number;
    name: string;
    description: string | null;
    permissions: Permission[];
  } | null;
  templateId?: string;
  onSubmit: (data: {
    roleId: number;
    templateId?: string;
    rating: number;
    feedback: string;
    permissionsFeedback: Array<{
      permissionName: string;
      hasPermission: boolean;
      shouldHave: boolean;
      comment?: string;
    }>;
  }) => Promise<void>;
  isPending: boolean;
}

export function RoleFeedbackModal({
  isOpen,
  onClose,
  role,
  templateId,
  onSubmit,
  isPending,
}: RoleFeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [permissionFeedback, setPermissionFeedback] = useState<
    Record<string, { shouldHave: boolean; comment: string }>
  >({});
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
  });

  const handleClose = () => {
    setShowSuccess(false);
    setRating(0);
    setPermissionFeedback({});
    reset();
    onClose();
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
    setValue("rating", value, { shouldValidate: true });
  };

  const handlePermissionFeedback = (
    permissionName: string,
    shouldHave: boolean
  ) => {
    setPermissionFeedback((prev) => ({
      ...prev,
      [permissionName]: {
        shouldHave,
        comment: prev[permissionName]?.comment || "",
      },
    }));
  };

  const handlePermissionComment = (
    permissionName: string,
    comment: string
  ) => {
    setPermissionFeedback((prev) => ({
      ...prev,
      [permissionName]: {
        shouldHave: prev[permissionName]?.shouldHave ?? true,
        comment,
      },
    }));
  };

  const onFormSubmit = async (data: FeedbackFormData) => {
    if (!role) return;

    const permissionsFeedbackArray = Object.entries(permissionFeedback).map(
      ([permissionName, feedback]) => {
        const permission = role.permissions.find((p) => p.name === permissionName);
        return {
          permissionName,
          hasPermission: !!permission,
          shouldHave: feedback.shouldHave,
          comment: feedback.comment || undefined,
        };
      }
    );

    await onSubmit({
      roleId: role.id,
      templateId,
      rating: data.rating,
      feedback: data.feedback,
      permissionsFeedback: permissionsFeedbackArray,
    });

    setShowSuccess(true);
  };

  if (!role) return null;

  // Group permissions by category
  const groupedPermissions = role.permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl">
                {showSuccess ? (
                  // Success State
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 p-2 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        </div>
                        <Dialog.Title className="text-xl font-bold text-gray-100">
                          Feedback Submitted!
                        </Dialog.Title>
                      </div>
                      <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                        <CheckCircle className="h-8 w-8 text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Thank You for Your Feedback!
                      </h3>
                      <p className="text-gray-400 mb-6">
                        Your feedback helps us refine role templates to better match real
                        production workflows. Our team will review your input.
                      </p>
                      <button
                        onClick={handleClose}
                        className="bg-gradient-to-r from-cinematic-gold-500 to-cinematic-gold-600 text-gray-950 font-semibold py-3 px-6 rounded-lg hover:from-cinematic-gold-600 hover:to-cinematic-gold-700 transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  // Form State
                  <form onSubmit={handleSubmit(onFormSubmit)}>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-cinematic-blue-500/20 p-2 rounded-lg">
                            <MessageSquare className="h-6 w-6 text-cinematic-blue-400" />
                          </div>
                          <div>
                            <Dialog.Title className="text-xl font-bold text-gray-100">
                              Provide Role Feedback
                            </Dialog.Title>
                            <p className="text-sm text-gray-400 mt-1">
                              Help us improve the "{role.name}" role template
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleClose}
                          className="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Role Info */}
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                          <h4 className="text-base font-semibold text-gray-200 mb-1">
                            {role.name}
                          </h4>
                          {role.description && (
                            <p className="text-sm text-gray-400">{role.description}</p>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            {role.permissions.length} permission
                            {role.permissions.length !== 1 ? "s" : ""} assigned
                          </div>
                        </div>

                        {/* Rating */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            How well do the permissions match your job responsibilities?
                          </label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleRatingClick(value)}
                                onMouseEnter={() => setHoveredRating(value)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`h-8 w-8 ${
                                    value <= (hoveredRating || rating)
                                      ? "fill-cinematic-gold-400 text-cinematic-gold-400"
                                      : "text-gray-600"
                                  }`}
                                />
                              </button>
                            ))}
                            {rating > 0 && (
                              <span className="ml-2 text-sm text-gray-400">
                                {rating === 1 && "Poor match"}
                                {rating === 2 && "Fair match"}
                                {rating === 3 && "Good match"}
                                {rating === 4 && "Very good match"}
                                {rating === 5 && "Perfect match"}
                              </span>
                            )}
                          </div>
                          {errors.rating && (
                            <p className="mt-2 text-sm text-red-400">
                              Please select a rating
                            </p>
                          )}
                        </div>

                        {/* General Feedback */}
                        <div>
                          <label
                            htmlFor="feedback"
                            className="block text-sm font-medium text-gray-300 mb-2"
                          >
                            Detailed Feedback
                          </label>
                          <textarea
                            id="feedback"
                            {...register("feedback")}
                            rows={4}
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cinematic-blue-500 focus:border-transparent transition-all"
                            placeholder="Tell us what works well and what could be improved about this role's permissions..."
                          />
                          {errors.feedback && (
                            <p className="mt-2 text-sm text-red-400">
                              {errors.feedback.message}
                            </p>
                          )}
                        </div>

                        {/* Permission-specific Feedback */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            Permission Feedback (Optional)
                          </label>
                          <p className="text-xs text-gray-500 mb-4">
                            For each permission, indicate if you should or shouldn't have it
                            based on your actual job responsibilities.
                          </p>

                          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {Object.entries(groupedPermissions).map(
                              ([category, permissions]) => (
                                <div
                                  key={category}
                                  className="bg-gray-800/30 border border-gray-700 rounded-lg p-4"
                                >
                                  <h4 className="text-sm font-semibold text-gray-200 mb-3">
                                    {category}
                                  </h4>

                                  <div className="space-y-3">
                                    {permissions.map((permission) => (
                                      <div
                                        key={permission.id}
                                        className="bg-gray-800/50 rounded-lg p-3"
                                      >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-300">
                                              {permission.displayName}
                                            </div>
                                            {permission.description && (
                                              <div className="text-xs text-gray-500 mt-0.5">
                                                {permission.description}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-1">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handlePermissionFeedback(
                                                  permission.name,
                                                  true
                                                )
                                              }
                                              className={`p-1.5 rounded transition-colors ${
                                                permissionFeedback[permission.name]
                                                  ?.shouldHave === true
                                                  ? "bg-green-500/20 text-green-400"
                                                  : "text-gray-500 hover:text-green-400"
                                              }`}
                                              title="Should have this permission"
                                            >
                                              <ThumbsUp className="h-4 w-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handlePermissionFeedback(
                                                  permission.name,
                                                  false
                                                )
                                              }
                                              className={`p-1.5 rounded transition-colors ${
                                                permissionFeedback[permission.name]
                                                  ?.shouldHave === false
                                                  ? "bg-red-500/20 text-red-400"
                                                  : "text-gray-500 hover:text-red-400"
                                              }`}
                                              title="Should not have this permission"
                                            >
                                              <ThumbsDown className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>

                                        {permissionFeedback[permission.name] && (
                                          <input
                                            type="text"
                                            value={
                                              permissionFeedback[permission.name]
                                                ?.comment || ""
                                            }
                                            onChange={(e) =>
                                              handlePermissionComment(
                                                permission.name,
                                                e.target.value
                                              )
                                            }
                                            placeholder="Add a comment (optional)"
                                            className="w-full mt-2 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cinematic-blue-500"
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-800 p-6 flex gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-medium hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 bg-gradient-to-r from-cinematic-blue-500 to-cinematic-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-cinematic-blue-600 hover:to-cinematic-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-5 w-5" />
                            Submit Feedback
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
