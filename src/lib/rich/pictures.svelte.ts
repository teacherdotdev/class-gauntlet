import { SvelteMap } from 'svelte/reactivity';

/**
 * Pictures in questions. On the teacher's computer they live in IndexedDB
 * (local storage is too small for them), each under the hash of its bytes,
 * so the same picture added twice is kept once. A student's device keeps
 * only what the teacher's tab sends it for the game it's in.
 */

export type PictureFile = { hash: string; type: string; bytes: ArrayBuffer };

/** Pictures bigger than this on their longest side are shrunk when added, so they reach phones quickly. */
const MAX_SIDE = 1600;
const MAX_BYTES = 600_000;

let database: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('classgauntlet', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('pictures', { keyPath: 'hash' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pictures', mode);
    const request = run(transaction.objectStore('pictures'));
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = () => reject(transaction.error);
  });
}

const urls = new SvelteMap<string, string>();
const files = new Map<string, PictureFile>();
const asked = new Set<string>();

function remember(file: PictureFile) {
  files.set(file.hash, file);
  if (!urls.has(file.hash)) urls.set(file.hash, URL.createObjectURL(new Blob([file.bytes], { type: file.type })));
}

async function hashOf(bytes: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...digest.slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** A big photo, shrunk to a size a projector and a phone need. GIFs and SVGs stay as they are. */
async function shrink(blob: Blob): Promise<Blob> {
  if (/gif|svg/.test(blob.type)) return blob;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return blob;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && blob.size <= MAX_BYTES) return blob;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d')!;
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const webp = await encode('image/webp');
  if (webp?.type === 'image/webp') return webp.size < blob.size ? webp : blob;
  // No WebP (older Safari): JPEG, on white where the picture was see-through.
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const jpeg = await encode('image/jpeg');
  return jpeg && jpeg.size < blob.size ? jpeg : blob;
}

/** Keeps a picture the teacher added; resolves to the hash it's kept under. */
export async function savePicture(blob: Blob): Promise<string> {
  if (!blob.type.startsWith('image/')) throw new Error('That file isn’t a picture.');
  const small = await shrink(blob);
  const bytes = await small.arrayBuffer();
  const file = { hash: await hashOf(bytes), type: small.type || blob.type, bytes };
  await withStore('readwrite', (store) => store.put(file));
  remember(file);
  return file.hash;
}

/** Keeps pictures that came in a backup or a question file. */
export async function storePictures(list: PictureFile[]) {
  if (!list.length) return;
  await withStore('readwrite', (store) => {
    for (const file of list) store.put(file);
  });
  for (const file of list) remember(file);
}

/** A picture's bytes, to send to a phone or put in a backup. */
export async function pictureFile(hash: string): Promise<PictureFile | null> {
  const known = files.get(hash);
  if (known) return known;
  try {
    const file = (await withStore<PictureFile>('readonly', (store) => store.get(hash))) ?? null;
    if (file) remember(file);
    return file;
  } catch {
    return null;
  }
}

/** A picture sent by the teacher's tab, on a student's device. */
export function receivePicture(file: PictureFile) {
  remember(file);
}

/**
 * Where to show a picture from, or null while it loads (or if this
 * computer doesn't have it). Reading this in a template is reactive.
 */
export function pictureUrl(hash: string): string | null {
  const url = urls.get(hash);
  if (url) return url;
  if (!asked.has(hash) && typeof indexedDB !== 'undefined') {
    asked.add(hash);
    queueMicrotask(() => void pictureFile(hash));
  }
  return null;
}

/** For the editor, which wants to wait for a picture rather than watch for it. */
export async function pictureUrlNow(hash: string): Promise<string> {
  return urls.get(hash) ?? ((await pictureFile(hash)) ? urls.get(hash)! : '');
}

export const bytesToBase64 = (bytes: ArrayBuffer) => {
  let binary = '';
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 0x8000) binary += String.fromCharCode(...view.subarray(i, i + 0x8000));
  return btoa(binary);
};

export const base64ToBytes = (text: string): ArrayBuffer => Uint8Array.from(atob(text), (c) => c.charCodeAt(0)).buffer;
