import { io } from "socket.io-client";
import { getAuth, onAuthStateChanged } from "./firebase";

// Initialize global Socket.io client instance
const socket = io({
  transports: ["websocket", "polling"]
});

let isSocketConnected = false;

// Dynamic auth handler - syncs user boundaries/roles with correct Socket rooms
setTimeout(() => {
  try {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const res = await fetch(`/api/db/users/${user.uid}`);
          if (res.ok) {
            const payload = await res.json();
            const role = payload.user?.role || 'guest';
            socket.emit("register_user", { userId: user.uid, role });
          } else {
            socket.emit("register_user", { userId: user.uid, role: "guest" });
          }
        } catch {
          socket.emit("register_user", { userId: user.uid, role: "guest" });
        }
      }
    });
  } catch (err) {
    console.warn("[Firebase Auth Sync] Auth sync observer deferment applied: ", err);
  }
}, 500);

socket.on("connect", () => {
  isSocketConnected = true;
});

socket.on("disconnect", () => {
  isSocketConnected = false;
});

// Event router dispatches to appropriate local intercept arrays
socket.on("dm:created", () => {
  triggerSnapshots("staff_dms");
});

socket.on("ticket:updated", () => {
  triggerSnapshots("tickets");
});

socket.on("staff_message:created", () => {
  triggerSnapshots("staff_messages");
});

/**
 * Custom cPanel MySQL Interception Adapter
 * Drop-in drop-out replacement for firebase/firestore
 */

export class FirebaseFirestoreMock {
  // Mock Firebase DB Reference
}

export function getFirestore(app?: any, databaseId?: string) {
  return new FirebaseFirestoreMock();
}

export function collection(db: any, ...pathSegments: string[]) {
  return {
    type: 'collection',
    path: pathSegments.join('/'),
    collectionName: pathSegments[0],
    subPath: pathSegments.slice(1).join('/'),
    id: pathSegments[pathSegments.length - 1],
    segments: pathSegments
  };
}

export function doc(dbOrCol: any, ...pathSegments: string[]) {
  let segments: string[] = [];
  if (dbOrCol && (dbOrCol.type === 'collection' || dbOrCol.type === 'doc')) {
    segments = [...dbOrCol.segments, ...pathSegments];
  } else {
    segments = pathSegments;
  }
  return {
    type: 'doc',
    path: segments.join('/'),
    collectionName: segments[0],
    id: segments[segments.length - 1],
    segments
  };
}

export function query(collectionRef: any, ...queryConstraints: any[]) {
  return {
    type: 'query',
    collectionRef,
    constraints: queryConstraints
  };
}

export function where(field: string, op: string, value: any) {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(n: number) {
  return { type: 'limit', value: n };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export function arrayUnion(...elements: any[]) {
  return { type: 'arrayUnion', elements };
}

export function arrayRemove(...elements: any[]) {
  return { type: 'arrayRemove', elements };
}

// Map collections to keys returned by endpoints
function getCollectionKey(col: string): string {
  if (col === 'properties') return 'properties';
  if (col === 'bookings') return 'bookings';
  if (col === 'turnovers') return 'turnovers';
  if (col === 'tickets') return 'tickets';
  if (col === 'secured_documents') return 'documents';
  if (col === 'users') return 'users';
  if (col === 'staff_messages') return 'messages';
  if (col === 'staff_dms') return 'dms';
  return col;
}

function parseTimestamps(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => parseTimestamps(item));
  }
  const res: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val === 'string' && (
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('time') || 
      key.toLowerCase().includes('created') || 
      key.toLowerCase().includes('updated') || 
      key.toLowerCase().includes('checkin') || 
      key.toLowerCase().includes('checkout') || 
      key.toLowerCase().includes('timestamp') ||
      (val.includes('T') && val.endsWith('Z'))
    )) {
      const parsed = Date.parse(val);
      if (!isNaN(parsed)) {
        res[key] = {
          seconds: Math.floor(parsed / 1000),
          nanoseconds: 0,
          toDate: () => new Date(parsed),
          toString: () => val
        };
        continue;
      }
    }
    if (val && typeof val === 'object') {
      res[key] = parseTimestamps(val);
    } else {
      res[key] = val;
    }
  }
  return res;
}

