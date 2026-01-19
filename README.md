# PassedAI Blog Posts

This repository contains automatically generated SEO blog posts for [PassedAI](https://passedai.io).

## 📝 Automatic Generation

Blog posts are automatically generated daily at 6:00 AM UTC using DeepSeek AI. Each day, 10 new SEO-optimized blog posts are created covering topics related to:

- AI Detection
- AI Text Humanization
- AI Writing Tools
- Tips for Students & Content Writers

## 🗂️ Structure

```
posts/
├── index.json          # Index of all posts
└── YYYY-MM-DD-slug.mdx # Individual posts
```

## 🔧 Manual Trigger

You can manually trigger post generation:

1. Go to **Actions** tab
2. Select **Daily Blog Post Generator**
3. Click **Run workflow**
4. Optionally specify the number of posts

## ⚙️ Required Secrets

Add these secrets in **Settings > Secrets and variables > Actions**:

| Secret | Description |
|--------|-------------|
| `DEEPSEEK_API_KEY` | Your DeepSeek API key |
| `VERCEL_DEPLOY_HOOK` | (Optional) Vercel deploy hook URL |

## 📄 License

All content is © PassedAI. All rights reserved.
