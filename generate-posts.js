const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load previously used titles to ensure uniqueness across all runs
function loadUsedTitles(outputDir) {
  const historyFile = path.join(outputDir, '.title-history.json');
  if (fs.existsSync(historyFile)) {
    return new Set(JSON.parse(fs.readFileSync(historyFile, 'utf8')));
  }
  return new Set();
}

function saveUsedTitles(outputDir, titles) {
  const historyFile = path.join(outputDir, '.title-history.json');
  const existing = loadUsedTitles(outputDir);
  titles.forEach(t => existing.add(t));
  const arr = Array.from(existing).slice(-500);
  fs.writeFileSync(historyFile, JSON.stringify(arr, null, 2));
}

// Load recently used images to prevent duplicates
function loadUsedImages(outputDir) {
  const historyFile = path.join(outputDir, '.image-history.json');
  if (fs.existsSync(historyFile)) {
    return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  }
  return [];
}

function saveUsedImages(outputDir, images) {
  const historyFile = path.join(outputDir, '.image-history.json');
  const arr = images.slice(-50);
  fs.writeFileSync(historyFile, JSON.stringify(arr, null, 2));
}

// Topic structures with mapped categories
const TOPIC_STRUCTURES = [
  // How-to guides -> Guides
  { template: "How to {action} Without Getting Caught in {year}", type: "guide", category: "Guides" },
  { template: "The Complete {year} Guide to {action}", type: "guide", category: "Guides" },
  { template: "Step-by-Step: {action} Like a Pro", type: "guide", category: "Guides" },
  { template: "{action}: A Beginner's Guide for {year}", type: "guide", category: "Guides" },
  
  // Comparisons -> Reviews
  { template: "{tool1} vs {tool2}: Honest Comparison ({year})", type: "comparison", category: "Reviews" },
  { template: "We Tested {tool1} and {tool2} - Here's What We Found", type: "comparison", category: "Reviews" },
  { template: "{tool1} or {tool2}? The Definitive Answer for {audience}", type: "comparison", category: "Reviews" },
  
  // Analysis & Research -> Research
  { template: "Why {tool} {failVerb} in {year} (And How to Fix It)", type: "analysis", category: "Research" },
  { template: "{tool} Accuracy Test: {year} Results Revealed", type: "analysis", category: "Research" },
  { template: "Inside {tool}: How It Really Works ({year} Update)", type: "analysis", category: "Research" },
  { template: "The Truth About {tool} That {audience} Need to Know", type: "analysis", category: "Research" },
  
  // Lists -> Tips
  { template: "{number} Proven Ways to {action} in {year}", type: "list", category: "Tips" },
  { template: "Top {number} {topic} Mistakes {audience} Make", type: "list", category: "Tips" },
  { template: "{number} {topic} Secrets That Actually Work", type: "list", category: "Tips" },
  { template: "{number} Things About {tool} Nobody Tells You", type: "list", category: "Tips" },
  
  // Problem-solving -> Education
  { template: "Struggling with {tool}? Here's Your Solution", type: "solution", category: "Education" },
  { template: "Why Your Content Fails {tool} (And How to Fix It)", type: "solution", category: "Education" },
  { template: "{tool} Flagged Your Work? Do This Now", type: "solution", category: "Education" },
  
  // Audience-specific -> Education
  { template: "{audience}'s Ultimate Guide to {action}", type: "audience", category: "Education" },
  { template: "What Every {singleAudience} Should Know About {topic}", type: "audience", category: "Education" },
  { template: "{topic} for {audience}: Everything You Need in {year}", type: "audience", category: "Education" },
  
  // Trends & News -> News
  { template: "{topic} in {year}: What's Changed and What's Coming", type: "trends", category: "News" },
  { template: "The Future of {topic}: {year} Predictions", type: "trends", category: "News" },
  { template: "{year} {topic} Trends Every {singleAudience} Should Watch", type: "trends", category: "News" },
  
  // Case studies -> Research
  { template: "How I {pastAction} Successfully (Real Results)", type: "case", category: "Research" },
  { template: "Case Study: {action} Without Detection", type: "case", category: "Research" },
  { template: "From Flagged to Passed: A {topic} Success Story", type: "case", category: "Research" },
];

