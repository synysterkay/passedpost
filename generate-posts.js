const fs = require('fs');
const path = require('path');

const SEO_KEYWORDS = [
  'AI detector', 'AI detection', 'bypass AI detection', 'humanize AI text',
  'AI content detector', 'GPTZero', 'Turnitin AI', 'Originality AI',
  'AI writing detector', 'ChatGPT detector', 'AI text humanizer',
  'how to bypass AI detection', 'make AI text undetectable',
  'pass Turnitin AI detection', 'bypass GPTZero', 'humanize ChatGPT text',
  'AI detection bypass tool', 'undetectable AI writing',
  'best AI humanizer 2025', 'AI detection accuracy',
  'AI writing tips', 'content authenticity', 'AI generated content'
];

const TOPIC_TEMPLATES = [
  "How to {action} in {year}: Complete Guide",
  "{number} Ways to {action} Successfully",
  "{tool1} vs {tool2}: Which is Better in {year}?",
  "Why {tool} {verb} and What You Can Do About It",
  "The Ultimate {topic} Guide for {audience}",
  "{number} {topic} Tips That Actually Work in {year}",
  "Is {tool} Accurate? {year} Analysis",
  "Best {category} Tools Compared: {year} Edition",
  "How {audience} Can {action} Easily",
  "{topic}: Everything You Need to Know in {year}"
];

const VARIABLES = {
  action: ['Bypass AI Detection', 'Humanize AI Text', 'Pass Turnitin', 'Beat GPTZero', 'Make Content Undetectable'],
  tool: ['Turnitin', 'GPTZero', 'Originality.ai', 'Copyleaks', 'ZeroGPT', 'Winston AI'],
  tool1: ['GPTZero', 'Turnitin', 'Originality.ai'],
  tool2: ['Copyleaks', 'ZeroGPT', 'Winston AI'],
  topic: ['AI Detection', 'AI Humanization', 'AI Writing', 'Content Authenticity'],
  category: ['AI Detector', 'AI Humanizer', 'Content Tool'],
  audience: ['Students', 'Content Writers', 'Marketers', 'Bloggers'],
  verb: ['Fails', 'Makes Mistakes', 'Gets It Wrong'],
  year: ['2025'],
  number: ['5', '7', '10', '15']
};

const CATEGORIES = ['Education', 'Guides', 'Research', 'Reviews', 'Tips', 'News'];
const IMAGE_INDICES = [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 20, 21, 22, 23, 50, 51, 52, 53];

function generateTopic() {
  const template = TOPIC_TEMPLATES[Math.floor(Math.random() * TOPIC_TEMPLATES.length)];
  let topic = template;
  for (const [key, values] of Object.entries(VARIABLES)) {
    const regex = new RegExp(`{${key}}`, 'g');
    topic = topic.replace(regex, values[Math.floor(Math.random() * values.length)]);
  }
  return topic;
}

async function generateContent(title, keywords) {
  const API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!API_KEY) throw new Error('DEEPSEEK_API_KEY required');
  
  const systemPrompt = `You are an expert SEO content writer for PassedAI, a tool that humanizes AI text.
Write engaging, SEO-optimized blog posts. Use ## headers, include practical tips, write 1500-2000 words.
End with a call-to-action for PassedAI.`;
  
  const userPrompt = `Write a blog post titled: "${title}"
Include these SEO keywords naturally: ${keywords.join(', ')}
Structure: Introduction, 4-6 sections with ## headers, practical tips, conclusion, CTA for PassedAI.`;
  
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });
  
  if (!response.ok) throw new Error(`API error: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
}

function generateExcerpt(content) {
  return content.replace(/^#+\s+.+$/gm, '').replace(/\*\*/g, '').replace(/\n+/g, ' ').trim().substring(0, 157) + '...';
}

function getRandomItems(arr, count) {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
}

async function main() {
  const count = parseInt(process.env.POST_COUNT || '10');
  const outputDir = './posts';
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  console.log(`Generating ${count} posts for ${dateStr}`);
  const usedTitles = new Set();
  const posts = [];
  
  for (let i = 0; i < count; i++) {
    try {
      let title;
      do { title = generateTopic(); } while (usedTitles.has(title));
      usedTitles.add(title);
      
      console.log(`[${i + 1}/${count}] ${title}`);
      
      const keywords = getRandomItems(SEO_KEYWORDS, 5);
      const content = await generateContent(title, keywords);
      const slug = generateSlug(title);
      const imageIndex = IMAGE_INDICES[i % IMAGE_INDICES.length];
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const readTime = Math.ceil(content.split(/\s+/).length / 200) + ' min read';
      
      const mdx = `---
title: "${title}"
excerpt: "${generateExcerpt(content)}"
date: "${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}"
author: "PassedAI Team"
category: "${category}"
tags: ${JSON.stringify(getRandomItems(keywords, 3))}
image: ${imageIndex}
readTime: "${readTime}"
featured: ${i === 0}
---

${content}

---

## Ready to Humanize Your AI Content?

PassedAI helps you transform AI-generated text into natural, human-like content that passes all major AI detectors. Try it free today!

[Start Humanizing Your Content →](https://passedai.io/app)
`;
      
      const filename = `${dateStr}-${slug}.mdx`;
      fs.writeFileSync(path.join(outputDir, filename), mdx);
      posts.push({ slug, title, filename, category, imageIndex, date: dateStr });
      
      console.log(`  ✅ ${filename}`);
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }
  
  // Update index
  let index = [];
  const indexPath = path.join(outputDir, 'index.json');
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  }
  index = [...posts, ...index].slice(0, 100);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  
  console.log(`\n✨ Generated ${posts.length} posts`);
}

main().catch(e => { console.error(e); process.exit(1); });
