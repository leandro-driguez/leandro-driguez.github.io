#!/usr/bin/env node
/**
 * Notion → Jekyll Sync Script
 *
 * Fetches all "Published" posts from a Notion database, converts
 * them to Markdown with Jekyll-compatible front matter, and writes
 * them into the _posts/ directory.
 *
 * Environment variables required:
 *   NOTION_TOKEN         — Notion integration secret
 *   NOTION_DATABASE_ID   — ID of the Notion blog database
 */

'use strict';

const { Client } = require('@notionhq/client');
const fs   = require('fs');
const path = require('path');

// ─── Validate environment ─────────────────────────────────────────────────────

const NOTION_TOKEN   = process.env.NOTION_TOKEN;
const DATABASE_ID    = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN) {
  console.error('Error: NOTION_TOKEN environment variable is not set.');
  process.exit(1);
}
if (!DATABASE_ID) {
  console.error('Error: NOTION_DATABASE_ID environment variable is not set.');
  process.exit(1);
}

const notion   = new Client({ auth: NOTION_TOKEN });
const POSTS_DIR = path.resolve(__dirname, '..', '_posts');

// ─── Rich text → Markdown ─────────────────────────────────────────────────────

/**
 * Convert a Notion rich_text array to a Markdown string,
 * handling bold, italic, code, strikethrough, and links.
 */
function richTextToMarkdown(richText = []) {
  return richText.map((item) => {
    let text = item.plain_text ?? '';
    if (!text) return '';

    const ann  = item.annotations ?? {};
    const href = item.href;

    // Order matters: code wrapping must happen before bold/italic
    if (ann.code)          text = `\`${text}\``;
    if (ann.bold && ann.italic) text = `***${text}***`;
    else if (ann.bold)     text = `**${text}**`;
    else if (ann.italic)   text = `*${text}*`;
    if (ann.strikethrough) text = `~~${text}~~`;
    if (href)              text = `[${text}](${href})`;

    return text;
  }).join('');
}

// ─── Block → Markdown ─────────────────────────────────────────────────────────

/**
 * Convert a single Notion block object to a Markdown string.
 * Returns null for unsupported blocks (caller will skip them).
 */
function blockToMarkdown(block) {
  const type = block.type;
  const data = block[type];
  if (!data) return null;

  switch (type) {
    case 'paragraph':
      return richTextToMarkdown(data.rich_text);

    case 'heading_1':
      return `# ${richTextToMarkdown(data.rich_text)}`;

    case 'heading_2':
      return `## ${richTextToMarkdown(data.rich_text)}`;

    case 'heading_3':
      return `### ${richTextToMarkdown(data.rich_text)}`;

    case 'bulleted_list_item':
      return `- ${richTextToMarkdown(data.rich_text)}`;

    case 'numbered_list_item':
      // Kramdown treats repeated "1." as an incremented ordered list
      return `1. ${richTextToMarkdown(data.rich_text)}`;

    case 'to_do':
      return `- [${data.checked ? 'x' : ' '}] ${richTextToMarkdown(data.rich_text)}`;

    case 'code': {
      const lang = data.language && data.language !== 'plain text'
        ? data.language
        : '';
      // Use plain_text for code (no inline annotations needed)
      const code = (data.rich_text ?? []).map((r) => r.plain_text).join('');
      const caption = richTextToMarkdown(data.caption ?? []);
      const block_md = `\`\`\`${lang}\n${code}\n\`\`\``;
      return caption ? `${block_md}\n*${caption}*` : block_md;
    }

    case 'quote':
      return `> ${richTextToMarkdown(data.rich_text)}`;

    case 'callout': {
      const icon = data.icon?.emoji ? `${data.icon.emoji} ` : '';
      return `> ${icon}${richTextToMarkdown(data.rich_text)}`;
    }

    case 'divider':
      return '---';

    case 'image': {
      const url = data.type === 'external'
        ? (data.external?.url ?? '')
        : (data.file?.url ?? '');
      const caption = richTextToMarkdown(data.caption ?? []);
      return `![${caption}](${url})`;
    }

    case 'video': {
      const url = data.type === 'external'
        ? (data.external?.url ?? '')
        : (data.file?.url ?? '');
      const caption = richTextToMarkdown(data.caption ?? []);
      return caption
        ? `[▶ ${caption}](${url})`
        : `[▶ Watch video](${url})`;
    }

    case 'bookmark':
    case 'link_preview': {
      const url = data.url ?? '';
      return `[${url}](${url})`;
    }

    case 'toggle':
      return `<details>\n<summary>${richTextToMarkdown(data.rich_text)}</summary>\n\n</details>`;

    case 'table_of_contents':
      // Skip — Jekyll doesn't use Notion's TOC blocks
      return '';

    case 'child_page':
    case 'child_database':
      // Skip embedded child pages/databases
      return null;

    default:
      return null;
  }
}

