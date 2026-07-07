# TailorNow QA Test Script
**Site:** https://tailornow.shop  
**Last updated:** 2026-07-01  
**Covers:** All features built/updated in the last session

---

## Setup: Test Accounts Needed

| Role | Email | How to create |
|------|-------|---------------|
| Admin | your admin email | Supabase → `profiles.role = 'admin'` |
| Customer | test-customer@gmail.com | Sign up normally |
| Verified Creative | test-creative@gmail.com | Sign up → admin onboards them |
| Unverified Creative | test-unverified@gmail.com | Sign up only, don't onboard |

---

## 1. Auth & Roles

- [ ] `/login` — email/password login works for all 3 roles
- [ ] `/signup` — new user can register and is redirected appropriately
- [ ] Logged-out user visiting `/admin/feed` is redirected to `/login`
- [ ] Customer visiting `/admin/feed` is redirected to `/browse`
- [ ] Admin visiting `/browse` works (not redirected)

---

## 2. Feed Page — `/feed`

### 2a. Layout (image-first redesign)

- [ ] Each post card: image fills the top of the card (square aspect ratio), no business profile header above the image
- [ ] Category badge appears **overlaid on the image** (top-left), not below it
- [ ] Caption text appears **below** the image
- [ ] Attribution ("✂️ TailorNow" or creative name) appears at the **bottom right** of the card
- [ ] Timestamp appears bottom left

### 2b. Admin posts (TailorNow branding)

- [ ] Admin posts show "✂️ TailorNow" in violet at the bottom right — no business name
- [ ] Admin posts have **no Follow button**
- [ ] Admin posts have **no "Book Now" button**
- [ ] Category badge from admin post tag (e.g. "🔥 Style of the Week") appears on the image

### 2c. Creative posts

- [ ] Creative posts show the business name as a small link at the bottom right
- [ ] Creative posts show "+ Follow" button next to the name (if not already following)
- [ ] "Book Now" button appears for creative posts (bottom-right of action row)
- [ ] Clicking the business name links to `/tailors/[id]`

### 2d. Fashion category chips

- [ ] Chips shown: All, 🔥 Style of the Week, 🎨 Alte Style, 👟 Street Wear, 🌍 Ankara, 💍 Bridal, ✨ New Trends, 😂 Memes
- [ ] "All" chip selected by default, shows all posts
- [ ] Tapping a chip filters posts whose caption tag matches (e.g. "Alte Style" only shows posts tagged `[🎨 Alte Style]`)
- [ ] Empty state for a chip with no matching posts: shows "No posts in this category yet. Check back soon!"

### 2e. Empty feed (demo posts)

- [ ] When feed has no real posts: 4 demo inspiration posts are shown
- [ ] Demo posts show fashion images with category tags (Style of the Week, Agbada Season, Bridal Inspo, Ankara of the Week)
- [ ] Demo posts show **no fake business names** — only "✂️ TailorNow" at the bottom
- [ ] A "Style inspiration" banner appears above demo posts
- [ ] Verified creatives section appears below demo posts (if any exist)

### 2f. Interactions

- [ ] Heart button: like/unlike a post (requires login — toast if logged out)
- [ ] Comment button: opens comment thread
- [ ] Submit comment works, appears immediately
- [ ] Feed/Discover toggle switches between post feed and creatives grid

---

## 3. Admin Feed Post Composer — `/admin/feed`

- [ ] Page requires admin role (redirects others to `/browse`)
- [ ] "New Post" button opens the compose form
- [ ] **Fashion tag presets** shown as pill buttons (8 tags): 🔥 Style of the Week, 🎨 Alte Style, 👟 Street Wear, 🌍 Ankara & African Prints, 💍 Bridal Inspo, ✨ New Trends, 😂 Fashion Memes, 🎉 Customer Spotlight
- [ ] Selecting a tag highlights it; selecting again deselects it
- [ ] Image upload works (up to 6 photos)
- [ ] Caption textarea accepts freeform text
- [ ] Submitting without photos shows error: "Add at least one photo"
- [ ] Submitting without caption shows error: "Add a caption"
- [ ] Successful publish shows toast "Post published to feed!" and post appears in the list below
- [ ] Published post with a tag shows the tag badge on the image preview
- [ ] Caption body shown without the `[tag]` prefix in the admin list
- [ ] Delete button (trash icon) removes the post after confirm dialog
- [ ] Published post appears in the public `/feed` with the correct category badge

---

## 4. Hall of Fame — `/hall-of-fame`

