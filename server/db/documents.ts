import { query } from './connection';
import { moveFtpFolder } from './ftp';

// --- SECURED DOCUMENTS SECTION ---
export async function saveDocument(id: string, doc: any): Promise<void> {
  await query(`
    INSERT INTO secured_documents (id, title, fileName, url, uploadedBy, category, identifier, docType, isDeleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      fileName = VALUES(fileName),
      url = VALUES(url),
      uploadedBy = VALUES(uploadedBy),
      category = VALUES(category),
      identifier = VALUES(identifier),
      docType = VALUES(docType),
      isDeleted = VALUES(isDeleted)
  `, [
    id,
    doc.title,
    doc.fileName || '',
    doc.url,
    doc.uploadedBy || '',
    doc.category || '',
    doc.identifier || '',
    doc.docType || '',
    doc.isDeleted ? 1 : 0
  ]);
}

export async function getDocument(id: string): Promise<any | null> {
  const rows = await query("SELECT * FROM secured_documents WHERE id = ?", [id]);
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    fileName: row.fileName,
    url: row.url,
    uploadedBy: row.uploadedBy,
    category: row.category || '',
    identifier: row.identifier || '',
    docType: row.docType || '',
    isDeleted: Boolean(row.isDeleted),
    uploadedAt: row.uploadedAt ? new Date(row.uploadedAt).toISOString() : null
  };
}

export async function getAllDocuments(): Promise<any[]> {
  const rows = await query("SELECT * FROM secured_documents WHERE isDeleted = 0 OR isDeleted IS NULL ORDER BY uploadedAt DESC");
  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    fileName: row.fileName,
    url: row.url,
    uploadedBy: row.uploadedBy,
    category: row.category || '',
    identifier: row.identifier || '',
    docType: row.docType || '',
    uploadedAt: row.uploadedAt ? new Date(row.uploadedAt).toISOString() : null
  }));
}

export async function deleteDocument(id: string): Promise<void> {
  // 1. Move storage folders first via FTP
  try {
    const doc = await getDocument(id);
    if (doc) {
      const category = doc.category || "documents";
      const identifier = doc.identifier || id;

      const safeCategory = category.replace(/[^\w]/g, "_").trim();
      const safeIdentifier = identifier.replace(/[^\s\w\-]/g, "_").trim();

      const oldSubDir = `${safeCategory}/${safeIdentifier}`;
      const newSubDir = `delete/${safeCategory}/${safeIdentifier}`;

      await moveFtpFolder(oldSubDir, newSubDir).catch(e => console.warn(e));
    }
  } catch (err) {
    console.warn("[deleteDocument] Warn moving document storage files:", err);
  }

  // 2. Perform DB soft-delete update
  await query("UPDATE secured_documents SET isDeleted = 1 WHERE id = ?", [id]);
}
