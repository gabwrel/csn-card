# Deploying "Can't Say No" to Vercel

This application is fully prepared and optimized for seamless deployment to **Vercel** with client-side **Firebase Authentication** (Google & Facebook login) and **Firestore** real-time database.

---

## 1. Quick Deploy via Vercel Dashboard (Recommended)

1. **Push your repository** to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and **Import** your repository.
3. Vercel automatically detects the **Vite** framework from `vercel.json` and `package.json`.
4. In the **Environment Variables** section, add your Firebase keys:

```env
VITE_FIREBASE_API_KEY=AIzaSyCYxK5ub3T9sSMF3Q0lyIam3C4Ejshz33Y
VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0742460446.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0742460446
VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0742460446.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=506038322500
VITE_FIREBASE_APP_ID=1:506038322500:web:3717d75bd0ebc925d74311
VITE_FIREBASE_FIRESTORE_DATABASE_ID=ai-studio-cantsayno-195dcb36-79ca-4c7d-ba99-17ba94466f5f
```
*(You can copy these directly from the in-app "Vercel Deploy" helper button!)*

5. Click **Deploy**. Your app will build in ~20 seconds!

---

## 2. Deploy via Vercel CLI

If you use the Vercel CLI:

```bash
# 1. Install Vercel CLI (if not already installed)
npm i -g vercel

# 2. Deploy to preview
vercel

# 3. Deploy to production
vercel --prod
```

---

## 3. Authorize Vercel Domain in Firebase Console

For Google and Facebook popups to authenticate successfully on your live Vercel domain:

1. Open [Firebase Console](https://console.firebase.google.com).
2. Select your project (`gen-lang-client-0742460446`).
3. Navigate to **Authentication** > **Settings** > **Authorized domains**.
4. Click **Add domain** and enter your Vercel URL (e.g. `your-app.vercel.app`).
5. Click **Done**.

---

## 4. Enabling Facebook Login (Optional)

1. Go to [Meta for Developers](https://developers.facebook.com) and create or select an App.
2. In your Firebase Console, navigate to **Authentication** > **Sign-in method** > **Facebook**.
3. Toggle **Enable**, paste your **App ID** and **App Secret** from Facebook, and save.
4. Copy the OAuth redirect URI shown by Firebase into your Facebook App settings.
