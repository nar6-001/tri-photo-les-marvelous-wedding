import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Bypass SSL certificate check for local networks/proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { DEFAULT_PHOTOS } from "../../server";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in env!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  try {
    const photos = DEFAULT_PHOTOS || [];

    if (photos.length === 0) {
      console.log("No photos in DEFAULT_PHOTOS to seed.");
      return;
    }

    console.log(`Seeding ${photos.length} photos to Supabase...`);

    const mappedPhotos = photos.map((p: any) => ({
      name: p.name,
      image: p.image,
      category: p.category,
      project_id: null // Make them global photos so they appear for all clients
    }));

    // Clear existing global photos first
    console.log("Cleaning existing global photos...");
    await supabase.from("wedding_photos").delete().is("project_id", null);

    const { data, error } = await supabase.from("wedding_photos").insert(mappedPhotos).select();

    if (error) {
      throw error;
    }

    console.log(`Successfully seeded ${data?.length} photos into Supabase!`);
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

seed();