export async function getDoc(docRef: any) {
  const collectionName = docRef.collectionName;
  const id = docRef.id;

  let url = `/api/db/${collectionName}/${id}`;
  if (collectionName === 'users') {
    url = `/api/db/users/${id}`;
  } else if (docRef.segments && docRef.segments.length > 2) {
    if (docRef.segments[0] === 'properties' && docRef.segments[2] === 'reviews') {
      // nested reviews search
      const reviewsRes = await fetch(`/api/db/properties/${docRef.segments[1]}/reviews`);
      if (reviewsRes.ok) {
        const payload = await reviewsRes.json();
        const reviews = payload.reviews || [];
        const active = reviews.find((r: any) => r.id === id);
        const mappedActive = parseTimestamps(active);
        return {
          exists: () => !!mappedActive,
          data: () => mappedActive || null,
          id
        };
      }
    }
  }

  const res = await fetch(url);
  if (!res.ok) {
    return {
      exists: () => false,
      data: () => null,
      id
    };
  }
  let data: any = {};
  try {
    data = await res.json();
  } catch (err) {
    console.warn("[Adapter] getDoc failed to parse response JSON: ", err);
  }
  let singular = collectionName.replace(/s$/, '');
  if (collectionName === 'properties') {
    singular = 'property';
  }
  const payload = data[collectionName === 'users' ? 'user' : singular] || data.data || data[collectionName];
  const mappedPayload = parseTimestamps(payload);
  return {
    exists: () => !!mappedPayload,
    data: () => mappedPayload,
    id
  };
}

export async function getDocs(queryOrCol: any) {
  let collectionRef = queryOrCol;
  let constraints: any[] = [];
  if (queryOrCol.type === 'query') {
    collectionRef = queryOrCol.collectionRef;
    constraints = queryOrCol.constraints;
  }

  const collectionName = collectionRef.collectionName;
  let url = `/api/db/${collectionName}`;

  if (collectionRef.segments && collectionRef.segments.length > 2) {
    if (collectionRef.segments[0] === 'properties' && collectionRef.segments[2] === 'reviews') {
      url = `/api/db/properties/${collectionRef.segments[1]}/reviews`;
    }
  }

  const res = await fetch(url);
  if (!res.ok) {
    return { docs: [] };
  }
  let data: any = {};
  try {
    data = await res.json();
  } catch (err) {
    console.warn("[Adapter] getDocs failed to parse response JSON: ", err);
  }
  const cKey = getCollectionKey(collectionName);
  let list = data[cKey] || data[collectionName] || data.data || [];

  // Frontend-side simulation for maximum compatibility: query restrictions
  for (const c of constraints) {
    if (c.type === 'where') {
      const { field, op, value } = c;
      list = list.filter((item: any) => {
        const itemVal = item[field];
        if (op === '==' || op === '===') return itemVal === value;
        if (op === '!=') return itemVal !== value;
        if (op === '>') return itemVal > value;
        if (op === '>=') return itemVal >= value;
        if (op === '<') return itemVal < value;
        if (op === '<=') return itemVal <= value;
        if (op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(value);
        return true;
      });
    }
  }

  // Handle orderBy
  const orderC = constraints.find(c => c.type === 'orderBy');
  if (orderC) {
    const { field, direction } = orderC;
    list.sort((a: any, b: any) => {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Handle limit
  const limitC = constraints.find(c => c.type === 'limit');
  if (limitC) {
    list = list.slice(0, limitC.value);
  }

  return {
    docs: list.map((item: any) => {
      const mappedItem = parseTimestamps(item);
      return {
        id: item.id || item.uid || item.token,
        exists: () => true,
        data: () => mappedItem
      };
    })
  };
}

export async function addDoc(collectionRef: any, data: any) {
  const collectionName = collectionRef.collectionName;
  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  let url = `/api/db/${collectionName}`;
  let payload = { id, ...data };

  if (collectionRef.segments && collectionRef.segments.length > 2) {
    if (collectionRef.segments[0] === 'properties' && collectionRef.segments[2] === 'reviews') {
      url = `/api/db/properties/${collectionRef.segments[1]}/reviews`;
    }
  }

  const cleanPayload = resolveArrayActions(payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanPayload)
  });

  if (!res.ok) {
    throw new Error(`Failed to save document in table ${collectionName}`);
  }

  triggerSnapshots(collectionName);
  return { id };
}

export async function setDoc(docRef: any, data: any, options?: any) {
  const collectionName = docRef.collectionName;
  const id = docRef.id;

  let url = `/api/db/${collectionName}`;
  if (collectionName === 'users') {
    url = `/api/db/users/${id}`;
  }

  let payload = { id, ...data };
  if (collectionName === 'users') {
    payload = data; 
  }

  const cleanPayload = resolveArrayActions(payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanPayload)
  });

  if (!res.ok) {
    throw new Error(`Failed to set document in table ${collectionName}`);
  }

  triggerSnapshots(collectionName);
}

