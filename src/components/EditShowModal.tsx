import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Film, Calendar, FileText, Building2 } from "lucide-react";
import { ProductionHouseCombobox } from "~/components/ProductionHouseCombobox";

interface EditShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: {
    id: number;
    title: string;
    productionHouseId?: number | null;
    description?: string | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    status: string;
  } | null;
  productionHouses: Array<{
    id: number;
    name: string;
  }>;
  onUpdate: (showId: number, data: ShowFormData) => Promise<void>;
  isPending: boolean;
  onCreateProductionHouse?: (name: string) => Promise<void>;
  isCreatingProductionHouse?: boolean;
}

const showFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  productionHouseId: z.number({
    required_error: "Production house is required",
    invalid_type_error: "Production house is required",
  }),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["Pre-Production", "Shooting", "Wrapped"]),
});

type ShowFormData = z.infer<typeof showFormSchema>;

export function EditShowModal({
  isOpen,
  onClose,
  show,
  productionHouses,
  onUpdate,
  isPending,
  onCreateProductionHouse,
  isCreatingProductionHouse = false,
}: EditShowModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ShowFormData>({
    resolver: zodResolver(showFormSchema),
  });

  // Reset form when show changes
  useEffect(() => {
    if (show) {
      const formatDateForInput = (date: Date | string | null | undefined) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toISOString().split("T")[0];
      };

      reset({
        title: show.title,
        productionHouseId: show.productionHouseId || undefined,
        description: show.description || "",
        startDate: formatDateForInput(show.startDate),
        endDate: formatDateForInput(show.endDate),
        status: show.status as "Pre-Production" | "Shooting" | "Wrapped",
      });
    }
  }, [show, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: ShowFormData) => {
    if (show) {
      await onUpdate(show.id, data);
      handleClose();
    }
  };

  if (!show) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-900/95 border border-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-cinematic-gold-500/20 rounded-lg">
                      <Film className="h-6 w-6 text-cinematic-gold-400" />
                    </div>
                    Edit Production
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Title *
                    </label>
                    <input
                      id="title"
                      type="text"
                      {...register("title")}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cinematic-gold-500"
                      placeholder="Production title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Production House */}
                  <div>
                    <label
                      htmlFor="productionHouseId"
                      className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4" />
                      Production House <span className="text-red-400">*</span>
                    </label>
                    <ProductionHouseCombobox
                      control={control}
                      name="productionHouseId"
                      productionHouses={productionHouses}
                      error={errors.productionHouseId}
                      disabled={isPending || isCreatingProductionHouse}
                      onCreateNew={onCreateProductionHouse}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Description
                    </label>
                    <textarea
                      id="description"
                      {...register("description")}
                      rows={3}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cinematic-gold-500 resize-none"
                      placeholder="Brief description of the production"
                    />
                  </div>

                  {/* Dates and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="startDate"
                        className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Start Date
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        {...register("startDate")}
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cinematic-gold-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="endDate"
                        className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        End Date
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        {...register("endDate")}
                        className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cinematic-gold-500"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Status *
                    </label>
                    <select
                      id="status"
                      {...register("status")}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-cinematic-gold-500"
                    >
                      <option value="Pre-Production">Pre-Production</option>
                      <option value="Shooting">Shooting</option>
                      <option value="Wrapped">Wrapped</option>
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.status.message}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2.5 text-gray-300 hover:text-white transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-6 py-2.5 bg-gradient-to-r from-cinematic-gold-500 to-cinematic-gold-600 text-gray-950 rounded-lg hover:from-cinematic-gold-600 hover:to-cinematic-gold-700 transition-all font-semibold shadow-lg shadow-cinematic-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? "Updating..." : "Update Production"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
