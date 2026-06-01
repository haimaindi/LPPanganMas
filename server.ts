import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createClient } from "@libsql/client/web";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import type { Readable } from "stream";
import multer from "multer";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = 3000;

// Async handler wrapper to catch unhandled promise rejections
const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;
for (const method of methods) {
  const original = app[method].bind(app);
  app[method] = function (path: any, ...handlers: any[]) {
    const wrappedHandlers = handlers.map((h: any) => {
      if (typeof h === 'function') {
        return (req: Request, res: Response, next: NextFunction) => {
          try {
            const result = h(req, res, next);
            if (result instanceof Promise) {
              result.catch(next);
            }
          } catch (err) {
            next(err);
          }
        };
      }
      return h;
    });
    return original(path, ...wrappedHandlers);
  } as any;
}

// Multer setup for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const isVercel = process.env.VERCEL === "1";
const dbUrl = process.env.VITE_TURSO_DB_URL || (isVercel ? "libsql://dummy-for-build.turso.io" : "file:local.db");

// Turso Database Client
const db = createClient({
  url: dbUrl,
  authToken: process.env.VITE_TURSO_DB_AUTH_TOKEN || "dummy",
});

// Tigris S3 Client
let s3: S3Client | null = null;
try {
  s3 = new S3Client({
    region: "auto",
    endpoint: process.env.TIGRIS_STORAGE_ENDPOINT || "https://t3.storage.dev",
    credentials: {
      accessKeyId: process.env.TIGRIS_STORAGE_ACCESS_KEY_ID || "placeholder",
      secretAccessKey: process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY || "placeholder",
    },
    forcePathStyle: true, // WAJIB untuk Tigris sesuai Guide/Tigris.md
  });
} catch (e) {
  console.error("Failed to initialize S3Client:", e);
}

app.use(express.json());

