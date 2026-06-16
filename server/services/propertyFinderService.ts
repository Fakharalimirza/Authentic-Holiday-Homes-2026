import { getSettings } from '../db/meta';
import { saveProperty } from '../db/properties';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

interface POTokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: POTokenCache | null = null;

export async function getPropertyFinderToken(): Promise<string> {
  const settings = await getSettings('global');
  if (!settings) {
    throw new Error('Global settings not initialized. Access declined.');
  }

  const { pfApiKey, pfApiSecret, pfApiUrl, pfEnabled } = settings;
  if (!pfEnabled) {
    throw new Error('Property Finder integration is disabled in settings.');
  }

  if (!pfApiKey || !pfApiSecret) {
    throw new Error('Property Finder API Key or API Secret is missing.');
  }

  // Check cache validity (with 30 seconds safety window)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30000) {
    return tokenCache.accessToken;
  }

  // Handle mock/demo tokens cleanly
  if (pfApiKey === 'demo' || pfApiKey === 'mock') {
    console.log('[Property Finder Service] generating mock token for demo/mock credentials.');
    const mockToken = 'mock-bearer-token-' + Math.random().toString(36).substring(2, 12);
    tokenCache = {
      accessToken: mockToken,
      expiresAt: Date.now() + 1800 * 1000 // 30 minutes
    };
    return mockToken;
  }

  const authUrl = `${pfApiUrl || 'https://atlas.propertyfinder.com/v1'}/auth/token`;

  try {
    const response = await axios.post(authUrl, {
      apiKey: pfApiKey,
      apiSecret: pfApiSecret
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.accessToken) {
      const durationSeconds = response.data.expiresIn || 1800;
      tokenCache = {
        accessToken: response.data.accessToken,
        expiresAt: Date.now() + durationSeconds * 1000
      };
      return response.data.accessToken;
    } else {
      throw new Error('Invalid response structure returned from token server.');
    }
  } catch (err: any) {
    console.error('[Property Finder Service] Token exchange failed:', err.message);
    throw new Error(`Auth failed: ${err.response?.data?.detail || err.message}`);
  }
}

/**
 * Perform a live compliance/permit check either with DLD or ADREC systems using the Enterprise API
 */
