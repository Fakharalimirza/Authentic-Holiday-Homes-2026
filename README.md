# Authentic Holiday Homes - Mobile App Project

This project is a high-end holiday home management platform built with React, Vite, and Tailwind CSS. It is configured with Capacitor to be easily converted into a native Android (and iOS) application.

## Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js**: [Download and install](https://nodejs.org/) (LTS version recommended)
- **Android Studio**: [Download and install](https://developer.android.com/studio) (Required for Android development)
- **NPM**: Comes bundled with Node.js

## Project Setup

1. **Install Dependencies**:
   Open your terminal in the project root and run:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   To see the web version of the project:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## Android Migration & Development

The project is already initialized with **Capacitor**. Follow these steps to build and run the app in Android Studio:

### 1. Build the Web Project
First, compile the React application into static files:
```bash
npm run build
```

### 2. Sync with Capacitor
This command copies the built web assets into the native Android project:
```bash
npx cap sync android
```

### 3. Open in Android Studio
Launch the Android project in Android Studio:
```bash
npx cap open android
```

### 4. Run on Device/Emulator
Once Android Studio is open:
- Wait for Gradle to finish syncing.
- Select your target device (emulator or physical device).
- Click the **Run** button (green play icon) to launch the app.

## Project Structure

- `src/`: Contains all React components and pages.
- `android/`: The native Android project folder (open this in Android Studio).
- `capacitor.config.ts`: Capacitor configuration file.
- `public/`: Static assets.

## Key Dependencies

- **React 19**: Modern UI library.
- **Vite**: Ultra-fast build tool.
- **Tailwind CSS 4**: For high-end styling.
- **Framer Motion**: Smooth animations.
- **Capacitor**: Native bridge for Android/iOS.
- **Lucide React**: Premium icon set.

## Common Capacitor Commands

- `npx cap copy android`: Copy only web assets.
- `npx cap sync android`: Copy assets and update native plugins.
- `npx cap open android`: Open Android Studio.
- `npx cap update`: Update native platforms and dependencies.

---
© 2026 Authentic Holiday Homes. All Rights Reserved.
