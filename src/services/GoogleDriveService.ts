import { getCachedAccessToken } from '../lib/firebase';

const DRIVE_FILE_NAME = 'mizan_bill_backup.json';

export const backupToDrive = async (data: any) => {
  const token = getCachedAccessToken();
  if (!token) throw new Error('Google Drive access token not found. Please log in with Google.');

  // 1. Search for existing backup file
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and trashed=false&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!searchRes.ok) throw new Error('Failed to query Google Drive.');
  const searchData = await searchRes.json();
  const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

  const fileContent = JSON.stringify(data);
  const metadata = {
    name: DRIVE_FILE_NAME,
    mimeType: 'application/json'
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (existingFile) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
    method = 'PATCH';
  }

  const uploadRes = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });

  if (!uploadRes.ok) throw new Error('Failed to upload backup to Google Drive.');
  return await uploadRes.json();
};

export const restoreFromDrive = async () => {
  const token = getCachedAccessToken();
  if (!token) throw new Error('Google Drive access token not found. Please log in with Google.');

  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILE_NAME}' and trashed=false&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!searchRes.ok) throw new Error('Failed to query Google Drive.');
  const searchData = await searchRes.json();
  const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

  if (!existingFile) throw new Error('No backup file found in Google Drive.');

  const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!downloadRes.ok) throw new Error('Failed to download backup from Google Drive.');

  return await downloadRes.json();
};
