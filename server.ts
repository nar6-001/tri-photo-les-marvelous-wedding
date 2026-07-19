import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

// Bypass SSL certificate validation errors (common on some networks/machines)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Path to store dynamic database
const DB_PATH = path.join(process.cwd(), "database.json");

// ============================================================================
// CLOUDINARY CONFIG (server-side, secured)
// ============================================================================
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

function cloudinaryConfigured() {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

async function cloudinaryFetch(path: string, params: Record<string, string | number> = {}) {
  if (!cloudinaryConfigured()) {
    throw new Error("Cloudinary non configuré côté serveur (env vars manquantes)");
  }
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => qs.append(k, String(v)));
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}${path}?${qs.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString("base64")}`
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// Default Catalog & Clients
export const DEFAULT_PHOTOS = [
  // ====== Dotation (préparatifs + cérémonie) ======
  {
    id: 'photo-1',
    name: 'Cérémonie sous la tonnelle',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 6000000).toISOString()
  },
  {
    id: 'photo-2',
    name: 'Échange des alliances',
    image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 5800000).toISOString()
  },
  {
    id: 'photo-3',
    name: 'Baiser sous le voile',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 5600000).toISOString()
  },
  {
    id: 'photo-4',
    name: 'Rire spontané au cocktail',
    image: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 5400000).toISOString()
  },
  {
    id: 'photo-5',
    name: 'Les mariés entrent dans l\'église',
    image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 5200000).toISOString()
  },
  {
    id: 'photo-6',
    name: 'La mariée descend l\'allée',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 5000000).toISOString()
  },
  {
    id: 'photo-7',
    name: 'Lecture des vœux',
    image: 'https://images.unsplash.com/photo-1521543298578-1bc1ed1b7c84?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 4800000).toISOString()
  },
  {
    id: 'photo-8',
    name: 'Le premier regard',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 4600000).toISOString()
  },
  {
    id: 'photo-9',
    name: 'Signature des registres',
    image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 4400000).toISOString()
  },
  {
    id: 'photo-10',
    name: 'Sortie de cérémonie sous les confettis',
    image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 4200000).toISOString()
  },
  {
    id: 'photo-11',
    name: 'La main dans la main',
    image: 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 4000000).toISOString()
  },
  {
    id: 'photo-12',
    name: 'Regard complice au sortir de l\'église',
    image: 'https://images.unsplash.com/photo-1597248374161-426f3d6cca88?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 3800000).toISOString()
  },

  // ====== Globale (moments forts + portraits) ======
  {
    id: 'photo-13',
    name: 'Décoration champêtre de la table',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'photo-14',
    name: 'Bouquet de la mariée',
    image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 3400000).toISOString()
  },
  {
    id: 'photo-15',
    name: 'Alliances en gros plan',
    image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 3200000).toISOString()
  },
  {
    id: 'photo-16',
    name: 'Portrait de couple dans le jardin',
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f484?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 3000000).toISOString()
  },
  {
    id: 'photo-17',
    name: 'Le sourire de la mariée',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 2800000).toISOString()
  },
  {
    id: 'photo-18',
    name: 'Cinquante nuances de bonheur',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 2600000).toISOString()
  },
  {
    id: 'photo-19',
    name: 'Le lancer de bouquet',
    image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 2400000).toISOString()
  },
  {
    id: 'photo-20',
    name: 'La robe déployée',
    image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 2200000).toISOString()
  },
  {
    id: 'photo-21',
    name: 'Détail des chaussures de la mariée',
    image: 'https://images.unsplash.com/photo-1583932692685-2c61fc3296ea?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 2000000).toISOString()
  },
  {
    id: 'photo-22',
    name: 'Échange de regards avec les parents',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'photo-23',
    name: 'Premier baiser en lumière dorée',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 1600000).toISOString()
  },
  {
    id: 'photo-24',
    name: 'Sourire échangé entre mariés',
    image: 'https://images.unsplash.com/photo-1521543298578-1bc1ed1b7c84?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 1400000).toISOString()
  },
  {
    id: 'photo-25',
    name: 'Le détail du costume du marié',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: 'photo-26',
    name: 'Décoration florale suspendue',
    image: 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 1000000).toISOString()
  },

  // ====== Album (soirée + pièces montées + bal) ======
  {
    id: 'photo-27',
    name: 'Ouverture du bal des mariés',
    image: 'https://images.unsplash.com/photo-1507504038482-7621c51b30ab?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 980000).toISOString()
  },
  {
    id: 'photo-28',
    name: 'La coupe de la pièce montée',
    image: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 960000).toISOString()
  },
  {
    id: 'photo-29',
    name: 'Le premier slow',
    image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 940000).toISOString()
  },
  {
    id: 'photo-30',
    name: 'Soirée dansante endiablée',
    image: 'https://images.unsplash.com/photo-1492684223066-813ece77bff0?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 920000).toISOString()
  },
  {
    id: 'photo-31',
    name: 'Le feu d\'artifice final',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'photo-32',
    name: 'Toast porté par le témoin',
    image: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 880000).toISOString()
  },
  {
    id: 'photo-33',
    name: 'Groupe d\'amis en délire',
    image: 'https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 860000).toISOString()
  },
  {
    id: 'photo-34',
    name: 'Le gâteau à 3 étages',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 840000).toISOString()
  },
  {
    id: 'photo-35',
    name: 'Les mariés enlacés au bar',
    image: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 820000).toISOString()
  },
  {
    id: 'photo-36',
    name: 'La fête sous les projecteurs',
    image: 'https://images.unsplash.com/photo-1496024840928-4c417adf211d?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 800000).toISOString()
  },
  {
    id: 'photo-37',
    name: 'Le bouquet de fleurs séchées',
    image: 'https://images.unsplash.com/photo-1507504038482-7621c51b30ab?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 780000).toISOString()
  },
  {
    id: 'photo-38',
    name: 'Éclats de rire entre convives',
    image: 'https://images.unsplash.com/photo-1492684223066-813ece77bff0?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 760000).toISOString()
  },

  // ====== PHOTOS CARRÉES (800x800) ======
  {
    id: 'photo-square-1',
    name: 'Vue du ciel — instant suspendu',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800&h=800',
    category: 'Globale',
    createdAt: new Date(Date.now() - 740000).toISOString()
  },
  {
    id: 'photo-square-2',
    name: 'Carré de lumière sur l\'alliance',
    image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=800&h=800',
    category: 'Dot',
    createdAt: new Date(Date.now() - 720000).toISOString()
  },
  {
    id: 'photo-square-3',
    name: 'Sourire en gros plan',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800&h=800',
    category: 'Globale',
    createdAt: new Date(Date.now() - 700000).toISOString()
  },
  {
    id: 'photo-square-4',
    name: 'Détail des mains entrelacées',
    image: 'https://images.unsplash.com/photo-1521543298578-1bc1ed1b7c84?auto=format&fit=crop&q=80&w=800&h=800',
    category: 'Dot',
    createdAt: new Date(Date.now() - 680000).toISOString()
  },
  {
    id: 'photo-square-5',
    name: 'Cadeau emballé avec soin',
    image: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=800&h=800',
    category: 'Album',
    createdAt: new Date(Date.now() - 660000).toISOString()
  },
  {
    id: 'photo-square-6',
    name: 'Rond de feu au sol',
    image: 'https://images.unsplash.com/photo-1496024840928-4c417adf211d?auto=format&fit=crop&q=80&w=800&h=800',
    category: 'Album',
    createdAt: new Date(Date.now() - 640000).toISOString()
  },

  // ====== PHOTOS PAYSAGES (1200x800) ======
  {
    id: 'photo-landscape-1',
    name: 'Vue panoramique du domaine',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200&h=800',
    category: 'Globale',
    createdAt: new Date(Date.now() - 620000).toISOString()
  },
  {
    id: 'photo-landscape-2',
    name: 'Table dressée pour le dîner',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=1200&h=800',
    category: 'Globale',
    createdAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'photo-landscape-3',
    name: 'Salle de réception illuminée',
    image: 'https://images.unsplash.com/photo-1507504038482-7621c51b30ab?auto=format&fit=crop&q=80&w=1200&h=800',
    category: 'Album',
    createdAt: new Date(Date.now() - 580000).toISOString()
  },
  {
    id: 'photo-landscape-4',
    name: 'Groupe d\'amis en délire — vue large',
    image: 'https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&q=80&w=1200&h=800',
    category: 'Album',
    createdAt: new Date(Date.now() - 560000).toISOString()
  },
  {
    id: 'photo-landscape-5',
    name: 'Cérémonie vue de loin',
    image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80&w=1200&h=800',
    category: 'Dot',
    createdAt: new Date(Date.now() - 540000).toISOString()
  },
  {
    id: 'photo-landscape-6',
    name: 'Piste de danse en plein air',
    image: 'https://images.unsplash.com/photo-1492684223066-813ece77bff0?auto=format&fit=crop&q=80&w=1200&h=800',
    category: 'Album',
    createdAt: new Date(Date.now() - 520000).toISOString()
  }
];

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://itpweepyypseuwemxzfd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// In-Memory Chat list that loads/saves with the DB
interface ChatMessage {
  id: string;
  sender: "client" | "photographer";
  text: string;
  timestamp: string;
}

interface DBStructure {
  globalPhotos: any[];
  clientsList: any[];
  chatMessages: Record<string, ChatMessage[]>;
  categoryLabels?: Record<string, string>;
  cloudinarySettings?: { cloudName: string; uploadPreset: string };
}

// Help initialize or read database from Supabase
async function fetchFullDatabase(): Promise<DBStructure> {
  try {
    // 1. Fetch wedding projects (active couples)
    const { data: projectsData, error: projErr } = await supabase
      .from("wedding_projects")
      .select("id, couple, wedding_date, country");
    if (projErr) throw projErr;

    // 2. Fetch selections config
    const { data: selectionsData, error: selErr } = await supabase
      .from("wedding_client_selections")
      .select("*");
    if (selErr) throw selErr;

    // 3. Fetch wedding photos
    const { data: photosData, error: photoErr } = await supabase
      .from("wedding_photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (photoErr) throw photoErr;

    // 4. Fetch internal wedding chats
    const { data: chatsData, error: chatErr } = await supabase
      .from("wedding_chats")
      .select("*")
      .order("timestamp", { ascending: true });
    if (chatErr) throw chatErr;

    // Map projects and selections together
    const selectionsMap = new Map((selectionsData || []).map(s => [s.project_id, s]));
    const clientsList = (projectsData || []).map(proj => {
      const sel = selectionsMap.get(proj.id) || {};
      return {
        id: proj.id,
        name: proj.couple,
        targetCount: sel.target_count ?? 5,
        targetCategoryQuotas: sel.target_category_quotas ?? {},
        selectedPhotoIds: sel.selected_photo_ids ?? [],
        dislikedPhotoIds: sel.disliked_photo_ids ?? [],
        photoComments: sel.photo_comments ?? {},
        isLocked: sel.is_locked ?? false,
        coverPhotoId: sel.cover_photo_id ?? null,
        deadline: sel.deadline ?? null,
        categoryLabels: sel.category_labels ?? { Dot: "Dot", Globale: "Classique", Album: "Album" },
        notes: sel.notes ?? "",
        createdAt: proj.wedding_date || new Date().toISOString(),
        weddingDate: proj.wedding_date || null,
        country: proj.country || ""
      };
    });

    const globalPhotos = (photosData || []).map(p => ({
      id: p.id,
      name: p.name,
      image: p.image,
      category: p.category,
      createdAt: p.created_at,
      clientId: p.project_id
    }));

    const chatMessages: Record<string, ChatMessage[]> = {};
    (chatsData || []).forEach(c => {
      const pId = c.project_id;
      if (!chatMessages[pId]) chatMessages[pId] = [];
      chatMessages[pId].push({
        id: c.id,
        sender: c.sender as "client" | "photographer",
        text: c.text,
        timestamp: c.timestamp
      });
    });

    return {
      globalPhotos,
      clientsList,
      chatMessages,
      categoryLabels: { Dot: "Dot", Globale: "Classique", Album: "Album" },
      cloudinarySettings: {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: ""
      }
    };
  } catch (err) {
    console.error("Error reading from Supabase database:", err);
    return {
      globalPhotos: [],
      clientsList: [],
      chatMessages: {},
      categoryLabels: { Dot: "Dot", Globale: "Classique", Album: "Album" },
      cloudinarySettings: { cloudName: CLOUDINARY_CLOUD_NAME, uploadPreset: "" }
    };
  }
}

// REST API endpoints for Frontend synchronization
app.get("/api/database", async (req, res) => {
  const db = await fetchFullDatabase();
  res.json(db);
});

app.post("/api/debug-log", (req, res) => {
  console.error("\x1b[31m[BROWSER-CRASH]\x1b[0m", JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.post("/api/clients", async (req, res) => {
  const { clientsList } = req.body;
  if (!Array.isArray(clientsList)) {
    return res.status(400).json({ error: "Invalid client list format" });
  }

  for (const client of clientsList) {
    const { error } = await supabase.from("wedding_client_selections").upsert({
      project_id: client.id,
      target_count: client.targetCount,
      target_category_quotas: client.targetCategoryQuotas || {},
      selected_photo_ids: client.selectedPhotoIds || [],
      disliked_photo_ids: client.dislikedPhotoIds || [],
      photo_comments: client.photoComments || {},
      is_locked: client.isLocked || false,
      cover_photo_id: client.coverPhotoId || null,
      deadline: client.deadline || null,
      category_labels: client.categoryLabels || { Dot: "Dot", Globale: "Classique", Album: "Album" },
      notes: client.notes || "",
      updated_at: new Date().toISOString()
    }, { onConflict: "project_id" });
    if (error) console.error("Upsert client selection error:", error);
  }
  res.json({ success: true });
});

app.post("/api/photos", async (req, res) => {
  const { globalPhotos } = req.body;
  if (!Array.isArray(globalPhotos)) {
    return res.status(400).json({ error: "Invalid photo format" });
  }

  for (const photo of globalPhotos) {
    const { error } = await supabase.from("wedding_photos").upsert({
      id: photo.id.length === 36 ? photo.id : undefined,
      project_id: photo.clientId || null,
      name: photo.name,
      image: photo.image,
      category: photo.category
    }, { onConflict: "id" });
    if (error) console.error("Upsert photo error:", error);
  }
  res.json({ success: true });
});

app.post("/api/categories", async (req, res) => {
  res.json({ success: true });
});

app.post("/api/cloudinary-config", (req, res) => {
  res.json({ success: true });
});

// Cloudinary: test connection (server-side, uses API key/secret)
app.get("/api/cloudinary/test", async (req, res) => {
  if (!cloudinaryConfigured()) {
    return res.json({
      success: false,
      configured: false,
      error: "Variables d'environnement Cloudinary manquantes côté serveur. Définissez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET dans votre .env."
    });
  }
  try {
    const result = await cloudinaryFetch("/resources/image", { max_results: 1 });
    res.json({ success: true, configured: true, cloudName: CLOUDINARY_CLOUD_NAME, rate_limit_remaining: result.rate_limit_remaining, rate_limit_allowed: result.rate_limit_allowed });
  } catch (e: any) {
    res.json({ success: false, configured: true, error: e.message });
  }
});

// Cloudinary: list photos in a folder (server-side)
app.get("/api/cloudinary/list", async (req, res) => {
  if (!cloudinaryConfigured()) {
    return res.json({ success: false, error: "Cloudinary non configuré côté serveur" });
  }
  const folder = (req.query.folder as string) || "";
  const maxResults = parseInt((req.query.max_results as string) || "100", 10);
  try {
    const params: Record<string, string | number> = {
      max_results: Math.min(maxResults, 500),
      type: "upload"
    };
    if (folder) params.prefix = folder.endsWith("/") ? folder : folder + "/";
    const result = await cloudinaryFetch("/resources/image", params);
    res.json({ success: true, resources: result.resources || [], total: result.resources?.length || 0 });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Cloudinary: list sub-folders (server-side, useful for browsing couples/categories)
app.get("/api/cloudinary/folders", async (req, res) => {
  if (!cloudinaryConfigured()) {
    return res.json({ success: false, error: "Cloudinary non configuré" });
  }
  try {
    const result = await cloudinaryFetch("/folders", { max_results: 100 });
    res.json({ success: true, folders: result.folders || [] });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Cloudinary: delete a photo by public_id (server-side)
app.post("/api/cloudinary/delete", async (req, res) => {
  if (!cloudinaryConfigured()) {
    return res.json({ success: false, error: "Cloudinary non configuré" });
  }
  const { publicId, cloudName } = req.body;
  if (!publicId) return res.json({ success: false, error: "publicId manquant" });
  try {
    // Use the specified cloud name or fall back to env var
    const targetCloud = cloudName || CLOUDINARY_CLOUD_NAME;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`).digest("hex");
    const url = `https://api.cloudinary.com/v1_1/${targetCloud}/image/destroy`;
    const formData = new URLSearchParams();
    formData.append("public_id", publicId);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    const response = await fetch(url, { method: "POST", body: formData });
    const data = await response.json();
    if (data.result === "ok" || data.result === "not found") {
      res.json({ success: true, result: data.result });
    } else {
      res.json({ success: false, error: data.error?.message || "Delete failed" });
    }
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Cloudinary: server config status (which env vars are set, without exposing secrets)
app.get("/api/cloudinary/server-status", (req, res) => {
  res.json({
    cloudName: CLOUDINARY_CLOUD_NAME || null,
    apiKeySet: !!CLOUDINARY_API_KEY,
    apiSecretSet: !!CLOUDINARY_API_SECRET,
    fullyConfigured: cloudinaryConfigured()
  });
});

