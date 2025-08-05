"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  getRestaurants,
  deleteRestaurant,
  updateRestaurant,
  Restaurant,
} from "../../../services/apiRestaurants";
import supabase from "../../../services/supabase";
import Link from "next/link";

const MenusTable: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(
    null
  );

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        toast.error("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter items based on search term
  const filteredItems = restaurants.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.desc_ar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle delete restaurant
  const handleDelete = async (restaurant: Restaurant) => {
    if (!restaurant.id) return;

    // Show confirmation toast
    const confirmed = await new Promise<boolean>((resolve) => {
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium">تأكيد الحذف</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                هل أنت متأكد من حذف هذا المطعم؟ سيتم حذف جميع البيانات والصور.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                حذف
              </button>
            </div>
          </div>
        ),
        {
          duration: 0,
          position: "top-center",
        }
      );
    });

    if (!confirmed) return;

    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        // Delete logo from storage if exists
        if (restaurant.logo) {
          try {
            const logoPath = restaurant.logo.split("/").pop();
            if (logoPath) {
              await supabase.storage
                .from("restaurant-logos")
                .remove([logoPath]);
            }
          } catch (error) {
            console.error("Error deleting logo:", error);
          }
        }

        // Delete images from storage if exist
        if (restaurant.images && restaurant.images.length > 0) {
          try {
            const imagePaths = restaurant.images
              .map((img) => img.split("/").pop())
              .filter(Boolean);
            if (imagePaths.length > 0) {
              await supabase.storage
                .from("restaurant-menus")
                .remove(imagePaths as string[]);
            }
          } catch (error) {
            console.error("Error deleting images:", error);
          }
        }

        // Delete restaurant from database
        await deleteRestaurant(restaurant.id);

        // Update local state
        setRestaurants((prev) => prev.filter((r) => r.id !== restaurant.id));
        resolve("تم حذف المطعم بنجاح");
      } catch (error) {
        console.error("Error deleting restaurant:", error);
        reject("حدث خطأ أثناء حذف المطعم");
      }
    });

    toast.promise(deletePromise, {
      loading: "جاري حذف المطعم...",
      success: (message) => message as string,
      error: (message) => message as string,
    });
  };

  // Handle edit restaurant
  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setShowEditModal(true);
  };

  // Handle save edit
  const handleSaveEdit = async (updatedData: Restaurant) => {
    if (!updatedData.id) return;

    const updatePromise = new Promise(async (resolve, reject) => {
      try {
        const data = await updateRestaurant(updatedData.id, {
          name: updatedData.name,
          desc_ar: updatedData.desc_ar,
          logo: updatedData.logo,
          images: updatedData.images,
        });

        // Update local state
        setRestaurants((prev) =>
          prev.map((r) => (r.id === updatedData.id ? data : r))
        );

        setShowEditModal(false);
        setEditingRestaurant(null);
        resolve("تم تحديث المطعم بنجاح");
      } catch (error) {
        console.error("Error updating restaurant:", error);
        reject("حدث خطأ أثناء تحديث المطعم");
      }
    });

    toast.promise(updatePromise, {
      loading: "جاري تحديث المطعم...",
      success: (message) => message as string,
      error: (message) => message as string,
    });
  };

  if (isLoading) {
    return (
      <div className="trezo-card p-[25px] text-center">جاري التحميل...</div>
    );
  }

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      <div className="trezo-card-header mb-[20px] md:mb-[25px] sm:flex items-center justify-between">
        <div className="trezo-card-title">
          <form className="relative sm:w-[265px]">
            <label className="leading-none absolute ltr:left-[13px] rtl:right-[13px] text-black dark:text-white mt-px top-1/2 -translate-y-1/2">
              <i className="material-symbols-outlined !text-[20px]">search</i>
            </label>
            <input
              type="text"
              placeholder="البحث هنا....."
              className="bg-gray-50 border border-gray-50 h-[36px] text-xs rounded-md w-full block text-black pt-[11px] pb-[12px] ltr:pl-[38px] rtl:pr-[38px] ltr:pr-[13px] ltr:md:pr-[16px] rtl:pl-[13px] rtl:md:pl-[16px] placeholder:text-gray-500 outline-0 dark:bg-[#15203c] dark:text-white dark:border-[#15203c] dark:placeholder:text-gray-400"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </form>
        </div>
        <div className="trezo-card-subtitle mt-[15px] sm:mt-0">
          <Link
            href={"/dashboard/resturants/create-resturant"}
            className="inline-block transition-all rounded-md font-medium px-[13px] py-[6px] text-primary-500 border border-primary-500 hover:bg-primary-500 hover:text-white"
            id="add-new-popup-toggle"
          >
            <span className="inline-block relative ltr:pl-[22px] rtl:pr-[22px]">
              <i className="material-symbols-outlined !text-[22px] absolute ltr:-left-[4px] rtl:-right-[4px] top-1/2 -translate-y-1/2">
                add
              </i>
              إضافة مطعم جديد
            </span>
          </Link>
        </div>
      </div>
      <div className="trezo-card-content">
        <div className="table-responsive overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="whitespace-nowrap uppercase text-[10px] font-bold tracking-[1px] ltr:text-left rtl:text-right pt-0 pb-[14px] px-[20px] text-gray-500 dark:text-gray-400 ltr:first:pl-0 rtl:first:pr-0 ltr:last:pr-0 rtl:first:pl-0">
                  <div className="flex items-center gap-[10px]">اللوجو</div>
                </th>
                <th className="whitespace-nowrap uppercase text-[10px] font-bold tracking-[1px] ltr:text-left rtl:text-right pt-0 pb-[14px] px-[20px] text-gray-500 dark:text-gray-400 ltr:first:pl-0 rtl:first:pr-0 ltr:last:pr-0 rtl:first:pl-0">
                  اسم المطعم
                </th>
                <th className="whitespace-nowrap uppercase text-[10px] font-bold tracking-[1px] ltr:text-left rtl:text-right pt-0 pb-[14px] px-[20px] text-gray-500 dark:text-gray-400 ltr:first:pl-0 rtl:first:pr-0 ltr:last:pr-0 rtl:first:pl-0">
                  الوصف
                </th>
                <th className="whitespace-nowrap uppercase text-[10px] font-bold tracking-[1px] ltr:text-left rtl:text-right pt-0 pb-[14px] px-[20px] text-gray-500 dark:text-gray-400 ltr:first:pl-0 rtl:first:pr-0 ltr:last:pr-0 rtl:first:pl-0">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="text-black dark:text-white">
              {currentItems.length > 0 ? (
                currentItems.map((restaurant) => (
                  <tr key={restaurant.id}>
                    <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[14px] ltr:first:pl-0 rtl:first:pr-0 border-b border-primary-50 dark:border-[#172036] ltr:last:pr-0 rtl:last:pl-0">
                      <div className="flex items-center gap-[10px]">
                        <div className="rounded-full w-[40px] h-[40px] overflow-hidden">
                          {restaurant.logo ? (
                            <Image
                              src={restaurant.logo}
                              width={40}
                              height={40}
                              className="inline-block rounded-full object-cover"
                              alt={restaurant.name}
                            />
                          ) : (
                            <div className="w-[40px] h-[40px] bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <i className="material-symbols-outlined text-gray-400">
                                restaurant
                              </i>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[14px] ltr:first:pl-0 rtl:first:pr-0 border-b border-primary-50 dark:border-[#172036] ltr:last:pr-0 rtl:last:pl-0">
                      <a
                        href="#"
                        className="font-semibold inline-block transition-all hover:text-primary-500"
                      >
                        {restaurant.name}
                      </a>
                    </td>
                    <td className="ltr:text-left rtl:text-right px-[20px] py-[14px] ltr:first:pl-0 rtl:first:pr-0 border-b border-primary-50 dark:border-[#172036] ltr:last:pr-0 rtl:last:pl-0">
                      <div className="max-w-[300px]">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {restaurant.desc_ar.substring(0, 150)}...
                        </p>
                      </div>
                    </td>
                    <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[14px] ltr:first:pl-0 rtl:first:pr-0 border-b border-primary-50 dark:border-[#172036] ltr:last:pr-0 rtl:last:pl-0">
                      <div className="flex items-center gap-[9px]">
                        <button
                          type="button"
                          className="text-gray-500 dark:text-gray-400 leading-none custom-tooltip"
                          id="customTooltip"
                          data-text="تعديل"
                          onClick={() => handleEdit(restaurant)}
                        >
                          <i className="material-symbols-outlined !text-md">
                            edit
                          </i>
                        </button>
                        <button
                          type="button"
                          className="text-danger-500 leading-none custom-tooltip"
                          id="customTooltip"
                          data-text="حذف"
                          onClick={() => handleDelete(restaurant)}
                        >
                          <i className="material-symbols-outlined !text-md">
                            delete
                          </i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    لا توجد مطاعم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-[14px] sm:flex sm:items-center justify-between">
          <p className="!mb-0 !text-xs">
            عرض {indexOfFirstItem + 1} إلى{" "}
            {Math.min(indexOfLastItem, filteredItems.length)} من{" "}
            {filteredItems.length} نتيجة
          </p>
          <ol className="mt-[10px] sm:mt-0">
            <li className="inline-block mx-[2px] ltr:first:ml-0 ltr:last:mr-0 rtl:first:mr-0 rtl:last:ml-0">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border ${
                  currentPage === 1
                    ? "border-gray-200 dark:border-[#172036] text-gray-400 cursor-not-allowed"
                    : "border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500"
                }`}
              >
                <span className="opacity-0">0</span>
                <i className="material-symbols-outlined left-0 right-0 absolute top-1/2 -translate-y-1/2">
                  chevron_right
                </i>
              </button>
            </li>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show limited page numbers with ellipsis for many pages
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <li
                  key={pageNum}
                  className="inline-block mx-[2px] ltr:first:ml-0 ltr:last:mr-0 rtl:first:mr-0 rtl:last:ml-0"
                >
                  <button
                    onClick={() => paginate(pageNum)}
                    className={`w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md ${
                      currentPage === pageNum
                        ? "border border-primary-500 bg-primary-500 text-white"
                        : "border border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500"
                    }`}
                  >
                    {pageNum}
                  </button>
                </li>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <li className="inline-block mx-[2px]">
                <span className="w-[31px] h-[31px] block leading-[29px] relative text-center">
                  ...
                </span>
              </li>
            )}

            <li className="inline-block mx-[2px] ltr:first:ml-0 ltr:last:mr-0 rtl:first:mr-0 rtl:last:ml-0">
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border ${
                  currentPage === totalPages
                    ? "border-gray-200 dark:border-[#172036] text-gray-400 cursor-not-allowed"
                    : "border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500"
                }`}
              >
                <span className="opacity-0">0</span>
                <i className="material-symbols-outlined left-0 right-0 absolute top-1/2 -translate-y-1/2">
                  chevron_left
                </i>
              </button>
            </li>
          </ol>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0c1427] rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">تعديل المطعم</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit(editingRestaurant);
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  اسم المطعم
                </label>
                <input
                  type="text"
                  value={editingRestaurant.name}
                  onChange={(e) =>
                    setEditingRestaurant({
                      ...editingRestaurant,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#15203c] dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  الوصف بالعربية
                </label>
                <textarea
                  value={editingRestaurant.desc_ar}
                  onChange={(e) =>
                    setEditingRestaurant({
                      ...editingRestaurant,
                      desc_ar: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#15203c] dark:text-white"
                />
              </div>

              {/* Logo Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  لوجو المطعم
                </label>
                <div className="flex items-center gap-3">
                  {editingRestaurant.logo ? (
                    <div className="relative">
                      <Image
                        src={editingRestaurant.logo}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                        alt="Logo"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditingRestaurant({
                            ...editingRestaurant,
                            logo: "",
                          })
                        }
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-[60px] h-[60px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <i className="material-symbols-outlined text-gray-400">
                        image
                      </i>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const fileName = `${Date.now()}-${file.name}`;
                            const { error } = await supabase.storage
                              .from("restaurant-logos")
                              .upload(fileName, file);

                            if (error) throw error;

                            const { data: urlData } = supabase.storage
                              .from("restaurant-logos")
                              .getPublicUrl(fileName);

                            setEditingRestaurant({
                              ...editingRestaurant,
                              logo: urlData.publicUrl,
                            });
                            toast.success("تم رفع اللوجو بنجاح");
                          } catch (error) {
                            console.error("Error uploading logo:", error);
                            toast.error("حدث خطأ أثناء رفع اللوجو");
                          }
                        }
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#15203c] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  صور المطعم
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {editingRestaurant.images?.map((image, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={image}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover w-full h-20"
                        alt={`Image ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages =
                            editingRestaurant.images?.filter(
                              (_, i) => i !== index
                            ) || [];
                          setEditingRestaurant({
                            ...editingRestaurant,
                            images: newImages,
                          });
                          toast.success("تم حذف الصورة");
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      try {
                        const uploadedUrls: string[] = [];
                        for (const file of files) {
                          const fileName = `${Date.now()}-${file.name}`;
                          const { error } = await supabase.storage
                            .from("restaurant-menus")
                            .upload(fileName, file);

                          if (error) throw error;

                          const { data: urlData } = supabase.storage
                            .from("restaurant-menus")
                            .getPublicUrl(fileName);

                          uploadedUrls.push(urlData.publicUrl);
                        }

                        setEditingRestaurant({
                          ...editingRestaurant,
                          images: [
                            ...(editingRestaurant.images || []),
                            ...uploadedUrls,
                          ],
                        });
                        toast.success(
                          `تم رفع ${uploadedUrls.length} صورة بنجاح`
                        );
                      } catch (error) {
                        console.error("Error uploading images:", error);
                        toast.error("حدث خطأ أثناء رفع الصور");
                      }
                    }
                  }}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-[#15203c] dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRestaurant(null);
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenusTable;
