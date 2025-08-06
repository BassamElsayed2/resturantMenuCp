"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

// Schema for form validation
const descriptionSchema = z.object({
  header_one_ar: z.string().min(1, "العنوان الأول بالعربية مطلوب"),
  header_one_en: z.string().min(1, "First header in English is required"),
  header_two_ar: z.string().min(1, "العنوان الثاني بالعربية مطلوب"),
  header_two_en: z.string().min(1, "Second header in English is required"),
  paragraph_ar: z
    .string()
    .min(10, "الفقرة بالعربية يجب أن تكون 10 أحرف على الأقل"),
  paragraph_en: z
    .string()
    .min(10, "Paragraph in English must be at least 10 characters"),
});

type DescriptionFormData = z.infer<typeof descriptionSchema>;

export default function EditDescriptionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rowId, setRowId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DescriptionFormData>({
    resolver: zodResolver(descriptionSchema),
  });

  const supabase = createClientComponentClient();

  // Fetch the first row from description table
  useEffect(() => {
    const fetchDescription = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("description")
        .select("*")
        .limit(1)
        .single();
      if (error) {
        toast.error("فشل في جلب البيانات: " + error.message);
        setLoading(false);
        return;
      }
      if (data) {
        setRowId(data.id);
        reset({
          header_one_ar: data.header_one_ar || "",
          header_one_en: data.header_one_en || "",
          header_two_ar: data.header_two_ar || "",
          header_two_en: data.header_two_en || "",
          paragraph_ar: data.paragraph_ar || "",
          paragraph_en: data.paragraph_en || "",
        });
      }
      setLoading(false);
    };
    fetchDescription();
  }, [reset, supabase]);

  const onSubmit = async (data: DescriptionFormData) => {
    if (!rowId) {
      toast.error("لا يوجد صف لتعديله.");
      return;
    }
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from("description")
        .update(data)
        .eq("id", rowId);
      if (error) {
        throw new Error(error.message);
      }
      toast.success("تم تحديث الوصف بنجاح");
      router.refresh();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      toast.error("فشل في تحديث الوصف: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">جاري تحميل البيانات...</div>;
  }

  return (
    <>
      <div className="gap-[25px]">
        <div className="xl:col-span-3 2xl:col-span-2">
          <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
            <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
              <div className="trezo-card-title">
                <h5 className="!mb-0">تعديل الوصف</h5>
              </div>
              <Link
                href="/dashboard"
                className="btn bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md"
              >
                العودة
              </Link>
            </div>

            <div className="trezo-card-content">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-[25px]">
                  {/* Header One Arabic */}
                  <div className="mb-[20px]">
                    <label className="mb-[10px] block font-medium text-black dark:text-white">
                      العنوان الأول بالعربية *
                    </label>
                    <input
                      type="text"
                      {...register("header_one_ar")}
                      className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all focus:border-primary-500"
                      placeholder="أدخل العنوان الأول بالعربية"
                    />
                    {errors.header_one_ar && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.header_one_ar.message}
                      </p>
                    )}
                  </div>

                  {/* Header One English */}
                  <div className="mb-[20px]">
                    <label className="mb-[10px] block font-medium text-black dark:text-white">
                      First Header in English *
                    </label>
                    <input
                      type="text"
                      {...register("header_one_en")}
                      className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all focus:border-primary-500"
                      placeholder="Enter first header in English"
                    />
                    {errors.header_one_en && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.header_one_en.message}
                      </p>
                    )}
                  </div>

                  {/* Header Two Arabic */}
                  <div className="mb-[20px]">
                    <label className="mb-[10px] block font-medium text-black dark:text-white">
                      العنوان الثاني بالعربية *
                    </label>
                    <input
                      type="text"
                      {...register("header_two_ar")}
                      className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all focus:border-primary-500"
                      placeholder="أدخل العنوان الثاني بالعربية"
                    />
                    {errors.header_two_ar && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.header_two_ar.message}
                      </p>
                    )}
                  </div>

                  {/* Header Two English */}
                  <div className="mb-[20px]">
                    <label className="mb-[10px] block font-medium text-black dark:text-white">
                      Second Header in English *
                    </label>
                    <input
                      type="text"
                      {...register("header_two_en")}
                      className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all focus:border-primary-500"
                      placeholder="Enter second header in English"
                    />
                    {errors.header_two_en && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.header_two_en.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Paragraph Arabic */}
                <div className="mb-[20px]">
                  <label className="mb-[10px] block font-medium text-black dark:text-white">
                    الفقرة بالعربية *
                  </label>
                  <textarea
                    {...register("paragraph_ar")}
                    rows={6}
                    className="rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] py-[15px] block w-full outline-0 transition-all focus:border-primary-500 resize-none"
                    placeholder="أدخل الفقرة بالعربية"
                  />
                  {errors.paragraph_ar && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.paragraph_ar.message}
                    </p>
                  )}
                </div>

                {/* Paragraph English */}
                <div className="mb-[20px]">
                  <label className="mb-[10px] block font-medium text-black dark:text-white">
                    Paragraph in English *
                  </label>
                  <textarea
                    {...register("paragraph_en")}
                    rows={6}
                    className="rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] py-[15px] block w-full outline-0 transition-all focus:border-primary-500 resize-none"
                    placeholder="Enter paragraph in English"
                  />
                  {errors.paragraph_en && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.paragraph_en.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-[15px]">
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="btn bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-md"
                    disabled={isSubmitting}
                  >
                    إعادة تعيين
                  </button>
                  <button
                    type="submit"
                    className="btn bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
