-- Authentic Holiday Homes Database Schema
-- Paste and execute this in phpMyAdmin under the SQL tab.

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    displayName VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    role VARCHAR(50) DEFAULT 'guest',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wishlist TEXT -- Stored as comma-separated IDs or JSON string
);

-- 2. Properties Table
CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) DEFAULT '',
    price DECIMAL(10, 2) DEFAULT 0.00,
    images TEXT, -- JSON array string of imageUrls
    amenities TEXT, -- JSON array string of amenities
    hostId VARCHAR(128) NOT NULL,
    isAvailable TINYINT(1) DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(128) PRIMARY KEY,
    propertyId VARCHAR(128) NOT NULL,
    propertyName VARCHAR(255) DEFAULT '',
    guestId VARCHAR(128) NOT NULL,
    guestName VARCHAR(255) DEFAULT '',
    guestEmail VARCHAR(191) DEFAULT '',
    guestPhone VARCHAR(50) DEFAULT '',
    checkIn DATE NOT NULL,
    checkOut DATE NOT NULL,
    totalPrice DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled'
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Secure Documents Table
CREATE TABLE IF NOT EXISTS secured_documents (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    fileName VARCHAR(255) DEFAULT '',
    url TEXT NOT NULL,
    uploadedBy VARCHAR(128) DEFAULT '',
    uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Turnovers Table
CREATE TABLE IF NOT EXISTS turnovers (
    id VARCHAR(128) PRIMARY KEY,
    bookingId VARCHAR(128) NOT NULL,
    propertyTitle VARCHAR(255) DEFAULT '',
    scheduledDate DATE NOT NULL,
    cleanerName VARCHAR(255) DEFAULT 'Unassigned',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed'
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Support Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(128) PRIMARY KEY,
    userId VARCHAR(128) DEFAULT '',
    userEmail VARCHAR(191) DEFAULT '',
    subject VARCHAR(255) DEFAULT '',
    description TEXT,
    category VARCHAR(100) DEFAULT 'maintenance',
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'resolved'
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    messages TEXT -- JSON array of chat messages
);

-- 7. Staff Messages (Public Channel)
CREATE TABLE IF NOT EXISTS staff_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(128) NOT NULL,
    userEmail VARCHAR(191) NOT NULL,
    text TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Staff / Support DMs
CREATE TABLE IF NOT EXISTS staff_dms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    senderId VARCHAR(128) NOT NULL,
    senderEmail VARCHAR(191) NOT NULL,
    recipientId VARCHAR(128) NOT NULL,
    recipientEmail VARCHAR(191) NOT NULL,
    text TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Invitations Table
CREATE TABLE IF NOT EXISTS invitations (
    token VARCHAR(128) PRIMARY KEY,
    email VARCHAR(191) NOT NULL,
    role VARCHAR(50) NOT NULL,
    note TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted'
    invitedBy VARCHAR(128) DEFAULT '',
    invitedByEmail VARCHAR(191) DEFAULT '',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acceptedBy VARCHAR(128) DEFAULT NULL,
    acceptedAt TIMESTAMP NULL DEFAULT NULL
);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(128) DEFAULT 'anonymous',
    userEmail VARCHAR(191) DEFAULT 'anonymous',
    userRole VARCHAR(50) DEFAULT 'guest',
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip VARCHAR(100) DEFAULT '127.0.0.1',
    userAgent VARCHAR(255) DEFAULT '',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Push Device Tokens (FCM/Mobile/Web)
CREATE TABLE IF NOT EXISTS device_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(128) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(50) DEFAULT 'web',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

