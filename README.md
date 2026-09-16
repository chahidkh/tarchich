# tarchich

Master Prompt — Platform Architecture for "مكتبة زينة" (Zaina Library)

Objective: Build a luxury, high-conversion Arabic Knowledge & Digital Commerce Platform named "مكتبة زينة" (Zaina Library) using Next.js, Tailwind CSS, Lucide Icons, and Supabase. The platform seamlessly fuses traditional Islamic/Arabic aesthetics with cutting-edge AI capabilities and community engagement features.

1. Visual Aesthetics & Cultural Identity (Arabic Heritage & Typography)

Theme & Atmosphere: Ultra-luxurious, immersive dark/warm editorial design. The global hero background must feature a high-resolution, atmospheric image of an ancient grand library with mahogany wood textures, golden lighting, and arched bookshelf architecture.

Typography: Integrate traditional Arabic calligraphy Google Fonts (Amiri, Reem Kufi, or Aref Ruqaa) for display headings and ornate titles, paired with Tajawal or Cairo for ultra-clean UI readability.

Color Palette: Deep Royal Mahogany/Navy (#1A120B), Antique Amber Gold (#D4AF37), Warm Parchment (#F5EBE0), and Emerald Accents.

2. Core Modules & Platform Features:

A. Intelligent AI Librarian & Search Assistant ("حكيم زينة")

An embedded, conversational AI drawer/modal that speaks in elegant, eloquent Arabic (عربي أصيل) with warmth and wisdom.

Capabilities: Answers questions about book contents, summarizes articles on the platform, recommends books based on user mood/interests, and searches the site's database using semantic reasoning.

Features a floating interactive trigger ("استشر حكيم المكتبة") with subtle glowing gold animations.

B. E-Commerce & Monetization Hub (قسم متجر الكتب)

Digital & Physical Bookstore: A grid displaying books with cover art, badges (الأكثر مبيعاً, حصري), pricing, and interactive preview modals.

Monetization Engine:

Direct sales (Digital PDF downloads & physical book delivery requests).

Affiliate Referral Boost: Registered users receive a 10% commission link for every book sold through their referral URL.

VIP Membership Tier: Paid subscription option ("عضوية مجلس زينة") unlocking exclusive daily articles, rare audiobooks, and unlimited AI search queries.

Integrated Shopping Cart drawer with Instant Checkout flow.

C. Daily Cultural Feed & Community Hub (المجلس الثقافي والمنتديات)

Daily Feed: Rich-text daily articles, embedded video analysis, and high-resolution infographics with interactive like, bookmark, and share triggers.

User Content Generation (UGC): Logged-in users can publish their own posts, book reviews, and quotes.

Interactive Discussions: Threaded comment system with nested replies, upvotes, and author verification badges.

D. User Authentication & Profile Management

Full authentication system via Supabase Auth (Email/Password & Google Sign-In).

User Dashboard: Customizable profile (avatar upload, bio, reading lists), referral tracking balance ($), published posts, and purchased book library.

3. Database Schema (Supabase Architecture)

profiles: id, full_name, avatar_url, bio, role (reader, vip, author, admin), referral_code, wallet_balance.

books: id, title, author, description, price, cover_image_url, sample_pdf_url, stock, category.

posts: id, author_id, title, content, media_url, media_type (image, video), created_at.

comments: id, post_id, user_id, content, created_at.

orders: id, user_id, total_amount, status (pending, completed), created_at.

4. UI/UX Rules:

Mobile-first, fully responsive RTL layout (Right-to-Left orientation default).

Use smooth glassmorphism effects for cards (backdrop-blur-md bg-black/40 border border-gold/20).

Include skeletal loading states and animated Arabic toast notifications for all user actions (e.g., "تمت إضافة الكتاب إلى السلة بنجاح").

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f6bd0b55-a47b-4bab-944b-c39e84cb5a95).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