const VARIABLES = {
  action: [
    'Bypass AI Detection', 'Humanize AI Text', 'Pass Turnitin', 
    'Beat GPTZero', 'Make Content Undetectable', 'Fool AI Detectors',
    'Write Undetectable Content', 'Pass Originality.ai', 'Avoid AI Flags',
    'Transform AI Text', 'Create Human-Like Content', 'Pass Any AI Checker'
  ],
  pastAction: [
    'Passed Turnitin', 'Beat GPTZero', 'Fooled Every AI Detector',
    'Made My AI Content Undetectable', 'Transformed AI Essays', 
    'Humanized 100+ Articles'
  ],
  tool: [
    'Turnitin', 'GPTZero', 'Originality.ai', 'Copyleaks', 
    'ZeroGPT', 'Winston AI', 'Scribbr', 'Quetext', 'Content at Scale'
  ],
  tool1: ['GPTZero', 'Turnitin', 'Originality.ai', 'Copyleaks', 'Winston AI'],
  tool2: ['ZeroGPT', 'Scribbr', 'Quetext', 'Content at Scale', 'Crossplag'],
  topic: [
    'AI Detection', 'AI Humanization', 'AI Writing', 'Content Authenticity',
    'AI Text Detection', 'Undetectable AI', 'AI Content Creation',
    'AI Detection Bypass', 'Human-Like AI Writing'
  ],
  audience: [
    'Students', 'Content Writers', 'Marketers', 'Bloggers',
    'Freelancers', 'Academic Writers', 'SEO Specialists', 'Copywriters'
  ],
  singleAudience: [
    'Student', 'Content Writer', 'Marketer', 'Blogger',
    'Freelancer', 'Academic Writer', 'SEO Specialist', 'Copywriter'
  ],
  failVerb: [
    'Fails', 'Makes Mistakes', 'Gets It Wrong', 'Misses the Mark',
    'Falls Short', 'Produces False Positives', 'Struggles'
  ],
  year: ['2026'],
  number: ['5', '7', '10', '12', '15', '20']
};

// Map categories to preferred image ranges for thematic consistency
const CATEGORY_IMAGE_RANGES = {
  'Education': { start: 20, end: 29 },
  'Guides': { start: 10, end: 19 },
  'Research': { start: 50, end: 59 },
  'Reviews': { start: 0, end: 9 },
  'Tips': { start: 40, end: 49 },
  'News': { start: 30, end: 39 }
};

function getUniqueImageIndex(category, usedImages) {
  const range = CATEGORY_IMAGE_RANGES[category] || { start: 0, end: 79 };
  
  // Try to find unused image in preferred range
  for (let i = range.start; i <= range.end; i++) {
    if (!usedImages.includes(i)) {
      return i;
    }
  }
  
  // If all in range are used, find any unused image
  for (let i = 0; i < 80; i++) {
    if (!usedImages.includes(i)) {
      return i;
    }
  }
  
  // All images used, get random from category range
  return range.start + Math.floor(Math.random() * (range.end - range.start + 1));
}

