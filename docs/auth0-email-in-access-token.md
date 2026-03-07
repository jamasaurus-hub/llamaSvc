# Auth0: Add Email to Access Token

## Why this is needed

The backend uses the **access token** (JWT) to identify users and perform Just-In-Time (JIT) provisioning. When a new user signs in, the backend:

1. Verifies the token
2. Extracts `sub` (Auth0 user ID) and `email` from the token
3. Creates or updates the user in the database with that email

**Auth0 access tokens do not include `email` by default** when issued for an API. Without configuration, the backend receives an empty email and users are created with `email: ''`.

This document describes how to configure Auth0 so the access token includes the user's email.

---

## For frontend developers

**You do not need to change your client code.** Continue sending the access token as usual:

```http
Authorization: Bearer <access_token>
```

The backend will receive the email from the token automatically once Auth0 is configured. No changes to your Auth0 SPA SDK setup, `getTokenSilently()`, or API calls are required.

**Who must do this:** Whoever has access to the Auth0 Dashboard (e.g. backend/DevOps or project owner). If that's not you, share this doc with them.

---

## Auth0 configuration (one-time setup)

### Step 1: Create a Login Action

1. Log in to the [Auth0 Dashboard](https://manage.auth0.com)
2. Go to **Actions** → **Flows** → **Login**
3. Click **+ Add Action** → **Build from scratch**
4. Name it (e.g. `Add email to access token`)
5. Click **Create**

### Step 2: Add the Action code

Replace the default code with one of the following.

**Option A – Namespaced claim (recommended)**  
Use your API identifier (same value as the backend’s `AUTH_AUDIENCE`) as the claim namespace:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  if (event.authorization) {
    api.accessToken.setCustomClaim(
      "https://your-api.com/email",
      event.user.email
    );
  }
};
```

Replace `https://your-api.com` with your actual API identifier (e.g. `https://api.yourapp.com`). It must match the backend’s `AUTH_AUDIENCE` env var.

**Option B – Standard claim**

```javascript
exports.onExecutePostLogin = async (event, api) => {
  if (event.authorization) {
    api.accessToken.setCustomClaim('email', event.user.email || '');
  }
};
```

Either option adds the email to the access token when the token is issued for your API.

### Step 3: Deploy and add to the flow

1. Click **Deploy**
2. Drag the Action from the right panel into the **Login** flow (between "Start" and "Complete")
3. Click **Apply**

### Step 4: Verify

1. Log out of your app (or use an incognito window)
2. Log in again
3. Decode the access token (e.g. at [jwt.io](https://jwt.io)) and confirm the payload includes the email:
   - Namespaced: `"https://your-api.com/email": "user@example.com"`
   - Standard: `"email": "user@example.com"`

---

## What the backend expects

The backend reads the email from the token in this order:

1. `email` (standard claim)
2. `preferred_username` (fallback)
3. `{AUTH_AUDIENCE}/email` – namespaced claim (e.g. `https://your-api.com/email` when `AUTH_AUDIENCE` is `https://your-api.com`)
4. `{AUTH_ISSUER}email` – issuer-based namespaced fallback

So both the standard `email` claim and the namespaced `https://your-api.com/email` format are supported. The namespace in the Action must match the backend’s `AUTH_AUDIENCE` exactly.

---

## Summary

| Item | Action |
|------|--------|
| **Frontend** | No changes; keep sending `Authorization: Bearer <token>` |
| **Backend** | No changes; already extracts `email` from the token |
| **Auth0** | Add a Login Action that sets the email claim (standard `email` or namespaced `{AUTH_AUDIENCE}/email`) |