export async function updateDoc(docRef: any, data: any) {
  const collectionName = docRef.collectionName;
  const id = docRef.id;

  // Let's first read the existing doc to combine updates (since POST replaces or updates)
  const existing = await getDoc(docRef);
  const currentData = existing.exists() ? existing.data() : {};
  
  // Resolve arrayUnion and arrayRemove actions
  const merged = { ...currentData };
  for (const k of Object.keys(data)) {
    const val = data[k];
    if (val && typeof val === 'object' && val.type === 'arrayUnion') {
      const arr = Array.isArray(merged[k]) ? [...merged[k]] : [];
      for (const el of val.elements) {
        if (!arr.includes(el)) arr.push(el);
      }
      merged[k] = arr;
    } else if (val && typeof val === 'object' && val.type === 'arrayRemove') {
      const arr = Array.isArray(merged[k]) ? [...merged[k]] : [];
      merged[k] = arr.filter((el: any) => !val.elements.includes(el));
    } else {
      merged[k] = val;
    }
  }

  let url = `/api/db/${collectionName}`;
  if (collectionName === 'users') {
    url = `/api/db/users/${id}`;
  } else if (collectionName === 'bookings') {
    if (Object.keys(data).length === 1 && data.status) {
      // Special optimize status update
      url = `/api/db/bookings/${id}/status`;
      const resStatus = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: data.status })
      });
      if (!resStatus.ok) throw new Error("Failed to update booking status");
      triggerSnapshots(collectionName);
      return;
    }
  }

  let payload = { id, ...merged };
  if (collectionName === 'users') {
    payload = merged;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Failed to update document in table ${collectionName}`);
  }

  triggerSnapshots(collectionName);
}

export async function deleteDoc(docRef: any) {
  const collectionName = docRef.collectionName;
  const id = docRef.id;

  const url = `/api/db/${collectionName}/${id}`;
  const res = await fetch(url, { method: 'DELETE' });

  if (!res.ok) {
    throw new Error(`Failed to delete document ${id} from table ${collectionName}`);
  }

  triggerSnapshots(collectionName);
}

export function writeBatch(db: any) {
  return {
    update(docRef: any, data: any) {
      updateDoc(docRef, data).catch(console.error);
    },
    async commit() {
      // Committed inline
    }
  };
}

export function runTransaction(db: any, updateFunction: (transaction: any) => Promise<any>) {
  const transaction = {
    async get(docRef: any) {
      return getDoc(docRef);
    },
    update(docRef: any, data: any) {
      updateDoc(docRef, data).catch(console.error);
    }
  };
  return updateFunction(transaction);
}

function resolveArrayActions(payload: any) {
  const clean = { ...payload };
  for (const k of Object.keys(clean)) {
    const val = clean[k];
    if (val && typeof val === 'object' && val.type === 'arrayUnion') {
      clean[k] = val.elements;
    } else if (val && typeof val === 'object' && val.type === 'arrayRemove') {
      clean[k] = [];
    }
  }
  return clean;
}

// Polling intervals fallback for reactive listeners on MySQL
const listeners = new Map<string, Set<() => void>>();

export function onSnapshot(queryOrCol: any, next: (snapshot: any) => void, error?: (err: any) => void) {
  if (queryOrCol?.type === 'doc') {
    const updateDoc = async () => {
      try {
        const snap = await getDoc(queryOrCol);
        next(snap);
      } catch (err: any) {
        // Quietly suppress transient offline fetch failures to keep client console pristine
        const errMsg = err?.message || String(err);
        if (errMsg.includes("Failed to fetch") || errMsg.includes("Load failed") || errMsg.includes("NetworkError")) {
          return;
        }
        if (error) error(err);
      }
    };
    
    // Immediate pull
    updateDoc();

    let adaptiveInterval: any = null;
    const startAdaptiveTimer = () => {
      if (adaptiveInterval) {
        clearInterval(adaptiveInterval);
        adaptiveInterval = null;
      }
      if (isSocketConnected) return; // Completely idle the timer when Socket is connected

      const delay = document.visibilityState === "visible" ? 20000 : 60000;
      adaptiveInterval = setInterval(updateDoc, delay);
    };

    startAdaptiveTimer();

    const onConnectChange = () => {
      if (isSocketConnected) {
        updateDoc().catch(() => {});
      }
      startAdaptiveTimer();
    };

    socket.on("connect", onConnectChange);
    socket.on("disconnect", onConnectChange);

    const onVisibilityChange = () => {
      startAdaptiveTimer();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const collectionName = queryOrCol.collectionName;
    if (!listeners.has(collectionName)) {
      listeners.set(collectionName, new Set());
    }
    const cb = () => { updateDoc().catch(() => {}); };
    listeners.get(collectionName)!.add(cb);

    return () => {
      if (adaptiveInterval) clearInterval(adaptiveInterval);
      socket.off("connect", onConnectChange);
      socket.off("disconnect", onConnectChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      listeners.get(collectionName)?.delete(cb);
    };
  }

  // Collection snapshot listener
  let collectionRef = queryOrCol;
  if (queryOrCol.type === 'query') {
    collectionRef = queryOrCol.collectionRef;
  }
  const collectionName = collectionRef.collectionName;

  // Let's keep track of seen document states to compute actual changes for listeners
  let previousDocsMap = new Map<string, string>(); // docId -> JSON.stringify(data)

  const update = async () => {
    try {
      const snap = await getDocs(queryOrCol);
      const docs = snap.docs || [];
      
      const docChangesList: any[] = [];
      const currentDocsMap = new Map<string, string>();

      for (const d of docs) {
        const itemData = d.data();
        const jsonStr = JSON.stringify(itemData);
        currentDocsMap.set(d.id, jsonStr);

        if (!previousDocsMap.has(d.id)) {
          docChangesList.push({
            type: 'added',
            doc: d
          });
        } else if (previousDocsMap.get(d.id) !== jsonStr) {
          docChangesList.push({
            type: 'modified',
            doc: d
          });
        }
      }

      for (const oldId of previousDocsMap.keys()) {
        if (!currentDocsMap.has(oldId)) {
          docChangesList.push({
            type: 'removed',
            doc: { id: oldId, exists: () => false, data: () => null }
          });
        }
      }

      // Save map for next diff
      previousDocsMap = currentDocsMap;

      const fullSnap = {
        docs,
        docChanges: () => docChangesList
      };

      next(fullSnap);
    } catch (err: any) {
      // Quietly suppress transient offline fetch failures to keep client console pristine
      const errMsg = err?.message || String(err);
      if (errMsg.includes("Failed to fetch") || errMsg.includes("Load failed") || errMsg.includes("NetworkError")) {
        return;
      }
      if (error) error(err);
    }
  };

  // Immediate pull on snapshot mount
  update();

  let adaptiveInterval: any = null;
  const startAdaptiveTimer = () => {
    if (adaptiveInterval) {
      clearInterval(adaptiveInterval);
      adaptiveInterval = null;
    }
    if (isSocketConnected) return; // Completely idle the timer when Socket is connected

    const delay = document.visibilityState === "visible" ? 20000 : 60000;
    adaptiveInterval = setInterval(update, delay);
  };

  startAdaptiveTimer();

  const onConnectChange = () => {
    if (isSocketConnected) {
      update().catch(() => {});
    }
    startAdaptiveTimer();
  };

  socket.on("connect", onConnectChange);
  socket.on("disconnect", onConnectChange);

  const onVisibilityChange = () => {
    startAdaptiveTimer();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  if (!listeners.has(collectionName)) {
    listeners.set(collectionName, new Set());
  }
  const cb = () => { update().catch(() => {}); };
  listeners.get(collectionName)!.add(cb);

  return () => {
    if (adaptiveInterval) clearInterval(adaptiveInterval);
    socket.off("connect", onConnectChange);
    socket.off("disconnect", onConnectChange);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    listeners.get(collectionName)?.delete(cb);
  };
}

function triggerSnapshots(collectionName: string) {
  const set = listeners.get(collectionName);
  if (set) {
    set.forEach(cb => {
      try { cb(); } catch(e){}
    });
  }
}
