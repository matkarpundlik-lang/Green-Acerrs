import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  formatEnquiryReference,
  validateEnquiryInput,
  type EnquiryType,
} from './src/utils/enquiryValidation.ts';
import {
  DEFAULT_SHEET_TAB_TITLE,
  DEFAULT_SPREADSHEET_TITLE,
  SHEET_HEADER_ROW,
  buildCreateSpreadsheetPayload,
  buildHeaderFormatBatchRequest,
  enquiryToSheetRow,
} from './src/utils/googleSheetsFormat.ts';

interface StoredEnquiry {
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  pincode: string;
  message: string;
  enquiryType: EnquiryType;
  submittedAt: string;
  syncedToSheet?: boolean;
}

interface StoredSheetConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  tabTitle: string;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ENQUIRIES_FILE = path.join(DATA_DIR, 'enquiries.json');
const SHEET_CONFIG_FILE = path.join(DATA_DIR, 'sheets-config.json');

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

function readSheetConfig(): StoredSheetConfig | null {
  try {
    if (!fs.existsSync(SHEET_CONFIG_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(SHEET_CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.spreadsheetId === 'string' && parsed.spreadsheetId) {
      return parsed as StoredSheetConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function writeSheetConfig(config: StoredSheetConfig): void {
  ensureDataDir();
  fs.writeFileSync(SHEET_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

async function resolveFirstSheetTabTitle(
  spreadsheetId: string,
  bearerHeader: string
): Promise<string> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`,
    {
      headers: { Authorization: bearerHeader },
    }
  );
  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Failed to inspect spreadsheet metadata (${metaRes.status}): ${errText}`);
  }
  const meta = (await metaRes.json()) as {
    sheets?: Array<{ properties?: { title?: string } }>;
  };
  return meta.sheets?.[0]?.properties?.title ?? DEFAULT_SHEET_TAB_TITLE;
}

async function appendRowsToGoogleSheet(
  spreadsheetId: string,
  bearerHeader: string,
  rows: string[][]
): Promise<{ updatedRows: number; tabTitle: string }> {
  const tabTitle = await resolveFirstSheetTabTitle(spreadsheetId, bearerHeader);
  const encodedRange = encodeURIComponent(`'${tabTitle}'!A1`);
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: bearerHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );
  if (!appendRes.ok) {
    const errText = await appendRes.text();
    throw new Error(`Google Sheets append failed (${appendRes.status}): ${errText}`);
  }
  const result = (await appendRes.json()) as {
    updates?: { updatedRows?: number };
  };
  return {
    updatedRows: result.updates?.updatedRows ?? rows.length,
    tabTitle,
  };
}

const ZAPIER_WEBHOOK_URL =
  process.env.ZAPIER_WEBHOOK_URL ||
  'https://hooks.zapier.com/hooks/catch/29456764/45lokry/';

async function sendEnquiryToZapier(record: StoredEnquiry): Promise<void> {
  try {
    const res = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      console.error(`Zapier webhook responded with ${res.status}`);
    }
  } catch (err) {
    console.error('Zapier webhook failed:', err);
  }
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
    const unsyncedCount = entries.filter((item) => !item.syncedToSheet).length;
    res.json({
      count: entries.length,
      unsyncedCount,
      recentReferences: entries.slice(-5).map((item) => ({
        reference: item.reference,
        enquiryType: item.enquiryType,
        submittedAt: item.submittedAt,
        syncedToSheet: Boolean(item.syncedToSheet),
      })),
    });
  });

  app.get('/api/sheets/config', (_req, res) => {
    const config = readSheetConfig();
    const entries = readEnquiries();
    const unsyncedCount = entries.filter((item) => !item.syncedToSheet).length;
    res.json({
      configured: Boolean(config),
      sheet: config,
      totalEnquiries: entries.length,
      unsyncedCount,
    });
  });

  app.post('/api/sheets/create', async (req, res) => {
    const bearer = req.headers.authorization;
    if (!bearer || !bearer.startsWith('Bearer ')) {
      res.status(401).json({
        ok: false,
        message: 'Sign in with Google first to create a spreadsheet in your Google account.',
      });
      return;
    }

    const requestedTitle =
      typeof req.body?.title === 'string' && req.body.title.trim().length > 0
        ? req.body.title.trim().slice(0, 120)
        : DEFAULT_SPREADSHEET_TITLE;

    try {
      const createPayload = buildCreateSpreadsheetPayload(
        requestedTitle,
        DEFAULT_SHEET_TAB_TITLE
      );
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: bearer,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPayload),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        res.status(createRes.status).json({
          ok: false,
          message: `Google Sheets refused spreadsheet creation (${createRes.status}). Please re-authenticate and ensure Sheets access is granted.`,
          detail: errText,
        });
        return;
      }

      const created = (await createRes.json()) as {
        spreadsheetId: string;
        spreadsheetUrl: string;
        properties?: { title?: string };
        sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
      };

      const firstSheetId = created.sheets?.[0]?.properties?.sheetId ?? 0;
      const actualTabTitle = created.sheets?.[0]?.properties?.title ?? DEFAULT_SHEET_TAB_TITLE;

      // Write header row
      await appendRowsToGoogleSheet(created.spreadsheetId, bearer, [[...SHEET_HEADER_ROW]]);

      // Apply clean dark-teal/ivory header formatting and column sizing
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(created.spreadsheetId)}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: bearer,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildHeaderFormatBatchRequest(firstSheetId)),
        }
      );

      const savedConfig: StoredSheetConfig = {
        spreadsheetId: created.spreadsheetId,
        spreadsheetTitle: created.properties?.title ?? requestedTitle,
        spreadsheetUrl: created.spreadsheetUrl,
        tabTitle: actualTabTitle,
        createdAt: new Date().toISOString(),
      };
      writeSheetConfig(savedConfig);

      // Sync any already-captured local enquiries immediately if requested
      const entries = readEnquiries();
      let syncedExistingCount = 0;
      if (req.body?.syncExisting && entries.length > 0) {
        const unsynced = entries.filter((e) => !e.syncedToSheet);
        if (unsynced.length > 0) {
          await appendRowsToGoogleSheet(
            savedConfig.spreadsheetId,
            bearer,
            unsynced.map(enquiryToSheetRow)
          );
          for (const item of entries) {
            item.syncedToSheet = true;
          }
          writeEnquiries(entries);
          syncedExistingCount = unsynced.length;
        }
      }

      res.status(201).json({
        ok: true,
        sheet: savedConfig,
        syncedExistingCount,
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unexpected error creating Google Spreadsheet.',
      });
    }
  });

  app.post('/api/sheets/sync-pending', async (req, res) => {
    const bearer = req.headers.authorization;
    if (!bearer || !bearer.startsWith('Bearer ')) {
      res.status(401).json({
        ok: false,
        message: 'Sign in with Google to push saved enquiries to Google Sheets.',
      });
      return;
    }

    const config = readSheetConfig();
    if (!config) {
      res.status(400).json({
        ok: false,
        message: 'Create or link the Green Acrres Google Sheet first.',
      });
      return;
    }

    const entries = readEnquiries();
    const unsynced = entries.filter((item) => !item.syncedToSheet);
    if (unsynced.length === 0) {
      res.json({
        ok: true,
        syncedCount: 0,
        sheet: config,
      });
      return;
    }

    try {
      await appendRowsToGoogleSheet(
        config.spreadsheetId,
        bearer,
        unsynced.map(enquiryToSheetRow)
      );
      for (const item of entries) {
        item.syncedToSheet = true;
      }
      writeEnquiries(entries);
      res.json({
        ok: true,
        syncedCount: unsynced.length,
        sheet: config,
      });
    } catch (error) {
      res.status(502).json({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to append enquiries to Google Sheets.',
      });
    }
  });

  app.post('/api/enquiries', async (req, res) => {
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
      syncedToSheet: false,
    };

    const bearer = req.headers.authorization;
    const sheetConfig = readSheetConfig();
    const pushRequested = Boolean(req.body?.pushToSheet);

    let sheetSync: {
      synced: boolean;
      spreadsheetUrl?: string;
      spreadsheetTitle?: string;
      error?: string;
    } = { synced: false };

    if (pushRequested && bearer?.startsWith('Bearer ') && sheetConfig) {
      try {
        await appendRowsToGoogleSheet(sheetConfig.spreadsheetId, bearer, [
          enquiryToSheetRow(record),
        ]);
        record.syncedToSheet = true;
        sheetSync = {
          synced: true,
          spreadsheetUrl: sheetConfig.spreadsheetUrl,
          spreadsheetTitle: sheetConfig.spreadsheetTitle,
        };
      } catch (err) {
        sheetSync = {
          synced: false,
          spreadsheetUrl: sheetConfig.spreadsheetUrl,
          spreadsheetTitle: sheetConfig.spreadsheetTitle,
          error: err instanceof Error ? err.message : 'Google Sheets push failed.',
        };
      }
    }

    existing.push(record);
    writeEnquiries(existing);

    // Send the enquiry to Zapier (runs in the background; never blocks the form)
    void sendEnquiryToZapier(record);

    res.status(201).json({
      ok: true,
      reference: record.reference,
      submittedAt: record.submittedAt,
      enquiryType: record.enquiryType,
      fullName: record.fullName,
      sheetSync,
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