// Post a chat message
app.post("/api/chats/:clientId", async (req, res) => {
  const { clientId } = req.params;
  const { sender, text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is empty" });

  const { error } = await supabase.from("wedding_chats").insert({
    project_id: clientId,
    sender: sender || "client",
    text,
    timestamp: new Date().toISOString()
  });

  if (error) {
    console.error("Insert chat error:", error);
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
});

// REST endpoint for resetting the database
app.post("/api/reset", async (req, res) => {
  await supabase.from("wedding_photos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("wedding_client_selections").delete().neq("project_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("wedding_chats").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  res.json({ success: true });
});


/* ========================================================
   MODEL CONTEXT PROTOCOL (MCP) IMPLEMENTATION
   ======================================================== */

// Register MCP Tools
const MCP_TOOLS = [
  {
    name: "get_wedding_database",
    description: "Get the full state of wedding photos, customer accounts, target selections, liked/disliked IDs, and chat histories.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "update_client_selection",
    description: "Programmatically approve (like) or reject (dislike) a photo for a wedding client account, or clear their picks.",
    inputSchema: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "The identifier of the client (e.g. 'sophie-marc', 'chloe-thomas')" },
        photoId: { type: "string", description: "The ID of the wedding photo being acted upon (e.g. 'photo-1')" },
        action: { type: "string", enum: ["like", "dislike", "reset"], description: "The action to take ('like' to approve, 'dislike' to discard, 'reset' to clear)" }
      },
      required: ["clientId", "photoId", "action"]
    }
  },
  {
    name: "send_wedding_message",
    description: "Send an interactive chat message to a client as the photographer or help host.",
    inputSchema: {
      type: "object",
      properties: {
        clientId: { type: "string", description: "The ID of the client" },
        text: { type: "string", description: "The text message content to send" },
        sender: { type: "string", enum: ["photographer", "client"], description: "Who is speaking" }
      },
      required: ["clientId", "text"]
    }
  },
  {
    name: "add_wedding_client",
    description: "Add a brand new wedding client account to the selection portal.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique string URL slug/ID (e.g. 'alice-bob')" },
        name: { type: "string", description: "Display name of the couple (e.g. 'Alice & Bob')" },
        targetCount: { type: "number", description: "Number of photos they need to select in their package target quota" },
        notes: { type: "string", description: "Personal notes or photographer preferences" }
      },
      required: ["id", "name", "targetCount"]
    }
  },
  {
    name: "add_wedding_photo",
    description: "Upload/insert a brand new wedding photo to the shared global gallery.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique catalog photo identifier" },
        name: { type: "string", description: "Title caption of the shot" },
        image: { type: "string", description: "Clean image URL (Unsplash/etc)" },
        category: { type: "string", enum: ["Dot", "Globale", "Album"], description: "Photo category filter division" }
      },
      required: ["id", "name", "image", "category"]
    }
  },
  {
    name: "reset_all_data",
    description: "Completely purge all custom clients and custom photos, returning back to elegant default presets.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

// Handles JSON-RPC requests for both HTTP-POST and SSE methods
async function handleMCPRequest(payload: any): Promise<any> {
  const { jsonrpc, method, params, id } = payload;

  if (jsonrpc !== "2.0") {
    return { jsonrpc: "2.0", id: id || null, error: { code: -32600, message: "Invalid JSON-RPC version" } };
  }

  // 1. List tools command
  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: MCP_TOOLS
      }
    };
  }

  // 2. Call tool command
  if (method === "tools/call") {
    const { name, arguments: args } = params || {};
    const db = await fetchFullDatabase();

    switch (name) {
      case "get_wedding_database":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "connected",
                  total_photos: db.globalPhotos.length,
                  clients: db.clientsList,
                  messages_summary: Object.keys(db.chatMessages).reduce((acc, current) => {
                    acc[current] = db.chatMessages[current].length + " messages";
                    return acc;
                  }, {} as Record<string, string>)
                }, null, 2)
              }
            ]
          }
        };

      case "update_client_selection": {
        const { clientId, photoId, action } = args;
        const { data: selection } = await supabase
          .from("wedding_client_selections")
          .select("selected_photo_ids, disliked_photo_ids")
          .eq("project_id", clientId)
          .maybeSingle();

        let selected = selection?.selected_photo_ids || [];
        let disliked = selection?.disliked_photo_ids || [];

        if (action === "like") {
          if (!selected.includes(photoId)) selected.push(photoId);
          disliked = disliked.filter((id: string) => id !== photoId);
        } else if (action === "dislike") {
          if (!disliked.includes(photoId)) disliked.push(photoId);
          selected = selected.filter((id: string) => id !== photoId);
        } else if (action === "reset") {
          selected = [];
          disliked = [];
        }

        await supabase.from("wedding_client_selections").upsert({
          project_id: clientId,
          selected_photo_ids: selected,
          disliked_photo_ids: disliked,
          updated_at: new Date().toISOString()
        }, { onConflict: "project_id" });

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: `Success: Client selection updated for ${clientId}.`
              }
            ]
          }
        };
      }

      case "send_wedding_message": {
        const { clientId, text, sender } = args;
        await supabase.from("wedding_chats").insert({
          project_id: clientId,
          sender: sender || "photographer",
          text,
          timestamp: new Date().toISOString()
        });

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: `Message successfully posted to conversation '${clientId}'.`
              }
            ]
          }
        };
      }

      case "add_wedding_client": {
        const { id: cId, name, targetCount, notes } = args;
        const { data: existingProject } = await supabase.from("wedding_projects").select("id").eq("id", cId).maybeSingle();
        if (!existingProject) {
          await supabase.from("wedding_projects").insert({
            id: cId,
            couple: name,
            wedding_date: new Date().toISOString().split("T")[0],
            country: "France",
            status: "Planification",
            progress: 0,
            amount: 0,
            delay_days: 0,
            is_legacy: false,
            requires_sync: false
          });
        }
        await supabase.from("wedding_client_selections").upsert({
          project_id: cId,
          target_count: targetCount || 5,
          notes: notes || "",
          updated_at: new Date().toISOString()
        }, { onConflict: "project_id" });

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: `New wedding group client '${name}' successfully generated and configured in Supabase.`
              }
            ]
          }
        };
      }

      case "add_wedding_photo": {
        const { id: pId, name, image, category } = args;
        await supabase.from("wedding_photos").insert({
          id: pId.length === 36 ? pId : undefined,
          name,
          image,
          category: category || "Dot",
          created_at: new Date().toISOString()
        });

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: `Photo '${name}' correctly saved in the Supabase database under category '${category}'.`
              }
            ]
          }
        };
      }

      case "reset_all_data": {
        await supabase.from("wedding_photos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("wedding_client_selections").delete().neq("project_id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("wedding_chats").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: "Entire database reset back to blank Supabase tables successfully."
              }
            ]
          }
        };
      }

      default:
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Tool '${name}' is not integrated in this wedding selector framework.`
          }
        };
    }
  }

  // Fallback for missing methods
  return {
    jsonrpc: "2.0",
    id: id || null,
    error: {
      code: -32601,
      message: `Method '${method}' is not implemented.`
    }
  };
}

// 1. HTTP-POST direct endpoint for MCP clients
app.post("/api/mcp", async (req, res) => {
  const result = await handleMCPRequest(req.body);
  res.json(result);
});

// 2. Official MCP Server-Sent Events SSE Transport
let mcpClients: Array<{ id: string; res: express.Response }> = [];

app.get("/api/mcp/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const clientId = "client_" + Date.now();
  
  // SSE connection handshake: send the message post URL back to the client
  // The client will use this endpoint to post JSON-RPC commands
  const messageUrl = `/api/mcp/message?id=${clientId}`;
  res.write(`event: endpoint\ndata: ${messageUrl}\n\n`);

  mcpClients.push({ id: clientId, res });
  console.log(`[MCP SSE] Client connected: ${clientId}. Total connected: ${mcpClients.length}`);

  req.on("close", () => {
    mcpClients = mcpClients.filter(c => c.id !== clientId);
    console.log(`[MCP SSE] Client disconnected: ${clientId}. Total remaining: ${mcpClients.length}`);
  });
});

app.post("/api/mcp/message", async (req, res) => {
  const { id } = req.query;
  const result = await handleMCPRequest(req.body);
  
  // Find the SSE client response and stream the reply back
  const client = mcpClients.find(c => c.id === id);
  if (client) {
    client.res.write(`event: message\ndata: ${JSON.stringify(result)}\n\n`);
    res.status(202).send("Accepted");
  } else {
    // If not found in active SSE clients, send response back directly via HTTP
    res.json(result);
  }
});


/* ========================================================
   VITE DEV MIDDLEWARE AND PRODUCTION STATIC BUILD SERVING
   ======================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Protect our API routes, let Vite handle all other static routes
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT) || 3001, "0.0.0.0", () => {
    console.log(`===============================================`);
    console.log(`💒 Wedding Photo Select & MCP Server online !`);
    console.log(`🖥️ Web UI / Local Dev: http://localhost:${PORT}`);
    console.log(`🔗 MCP HTTP endpoint: http://localhost:${PORT}/api/mcp`);
    console.log(`📥 MCP SSE handshake: http://localhost:${PORT}/api/mcp/sse`);
    console.log(`===============================================`);
  });
}

startServer();

