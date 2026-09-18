# Website UX, Dynamics, and SEO Improvements

## What will improve

- Refine the homepage and `/jobs` page into a more consistent, professional visual system with clearer hierarchy, tighter spacing, and better content density.
- Fix text overflow and overlap across narrow mobile screens, tablets, and desktop layouts, including the `/jobs` filter bar currently sitting beneath the fixed header incorrectly.
- Improve interactive feedback with restrained entrance transitions, clearer selected states, stable card dimensions, and reduced-motion support—without scroll or parallax effects.
- Make search and navigation actions behave reliably, including the homepage search flow, category selection, institution selection, bookmarks, and mobile navigation.
- Standardize buttons, cards, section spacing, headings, and empty/loading states while preserving the existing OWL ROLES brand and professional owl artwork.

## Homepage

- Rebalance the first screen so the OWL ROLES offer, search actions, and artwork fit cleanly at common viewport sizes without oversized or clipped text.
- Remove the prohibited Chandigarh reference from the visible trust list and any remaining public partner data.
- Improve category, process, institution, testimonial, and signup sections for consistent spacing and responsive text fitting.
- Correct copy issues and improve controls for accessibility, including labels for carousel navigation and semantic navigation links.
- Keep motion purposeful and subtle, with no continuous floating or scroll-driven effects.

## Jobs Page

- Place the sticky search controls below the fixed navigation bar so they never overlap.
- Improve mobile wrapping for the greeting, action buttons, statistics, filters, result count, job cards, and final profile prompt.
- Make job-type selection and save controls use the shared control styles with clear active, keyboard-focus, and touch states.
- Preserve the full job feed, sorting, filtering, job details, and assistant behavior.

## SEO

- Add a sitemap containing only public, indexable pages and reference it from the existing crawler rules.
- Improve semantic internal links and section landmarks so crawlers and assistive technology can follow the public experience.
- Correct the social preview setup by removing the favicon-sized share image; hosting can supply a valid preview until a proper 1200×630 image exists.
- Keep the existing title, description, canonical URL, structured data, favicon, and crawler access that already pass the SEO scan.
- Keep authenticated dashboards, account pages, and admin pages out of the sitemap.

## Technical details

- Update shared global typography rules to prevent aggressive balanced wrapping and negative letter spacing from causing narrow-screen collisions.
- Use the existing semantic color tokens and shared controls; avoid hardcoded component colors and raw interactive buttons.
- Add `public/sitemap.xml` for `/`, `/privacy-policy`, `/terms-of-service`, and `/cookie-policy`, using the project’s configured canonical domain and no artificial `lastmod` dates.
- Verify the finished pages at desktop and mobile sizes, test primary interactions, check console/runtime output, and confirm the build is clean.
