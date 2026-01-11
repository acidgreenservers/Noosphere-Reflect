# GitHub Pages Deployment Protocol

**Protocol ID:** OP-GHP-001
**Version:** 1.0.0
**Last Updated:** January 10, 2026

## 1. Purpose
This protocol standardizes the setup for deploying React/Vite applications to GitHub Pages using GitHub Actions. It ensures the correct configuration of build paths and workflow permissions to prevent common "404" or "Blank Page" errors.

## 2. Configuration Steps

### 2.1. The "Base Path" Rule (Vite)
**Crucial Step**: GitHub Pages hosts project sites at `https://username.github.io/repo-name/`.
By default, Vite assumes the site is at the root (`/`). This breaks asset loading (CSS/JS).

**Action**: Update `vite.config.ts`:
```typescript
export default defineConfig({
  // MUST match your GitHub repository name exactly, with leading/trailing slashes
  base: '/Repo-Name-Here/', 
  // ... rest of config
});
```
*If using a custom domain (e.g., `docs.example.com`), set `base: '/'`.*

### 2.2. The Workflow File
Create `.github/workflows/deploy.yml` with this exact standard configuration:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 2.3. Repository Settings (Manual Step)
This cannot be automated via code. The user **MUST** perform this in the GitHub UI:
1.  Go to repository **Settings**.
2.  Click **Pages** (left sidebar).
3.  Under **Build and deployment** > **Source**, select **GitHub Actions** (Beta).
    *   *Note: Do not select "Deploy from a branch".*

## 3. Verification
1.  Push the changes to `main`.
2.  Go to the **Actions** tab in GitHub.
3.  Watch the "Deploy to GitHub Pages" workflow.
4.  Once green, click the URL provided in the "deploy" job output.
5.  **Sanity Check**: Open the console (F12) on the deployed site. If you see red 404s for `.js` or `.css` files, the **Base Path (2.1)** is likely incorrect.
