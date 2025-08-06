"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRestaurant,
  uploadLogo,
  uploadMenuImages,
} from "../../../../../../services/apiRestaurants";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Editor,
  EditorProvider,
  BtnBold,
  BtnBulletList,
  BtnClearFormatting,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnRedo,
  BtnStrikeThrough,
  BtnStyles,
  BtnUnderline,
  BtnUndo,
  HtmlButton,
  Separator,
  Toolbar,
} from "react-simple-wysiwyg";

type RestaurantFormValues = {
  name: string;
  desc_ar: string;
  desc_en: string;
  logo: File[];
  images: File[];
};

const CreateRestaurantForm: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Text Editor states
  const [descAr, setDescAr] = useState("اكتب وصف المطعم بالعربية...");
  const [descEn, setDescEn] = useState(
    "Write restaurant description in English..."
  );

  const { register, handleSubmit, setValue, formState } =
    useForm<RestaurantFormValues>();

  const { errors } = formState;

  const { mutate, isPending } = useMutation({
    mutationFn: createRestaurant,
    onSuccess: () => {
      toast.success("تم إنشاء المطعم بنجاح");
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      router.push("/dashboard/resturants");
    },
    onError: (error) => toast.error("حدث خطأ ما" + error.message),
  });

  // Logo upload
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // التحقق من نوع الملف
      if (!file.type.startsWith("image/")) {
        toast.error("الملف المحدد ليس صورة");
        return;
      }

      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن لا يتجاوز 5MB");
        return;
      }

      setSelectedLogo(file);
    }
  };

  const handleRemoveLogo = () => {
    setSelectedLogo(null);
  };

  // Menu images upload
  const [selectedMenuImages, setSelectedMenuImages] = useState<File[]>([]);
  const [isUploadingMenuImages, setIsUploadingMenuImages] = useState(false);

  const handleMenuImagesChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);

      // التحقق من عدد الصور
      if (selectedMenuImages.length + filesArray.length > 10) {
        toast.error("يمكنك رفع 10 صور كحد أقصى");
        return;
      }

      // التحقق من نوع وحجم الصور
      const validFiles = filesArray.filter((file) => {
        // التحقق من نوع الملف
        if (!file.type.startsWith("image/")) {
          toast.error(`الملف ${file.name} ليس صورة`);
          return false;
        }

        // التحقق من حجم الملف (5MB كحد أقصى)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`حجم الصورة ${file.name} يجب أن لا يتجاوز 5MB`);
          return false;
        }

        return true;
      });

      setSelectedMenuImages((prevImages) => [...prevImages, ...validFiles]);
    }
  };

  const handleRemoveMenuImage = (index: number) => {
    setSelectedMenuImages((prevImages) =>
      prevImages.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (data: RestaurantFormValues) => {
    // تحقق من وجود شعار
    if (!selectedLogo) {
      toast.error("يجب إضافة شعار للمطعم");
      return;
    }

    // تحقق من وجود صور القائمة
    if (selectedMenuImages.length === 0) {
      toast.error("يجب إضافة صور للقائمة");
      return;
    }

    // تحقق من الوصف
    if (
      !descAr ||
      descAr.trim() === "" ||
      descAr === "اكتب وصف المطعم بالعربية..."
    ) {
      toast.error("يجب إدخال وصف المطعم بالعربية");
      return;
    }

    if (
      !descEn ||
      descEn.trim() === "" ||
      descEn === "Write restaurant description in English..."
    ) {
      toast.error("يجب إدخال وصف المطعم بالانجليزية");
      return;
    }

    try {
      setIsUploadingLogo(true);
      setIsUploadingMenuImages(true);

      // ارفع الشعار أولاً
      const uploadedLogoUrl = await uploadLogo([selectedLogo]);

      // ارفع صور القائمة
      const uploadedMenuImageUrls = await uploadMenuImages(selectedMenuImages);

      const finalData = {
        name: data.name,
        desc_ar: descAr,
        desc_en: descEn,
        logo: uploadedLogoUrl[0],
        images: uploadedMenuImageUrls,
      };

      mutate(finalData);
    } catch (error: Error | unknown) {
      toast.error("حدث خطأ أثناء رفع الصور");
      console.error("Image upload error:", error);
    } finally {
      setIsUploadingLogo(false);
      setIsUploadingMenuImages(false);
    }
  };

  return (
    <>
      <div className="mb-[25px] md:flex items-center justify-between">
        <h5 className="!mb-0">إنشاء مطعم</h5>

        <ol className="breadcrumb mt-[12px] md:mt-0 rtl:flex-row-reverse">
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            <Link
              href="/dashboard"
              className="inline-block relative ltr:pl-[22px] rtl:pr-[22px] transition-all hover:text-primary-500"
            >
              <i className="material-symbols-outlined absolute ltr:left-0 rtl:right-0 !text-lg -mt-px text-primary-500 top-1/2 -translate-y-1/2">
                home
              </i>
              رئيسية
            </Link>
          </li>
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            المطاعم
          </li>
          <li className="breadcrumb-item inline-block relative text-sm mx-[11px] ltr:first:ml-0 rtl:first:mr-0 ltr:last:mr-0 rtl:last:ml-0">
            إنشاء مطعم
          </li>
        </ol>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="gap-[25px]">
          <div className="lg:col-span-2">
            <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
              <div className="trezo-card-header mb-[20px] md:mb-[25px] flex items-center justify-between">
                <div className="trezo-card-title">
                  <h5 className="!mb-0">أضف مطعم</h5>
                </div>
              </div>

              <div className="trezo-card-content">
                <div className="sm:grid sm:grid-cols-2 sm:gap-[25px]">
                  <div className="mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      اسم المطعم
                    </label>
                    <input
                      type="text"
                      className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-500"
                      placeholder="أدخل اسم المطعم"
                      id="name"
                      {...register("name", {
                        required: "يجب إدخال اسم المطعم",
                      })}
                    />
                    {errors?.name?.message && (
                      <span className="text-red-700 text-sm">
                        {errors.name.message}
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      الوصف (بالعربية)
                    </label>
                    <EditorProvider>
                      <Editor
                        value={descAr}
                        onChange={(e) => {
                          setDescAr(e.target.value);
                          setValue("desc_ar", e.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        style={{ minHeight: "200px" }}
                        className="rsw-editor"
                      >
                        <Toolbar>
                          <BtnUndo />
                          <BtnRedo />
                          <Separator />
                          <BtnBold />
                          <BtnItalic />
                          <BtnUnderline />
                          <BtnStrikeThrough />
                          <Separator />
                          <BtnNumberedList />
                          <BtnBulletList />
                          <Separator />
                          <BtnLink />
                          <BtnClearFormatting />
                          <HtmlButton />
                          <Separator />
                          <BtnStyles />
                        </Toolbar>
                      </Editor>
                    </EditorProvider>
                    {errors?.desc_ar?.message && (
                      <span className="text-red-700 text-sm">
                        {errors.desc_ar.message}
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      الوصف (بالانجليزية)
                    </label>
                    <EditorProvider>
                      <Editor
                        value={descEn}
                        onChange={(e) => {
                          setDescEn(e.target.value);
                          setValue("desc_en", e.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        style={{ minHeight: "200px" }}
                        className="rsw-editor"
                      >
                        <Toolbar>
                          <BtnUndo />
                          <BtnRedo />
                          <Separator />
                          <BtnBold />
                          <BtnItalic />
                          <BtnUnderline />
                          <BtnStrikeThrough />
                          <Separator />
                          <BtnNumberedList />
                          <BtnBulletList />
                          <Separator />
                          <BtnLink />
                          <BtnClearFormatting />
                          <HtmlButton />
                          <Separator />
                          <BtnStyles />
                        </Toolbar>
                      </Editor>
                    </EditorProvider>
                    {errors?.desc_en?.message && (
                      <span className="text-red-700 text-sm">
                        {errors.desc_en.message}
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      شعار المطعم
                    </label>

                    <div id="logoUploader">
                      <div className="relative flex items-center justify-center overflow-hidden rounded-md py-[88px] px-[20px] border border-gray-200 dark:border-[#172036]">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-[35px] h-[35px] border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg mb-3">
                            <i className="ri-upload-2-line"></i>
                          </div>
                          <p className="leading-[1.5] mb-2">
                            <strong className="text-black dark:text-white">
                              اضغط لرفع
                            </strong>
                            <br /> شعار المطعم من هنا
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            حجم الصورة: حتى 5 ميجابايت
                          </p>
                        </div>

                        <input
                          type="file"
                          id="logo"
                          accept="image/*"
                          className="absolute top-0 left-0 right-0 bottom-0 rounded-md z-[1] opacity-0 cursor-pointer"
                          onChange={handleLogoChange}
                        />
                      </div>

                      {/* Logo Preview */}
                      {selectedLogo && (
                        <div className="mt-[10px] flex items-center gap-2">
                          <div className="relative w-[80px] h-[80px]">
                            <Image
                              src={URL.createObjectURL(selectedLogo)}
                              alt="logo-preview"
                              width={80}
                              height={80}
                              className="rounded-md object-cover"
                            />
                            <button
                              type="button"
                              className="absolute top-[-5px] right-[-5px] bg-red-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs rtl:right-auto rtl:left-[-5px]"
                              onClick={handleRemoveLogo}
                            >
                              ✕
                            </button>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedLogo.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2 mb-[20px] sm:mb-0">
                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                      صور قائمة الطعام
                    </label>

                    <div id="menuImagesUploader">
                      <div className="relative flex items-center justify-center overflow-hidden rounded-md py-[88px] px-[20px] border border-gray-200 dark:border-[#172036]">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-[35px] h-[35px] border border-gray-100 dark:border-[#15203c] flex items-center justify-center rounded-md text-primary-500 text-lg mb-3">
                            <i className="ri-upload-2-line"></i>
                          </div>
                          <p className="leading-[1.5] mb-2">
                            <strong className="text-black dark:text-white">
                              اضغط لرفع
                            </strong>
                            <br /> صور قائمة الطعام من هنا
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            الحد الأقصى: 10 صور
                            <br />
                            حجم الصورة: حتى 5 ميجابايت
                          </p>
                        </div>

                        <input
                          type="file"
                          id="images"
                          multiple
                          accept="image/*"
                          className="absolute top-0 left-0 right-0 bottom-0 rounded-md z-[1] opacity-0 cursor-pointer"
                          onChange={handleMenuImagesChange}
                        />
                      </div>

                      {/* Menu Images Previews */}
                      <div className="mt-[10px] flex flex-wrap gap-2">
                        {selectedMenuImages.map((image, index) => (
                          <div
                            key={index}
                            className="relative w-[80px] h-[80px]"
                          >
                            <Image
                              src={URL.createObjectURL(image)}
                              alt="menu-preview"
                              width={80}
                              height={80}
                              className="rounded-md object-cover"
                            />
                            <button
                              type="button"
                              className="absolute top-[-5px] right-[-5px] bg-red-500 text-white w-[20px] h-[20px] flex items-center justify-center rounded-full text-xs rtl:right-auto rtl:left-[-5px]"
                              onClick={() => handleRemoveMenuImage(index)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="trezo-card mb-[25px]">
          <div className="trezo-card-content">
            <button
              type="reset"
              className="font-medium inline-block transition-all rounded-md md:text-md ltr:mr-[15px] rtl:ml-[15px] py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-danger-500 text-white hover:bg-danger-400"
            >
              ألغاء
            </button>

            <button
              type="submit"
              disabled={isPending || isUploadingLogo || isUploadingMenuImages}
              className="font-medium inline-block transition-all rounded-md md:text-md py-[10px] md:py-[12px] px-[20px] md:px-[22px] bg-primary-500 text-white hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="inline-block relative ltr:pl-[29px] rtl:pr-[29px]">
                {isUploadingLogo || isUploadingMenuImages ? (
                  <>
                    <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2 animate-spin">
                      sync
                    </i>
                    جاري رفع الصور...
                  </>
                ) : isPending ? (
                  <>
                    <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2 animate-spin">
                      sync
                    </i>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <i className="material-symbols-outlined ltr:left-0 rtl:right-0 absolute top-1/2 -translate-y-1/2">
                      add
                    </i>
                    إنشاء مطعم
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default CreateRestaurantForm;
