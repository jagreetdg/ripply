# Landing Page - Page Design Document

## 1. Overview

**Page Path**: `/landing`  
**Parent Route**: `(marketing)/_layout.tsx`  

The purpose of this page is to introduce Ripply, a voice-based social platform, and convert first-time visitors into signups or early testers. It highlights the core value proposition, differentiates from traditional platforms, and builds trust using testimonials, visuals, and storytelling.

---

## 2. User Stories

- **As a creator**, I want to **share short voice notes** so that **I can express myself authentically**.
- **As a new user**, I need to **understand what Ripply does immediately** to achieve **confidence in trying the platform**.
- **As a curious visitor**, I expect **to see quick proof that others love the product** when I interact with the hero section.

---

## 3. Component Breakdown

- **LandingPageContainer** (`<View>`)
    - **HeroBlock** (`<HeroBlock>`)
        - Heading: "Your Voice. Your Story."
        - Subheading: Explains the value of voice-based social sharing.
        - CTA: “Start Sharing”
        - Visual: Product GIF or Loom-style demo.
        - Quick Proof: Stars, user count, short testimonial.
    - **ProblemAgitationSection** (`<ProblemBlock>`)
        - Textual breakdown of status quo and problems with text-based media.
    - **TransformationBlock** (`<TransformationVisual>`)
        - "How it works" GIF
        - Three benefit highlights
    - **TestimonialsSection** (`<TestimonialList>`)
        - User photos + roles + quotes
    - **FeatureGroupsSection** (`<FeatureGrid>`)
        - 4 feature groups with visuals or GIFs
    - **AboutUsBlock** (`<FounderStory>`)
        - 2-3 paragraphs about the founder’s mission
        - Founder’s face image
    - **PricingPlans** (`<PricingSection>`)
        - Free, Creator Boost, and Indie Studio tiers
        - Monthly subscription details
    - **Footer** (`<FooterLinks>`)

---

## 4. UI/UX & Design Principles

- **Layout**: 
    - Single column, scrollable view. Sticky header with anchor navigation to each section (`#hero`, `#features`, etc.).
    - Tailwind classes: `p-6`, `gap-6`, `max-w-7xl mx-auto`

- **Key Principles**:
    - **Von Restorff Effect**: CTA “Start Sharing” in `bg-purple-600 text-white`.
    - **Fitts's Law**: Sticky CTA button on mobile, always visible at bottom.
    - **Hick's Law**: Limit primary actions to 2 (“Start Sharing”, “Learn More”).
    - **Zeigarnik Effect**: Smooth scroll to testimonials or signup form when interacting.

- **Color Palette**:
    - Primary: `bg-purple-600`
    - Secondary: `bg-white`, `bg-gray-100`
    - Text: `text-gray-900`, `text-gray-600`

- **Typography**:
    - Headers: `text-3xl font-bold` to `text-xl font-semibold`
    - Body: `text-base font-medium` or `text-sm text-gray-600`

---

## 5. State Management

- **Global State**: 
    - `UserContext`: Tracks if user is logged in (to hide/show CTA).
- **Local State (`useState`)**:
    - `modalVisible: boolean`
    - `activeSection: string`
- **Hooks**:
    - `useEffect()` for scroll animations
    - `useTestimonials()` for dynamic loading if using CMS

---

## 6. Data & API Dependencies

- **`GET /api/testimonials`**
    - **Purpose**: Fetch list of testimonials
    - **Backend Controller**: `marketingController.getTestimonials`
    - **Response**: `{ name: string, role: string, image: string, quote: string }[]`

- **`GET /api/feature-metrics`**
    - **Purpose**: Fetch real-time usage data for social proof
    - **Backend Controller**: `statsController.getLandingStats`
    - **Response**: `{ users: number, rating: number, quote: string }`

---

## 7. Navigation & Routing

- **Entry Points**:
    - Root domain (`/`)
    - Link from producthunt, socials, etc.
- **Exits / Onward Journeys**:
    - Clicking “Start Sharing” routes to `/signup`
    - Footer links to `/features`, `/about`, `/pricing`, `/privacy`

---

## 8. Edge Cases & Error States

- **Loading State**: 
    - Use skeletons for testimonials and product visuals.
- **Empty State**: 
    - “We’re just starting out — be one of the first voices!” with animation.
- **Error State**: 
    - Failed API calls (testimonials, stats) show fallback hardcoded data.
- **Permissions**:
    - None — open to all users.
