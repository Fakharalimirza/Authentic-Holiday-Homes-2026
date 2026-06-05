import fs from 'fs';
import path from 'path';

const LOCAL_DB_PATH = path.resolve(process.cwd(), "server", "local-db.json");

export interface LocalData {
  users: any[];
  properties: any[];
  property_reviews: any[];
  bookings: any[];
  secured_documents: any[];
  turnovers: any[];
  tickets: any[];
  staff_messages: any[];
  staff_dms: any[];
  invitations: any[];
  audit_logs: any[];
  settings: any[];
  device_tokens: any[];
  property_amenities: any[];
  landlords: any[];
  buildings: any[];
  units: any[];
  email_templates: any[];
}

function getInitialLocalData(): LocalData {
  return {
    users: [],
    properties: [],
    property_reviews: [],
    bookings: [],
    secured_documents: [],
    turnovers: [],
    tickets: [],
    staff_messages: [],
    staff_dms: [],
    invitations: [],
    audit_logs: [],
    settings: [],
    device_tokens: [],
    property_amenities: [],
    landlords: [],
    buildings: [],
    units: [],
    email_templates: [
      {
        id: "birthday",
        name: "Birthday Greeting",
        subject: "Happy Birthday {{displayName}}! 🎂",
        body: `Dear {{displayName}},\n\nSending you our warmest wishes on your birthday! Hope your day is filled with joy, laughter, and great moments.\n\nThank you for being part of our application.\n\nBest regards,\nThe Team`,
        variables: "displayName"
      },
      {
        id: "booking_received",
        name: "Booking Request Received",
        subject: "We received your booking request! Details inside",
        body: `Dear {{guestName}},\n\nThank you for choosing us! We have received your booking request for "{{propertyName}}".\n\nBooking details:\n- Check In: {{checkIn}}\n- Check Out: {{checkOut}}\n- Total Price: AED {{totalPrice}}\n\nOur team will review your booking and get in touch shortly to confirm.\n\nWarm regards,\nThe Booking Team`,
        variables: "guestName,propertyName,checkIn,checkOut,totalPrice"
      },
      {
        id: "booking_confirmed",
        name: "Booking Request Confirmed",
        subject: "Booking Confirmed: We look forward to hosting you!",
        body: `Dear {{guestName}},\n\nGreat news! Your booking request for "{{propertyName}}" has been confirmed.\n\nBooking details:\n- Check In: {{checkIn}}\n- Check Out: {{checkOut}}\n- Total Price: AED {{totalPrice}}\n\nIf you have any questions or require assistance, please feel free to contact us via the client chat portal.\n\nWarm regards,\nThe Booking Team`,
        variables: "guestName,propertyName,checkIn,checkOut,totalPrice"
      }
    ]
  };
}

let localDbCache: LocalData | null = null;

export function loadLocalFileDb(): LocalData {
  if (localDbCache) return localDbCache;
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const dataStr = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      localDbCache = JSON.parse(dataStr);
    } else {
      localDbCache = getInitialLocalData();
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localDbCache, null, 2), "utf-8");
    }
  } catch (e) {
    console.warn("[Local Sandbox DB] Failed to load local-db.json, using custom in-memory fallback:", e);
    localDbCache = getInitialLocalData();
  }
  return localDbCache!;
}

export function saveLocalFileDb(data: LocalData) {
  localDbCache = data;
  try {
    const parentDir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("[Local Sandbox DB] Failed to write to local-db.json:", e);
  }
}