// Initialize Database Tables
async function initDB() {
  console.log("Initializing database...");
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        specs TEXT NOT NULL DEFAULT '-',
        image_url TEXT,
        badge TEXT,
        isPromote INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        "order" INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Migration: Handle transitioning previous schema
    try {
      const tableInfo = await db.execute("PRAGMA table_info(products)");
      const columnNames = tableInfo.rows.map(row => row.name);

      if (!columnNames.includes('isPromote')) {
        await db.execute("ALTER TABLE products ADD COLUMN isPromote INTEGER DEFAULT 0");
      }
      if (!columnNames.includes('isActive')) {
        await db.execute("ALTER TABLE products ADD COLUMN isActive INTEGER DEFAULT 1");
      }
      if (!columnNames.includes('order')) {
        await db.execute('ALTER TABLE products ADD COLUMN "order" INTEGER DEFAULT 0');
      }

    } catch (e) {
      console.error("Migration error (might be okay if already migrated):", e);
    }
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        logo_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        cta_text TEXT NOT NULL,
        cta_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        whatsapp_pilihan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS branch_gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        nama TEXT NOT NULL,
        perusahaan TEXT NOT NULL,
        telepon TEXT NOT NULL,
        email TEXT NOT NULL,
        pesan TEXT NOT NULL,
        attachments TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS company_profile (
        id TEXT PRIMARY KEY,
        hero_title TEXT NOT NULL,
        hero_title_color TEXT,
        hero_subtitle TEXT NOT NULL,
        hero_subtitle_color TEXT,
        hero_image TEXT NOT NULL,
        about_title TEXT NOT NULL,
        about_content TEXT NOT NULL,
        vision_title TEXT NOT NULL,
        vision_text TEXT NOT NULL,
        mission_title TEXT NOT NULL,
        mission_content TEXT NOT NULL,
        portfolio_link TEXT,
        footer_text TEXT,
        contact_address TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      const tableInfo = await db.execute("PRAGMA table_info(company_profile)");
      if (!tableInfo.rows.some(row => row.name === 'portfolio_link')) {
        await db.execute("ALTER TABLE company_profile ADD COLUMN portfolio_link TEXT");
      }
      if (!tableInfo.rows.some(row => row.name === 'footer_text')) {
        await db.execute("ALTER TABLE company_profile ADD COLUMN footer_text TEXT");
      }
      if (!tableInfo.rows.some(row => row.name === 'contact_address')) {
        await db.execute("ALTER TABLE company_profile ADD COLUMN contact_address TEXT");
      }
      if (!tableInfo.rows.some(row => row.name === 'contact_phone')) {
        await db.execute("ALTER TABLE company_profile ADD COLUMN contact_phone TEXT");
      }
      if (!tableInfo.rows.some(row => row.name === 'contact_email')) {
        await db.execute("ALTER TABLE company_profile ADD COLUMN contact_email TEXT");
      }
    } catch(e) {}

    // Add company profile if empty
    const profileCount = await db.execute("SELECT COUNT(*) as count FROM company_profile");
    if (Number(profileCount.rows[0].count) === 0) {
      await db.execute({
        sql: `INSERT INTO company_profile (
          id, hero_title, hero_title_color, hero_subtitle, hero_subtitle_color, 
          hero_image, about_title, about_content, 
          vision_title, vision_text, mission_title, mission_content,
          footer_text, contact_address, contact_phone, contact_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          "main",
          "Profil Perusahaan",
          "#ffffff",
          "Membangun Masa Depan Pertanian Indonesia",
          "#ffffff",
          "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=2000",
          "Tentang Kami",
          "<p>PT Pangan Mas Abadi adalah pemimpin dalam inovasi pertanian dan distribusi pangan di Indonesia. Selama lebih dari satu dekade, kami telah berkomitmen untuk memberdayakan petani lokal melalui teknologi modern, penyediaan benih berkualitas tinggi, dan dukungan teknis yang tak tertandingi di lapangan.</p><p>Kami percaya bahwa kedaulatan pangan dimulai dari tanah yang subur dan petani yang sejahtera. Oleh karena itu, setiap langkah yang kami ambil didorong oleh misi untuk meningkatkan produktivitas pertanian nasional tanpa mengesampingkan keberlanjutan lingkungan.</p>",
          "Visi Kami",
          "<p>Menjadi mitra terpercaya bagi petani Indonesia dalam mewujudkan kemandirian pangan melalui inovasi berkelanjutan dan penyediaan solusi pertanian terpadu.</p>",
          "Misi Kami",
          "<ul><li>Mengembangkan teknologi pertanian yang adaptif dan efisien.</li><li>Menjamin ketersediaan sarana produksi pertanian berkualitas.</li><li>Memberikan edukasi dan pendampingan berkelanjutan bagi komunitas petani.</li><li>Membangun ekosistem distribusi pangan yang transparan dan adil.</li></ul>",
          "Mitra terpercaya dalam penyediaan kebutuhan pangan segar dan berkualitas untuk keluarga Indonesia.",
          "Jl. Raya Pangan No. 88, Jakarta",
          "+62 21 5555 8888",
          "info@panganmasabadi.co.id"
        ]
      });
    }

    // Add sample data if empty
    const productsCount = await db.execute("SELECT COUNT(*) as count FROM products");
    if (Number(productsCount.rows[0].count) === 0) {
      await db.execute({
        sql: "INSERT INTO products (title, category, specs, image_url, badge) VALUES (?, ?, ?, ?, ?)",
        args: ["Beras Organik Premium 5kg", "Bahan Pokok", "Beras organik pilihan dengan kualitas premium, tanpa pemutih dan pengawet. Cocok untuk konsumsi harian keluarga.", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800", "Terlaris"]
      });
      await db.execute({
        sql: "INSERT INTO products (title, category, specs, image_url) VALUES (?, ?, ?, ?)",
        args: ["Minyak Goreng Kemurnian 2L", "Bahan Masak", "Minyak goreng kelapa sawit pilihan yang diproses melalui multi-tahap pemurnian untuk menghasilkan minyak yang jernih dan sehat.", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800"]
      });
    }

    const clientsCount = await db.execute("SELECT COUNT(*) as count FROM clients");
    if (Number(clientsCount.rows[0].count) === 0) {
      const sampleClients = [
        ["Retail Asia", "https://picsum.photos/seed/c1/200/100"],
        ["IndoFood Corp", "https://picsum.photos/seed/c2/200/100"],
        ["Global Agros", "https://picsum.photos/seed/c3/200/100"],
        ["Nusantara Mart", "https://picsum.photos/seed/c4/200/100"]
      ];
      for (const [name, logo] of sampleClients) {
        await db.execute({
          sql: "INSERT INTO clients (name, logo_url) VALUES (?, ?)",
          args: [name, logo]
        });
      }
    }

    const slidesCount = await db.execute("SELECT COUNT(*) as count FROM slides");
    if (Number(slidesCount.rows[0].count) === 0) {
      await db.execute({
        sql: "INSERT INTO slides (image_url, title, subtitle, cta_text, cta_url) VALUES (?, ?, ?, ?, ?)",
        args: [
          "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?auto=format&fit=crop&q=80&w=1920",
          "Kualitas Pangan Terbaik untuk Indonesia",
          "Menyediakan bahan pangan segar dan berkualitas tinggi langsung dari petani terbaik ke meja Anda.",
          "Lihat Produk",
          "#produk"
        ]
      });
    }

    const branchesCount = await db.execute("SELECT COUNT(*) as count FROM branches");
    if (Number(branchesCount.rows[0].count) === 0) {
      // Magelang
      const magelangRes = await db.execute({
        sql: "INSERT INTO branches (slug, name, phone, email, address, lat, lng, whatsapp_pilihan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: ["magelang", "Cabang Magelang", "+62 293 123456", "magelang@panganmas.co.id", "Jl. Pemuda No. 123, Kel. Kemirirejo, Kec. Magelang Tengah, Kota Magelang, Jawa Tengah 56122", -7.4706, 110.2178, "62293123456"]
      });
      const magelangId = Number(magelangRes.lastInsertRowid);
      
      const magelangGallery = [
        ["Gudang Utama", "Fasilitas gudang penyimpanan modern dengan sistem pengelolaan stok real-time.", "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800"],
        ["Area Kantor", "Ruang administrasi dan pelayanan pelanggan yang nyaman dan profesional.", "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"],
        ["Armada Logistik", "Unit pengiriman yang siap mendistribusikan produk ke seluruh wilayah.", "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800"],
        ["Loading Dock", "Area bongkar muat yang luas untuk efisiensi distribusi barang.", "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=800"]
      ];
      for (const [title, desc, img] of magelangGallery) {
        await db.execute({
          sql: "INSERT INTO branch_gallery (branch_id, title, description, image_url) VALUES (?, ?, ?, ?)",
          args: [magelangId, title, desc, img]
        });
      }

      // Malang
      const malangRes = await db.execute({
        sql: "INSERT INTO branches (slug, name, phone, email, address, lat, lng, whatsapp_pilihan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: ["malang", "Cabang Malang", "+62 341 987654", "malang@panganmas.co.id", "Jl. Ijen No. 45, Kel. Oro-oro Dowo, Kec. Klojen, Kota Malang, Jawa Timur 65119", -7.9666, 112.6326, "62341987654"]
      });
      const malangId = Number(malangRes.lastInsertRowid);

      const malangGallery = [
        ["Gudang Distribusi", "Pusat distribusi utama wilayah Jawa Timur bagian selatan.", "https://images.unsplash.com/photo-1494412574743-019475a8993d?auto=format&fit=crop&q=80&w=800"],
        ["Kantor Cabang", "Pusat operasional dan layanan mitra di Malang.", "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=800"],
        ["Area Loading", "Fasilitas bongkar muat modern untuk percepatan logistik.", "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800"],
        ["Showroom Produk", "Display produk unggulan kami untuk para mitra bisnis.", "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=800"]
      ];
      for (const [title, desc, img] of malangGallery) {
        await db.execute({
          sql: "INSERT INTO branch_gallery (branch_id, title, description, image_url) VALUES (?, ?, ?, ?)",
          args: [malangId, title, desc, img]
        });
      }
    }
  } catch (error) {
    console.error("DB Initialization Error:", error);
  }
}

// initDB() is now called in startServer()

// Initialize DB manually via API
app.get("/api/init-db", async (req, res) => {
  try {
    await initDB();
    res.json({ message: "Database initialized successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to initialize db: " + (error as any).message });
  }
});

// API ROUTES

// Read image from private Tigris bucket
app.get("/api/images/:key", async (req, res) => {
  try {
    if (!s3) {
      return res.status(500).json({ error: "S3 Client not configured" });
    }

    const { key } = req.params;
    const bucketName = process.env.TIGRIS_STORAGE_BUCKET || "pangan-mas-abadi";

    const response = await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));

    if (response.ContentType) res.setHeader("Content-Type", response.ContentType);
    if (response.ContentLength) res.setHeader("Content-Length", response.ContentLength);
    // Cache di browser agar akses kembali lebih cepat
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    if (response.Body) {
      // Pipe stream file langsung ke client
      (response.Body as Readable).pipe(res);
    } else {
      res.status(404).send("File tidak ditemukan");
    }
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      res.status(404).send("File tidak ditemukan");
    } else {
      console.error("Error fetching image from Tigris:", error);
      res.status(500).send("Gagal mengambil gambar");
    }
  }
});

// Upload to Tigris
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!s3) {
      return res.status(500).json({ error: "S3 Client not configured" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${crypto.randomBytes(16).toString("hex")}${fileExtension}`;
    const bucketName = process.env.TIGRIS_STORAGE_BUCKET || "pangan-mas-abadi";

    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    // Karena bucket direstriksi menjadi Private, kita kembalikan URL endpoint lokal (proxy)
    // yang akan melayani gambar ini menggunakan kredensial SDK backend.
    const imageUrl = `/api/images/${fileName}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Internal server error during upload" });
  }
});

// Products
app.get("/api/products", async (req, res) => {
  const result = await db.execute("SELECT * FROM products ORDER BY \"order\" ASC, created_at DESC");
  const products = result.rows.map(row => ({
    ...row,
    isPromote: !!row.isPromote,
    isActive: !!row.isActive,
    order: Number(row.order)
  }));
  res.json(products);
});

app.post("/api/products", async (req, res) => {
  const { title, category, specs, image_url, badge, isPromote, isActive, order } = req.body;
  await db.execute({
    sql: "INSERT INTO products (title, category, specs, image_url, badge, isPromote, isActive, \"order\") VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [title, category, specs, image_url, badge, isPromote ? 1 : 0, isActive ? 1 : 0, order]
  });
  res.status(201).json({ message: "Product created" });
});

app.delete("/api/products/:id", async (req, res) => {
  await db.execute({
    sql: "DELETE FROM products WHERE id = ?",
    args: [req.params.id]
  });
  res.json({ message: "Product deleted" });
});

// Slides
app.get("/api/slides", async (req, res) => {
  const result = await db.execute("SELECT * FROM slides ORDER BY created_at ASC");
  res.json(result.rows);
});

app.post("/api/slides", async (req, res) => {
  const { image_url, title, subtitle, cta_text, cta_url } = req.body;
  
  // Max 3 slides check
  const countRes = await db.execute("SELECT COUNT(*) as count FROM slides");
  if (Number(countRes.rows[0].count) >= 3) {
    return res.status(400).json({ error: "Maximum 3 slides allowed" });
  }

  await db.execute({
    sql: "INSERT INTO slides (image_url, title, subtitle, cta_text, cta_url) VALUES (?, ?, ?, ?, ?)",
    args: [image_url, title, subtitle, cta_text, cta_url]
  });
  res.status(201).json({ message: "Slide created" });
});

app.delete("/api/slides/:id", async (req, res) => {
  await db.execute({
    sql: "DELETE FROM slides WHERE id = ?",
    args: [req.params.id]
  });
  res.json({ message: "Slide deleted" });
});

app.put("/api/slides/:id", async (req, res) => {
  const { image_url, title, subtitle, cta_text, cta_url } = req.body;
  await db.execute({
    sql: "UPDATE slides SET image_url = ?, title = ?, subtitle = ?, cta_text = ?, cta_url = ? WHERE id = ?",
    args: [image_url, title, subtitle, cta_text, cta_url, req.params.id]
  });
  res.json({ message: "Slide updated" });
});

// Clients
app.get("/api/clients", async (req, res) => {
  const result = await db.execute("SELECT * FROM clients ORDER BY created_at DESC");
  res.json(result.rows);
});

// Company Profile
app.get("/api/profile", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM company_profile WHERE id = 'main'");
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    const row = result.rows[0];
    // Map underscore to camelCase for frontend
    res.json({
      heroTitle: row.hero_title,
      heroTitleColor: row.hero_title_color || '#ffffff',
      heroSubtitle: row.hero_subtitle,
      heroSubtitleColor: row.hero_subtitle_color || '#ffffff',
      heroImage: row.hero_image,
      aboutTitle: row.about_title,
      aboutContent: row.about_content,
      visionTitle: row.vision_title,
      visionText: row.vision_text,
      missionTitle: row.mission_title,
      missionContent: row.mission_content,
      portfolioLink: row.portfolio_link,
      footerText: row.footer_text || 'Mitra terpercaya dalam penyediaan kebutuhan pangan segar dan berkualitas untuk keluarga Indonesia.',
      contactAddress: row.contact_address || 'Jl. Raya Pangan No. 88, Jakarta',
      contactPhone: row.contact_phone || '+62 21 5555 8888',
      contactEmail: row.contact_email || 'info@panganmasabadi.co.id',
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/profile", async (req, res) => {
  try {
    const { 
      heroTitle, heroTitleColor, heroSubtitle, heroSubtitleColor, 
      heroImage, aboutTitle, aboutContent, 
      visionTitle, visionText, missionTitle, missionContent, portfolioLink,
      footerText, contactAddress, contactPhone, contactEmail
    } = req.body;

    await db.execute({
      sql: `UPDATE company_profile SET 
        hero_title = ?, hero_title_color = ?, hero_subtitle = ?, hero_subtitle_color = ?, 
        hero_image = ?, about_title = ?, 
        about_content = ?, vision_title = ?, vision_text = ?, mission_title = ?, 
        mission_content = ?, portfolio_link = ?, footer_text = ?, contact_address = ?, contact_phone = ?, contact_email = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 'main'`,
      args: [
        heroTitle, heroTitleColor, heroSubtitle, heroSubtitleColor, 
        heroImage, aboutTitle, aboutContent, 
        visionTitle, visionText, missionTitle, missionContent, portfolioLink,
        footerText, contactAddress, contactPhone, contactEmail
      ]
    });
    res.json({ message: "Profile updated" });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/clients", async (req, res) => {
  const { name, logo_url } = req.body;
  await db.execute({
    sql: "INSERT INTO clients (name, logo_url) VALUES (?, ?)",
    args: [name, logo_url]
  });
  res.status(201).json({ message: "Client created" });
});

app.delete("/api/clients/:id", async (req, res) => {
  await db.execute({
    sql: "DELETE FROM clients WHERE id = ?",
    args: [req.params.id]
  });
  res.json({ message: "Client deleted" });
});

app.put("/api/clients/:id", async (req, res) => {
  const { name, logo_url } = req.body;
  await db.execute({
    sql: "UPDATE clients SET name = ?, logo_url = ? WHERE id = ?",
    args: [name, logo_url, req.params.id]
  });
  res.json({ message: "Client updated" });
});

// Update Product
app.put("/api/products/:id", async (req, res) => {
  const { title, category, specs, image_url, badge, isPromote, isActive, order } = req.body;
  await db.execute({
    sql: "UPDATE products SET title = ?, category = ?, specs = ?, image_url = ?, badge = ?, isPromote = ?, isActive = ?, \"order\" = ? WHERE id = ?",
    args: [title, category, specs, image_url, badge, isPromote ? 1 : 0, isActive ? 1 : 0, order, req.params.id]
  });
  res.json({ message: "Product updated" });
});

// Branches API
app.get("/api/branches", async (req, res) => {
  const result = await db.execute("SELECT * FROM branches ORDER BY name ASC");
  res.json(result.rows);
});

app.get("/api/branches/:slugOrId", async (req, res) => {
  const { slugOrId } = req.params;
  let sql = "SELECT * FROM branches WHERE slug = ?";
  if (!isNaN(Number(slugOrId))) {
    sql = "SELECT * FROM branches WHERE id = ?";
  }
  
  const result = await db.execute({ sql, args: [slugOrId] });
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Branch not found" });
  }
  
  const branch = result.rows[0];
  const gallery = await db.execute({
    sql: "SELECT * FROM branch_gallery WHERE branch_id = ? ORDER BY id ASC",
    args: [branch.id]
  });
  
  res.json({ ...branch, gallery: gallery.rows });
});

app.put("/api/branches/:id", async (req, res) => {
  const { name, phone, email, address, lat, lng, whatsapp_pilihan } = req.body;
  await db.execute({
    sql: "UPDATE branches SET name = ?, phone = ?, email = ?, address = ?, lat = ?, lng = ?, whatsapp_pilihan = ? WHERE id = ?",
    args: [name, phone, email, address, Number(lat), Number(lng), whatsapp_pilihan, req.params.id]
  });
  res.json({ message: "Branch updated" });
});

app.post("/api/branches/:id/gallery", async (req, res) => {
  const { title, description, image_url } = req.body;
  await db.execute({
    sql: "INSERT INTO branch_gallery (branch_id, title, description, image_url) VALUES (?, ?, ?, ?)",
    args: [req.params.id, title, description, image_url]
  });
  res.status(201).json({ message: "Gallery item added" });
});

app.delete("/api/branches/gallery/:id", async (req, res) => {
  await db.execute({
    sql: "DELETE FROM branch_gallery WHERE id = ?",
    args: [req.params.id]
  });
  res.json({ message: "Gallery item deleted" });
});

app.put("/api/branches/gallery/:id", async (req, res) => {
  console.log("Updating gallery item:", req.params.id, req.body);
  const { title, description, image_url } = req.body;
  try {
    await db.execute({
      sql: "UPDATE branch_gallery SET title = ?, description = ?, image_url = ? WHERE id = ?",
      args: [title, description, image_url, req.params.id]
    });
    res.json({ message: "Gallery item updated" });
  } catch (error) {
    console.error("Gallery update error:", error);
    res.status(500).json({ error: "Failed to update gallery" });
  }
});

// Contacts API
app.get("/api/contacts", async (req, res) => {
  const result = await db.execute("SELECT * FROM contacts ORDER BY created_at DESC");
  // Parse attachments
  const contacts = result.rows.map(row => ({
    ...row,
    attachments: row.attachments ? JSON.parse(row.attachments as string) : []
  }));
  res.json(contacts);
});

app.post("/api/contacts", async (req, res) => {
  const { type, nama, perusahaan, telepon, email, pesan, attachments } = req.body;
  await db.execute({
    sql: "INSERT INTO contacts (type, nama, perusahaan, telepon, email, pesan, attachments) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [type, nama, perusahaan, telepon, email, pesan, JSON.stringify(attachments)]
  });
  res.status(201).json({ message: "Message sent successfully" });
});

app.patch("/api/contacts/:id/read", async (req, res) => {
  const { is_read } = req.body;
  await db.execute({
    sql: "UPDATE contacts SET is_read = ? WHERE id = ?",
    args: [is_read ? 1 : 0, req.params.id]
  });
  res.json({ message: "Status updated" });
});

app.delete("/api/contacts/:id", async (req, res) => {
  await db.execute({
    sql: "DELETE FROM contacts WHERE id = ?",
    args: [req.params.id]
  });
  res.json({ message: "Message deleted" });
});

// Vite middleware setup
app.post("/api/login", async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD not set");
    return res.status(500).json({ error: "Configuration error" });
  }

  if (password === adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Akses tidak diterima" });
  }
});

async function startServer() {
  await initDB();
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Global Error Handler for API routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
  next(err);
});

// Only start the server if we are not running on Vercel
if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