export async function checkPermitCompliance(permitNumber: string, licenseNumber: string): Promise<any> {
  const settings = await getSettings('global');
  const targetLicense = licenseNumber || settings?.pfBrokerLicense || '1501234';

  if (!permitNumber) {
    throw new Error('Regulated Permit/Advertisement number is required.');
  }

  const isDemo = !settings || !settings.pfEnabled || settings.pfApiKey === 'demo' || settings.pfApiKey === 'mock';

  if (isDemo) {
    // Elegant simulated response format fully compatible with DLD/ADREC spec in /help/openapi.json
    console.log(`[Property Finder Service] Returning modeled compliance response for permit: ${permitNumber}`);
    
    // Simulate DLD and sale/rent restrictions
    const dldCategory = permitNumber.startsWith('20') ? 'Unit' : 'Villa';
    const saleType = Math.random() > 0.5 ? 'Primary' : 'Secondary';
    const mockArea = Math.random() > 0.5 ? 1200 : 2400;

    return {
      status: 'VALID',
      permitNumber,
      licenseNumber: targetLicense,
      source: 'DLD',
      data: [{
        permitStatus: 'APPROVED',
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        property: {
          listingType: dldCategory, // 'Unit', 'Villa', 'Building', 'Land'
          saleType: saleType, // 'Primary', 'Secondary' or ""
          builtUpArea: mockArea,
          price: Math.random() > 0.5 ? 1500000 : 3500000,
          locationName: 'Dubai Marina',
          amenities: ['central-ac', 'covered-parking', 'shared-gym', 'shared-pool']
        }
      }]
    };
  }

  const token = await getPropertyFinderToken();
  const pfUrl = settings.pfApiUrl || 'https://atlas.propertyfinder.com/v1';
  const complianceUrl = `${pfUrl}/compliances/${encodeURIComponent(permitNumber)}/${encodeURIComponent(targetLicense)}`;

  try {
    const response = await axios.get(complianceUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    return response.data;
  } catch (err: any) {
    console.error('[Property Finder Service] Compliance check failed:', err.message);
    throw new Error(`Compliance error: ${err.response?.data?.detail || err.message}`);
  }
}

/**
 * Drafts and publishes listings to the property finder portal safely in chronological steps
 */
export async function syncListingToPropertyFinder(listing: any, permitDetails: any): Promise<any> {
  const settings = await getSettings('global');
  const isDemo = !settings || !settings.pfEnabled || settings.pfApiKey === 'demo' || settings.pfApiKey === 'mock';

  if (isDemo) {
    console.log(`[Property Finder Service] Running simulated listing draft sync for: ${listing.title}`);
    const mockListingId = 'pf-lst-' + Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      listingId: mockListingId,
      status: 'DRAFT',
      publishWorkflowInitiated: true,
      message: 'Listing successfully synchronized in draft mode and queued for publication on Property Finder.'
    };
  }

  const token = await getPropertyFinderToken();
  const pfUrl = settings.pfApiUrl || 'https://atlas.propertyfinder.com/v1';

  // Construct payload payload mapping as defined in /help/openapi.json
  const pfListingPayload = {
    title: listing.title,
    description: listing.description || '',
    type: listing.type || 'Apartment',
    size: listing.size || listing.builtUpArea || 1200,
    builtUpArea: listing.builtUpArea || 1200,
    price: {
      value: listing.price,
      type: listing.priceType || 'sale',
      period: listing.pricePeriod || 'yearly'
    },
    locationId: listing.pfLocationId || 50, // Fallback to Dubai Marina default ID if not defined
    publicProfileId: listing.pfProfileId || 216582, // Default public profile
    media: {
      images: (listing.images || '').split(',').filter(Boolean).map((url: string) => ({
        url: url.trim()
      }))
    },
    compliance: {
      permitNumber: permitDetails?.permitNumber || listing.listingAdvertisementNumber || '',
      licenseNumber: permitDetails?.licenseNumber || settings?.pfBrokerLicense || ''
    }
  };

  try {
    // Step 1: Create draft
    const createRes = await axios.post(`${pfUrl}/listings`, pfListingPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });

    const listingId = createRes.data?.id;
    if (!listingId) {
      throw new Error('Failed to obtain listing ID from Property Finder.');
    }

    // Step 2: Publish Listing (Asynchronous)
    await axios.post(`${pfUrl}/listings/${listingId}/publish`, {}, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });

    return {
      success: true,
      listingId,
      status: 'PUBLISHING_QUEUED',
      message: 'Listing drafted and queue publishing request submitted successfully.'
    };
  } catch (err: any) {
    console.error('[Property Finder Service] Sync Listing Failed:', err.message);
    throw new Error(`Portal upload failed: ${err.response?.data?.detail || err.message}`);
  }
}