// ─── Blocks → Markdown ────────────────────────────────────────────────────────

const LIST_TYPES = new Set([
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
]);

/**
 * Convert an ordered array of Notion blocks to a single Markdown string.
 * Consecutive list items are not separated by blank lines.
 */
function blocksToMarkdown(blocks) {
  const lines = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const md    = blockToMarkdown(block);

    if (md === null) continue; // unsupported block — skip

    const prevBlock   = i > 0 ? blocks[i - 1] : null;
    const isList      = LIST_TYPES.has(block.type);
    const prevIsList  = prevBlock ? LIST_TYPES.has(prevBlock.type) : false;

    // Insert blank line between blocks, but not between consecutive list items
    if (lines.length > 0 && !(isList && prevIsList)) {
      lines.push('');
    }

    if (md !== '') {
      lines.push(md);
    }
  }

  return lines.join('\n').trim();
}

// ─── Fetch all blocks (paginated) ─────────────────────────────────────────────

/**
 * Retrieve every child block of a page/block, following pagination.
 */
async function fetchAllBlocks(blockId) {
  const blocks = [];
  let cursor;

  do {
    const res = await notion.blocks.children.list({
      block_id:     blockId,
      start_cursor: cursor,
      page_size:    100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

// ─── Fetch published pages (paginated) ────────────────────────────────────────

/**
 * Query the Notion database and return all pages with Status = "Published".
 */
async function fetchPublishedPages() {
  const pages  = [];
  let cursor;

  do {
    const res = await notion.databases.query({
      database_id:  DATABASE_ID,
      filter: {
        property: 'Status',
        select:   { equals: 'Published' },
      },
      start_cursor: cursor,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return pages;
}

// ─── Metadata extraction ──────────────────────────────────────────────────────

/**
 * Slugify a title into a URL-safe string.
 */
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract blog post metadata from Notion page properties.
 * Handles flexible property naming (e.g. "Publish Date" vs "Date").
 */
function extractMeta(page) {
  const props = page.properties;

  // Title — try common property names
  const titleProp = props.Title ?? props.title ?? props.Name;
  const title =
    titleProp?.title?.[0]?.plain_text ??
    titleProp?.rich_text?.[0]?.plain_text ??
    'Untitled';

  // Slug — falls back to slugified title
  const slugProp = props.Slug ?? props.slug;
  const slug =
    slugProp?.rich_text?.[0]?.plain_text?.trim() ||
    titleToSlug(title);

  // Publish date — falls back to today
  const dateProp = props['Publish Date'] ?? props.Date ?? props.Published;
  const date =
    dateProp?.date?.start ??
    new Date().toISOString().split('T')[0];

  // Tags
  const tags = (props.Tags?.multi_select ?? []).map((t) => t.name);

  // Description / excerpt
  const descProp = props.Description ?? props.Excerpt ?? props.Summary;
  const description =
    descProp?.rich_text?.[0]?.plain_text?.trim() ?? '';

  // Cover image — supports both file and external URL types
  const coverFiles = props['Cover Image']?.files ?? [];
  const coverImage =
    coverFiles[0]?.external?.url ??
    coverFiles[0]?.file?.url ??
    '';

  // Optional fields
  const canonicalUrl = props['Canonical URL']?.url ?? '';
  const featured     = props.Featured?.checkbox ?? false;

  return { title, slug, date, tags, description, coverImage, canonicalUrl, featured };
}

// ─── Front matter generation ──────────────────────────────────────────────────

/**
 * Build a YAML front matter string from metadata + Notion page ID.
 */
function buildFrontMatter(meta, notionId) {
  const lines = ['---'];

  lines.push(`layout: post`);
  lines.push(`title: ${JSON.stringify(meta.title)}`);
  lines.push(`date: ${meta.date}`);
  lines.push(`slug: ${meta.slug}`);

  if (meta.tags.length > 0) {
    const tagList = meta.tags.map((t) => JSON.stringify(t)).join(', ');
    lines.push(`tags: [${tagList}]`);
  }

  if (meta.description) {
    lines.push(`excerpt: ${JSON.stringify(meta.description)}`);
  }

  if (meta.coverImage) {
    lines.push(`cover_image: ${JSON.stringify(meta.coverImage)}`);
  }

  if (meta.canonicalUrl) {
    lines.push(`canonical_url: ${JSON.stringify(meta.canonicalUrl)}`);
  }

  if (meta.featured) {
    lines.push(`featured: true`);
  }

  // Stable ID used to track the post across slug/date changes
  lines.push(`notion_id: ${JSON.stringify(notionId)}`);
  lines.push('---');

  return lines.join('\n');
}

/**
 * Return the _posts filename for a given date and slug.
 */
function postFilename(date, slug) {
  return `${date}-${slug}.md`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting Notion → Jekyll sync...\n');

  // Ensure _posts/ exists
  fs.mkdirSync(POSTS_DIR, { recursive: true });

  // ── Index existing posts by notion_id ────────────────────────────────────
  const existingFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'));

  // Map: notionId → filename
  const notionIdToFile = new Map();
  for (const file of existingFiles) {
    try {
      const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      const match   = content.match(/^notion_id:\s*"?([a-f0-9-]{36})"?/m);
      if (match) notionIdToFile.set(match[1], file);
    } catch {
      // Unreadable file — skip
    }
  }

  console.log(`  Existing posts in _posts/ : ${existingFiles.length}`);

  // ── Fetch published pages from Notion ────────────────────────────────────
  let publishedPages;
  try {
    publishedPages = await fetchPublishedPages();
  } catch (err) {
    console.error(`\n  Error querying Notion database: ${err.message}`);
    process.exit(1);
  }

  console.log(`  Published posts in Notion : ${publishedPages.length}\n`);

  const processedIds = new Set();
  const stats = { created: 0, updated: 0, unchanged: 0, errors: 0 };

  // ── Process each published page ──────────────────────────────────────────
  for (const page of publishedPages) {
    processedIds.add(page.id);

    let meta;
    try {
      meta = extractMeta(page);
    } catch (err) {
      console.error(`  [skip] Could not read metadata for ${page.id}: ${err.message}`);
      stats.errors++;
      continue;
    }

    console.log(`  → "${meta.title}"`);

    try {
      const blocks  = await fetchAllBlocks(page.id);
      const body    = blocksToMarkdown(blocks);
      const fm      = buildFrontMatter(meta, page.id);
      const content = `${fm}\n\n${body}\n`;

      const filename = postFilename(meta.date, meta.slug);
      const filePath = path.join(POSTS_DIR, filename);

      // Handle slug/date rename: delete old file if its path changed
      const prevFilename = notionIdToFile.get(page.id);
      if (prevFilename && prevFilename !== filename) {
        try {
          fs.unlinkSync(path.join(POSTS_DIR, prevFilename));
          console.log(`     renamed: ${prevFilename} → ${filename}`);
        } catch {
          // Old file already gone — that's fine
        }
      }

      // Only write if content actually changed (idempotent runs)
      let needsWrite = true;
      if (fs.existsSync(filePath)) {
        const existing = fs.readFileSync(filePath, 'utf8');
        needsWrite = existing !== content;
      }

      if (needsWrite) {
        fs.writeFileSync(filePath, content, 'utf8');
        const isNew = !prevFilename && !existingFiles.includes(filename);
        if (isNew) {
          console.log(`     created: ${filename}`);
          stats.created++;
        } else {
          console.log(`     updated: ${filename}`);
          stats.updated++;
        }
      } else {
        console.log(`     unchanged`);
        stats.unchanged++;
      }
    } catch (err) {
      console.error(`     [error] ${err.message}`);
      stats.errors++;
      // Continue processing remaining posts — one failure shouldn't stop all
    }
  }

  // ── Remove posts that are no longer published ─────────────────────────────
  for (const [notionId, filename] of notionIdToFile) {
    if (!processedIds.has(notionId)) {
      try {
        fs.unlinkSync(path.join(POSTS_DIR, filename));
        console.log(`\n  removed (unpublished): ${filename}`);
      } catch {
        console.warn(`  Warning: could not remove ${filename}`);
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────');
  console.log('Sync complete');
  console.log(`  Created   : ${stats.created}`);
  console.log(`  Updated   : ${stats.updated}`);
  console.log(`  Unchanged : ${stats.unchanged}`);
  console.log(`  Errors    : ${stats.errors}`);
  console.log('─────────────────────────────────');

  if (stats.errors > 0) {
    console.error('\nSync finished with errors (see above).');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