export function runLocalSqlQuery(sql: string, params: any[] = []): any {
  const norm = sql.toLowerCase().replace(/\s+/g, " ").trim();
  const db = loadLocalFileDb();

  // Determine correct table name
  let tableName = "";
  const tables = [
    "users", "properties", "property_reviews", "bookings", "secured_documents",
    "turnovers", "tickets", "staff_messages", "staff_dms", "invitations",
    "audit_logs", "settings", "device_tokens", "property_amenities", "landlords",
    "buildings", "units", "email_templates"
  ];
  for (const t of tables) {
    if (norm.includes(` ${t} `) || norm.includes(` ${t}(`) || norm.includes(` ${t},`) || norm.endsWith(` ${t}`)) {
      tableName = t;
      break;
    }
  }
  if (!tableName) {
    const words = norm.split(/[\s,()]+/);
    for (const t of tables) {
      if (words.includes(t)) {
        tableName = t;
        break;
      }
    }
  }

  if (!tableName) {
    console.warn("[Local Sandbox DB Interceptor] Table name undetected for operation:", sql);
    return [];
  }

  const tableData: any[] = db[tableName as keyof LocalData] || [];

  // 1. SELECT OPERATIONS (MOCK SQL SELECTS)
  if (norm.startsWith("select")) {
    let filtered = [...tableData];

    if (tableName === "users") {
      if (norm.includes("uid = ?")) {
        filtered = filtered.filter(row => row.uid === params[0]);
      } else if (norm.includes("email = ?")) {
        filtered = filtered.filter(row => (row.email || '').toLowerCase().trim() === String(params[0] || '').toLowerCase().trim());
      }
      if (norm.includes("order by email asc")) {
        filtered.sort((a,b) => (a.email || '').localeCompare(b.email || ''));
      }
    } else if (tableName === "properties") {
      if (norm.includes("id = ?")) {
        filtered = filtered.filter(row => row.id === params[0]);
      } else {
        filtered = filtered.filter(row => row.isDeleted === 0 || !row.isDeleted);
      }
      if (norm.includes("order by createdat desc")) {
        filtered.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
    } else if (tableName === "bookings") {
      filtered.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (tableName === "turnovers") {
      filtered.sort((a,b) => new Date(b.scheduledDate || 0).getTime() - new Date(a.scheduledDate || 0).getTime());
    } else if (tableName === "tickets") {
      filtered.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (tableName === "secured_documents") {
      if (norm.includes("id = ?")) {
        filtered = filtered.filter(row => row.id === params[0]);
      } else {
        filtered = filtered.filter(row => row.isDeleted === 0 || !row.isDeleted);
      }
      filtered.sort((a,b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
    } else if (tableName === "invitations") {
      if (norm.includes("token = ?")) {
        filtered = filtered.filter(row => row.token === params[0]);
      } else {
        filtered.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
    } else if (tableName === "audit_logs") {
      filtered.sort((a,b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
      if (filtered.length > 200) filtered = filtered.slice(0, 200);
    } else if (tableName === "staff_messages") {
      filtered.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      if (filtered.length > 100) filtered = filtered.slice(0, 100);
      filtered.reverse();
    } else if (tableName === "staff_dms") {
      filtered.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      if (filtered.length > 200) filtered = filtered.slice(0, 200);
      filtered.reverse();
    } else if (tableName === "property_reviews") {
      if (norm.includes("propertyid = ?")) {
        filtered = filtered.filter(row => row.propertyId === params[0]);
      }
      filtered.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (tableName === "settings") {
      if (norm.includes("id = ?")) {
        filtered = filtered.filter(row => row.id === params[0]);
      }
    } else if (tableName === "device_tokens") {
      if (norm.includes("userid = ?")) {
        filtered = filtered.filter(row => row.userId === params[0]);
      }
    } else if (tableName === "landlords") {
      if (norm.includes("id = ?")) {
        filtered = filtered.filter(row => row.id === params[0] && (row.isDeleted === 0 || !row.isDeleted));
      } else {
        filtered = filtered.filter(row => row.isDeleted === 0 || !row.isDeleted);
      }
      filtered.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (tableName === "buildings") {
      if (norm.includes("id = ?")) {
        filtered = filtered.filter(row => row.id === params[0] && (row.isDeleted === 0 || !row.isDeleted));
      } else {
        filtered = filtered.filter(row => row.isDeleted === 0 || !row.isDeleted);
      }
      filtered.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (tableName === "units") {
      if (norm.includes("id = ?")) {
        filtered = filtered.filter(row => row.id === params[0] && (row.isDeleted === 0 || !row.isDeleted));
      } else {
        filtered = filtered.filter(row => row.isDeleted === 0 || !row.isDeleted);
      }
      filtered.sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (tableName === "email_templates") {
      if (norm.includes("id = ?")) {
        filtered = filtered.filter(row => row.id === params[0]);
      } else if (norm.includes("name = ?")) {
        filtered = filtered.filter(row => row.name === params[0]);
      }
    }

    return filtered;
  }

  // 2. DELETE OPERATIONS
  if (norm.startsWith("delete")) {
    const beforeLen = tableData.length;
    let keep: any[] = [];
    if (tableName === "invitations" && norm.includes("token = ?")) {
      keep = tableData.filter(row => row.token !== params[0]);
    } else if (tableName === "device_tokens" && norm.includes("token = ?")) {
      keep = tableData.filter(row => row.token !== params[0]);
    } else if (tableName === "property_amenities" && norm.includes("propertyid = ?")) {
      keep = tableData.filter(row => row.propertyId !== params[0]);
    } else {
      keep = tableData;
    }
    db[tableName as keyof LocalData] = keep as any;
    saveLocalFileDb(db);
    return { affectedRows: beforeLen - keep.length };
  }

  // 3. INSERT/UPDATE/REPLACE (UPSERT MERGE)
  if (norm.startsWith("insert") || norm.startsWith("update") || norm.startsWith("replace")) {
    let keyName = "id";
    if (tableName === "users") keyName = "uid";
    else if (tableName === "invitations") keyName = "token";
    else if (tableName === "device_tokens") keyName = "token";
    else if (tableName === "property_amenities") keyName = "id";
    else if (tableName === "staff_messages") keyName = "id";
    else if (tableName === "staff_dms") keyName = "id";
    else if (tableName === "audit_logs") keyName = "id";
    else if (tableName === "email_templates") keyName = "id";

    if (tableName === "users") {
      let resolvedUid = "";
      let resolvedEmail = "";
      let resolvedDisplayName = "";
      let resolvedPassword = "";
      let resolvedPhone = "";
      let resolvedRole = "";
      let resolvedWishlist = "[]";
      let resolvedDob = null;

      if (norm.startsWith("update users")) {
        // params: [email, displayName, password, phone, role, wishlist, dob, uid]
        resolvedEmail = params[0] || "";
        resolvedDisplayName = params[1] || "";
        resolvedPassword = params[2] || "";
        resolvedPhone = params[3] || "";
        resolvedRole = params[4] || "";
        resolvedWishlist = params[5] || "[]";
        resolvedDob = params[6] || null;
        resolvedUid = params[7] || "";
      } else {
        // params: [uid, email, displayName, password, phone, role, wishlist, dob]
        resolvedUid = params[0] || "";
        resolvedEmail = params[1] || "";
        resolvedDisplayName = params[2] || "";
        resolvedPassword = params[3] || "";
        resolvedPhone = params[4] || "";
        resolvedRole = params[5] || "";
        resolvedWishlist = params[6] || "[]";
        resolvedDob = params[7] || null;
      }

      let parsedWishlist = [];
      try { parsedWishlist = typeof resolvedWishlist === "string" ? JSON.parse(resolvedWishlist) : (resolvedWishlist || []); } catch(e){}

      const userRecord: any = {
        uid: resolvedUid,
        email: resolvedEmail || "",
        displayName: resolvedDisplayName || "",
        password: resolvedPassword || "",
        phone: resolvedPhone || "",
        dob: resolvedDob,
        role: (resolvedEmail && resolvedEmail.toLowerCase() === 'fakharalimirza@gmail.com') ? 'super_admin' : (resolvedRole || 'guest'),
        wishlist: Array.isArray(parsedWishlist) ? parsedWishlist : []
      };

      const existingIdx = tableData.findIndex(row => row[keyName] === resolvedUid);
      if (existingIdx >= 0) {
        db.users[existingIdx] = { ...db.users[existingIdx], ...userRecord };
      } else {
        userRecord.createdAt = new Date().toISOString();
        db.users.push(userRecord);
      }
    } else if (tableName === "properties") {
      if (norm.includes("set isdeleted = 1")) {
        const existing = tableData.find(row => row.id === params[0]);
        if (existing) existing.isDeleted = 1;
      } else {
        const [id, title, description, location, price, images, amenities, hostId, isAvailable, rating, reviewCount, category, unitNumber, buildingName, referenceNo, purpose, furnishing, size, bedrooms, bathrooms, maxGuests, minimumNights, landlordId, buildingId] = params;
        
        const propRecord = {
          id, title, description, location,
          price: Number(price || 0),
          images: typeof images === "string" ? JSON.parse(images) : (images || {}),
          amenities: typeof amenities === "string" ? JSON.parse(amenities) : (amenities || {}),
          hostId,
          isAvailable: Number(isAvailable || 1),
          rating: Number(rating || 5),
          reviewCount: Number(reviewCount || 0),
          category, unitNumber, buildingName, referenceNo, purpose, furnishing, size, bedrooms, bathrooms, maxGuests, minimumNights, landlordId, buildingId,
          isDeleted: 0,
          createdAt: new Date().toISOString()
        };

        const existingIdx = tableData.findIndex(row => row.id === id);
        if (existingIdx >= 0) {
          db.properties[existingIdx] = { ...db.properties[existingIdx], ...propRecord };
        } else {
          db.properties.push(propRecord);
        }
      }
    } else if (tableName === "bookings") {
      if (norm.startsWith("update bookings set status")) {
        const targetId = params[1];
        const existing = tableData.find(row => row.id === targetId);
        if (existing) existing.status = params[0];
      } else {
        const [id, propertyId, propertyName, guestId, guestName, guestEmail, guestPhone, checkIn, checkOut, totalPrice, status] = params;
        const record = {
          id, propertyId, propertyName, guestId, guestName, guestEmail, guestPhone, checkIn, checkOut,
          totalPrice: Number(totalPrice || 0),
          status: status || "pending",
          createdAt: new Date().toISOString()
        };
        const existingIdx = tableData.findIndex(row => row.id === id);
        if (existingIdx >= 0) {
          db.bookings[existingIdx] = { ...db.bookings[existingIdx], ...record };
        } else {
          db.bookings.push(record);
        }
      }
    } else if (tableName === "turnovers") {
      const [id, bookingId, propertyTitle, scheduledDate, cleanerName, status, notes] = params;
      const record = {
        id, bookingId, propertyTitle, scheduledDate, cleanerName, status, notes,
        createdAt: new Date().toISOString()
      };
      const existingIdx = tableData.findIndex(row => row.id === id);
      if (existingIdx >= 0) {
        db.turnovers[existingIdx] = { ...db.turnovers[existingIdx], ...record };
      } else {
        db.turnovers.push(record);
      }
    } else if (tableName === "tickets") {
      const [id, userId, userEmail, subject, description, category, status, messages] = params;
      const record = {
        id, userId, userEmail, subject, description, category, status,
        messages: typeof messages === "string" ? JSON.parse(messages) : (messages || []),
        createdAt: new Date().toISOString()
      };
      const existingIdx = tableData.findIndex(row => row.id === id);
      if (existingIdx >= 0) {
        db.tickets[existingIdx] = { ...db.tickets[existingIdx], ...record };
      } else {
        db.tickets.push(record);
      }
    } else if (tableName === "email_templates") {
      let resolvedId = "";
      let resolvedName = "";
      let resolvedSubject = "";
      let resolvedBody = "";
      let resolvedVariables = "";

      if (norm.startsWith("update email_templates")) {
        const [name, subject, body, variables, id] = params;
        resolvedName = name || "";
        resolvedSubject = subject || "";
        resolvedBody = body || "";
        resolvedVariables = variables || "";
        resolvedId = id;

        const existing = db.email_templates.find(row => row.id === resolvedId);
        if (existing) {
          existing.name = resolvedName;
          existing.subject = resolvedSubject;
          existing.body = resolvedBody;
          existing.variables = resolvedVariables;
        }
      } else {
        const [id, name, subject, body, variables] = params;
        const record = { id, name, subject, body, variables };
        const existingIdx = db.email_templates.findIndex(row => row.id === id);
        if (existingIdx >= 0) {
          db.email_templates[existingIdx] = { ...db.email_templates[existingIdx], ...record };
        } else {
          db.email_templates.push(record);
        }
      }
    } else if (tableName === "secured_documents") {
      if (norm.includes("set isdeleted = 1")) {
        const targetId = params[0];
        const existing = tableData.find(row => row.id === targetId);
        if (existing) existing.isDeleted = 1;
      } else {
        const [id, title, fileName, url, uploadedBy, category, identifier, docType] = params;
        const record = {
          id, title, fileName, url, uploadedBy, category, identifier, docType,
          isDeleted: 0,
          uploadedAt: new Date().toISOString()
        };
        const existingIdx = tableData.findIndex(row => row.id === id);
        if (existingIdx >= 0) {
          db.secured_documents[existingIdx] = { ...db.secured_documents[existingIdx], ...record };
        } else {
          db.secured_documents.push(record);
        }
      }
    } else if (tableName === "invitations") {
      const [token, email, role, note, status, invitedBy, invitedByEmail, acceptedBy, acceptedAt] = params;
      const record = {
        token, email, role, note, status, invitedBy, invitedByEmail, acceptedBy, acceptedAt,
        createdAt: new Date().toISOString()
      };
      const existingIdx = tableData.findIndex(row => row.token === token);
      if (existingIdx >= 0) {
        db.invitations[existingIdx] = { ...db.invitations[existingIdx], ...record };
      } else {
        db.invitations.push(record);
      }
    } else if (tableName === "audit_logs") {
      const [userId, userEmail, userRole, action, details, ip, userAgent] = params;
      const id = "log_" + Math.random().toString(36).substring(2, 11);
      const record = {
        id, userId, userEmail, userRole, action, details, ip, userAgent,
        timestamp: new Date().toISOString()
      };
      db.audit_logs.push(record);
    } else if (tableName === "staff_messages") {
      const [userId, userEmail, text] = params;
      const id = Math.floor(Math.random() * 100000);
      const record = {
        id, userId, userEmail, text,
        createdAt: new Date().toISOString()
      };
      db.staff_messages.push(record);
    } else if (tableName === "staff_dms") {
      const [senderId, senderEmail, recipientId, recipientEmail, text] = params;
      const id = Math.floor(Math.random() * 100000);
      const record = {
        id, senderId, senderEmail, recipientId, recipientEmail, text,
        createdAt: new Date().toISOString()
      };
      db.staff_dms.push(record);
    } else if (tableName === "property_reviews") {
      const [id, propertyId, userId, userName, userPhoto, rating, comment] = params;
      const record = {
        id, propertyId, userId, userName, userPhoto, rating, comment,
        createdAt: new Date().toISOString()
      };
      const existingIdx = tableData.findIndex(row => row.id === id);
      if (existingIdx >= 0) {
        db.property_reviews[existingIdx] = { ...db.property_reviews[existingIdx], ...record };
      } else {
        db.property_reviews.push(record);
      }
    } else if (tableName === "settings") {
      const [id, data] = params;
      const record = {
        id,
        data: typeof data === "string" ? JSON.parse(data) : (data || {}),
        updatedAt: new Date().toISOString()
      };
      const existingIdx = tableData.findIndex(row => row.id === id);
      if (existingIdx >= 0) {
        db.settings[existingIdx] = { ...db.settings[existingIdx], ...record };
      } else {
        db.settings.push(record);
      }
    } else if (tableName === "device_tokens") {
      const [userId, token, platform] = params;
      const record = { userId, token, platform };
      const existingIdx = tableData.findIndex(row => row.token === token);
      if (existingIdx >= 0) {
        db.device_tokens[existingIdx] = { ...db.device_tokens[existingIdx], ...record };
      } else {
        db.device_tokens.push(record);
      }
    } else if (tableName === "property_amenities") {
      const [propertyId, amenityKey, category] = params;
      const id = `${propertyId}_${amenityKey}`;
      db.property_amenities.push({ id, propertyId, amenityKey, category });
    } else if (tableName === "landlords") {
      if (norm.includes("set isdeleted = 1")) {
        const targetId = params[0];
        const existing = tableData.find(row => row.id === targetId);
        if (existing) existing.isDeleted = 1;
      } else {
        const [
          id, fullName, email, phone, identityNumber, identityDocumentUrl, nationality,
          bankName, bankAccountHolder, bankAccountNumber, swiftCode, iban, bankBranch
        ] = params;
        const record = {
          id,
          fullName: fullName || '',
          email: email || '',
          phone: phone || '',
          identityNumber: identityNumber || '',
          identityDocumentUrl: identityDocumentUrl || null,
          nationality: nationality || '',
          bankName: bankName || '',
          bankAccountHolder: bankAccountHolder || '',
          bankAccountNumber: bankAccountNumber || '',
          swiftCode: swiftCode || '',
          iban: iban || '',
          bankBranch: bankBranch || '',
          isDeleted: 0,
          createdAt: new Date().toISOString()
        };
        const existingIdx = tableData.findIndex(row => row.id === id);
        if (existingIdx >= 0) {
          db.landlords[existingIdx] = { ...db.landlords[existingIdx], ...record };
        } else {
          db.landlords.push(record);
        }
      }
    } else if (tableName === "buildings") {
      if (norm.includes("set isdeleted = 1")) {
        const targetId = params[0];
        const existing = tableData.find(row => row.id === targetId);
        if (existing) existing.isDeleted = 1;
      } else {
        const [id, name, managementCompany, managementEmail, address, googleMapUrl, floors, city, makaniNumber, country, securityCompanyName, securityCompanyContact, gasCompanyName, gasCompanyContact, coolingCompanyName, coolingCompanyContact, internetProviderName, internetProviderContact] = params;
        const record = {
          id, name, managementCompany, managementEmail, address, googleMapUrl,
          floors: Number(floors || 1),
          city, makaniNumber, country, securityCompanyName, securityCompanyContact,
          gasCompanyName, gasCompanyContact, coolingCompanyName, coolingCompanyContact,
          internetProviderName, internetProviderContact,
          isDeleted: 0,
          createdAt: new Date().toISOString()
        };
        const existingIdx = tableData.findIndex(row => row.id === id);
        if (existingIdx >= 0) {
          db.buildings[existingIdx] = { ...db.buildings[existingIdx], ...record };
        } else {
          db.buildings.push(record);
        }
      }
    } else if (tableName === "units") {
      if (norm.includes("set isdeleted = 1")) {
        const targetId = params[0];
        const existing = tableData.find(row => row.id === targetId);
        if (existing) existing.isDeleted = 1;
      } else {
        const [
          id, unitNumber, buildingId, landlordId, status, price, bedrooms, bathrooms, size, furnishing, notes,
          unitType, internetProvider, internetAccountNumber, dewaPremisesNumber, mgmtCommission, guestCapacity,
          description, titleDeedUrl, permitNumber, permitDocUrl
        ] = params;
        const record = {
          id, unitNumber, buildingId, landlordId: landlordId || null,
          status: status || 'Vacant',
          price: Number(price || 0),
          bedrooms: Number(bedrooms || 0),
          bathrooms: Number(bathrooms || 0),
          size: Number(size || 0),
          furnishing: furnishing || 'Furnished',
          notes: notes || '',
          unitType: unitType || 'Apartment',
          internetProvider: internetProvider || '',
          internetAccountNumber: internetAccountNumber || '',
          dewaPremisesNumber: dewaPremisesNumber || '',
          mgmtCommission: Number(mgmtCommission || 0),
          guestCapacity: Number(guestCapacity || 1),
          description: description || '',
          titleDeedUrl: titleDeedUrl || '',
          permitNumber: permitNumber || '',
          permitDocUrl: permitDocUrl || '',
          isDeleted: 0,
          createdAt: new Date().toISOString()
        };
        const existingIdx = tableData.findIndex(row => row.id === id);
        if (existingIdx >= 0) {
          db.units[existingIdx] = { ...db.units[existingIdx], ...record };
        } else {
          db.units.push(record);
        }
      }
    }

    saveLocalFileDb(db);
    return { affectedRows: 1 };
  }

  return [];
}