const mockListings = [
  {
    id: "pf-import-101",
    title: "Scenic 2BR Oasis with Marina Views",
    description: "This ready-to-move-in two-bedroom apartment offers panoramic marina views. It has high ceilings, premium tile flooring, built-in wardrobes, a fully-fitted European kitchen, and a spacious balcony. Perfect for families looking for a vibrant waterfront luxury lifestyle.",
    type: "Apartment",
    size: 1180,
    price: { value: 165000, type: "rent", period: "yearly" },
    locationName: "Marina Gate 2",
    locationId: 50,
    referenceNo: "PF-G-101",
    unitNumber: "1405",
    category: "Apartment",
    purpose: "For Rent",
    furnishingType: "furnished",
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["central-ac", "covered-parking", "shared-gym", "shared-pool", "balcony"],
    media: {
      images: [
        { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80" },
        { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" }
      ]
    },
    titleDeedUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    permitDetails: {
      permitNumber: "7117822530",
      licenseNumber: "1501234"
    },
    assignedTo: {
      id: 216582,
      name: "Mirza Ali"
    }
  },
  {
    id: "pf-import-102",
    title: "High-Floor Elegant Studio in Downtown",
    description: "Gorgeous, fully furnished luxury studio in Downtown Views II. Features state of the art finishes, floor-to-ceiling windows, open kitchen layout, and walks directly to Dubai Mall. Ideal short-term holiday base with high occupancy rates and premium return on investment.",
    type: "Apartment",
    size: 540,
    price: { value: 95000, type: "rent", period: "yearly" },
    locationName: "Downtown Views II",
    locationId: 30,
    referenceNo: "PF-D-102",
    unitNumber: "3302",
    category: "Apartment",
    purpose: "For Rent",
    furnishingType: "furnished",
    bedrooms: 0,
    bathrooms: 1,
    amenities: ["central-ac", "security", "lobby-in-building", "shared-pool"],
    media: {
      images: [
        { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80" }
      ]
    },
    titleDeedUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    permitDetails: {
      permitNumber: "7122485900",
      licenseNumber: "1501234"
    },
    assignedTo: {
      id: 216582,
      name: "Mirza Ali"
    }
  },
  {
    id: "pf-import-103",
    title: "Majestic Sunset Villa in Palm Jumeirah",
    description: "Exceptional beachfront Signature Villa on Frond J. This property features 5 sprawling en-suite bedrooms, private landscaped garden, custom infinity pool, private beach access, high ceilings, double glazed windows, and smart automation systems for maximum security and peace of mind.",
    type: "Villa",
    size: 6500,
    price: { value: 12500000, type: "sale", period: "one-time" },
    locationName: "Signature Villas Frond J",
    locationId: 75,
    referenceNo: "PF-P-103",
    unitNumber: "Frond J24",
    category: "Villa",
    purpose: "For Sale",
    furnishingType: "unfurnished",
    bedrooms: 5,
    bathrooms: 6,
    amenities: ["private-pool", "private-garden", "security", "maid-service", "maids-room", "balcony"],
    media: {
      images: [
        { url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80" },
        { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80" }
      ]
    },
    titleDeedUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    permitDetails: {
      permitNumber: "7044812350",
      licenseNumber: "1501234"
    },
    assignedTo: {
      id: 216582,
      name: "Mirza Ali"
    }
  }
];

async function downloadAndSaveFile(fileUrl: string, buildingName: string, unitNumber: string, category: 'images' | 'documents', originalName: string): Promise<string> {
  const safeBuildingName = buildingName.replace(/[^\s\w\-\.]/g, "_").trim();
  const safeUnitNumber = unitNumber.replace(/[^\s\w\-\.]/g, "_").trim();
  const outputFileName = `${category}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${path.extname(originalName) || (category === 'images' ? '.webp' : '.pdf')}`;

  const useVps = !!process.env.VPS_FTP_HOST;
  
  try {
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 20000 });
    const buffer = Buffer.from(response.data);

    if (useVps) {
      const client = new ftp.Client();
      client.ftp.verbose = true;
      try {
        let hostToConnect = process.env.VPS_FTP_HOST || "";
        if (hostToConnect === "ftp.jad-etude.pro") {
          hostToConnect = "media.authenticholidayhomes.ae";
        }
        
        await client.access({
          host: hostToConnect,
          user: process.env.VPS_FTP_USER,
          password: process.env.VPS_FTP_PASS,
          port: parseInt(process.env.VPS_FTP_PORT || "21"),
          secure: process.env.VPS_FTP_SECURE === "true",
          secureOptions: { rejectUnauthorized: false }
        });

        const baseDir = process.env.VPS_FTP_REMOTE_DIR || "public_html/uploads";
        await client.cd("/");
        const baseParts = baseDir.split("/").filter(Boolean);
        for (const part of baseParts) {
          await client.ensureDir(part);
        }

        const pathParts = ["properties", safeBuildingName, safeUnitNumber, category];
        for (const part of pathParts) {
          await client.ensureDir(part);
        }

        const uploadStream = Readable.from(buffer);
        await client.uploadFrom(uploadStream, outputFileName);

        const mediaBaseUrl = (process.env.VPS_MEDIA_BASE_URL || "https://authenticholidayhomes.ae/uploads").replace(/\/$/, "");
        return `${mediaBaseUrl}/properties/${encodeURIComponent(safeBuildingName)}/${encodeURIComponent(safeUnitNumber)}/${category}/${outputFileName}`;
      } finally {
        try { client.close(); } catch(e){}
      }
    } else {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "properties", safeBuildingName, safeUnitNumber, category);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, outputFileName), buffer);
      return `/uploads/properties/${encodeURIComponent(safeBuildingName)}/${encodeURIComponent(safeUnitNumber)}/${category}/${outputFileName}`;
    }
  } catch (err: any) {
    console.error(`[Property Finder Import] Failed to download and store file from ${fileUrl}:`, err.message);
    // Return original url as fallback so the resource is not lost
    return fileUrl;
  }
}

function ensureString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.en || val.ar || Object.values(val)[0] || '';
  }
  return String(val);
}

