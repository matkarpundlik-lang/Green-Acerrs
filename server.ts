import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  formatEnquiryReference,
  validateEnquiryInput,
  type EnquiryType,
} from './src/utils/enquiryValidation.ts';

interface StoredEnquiry {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  pincode: string;
  message: string;
  enquiryType: EnquiryType;
  submittedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ENQUIRIES_FILE = path.join(DATA_DIR, 'enquiries.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readEnquiries(): StoredEnquiry[] {
  try {
    if (!fs.existsSync(ENQUIRIES_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(ENQUIRIES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEnquiries(entries: StoredEnquiry[]): void {
  ensureDataDir();
  fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'green-acrres-paradigm' });
  });

  app.get('/api/enquiries/summary', (_req, res) => {
    const entries = readEnquiries();
    res.json({
      count: entries.length,
      recentReferences: entries.slice(-5).map((item) => ({
        reference: item.reference,
        enquiryType: item.enquiryType,
        submittedAt: item.submittedAt,
      })),
    });
  });

  app.post('/api/enquiries', (req, res) => {
    const validation = validateEnquiryInput(req.body ?? {});
    if (!validation.valid) {
      res.status(400).json({
        ok: false,
        message: 'Please review the highlighted fields before submitting.',
        errors: validation.errors,
      });
      return;
    }

    const existing = readEnquiries();
    const now = Date.now();
    const reference = formatEnquiryReference(existing.length + 1, now);
    const record: StoredEnquiry = {
      reference,
      fullName: validation.sanitized.fullName,
      email: validation.sanitized.email,
      phone: validation.sanitized.phone,
      pincode: validation.sanitized.pincode ?? '',
      message: validation.sanitized.message ?? '',
      enquiryType: validation.sanitized.enquiryType,
      submittedAt: new Date(now).toISOString(),
    };

    existing.push(record);
    writeEnquiries(existing);

    res.status(201).json({
      ok: true,
      reference: record.reference,
      submittedAt: record.submittedAt,
      enquiryType: record.enquiryType,
      fullName: record.fullName,
    });
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    app.get('/api/dev-export/green-acrres-project.zip', (_req, res) => {
      const archivePath = path.resolve(
        process.cwd(),
        '.aistudio/artifacts/brain/27955c98-197d-4c74-9b1c-8340c614e305/green-acrres-project.zip'
      );
      if (!fs.existsSync(archivePath)) {
        res.status(404).json({ ok: false, message: 'Source archive not found.' });
        return;
      }
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="green-acrres-project.zip"');
      res.setHeader('Cache-Control', 'no-store');
      res.sendFile(archivePath);
    });

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Green Acrres server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