function generateUniqueTitle(usedTitles) {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const structure = TOPIC_STRUCTURES[Math.floor(Math.random() * TOPIC_STRUCTURES.length)];
    let title = structure.template;
    
    for (const [key, values] of Object.entries(VARIABLES)) {
      const regex = new RegExp(`{${key}}`, 'g');
      title = title.replace(regex, values[Math.floor(Math.random() * values.length)]);
    }
    
    const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!usedTitles.has(normalized)) {
      usedTitles.add(normalized);
      return { title, type: structure.type, category: structure.category };
    }
    attempts++;
  }
  
  const fallbackTitle = `AI Detection Guide ${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  return { title: fallbackTitle, type: 'guide', category: 'Guides' };
}

async function generateContent(title, type, keywords) {
  const API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!API_KEY) throw new Error('DEEPSEEK_API_KEY required');
  
  const typeInstructions = {
    guide: "Write a comprehensive, actionable how-to guide with clear steps. Include specific examples and real-world scenarios.",
    comparison: "Write an objective, detailed comparison. Include pros/cons tables, specific metrics, and a clear recommendation.",
    analysis: "Write an in-depth analysis with data, research findings, and expert insights. Be analytical and thorough.",
    list: "Write an engaging listicle with detailed explanations for each point. Make each item actionable and specific.",
    solution: "Write a problem-solving article that addresses pain points directly. Provide clear, immediate solutions.",
    audience: "Write specifically for this audience's needs, challenges, and goals. Use their language and address their specific concerns.",
    trends: "Write about current and emerging trends with predictions. Include industry insights and expert opinions.",
    case: "Write a compelling case study with real scenarios, specific results, and lessons learned. Be detailed and authentic."
  };

  const systemPrompt = `You are an expert SEO content writer for PassedAI (https://passedai.io), the leading AI text humanizer tool.

CRITICAL REQUIREMENTS:
1. Write 2000-2500 words of UNIQUE, high-quality content
2. Use natural language - avoid robotic or repetitive patterns
3. Include specific examples, statistics, and actionable advice
4. Write in an engaging, conversational tone
5. Use ## for main headers, ### for subheaders
6. Include bullet points and numbered lists for scannability
7. Add personal insights and expert perspectives
8. Naturally incorporate SEO keywords without keyword stuffing
9. End with a compelling call-to-action for PassedAI

CONTENT TYPE: ${typeInstructions[type] || typeInstructions.guide}

IMPORTANT: Every article must be original and provide genuine value. Avoid generic filler content.`;

  const userPrompt = `Write a blog post titled: "${title}"

Target SEO keywords to include naturally: ${keywords.join(', ')}

Article structure:
1. Engaging introduction with a hook (what problem are we solving?)
2. Main content: 4-6 detailed sections with ## headers
3. Practical, actionable tips in each section
4. Real examples or scenarios
5. Expert insights or little-known facts
6. Summary of key takeaways
7. Strong CTA for PassedAI

Remember: Quality over quantity. Each sentence should add value.`;

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
      temperature: 0.8,
      max_tokens: 5000,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    })
  });

  if (!response.ok) throw new Error(`API error: ${await response.text()}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function generateExcerpt(content) {
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const excerpt = lines.slice(0, 2).join(' ')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
  return excerpt.substring(0, 160) + (excerpt.length > 160 ? '...' : '');
}

function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

const SEO_KEYWORDS = [
  'AI detector', 'AI detection', 'bypass AI detection', 'humanize AI text',
  'AI content detector', 'GPTZero', 'Turnitin AI', 'Originality AI',
  'AI writing detector', 'ChatGPT detector', 'AI text humanizer',
  'how to bypass AI detection', 'make AI text undetectable',
  'pass Turnitin AI detection', 'bypass GPTZero', 'humanize ChatGPT text',
  'AI detection bypass tool', 'undetectable AI writing',
  'best AI humanizer 2026', 'AI detection accuracy',
  'AI writing tips', 'content authenticity', 'AI generated content',
  'pass AI checker', 'avoid AI detection', 'AI content humanizer',
  'Turnitin bypass', 'GPTZero bypass', 'undetectable AI content'
];

async function main() {
  const count = parseInt(process.env.POST_COUNT || '1');
  const outputDir = './posts';
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const timeStr = today.toISOString().split('T')[1].substring(0, 5).replace(':', '-');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const usedTitles = loadUsedTitles(outputDir);
  const usedImages = loadUsedImages(outputDir);
  const newTitles = [];
  const newImages = [];

  console.log(`Generating ${count} unique posts for ${dateStr}`);
  const posts = [];

  for (let i = 0; i < count; i++) {
    try {
      const { title, type, category } = generateUniqueTitle(usedTitles);
      newTitles.push(title.toLowerCase().replace(/[^a-z0-9]/g, ''));
      
      console.log(`[${i + 1}/${count}] ${title}`);
      console.log(`   Type: ${type} | Category: ${category}`);

      const keywords = getRandomItems(SEO_KEYWORDS, 6);
      const content = await generateContent(title, type, keywords);
      const slug = `${generateSlug(title)}-${timeStr}`;
      
      // Get unique image that hasn't been used recently
      const imageIndex = getUniqueImageIndex(category, [...usedImages, ...newImages]);
      newImages.push(imageIndex);
      
      const wordCount = content.split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200) + ' min read';
      const excerpt = generateExcerpt(content);

      const mdx = `---
title: "${title.replace(/"/g, '\\"')}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
date: "${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}"
publishedAt: "${today.toISOString()}"
author: "PassedAI Team"
category: "${category}"
tags: ${JSON.stringify(getRandomItems(keywords, 4))}
image: ${imageIndex}
readTime: "${readTime}"
wordCount: ${wordCount}
featured: ${i === 0}
seoTitle: "${title.replace(/"/g, '\\"')} | PassedAI Blog"
seoDescription: "${excerpt.replace(/"/g, '\\"')}"
canonical: "https://passedai.io/blog/${slug}"
---

${content}

---

## Ready to Humanize Your AI Content?

**PassedAI** helps you transform AI-generated text into natural, human-like content that passes all major AI detectors including Turnitin, GPTZero, and Originality.ai.

✅ 95%+ bypass rate  
✅ Preserves your message  
✅ Works in seconds  

[**Start Humanizing Your Content Free →**](https://passedai.io/app)
`;

      const filename = `${dateStr}-${slug}.mdx`;
      fs.writeFileSync(path.join(outputDir, filename), mdx);
      
      posts.push({ 
        slug, 
        title, 
        excerpt,
        filename, 
        category, 
        imageIndex, 
        date: dateStr,
        publishedAt: today.toISOString(),
        readTime,
        wordCount,
        featured: i === 0,
        canonical: `https://passedai.io/blog/${slug}`
      });

      console.log(`   ✅ ${filename} (${wordCount} words, image: ${imageIndex})`);
      
      if (i < count - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    }
  }

  // Save used titles and images
  saveUsedTitles(outputDir, newTitles);
  saveUsedImages(outputDir, [...usedImages, ...newImages]);

  // Update index
  let index = [];
  const indexPath = path.join(outputDir, 'index.json');
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    } catch (e) {
      index = [];
    }
  }
  
  const slugSet = new Set();
  index = [...posts, ...index].filter(p => {
    if (slugSet.has(p.slug)) return false;
    slugSet.add(p.slug);
    return true;
  }).slice(0, 200);
  
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  console.log(`\n✨ Generated ${posts.length} unique posts`);
  console.log(`📊 Total posts in index: ${index.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