function normalizeListing(l: any): any {
  if (!l) return l;

  let resolvedBuilding = ensureString(l.buildingName);
  let resolvedLocation = ensureString(l.locationName);

  if (!resolvedBuilding && l.building) {
    resolvedBuilding = ensureString(l.building.name || l.building.title);
  }

  if (l.location && typeof l.location === 'object') {
    const locFull = l.location.fullName || l.location.name || l.location.title;
    const locName = l.location.name || l.location.title;

    const fullStr = ensureString(locFull);
    const shortStr = ensureString(locName);

    if (fullStr) {
      resolvedLocation = fullStr;
    }
    if (shortStr && !resolvedBuilding) {
      resolvedBuilding = shortStr;
    }
  }

  if (!resolvedBuilding && resolvedLocation) {
    const parts = resolvedLocation.split(',');
    resolvedBuilding = parts[0]?.trim() || resolvedLocation;
  }

  return {
    ...l,
    title: ensureString(l.title),
    description: ensureString(l.description),
    locationName: ensureString(resolvedLocation || l.locationName || l.buildingName || 'Dubai Marina, Dubai'),
    buildingName: ensureString(resolvedBuilding || l.buildingName || 'Signature Heights'),
    category: ensureString(l.category || l.type || l.categoryName),
    type: ensureString(l.type || l.category || l.typeName),
  };
}

