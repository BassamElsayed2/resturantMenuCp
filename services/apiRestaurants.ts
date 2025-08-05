import supabase from "./supabase";
import { UUID } from "crypto";

export interface Restaurant {
  id?: UUID;
  name: string;
  desc_ar: string;
  desc_en: string;
  logo: string;
  images: string[];
  created_at?: string;
}

export async function createRestaurant(
  restaurantData: Restaurant
): Promise<Restaurant> {
  const { data, error } = await supabase
    .from("restaurants")
    .insert([restaurantData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRestaurant(
  id: UUID,
  restaurantData: Partial<Restaurant>
): Promise<Restaurant> {
  const { data, error } = await supabase
    .from("restaurants")
    .update(restaurantData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadLogo(files: File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("restaurant-logos")
      .upload(fileName, file);

    if (error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("restaurant-logos")
      .getPublicUrl(fileName);

    uploadedUrls.push(urlData.publicUrl);
  }

  return uploadedUrls;
}

export async function uploadMenuImages(files: File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("restaurant-menus")
      .upload(fileName, file);

    if (error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("restaurant-menus")
      .getPublicUrl(fileName);

    uploadedUrls.push(urlData.publicUrl);
  }

  return uploadedUrls;
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteRestaurant(id: UUID): Promise<void> {
  const { error } = await supabase.from("restaurants").delete().eq("id", id);

  if (error) throw error;
}