- [ ] Page loads for logged-out users (public page)
- [ ] Top 3 creatives shown in gold / silver / bronze podium cards
- [ ] Ranked list (positions 4–20) shown below the podium
- [ ] Creatives ordered by avg_rating DESC, then total_orders DESC
- [ ] Only verified creatives appear (`is_verified = true`)
- [ ] **First Cut badge** (dark charcoal/gold "✂ First Cut") visible on cards where `is_founder = true`
- [ ] Each card links to `/tailors/[id]`
- [ ] "🏆 Hall of Fame" link appears in the navbar for all user states (logged out, customer, creative, admin)

---

## 5. Admin Broadcast — `/admin/broadcast`

- [ ] Page requires admin role
- [ ] 4 audience tabs: All Users, Customers, Verified Creatives, All Creatives
- [ ] Switching tabs changes the contact count shown
- [ ] Contact list shows name, email, phone (if available)
- [ ] "Copy" button next to phone number copies to clipboard, shows toast
- [ ] "Download CSV" button downloads a `.csv` with all contacts in the current audience tab
- [ ] Email subject and body fields present
- [ ] Sending with empty subject/body shows validation error
- [ ] "Send Broadcast" sends emails via Resend (requires `RESEND_API_KEY` set in Vercel)
- [ ] Success toast shows number of emails sent

---

## 6. First Cut Badge

### 6a. Dashboard — `/dashboard` (creative role)

- [ ] Creative with `is_founder = true` sees the dark charcoal/gold "✂ First Cut" badge on their dashboard
- [ ] Creative with `is_founder = false` does NOT see the badge

### 6b. Browse — `/browse`

- [ ] First Cut creatives show the "✂ First Cut" badge in the **top-left** of their card image
- [ ] Badge uses `from-gray-950 to-slate-800` gradient with amber-400 text

### 6c. Profile page — `/tailors/[id]`

- [ ] First Cut badge appears **next to the business name** in the profile header
- [ ] Clicking the badge does nothing (it's display-only)

### 6d. Hall of Fame — `/hall-of-fame`

- [ ] First Cut badge visible on podium cards for qualifying creatives
- [ ] First Cut badge visible on ranked list rows for qualifying creatives

### 6e. Onboarding logic (admin test)

- [ ] When admin onboards creative #1–50: `is_founder = true` set, "✂️ You earned the First Cut badge!" notification
- [ ] When admin onboards creative #51+: `is_founder = false`, standard verified notification

---

## 7. Rename: Tailor → Creative

- [ ] `/orders/[id]` — label reads "Creative" (not "Tailor")
- [ ] `/orders/[id]/dispute` — all 3 dispute reason options say "Creative did/is..." not "Tailor..."
- [ ] `/admin/onboard-tailor` — success toast says "Creative onboarded and verified!"
- [ ] Page title on `/admin/onboard-tailor` reads "Onboard a Creative" and "verified creative"
- [ ] General scan: no visible "Tailor" label in customer-facing pages where it refers to a person

---

## 8. Chat — `/chat`

- [ ] Locked state (no order placed) shows: **"Place an order to chat directly"** (not "Pay deposit")
- [ ] Subtext reads: "Contact details unlock once payment is confirmed on an order. This keeps both you and the creative protected."
- [ ] No mention of "deposit" anywhere in the chat UI

---

## 9. Admin Onboard Creative — `/admin/onboard-tailor`

- [ ] Search by email finds a registered user
- [ ] "No account found" state shows correctly for unknown email
- [ ] Step 2 form appears after finding user
- [ ] Required fields (business name, city, state) validated before submit
- [ ] At least one service and one work type required
- [ ] Submitting creates `tailor_profiles` row with `is_verified = true`
- [ ] User's `profiles.role` updated to `'tailor'`
- [ ] Already-onboarded user shows error "This user already has a tailor profile"
- [ ] Success state shows "Onboard another" + "View all tailors" buttons

---

## 10. Browse & Booking (regression check)

- [ ] `/browse` loads list of verified creatives
- [ ] Search by name/location works
- [ ] State → city filter cascades correctly
- [ ] Service type filter works
- [ ] Clicking a creative card opens `/tailors/[id]`
- [ ] "Book Now" on profile page goes to `/orders/new?tailor=[id]`
- [ ] Order creation flow completes (Paystack payment page loads)

---

## Known Pending (do NOT test — not built yet)

- Email verification on signup (Supabase setting not yet enabled)
- Automatic welcome email (needs `RESEND_API_KEY` in Vercel)
- Deposit/balance simplification (still full upfront only)
- Mandatory signup wizard

---

## Environment Checklist (before testing live)

- [ ] `RESEND_API_KEY` added to Vercel env vars
- [ ] `NEXT_PUBLIC_SITE_URL=https://tailornow.shop` in Vercel env vars
- [ ] Supabase: email confirmation enabled
- [ ] Supabase: `https://tailornow.shop/auth/callback` in redirect URLs