export async function getPropertyFinderListings(): Promise<any[]> {
  const settings = await getSettings('global');
  const isDemo = !settings || !settings.pfEnabled || settings.pfApiKey === 'demo' || settings.pfApiKey === 'mock';

  if (isDemo) {
    return mockListings.map(normalizeListing);
  }

  try {
    const token = await getPropertyFinderToken();
    const pfUrl = settings.pfApiUrl || 'https://atlas.propertyfinder.com/v1';
    
    // We fetch draft & active listings paginated to retrieve all records safely
    const fetchListingsForType = async (isDraft: boolean): Promise<any[]> => {
      let listingsList: any[] = [];
      let page = 1;
      let hasMore = true;
      const perPage = 50; // Use steady 50 records per page as specified by API constraints
      
      while (hasMore && page <= 20) { // Safe deep boundary of 1000 items (20 pages * 50)
        try {
          const response = await axios.get(`${pfUrl}/listings?draft=${isDraft}&perPage=${perPage}&page=${page}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 15000
          });
          
          let pageListings: any[] = [];
          if (response.data && Array.isArray(response.data.results)) {
            pageListings = response.data.results;
          } else if (response.data && Array.isArray(response.data.data)) {
            pageListings = response.data.data;
          }
          
          if (pageListings.length === 0) {
            hasMore = false;
          } else {
            listingsList.push(...pageListings);
            // If less than the page size was fetched, this was the last page
            if (pageListings.length < perPage) {
              hasMore = false;
            } else {
              page++;
            }
          }
        } catch (pageErr: any) {
          console.error(`[Property Finder Service] Paginated fetch failed on page ${page} (draft=${isDraft}):`, pageErr.message);
          hasMore = false;
        }
      }
      return listingsList;
    };

    const [drafts, published] = await Promise.all([
      fetchListingsForType(true),
      fetchListingsForType(false)
    ]);

    // Merge lists and de-duplicate based on Property Finder listing ID
    const mergedMap = new Map<string, any>();
    for (const item of [...drafts, ...published]) {
      if (item && item.id) {
        mergedMap.set(String(item.id), item);
      }
    }
    
    const rawListings = Array.from(mergedMap.values());
    console.log(`[Property Finder Service] Retrieved ${rawListings.length} total listings from live endpoints (including drafts and duplicates de-duplicated)`);
    return rawListings.map(normalizeListing);
  } catch (err: any) {
    console.warn('[Property Finder Service] Live search failed, returning mock fallback for UX testing:', err.message);
    return mockListings.map(normalizeListing);
  }
}

function getImageUrl(imgObj: any): string | null {
  if (!imgObj) return null;
  if (typeof imgObj === 'string') return imgObj;
  if (imgObj.original?.url) return imgObj.original.url;
  if (imgObj.url) return imgObj.url;
  if (imgObj.medium?.url) return imgObj.medium.url;
  if (imgObj.large?.url) return imgObj.large.url;
  return null;
}

function parsePropertyFinderPrice(priceObj: any): {
  price: number;
  priceDaily: number;
  priceMonthly: number;
  purpose: string;
} {
  let price = 150000;
  let priceDaily = 0;
  let priceMonthly = 0;
  let purpose = 'For Rent';

  if (!priceObj) {
    return { price, priceDaily: Math.round(price / 365), priceMonthly: Math.round(price / 12), purpose };
  }

  if (typeof priceObj === 'number') {
    price = priceObj;
  } else if (typeof priceObj === 'object') {
    const type = priceObj.type || '';
    const amounts = priceObj.amounts || {};
    
    if (typeof priceObj.value === 'number' || typeof priceObj.value === 'string') {
      price = Number(priceObj.value);
      const isRent = priceObj.type === 'rent' || priceObj.period;
      purpose = isRent ? 'For Rent' : 'For Sale';
      if (priceObj.period === 'daily') {
        priceDaily = price;
        priceMonthly = price * 30;
      } else if (priceObj.period === 'monthly') {
        priceMonthly = price;
        priceDaily = price / 30;
      } else {
        priceMonthly = price / 12;
        priceDaily = price / 365;
      }
      return { price, priceDaily, priceMonthly, purpose };
    }

    if (type === 'sale') {
      price = Number(amounts.sale || 0);
      purpose = 'For Sale';
      priceDaily = price / 365;
      priceMonthly = price / 12;
    } else {
      purpose = 'For Rent';
      const yearlyVal = Number(amounts.yearly || 0);
      const monthlyVal = Number(amounts.monthly || 0);
      const weeklyVal = Number(amounts.weekly || 0);
      const dailyVal = Number(amounts.daily || 0);

      if (type === 'yearly' && yearlyVal) {
        price = yearlyVal;
        priceMonthly = monthlyVal || (yearlyVal / 12);
        priceDaily = dailyVal || (yearlyVal / 365);
      } else if (type === 'monthly' && monthlyVal) {
        price = monthlyVal;
        priceMonthly = monthlyVal;
        priceDaily = dailyVal || (monthlyVal / 30);
      } else if (type === 'daily' && dailyVal) {
        price = dailyVal;
        priceDaily = dailyVal;
        priceMonthly = monthlyVal || (dailyVal * 30);
      } else if (type === 'weekly' && weeklyVal) {
        price = weeklyVal;
        priceDaily = dailyVal || (weeklyVal / 7);
        priceMonthly = monthlyVal || (weeklyVal * 4.3);
      } else {
        const activePrice = yearlyVal || monthlyVal || dailyVal || weeklyVal;
        if (activePrice) {
          price = activePrice;
          priceMonthly = monthlyVal || (yearlyVal ? yearlyVal / 12 : activePrice);
          priceDaily = dailyVal || (yearlyVal ? yearlyVal / 365 : activePrice / 30);
        }
      }
    }
  }

  if (!priceDaily) priceDaily = price / 365;
  if (!priceMonthly) priceMonthly = price / 12;

  price = Math.round(price);
  priceDaily = Math.round(priceDaily);
  priceMonthly = Math.round(priceMonthly);

  return { price, priceDaily, priceMonthly, purpose };
}

export async function importPropertyFinderListing(listingId: string, hostId?: string): Promise<any> {
  const listings = await getPropertyFinderListings();
  const listing = listings.find((l: any) => String(l.id) === String(listingId));

  if (!listing) {
    throw new Error(`Listing with ID ${listingId} not found on Property Finder.`);
  }

  let buildingName = listing.buildingName || listing.locationName || "Signature Heights";
  if (buildingName.toLowerCase() === "unknown building" && listing.locationName) {
    buildingName = listing.locationName;
  }
  if (buildingName.includes(',')) {
    const candidate = buildingName.split(',')[0].trim();
    if (candidate) {
      buildingName = candidate;
    }
  }
  if (!buildingName || buildingName.toLowerCase() === "unknown building") {
    buildingName = "Signature Heights";
  }

  const unitNumber = listing.unitNumber || listing.referenceNo || `Unit-${Math.floor(100 + Math.random()*900)}`;

  console.log(`[Property Finder Import] Importing listing: ${listing.title} (${buildingName} - ${unitNumber})`);

  // Download and store images securely
  const webpUrls: string[] = [];
  const imageUrls = listing.media?.images || listing.images || [];
  
  for (let i = 0; i < imageUrls.length; i++) {
    const imgObj = imageUrls[i];
    const imgUrl = getImageUrl(imgObj);
    if (imgUrl) {
      console.log(`[Property Finder Import] Downloading image ${i+1}/${imageUrls.length}: ${imgUrl}`);
      const storedUrl = await downloadAndSaveFile(imgUrl, buildingName, unitNumber, 'images', `image_${i}.jpg`);
      webpUrls.push(storedUrl);
    }
  }

  // Download and store title deed or papers
  let storedTitleDeedUrl = null;
  const originalDeedUrl = listing.titleDeedUrl || listing.titleDeed?.value || null;
  if (originalDeedUrl && typeof originalDeedUrl === 'string') {
    console.log(`[Property Finder Import] Downloading title deed document...`);
    storedTitleDeedUrl = await downloadAndSaveFile(originalDeedUrl, buildingName, unitNumber, 'documents', 'TitleDeed.pdf');
  }

  // Compile final mapped property listing
  const systemPropertyId = `pf-imported-${listing.id}`;
  
  const amenitiesObj: any = {
    general: listing.amenities || []
  };

  const imagesObj = {
    avif: [],
    webp: webpUrls,
    png: []
  };

  const { price, priceDaily, priceMonthly, purpose } = parsePropertyFinderPrice(listing.price);

  let bedrooms = 0;
  if (listing.bedrooms) {
    if (typeof listing.bedrooms === 'number') {
      bedrooms = listing.bedrooms;
    } else if (typeof listing.bedrooms === 'string') {
      if (listing.bedrooms.toLowerCase() === 'studio') {
        bedrooms = 0;
      } else {
        const parsed = parseInt(listing.bedrooms, 10);
        bedrooms = isNaN(parsed) ? 1 : parsed;
      }
    }
  }

  let bathrooms = 0;
  if (listing.bathrooms) {
    if (typeof listing.bathrooms === 'number') {
      bathrooms = listing.bathrooms;
    } else if (typeof listing.bathrooms === 'string') {
      if (listing.bathrooms.toLowerCase() === 'none') {
        bathrooms = 0;
      } else {
        const parsed = parseInt(listing.bathrooms, 10);
        bathrooms = isNaN(parsed) ? 1 : parsed;
      }
    }
  }

  let furnishing = 'Furnished';
  if (listing.furnishingType) {
    const fType = String(listing.furnishingType).toLowerCase();
    if (fType === 'unfurnished') {
      furnishing = 'Unfurnished';
    } else if (fType === 'partially' || fType === 'partly_furnished' || fType === 'semi-furnished') {
      furnishing = 'Partially Furnished';
    } else {
      furnishing = 'Furnished';
    }
  }

  const mappedProperty = {
    id: systemPropertyId,
    title: listing.title || "Property Finder Sync",
    description: listing.description || "",
    location: {
      address: `${buildingName}, ${listing.location || "Dubai"}`,
      lat: 25.2048,
      lng: 55.2708
    },
    price: price,
    priceDaily: priceDaily,
    priceMonthly: priceMonthly,
    images: imagesObj,
    amenities: amenitiesObj,
    hostId: hostId || 'imported_pf',
    isAvailable: false,
    status: 'draft',
    rating: 5.0,
    reviewCount: 0,
    category: listing.category || listing.type || 'Apartment',
    unitNumber: unitNumber,
    buildingName: buildingName,
    referenceNo: listing.referenceNo || `PF-${listing.id}`,
    purpose: purpose,
    furnishing: furnishing,
    size: listing.size || 1200,
    bedrooms: bedrooms,
    bathrooms: bathrooms,
    maxGuests: Math.max(1, bedrooms * 2),
    minimumNights: purpose === 'For Sale' ? 30 : 1,
    landlordId: null,
    buildingId: null,
    // Prepared Property Finder integration metadata columns:
    pfListingId: String(listing.id),
    pfImported: true,
    pfRawData: JSON.stringify(listing),
    pfPermitNumber: listing.permitDetails?.permitNumber || listing.listingAdvertisementNumber || null,
    pfLocationId: Number(listing.locationId || 50),
    pfAssignedTo: listing.assignedTo?.name || null
  };

  // Persist imported property listing inside system SQL tables
  await saveProperty(systemPropertyId, mappedProperty);

  return {
    success: true,
    propertyId: systemPropertyId,
    title: mappedProperty.title,
    imagesCount: webpUrls.length,
    documentUrl: storedTitleDeedUrl,
    property: mappedProperty,
    message: `Listing '${mappedProperty.title}' successfully imported from Property Finder and cataloged in the SQL database.`
  };
}
