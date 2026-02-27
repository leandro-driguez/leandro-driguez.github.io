# NotionGit Jekyll Blog

A free, minimalist blog template that syncs automatically from **Notion** to **GitHub Pages**.

Write posts in Notion → they appear on your site within ~10 minutes. No servers, no paid tools.

---

## How it works

```
Notion database  →  GitHub Action (cron)  →  _posts/*.md  →  Jekyll  →  GitHub Pages
```

1. A scheduled GitHub Action queries your Notion database every 10 minutes.
2. Published posts are converted to Markdown and committed to `_posts/`.
3. GitHub Pages rebuilds the Jekyll site automatically.

---

## Setup (≈ 15 minutes)

### Step 1 — Duplicate the Notion template

1. Open the [Notion blog database template](#) *(duplicate this into your workspace)*.
2. Make sure the database has these properties:

   | Property | Type | Notes |
   |---|---|---|
   | `Title` | Title | Post title |
   | `Slug` | Text | URL-friendly identifier, e.g. `my-first-post` |
   | `Status` | Select | Options: `Draft`, `Published` |
   | `Publish Date` | Date | Date to display on the post |
   | `Tags` | Multi-select | Optional but recommended |
   | `Cover Image` | Files & media | Optional cover photo |
   | `Description` | Text | Optional excerpt / meta description |

### Step 2 — Create a Notion integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations).
2. Click **+ New integration**, give it a name (e.g. *Blog Sync*), and select your workspace.
3. Copy the **Internal Integration Token** — you'll need it in Step 4.
4. Back in Notion, open your blog database, click `···` → **Add connections**, and connect your integration.

### Step 3 — Use this GitHub template

1. Click **"Use this template"** at the top of this repository.
2. Give your repo a name (e.g. `my-blog` or `username.github.io`).
3. Clone or open the new repo.

### Step 4 — Add secrets to GitHub

In your repo go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret name | Value |
|---|---|
| `NOTION_TOKEN` | Your Notion integration token from Step 2 |
| `NOTION_DATABASE_ID` | The ID of your Notion database (see below) |

**Finding your database ID:**
Open the database in Notion and look at the URL:
```
https://www.notion.so/yourworkspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                   This 32-character string is the database ID
```

### Step 5 — Configure the site

Edit `_config.yml` and update:

```yaml
title: "Your Blog Name"
description: "A short description of your blog."
url: "https://username.github.io"   # or your custom domain
baseurl: ""                          # leave empty for username.github.io repos

author:
  name: "Your Name"
  email: "you@example.com"
```

Also edit `about.md` to write your about page.

### Step 6 — Enable GitHub Pages

1. Go to **Settings → Pages**.
2. Under **Source**, select **Deploy from a branch**.
3. Select branch `master` (or `main`) and folder `/ (root)`.
4. Click **Save**.

Your site will be live at `https://username.github.io` (or your custom domain) within a minute.

### Step 7 — Publish your first post

1. Open your Notion database.
2. Create a new row (post).
3. Fill in `Title`, `Slug`, `Publish Date`, and any `Tags`.
4. Write the post content in the page body.
5. Set `Status` to **Published**.
6. Wait up to 10 minutes for the sync to run, or trigger it manually:
   - Go to **Actions → Sync Notion → Jekyll → Run workflow**.

---

## Supported Notion content

| Notion block | Markdown output |
|---|---|
| Paragraph | Plain paragraph |
| Heading 1 / 2 / 3 | `#` / `##` / `###` |
| Bulleted list | `- item` |
| Numbered list | `1. item` |
| To-do list | `- [ ] item` / `- [x] item` |
| Code block | ` ```lang ``` ` with syntax highlighting |
| Quote | `> blockquote` |
| Callout | `> 💡 callout text` |
| Divider | `---` |
| Image | `![caption](url)` |
| Video | Link |
| Bookmark / link preview | Inline link |
| Toggle | `<details><summary>...</summary>` |

---

## Customisation

### Site title, description, author
Edit `_config.yml`.

### About page
Edit `about.md`.

### Navigation
Edit `_includes/header.html` to add or change nav links.

### Theme colours
All design tokens (colours, fonts, spacing) are CSS custom properties at the top of `assets/css/main.css`. Override the `:root` block to change the look.

### Custom domain
1. Add a `CNAME` file to the repo root containing your domain (e.g. `blog.example.com`).
2. Configure your DNS provider to point to GitHub Pages.
3. Update `url:` in `_config.yml`.

---

## Unpublishing a post

Set the post's `Status` to `Draft` in Notion. On the next sync run, the file will be removed from `_posts/` and the page will disappear from the site.

---

## Local development

```bash
# Install Ruby dependencies
bundle install

# Serve locally (hot-reload)
bundle exec jekyll serve

# Test the sync script locally
NOTION_TOKEN=secret_xxx NOTION_DATABASE_ID=xxx node scripts/sync-notion.js
```

---

## Repository structure

```
├── _posts/               ← generated by sync (do not edit manually)
├── _layouts/
│   ├── default.html      ← base HTML shell
│   ├── home.html         ← post list page
│   ├── post.html         ← individual post
│   └── page.html         ← static pages (About, etc.)
├── _includes/
│   ├── head.html         ← <head> meta, CSS link
│   ├── header.html       ← site nav
│   ├── footer.html
│   └── post-card.html    ← post preview on home page
├── assets/css/main.css   ← full theme (≈ 500 lines, plain CSS)
├── scripts/
│   └── sync-notion.js    ← Notion fetch + Markdown conversion
├── .github/workflows/
│   └── sync-notion.yml   ← scheduled GitHub Action
├── _config.yml
├── index.html            ← home page (uses home layout)
├── about.md
└── tags.html
```

---

## FAQ

**Q: How often does the sync run?**
Every 10 minutes via a GitHub Actions cron schedule. You can also trigger it manually from the Actions tab. Note: GitHub may occasionally delay scheduled workflows by a few minutes under high load.

**Q: What if a post has errors?**
The sync script logs detailed output. One failing post will not prevent other posts from syncing. Check the Actions run log for details.

**Q: Are Notion image URLs permanent?**
Notion-hosted file URLs expire after ~1 hour. For images in posts, use **external** image URLs (Unsplash, your own CDN, etc.) instead of uploading files directly to Notion. Set the `Cover Image` property to an external URL for reliable cover images.

**Q: Can I use a custom Jekyll theme?**
Yes. Replace the contents of `_layouts/`, `_includes/`, and `assets/css/main.css` with any Jekyll-compatible theme. The sync script only touches `_posts/`.

**Q: Will GitHub Pages build correctly?**
The theme uses only GitHub Pages–supported plugins (`jekyll-feed`, `jekyll-seo-tag`, `jekyll-sitemap`). No custom plugins that require `--safe` bypassing.

---

## License

MIT — free to use, modify, and deploy.
