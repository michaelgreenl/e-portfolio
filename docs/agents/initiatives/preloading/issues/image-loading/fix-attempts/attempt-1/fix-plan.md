# Fix Plan: Image Loading — Attempt 1

## Context

The preloading initiative introduced a custom asset-loading architecture in **`src/stores/routeStore.js`** that pre-fetches JS chunks, fonts, and images for each route via `loadRouteAssets`. The Projects route declares four blurred `.webp` images in **`routeAssets`**. These are preloaded during background idle-time after the initial Home route loads. Despite this preloading, the images visibly flash in when navigating to the Projects page instead of being present on first paint.

---

## Test Target

All four tests in **`issue.cy.js`** must pass:

- **Test 1** — After background preloading completes on Home, navigating to Projects must show all four `img.project-img` elements with `complete === true` and `naturalWidth > 0` as soon as the `.project-card` elements appear. All cards must reach `opacity: 1`.
- **Test 2** — A second navigation to Projects must trigger zero new network requests for `*_blurred*.webp` images.
- **Test 3** — As soon as each `.project-card` exists in the DOM, its child `img.project-img` must already have `complete === true` and `naturalWidth > 0`.
- **Test 4** — A cold direct visit to `/#projects` must also show all images fully loaded before the enter animation settles.

---

## Root Cause

The preloader in **`src/stores/routeStore.js`** at **`lines 142–149`** creates `new Image()` objects inside a `.map()` callback. Each `Image` is assigned a `src`, and the wrapping `Promise` resolves on `onload` (or `onerror`). Once the `Promise.all` resolves, there are **no surviving JavaScript references** to these `Image` objects — they become eligible for garbage collection.

When the browser's GC reclaims them, it is free to evict the decoded bitmap from its in-memory image cache. Later, when Vue mounts **`ProjectsView.vue`** and the DOM `<img>` elements request the identical URLs (confirmed identical via build output inspection — both modules resolve to the same Vite-hashed `/assets/...-hash.webp` paths), the browser must re-fetch or at minimum re-decode from disk cache. This re-decode does not complete in time for the first paint frame, causing the images to visibly pop in after the GSAP `headerReveal` animation has already started fading `.project-card` elements from `opacity: 0` to `opacity: 1`.

The re-fetch also happens on every subsequent navigation to Projects because the orphaned `Image` objects are recreated (via a new `loadRouteAssets` call) only to be orphaned again. However, because the route is already in `readyRoutes`, re-navigation skips `loadRouteAssets` entirely — so on second visit, the DOM `<img>` elements are completely on their own with no preloader backing them, relying solely on whatever the browser's HTTP cache retained.

---

## Step-by-Step Fix

### 1. **`src/stores/routeStore.js`** — Add a persistent image cache map

- **Location:** Near the top of the `defineStore` callback, alongside the existing `pendingAssets` map declaration (around **`line 92`**).
- **Change:** Declare a new module-level (non-exported, non-reactive) `Map` named `preloadedImages`. This map will be keyed by image filename (e.g., `"tally_blurred.webp"`) and will hold a reference to the corresponding `Image` object.
- **Purpose:** Keeping a strong JS reference to each preloaded `Image` object prevents the browser from garbage-collecting the decoded bitmap. As long as the reference exists, the browser's in-memory image cache will serve the same URL instantly to any DOM `<img>` element.

### 2. **`src/stores/routeStore.js`** — Retain `Image` references in the preloader

- **Location:** Inside `loadRouteAssets`, the `.map()` over `routeAssets[routeName]?.images` at **`lines 142–150`**.
- **Change:** After constructing the `new Image()` and assigning its `src`, store the `Image` object in the `preloadedImages` map (keyed by `filename`) **before** the promise resolves. The `Image` reference must be stored synchronously (i.e., during the `.map()` call, not inside the `onload` callback) so it survives regardless of when GC runs. The promise resolution logic (`onload`/`onerror` both resolving) remains unchanged.
- **Purpose:** This is the core fix. The `Image` object now has a persistent reference in `preloadedImages`, so the browser will never evict its decoded bitmap from memory cache. When Vue later renders `<img :src="getURL(project.img)">` in **`ProjectsView.vue`**, the browser serves the response from its in-memory cache with zero network activity and zero decode latency.

### 3. **`src/stores/routeStore.js`** — Guard against duplicate image preloads

- **Location:** Same `.map()` block as Step 2, at the very start of the mapping function for each `filename`.
- **Change:** Before constructing a `new Image()`, check if `preloadedImages` already has an entry for this `filename`. If it does, return a pre-resolved promise immediately instead of creating another `Image` object. This handles the edge case where `loadRouteAssets` is called for a route whose images overlap with another route's image list, or when `readyRoutes` was cleared for a retry.
- **Purpose:** Prevents redundant network requests and duplicate `Image` objects. Directly supports Test 2's assertion that zero image requests fire on second navigation.

### 4. No changes to **`src/views/ProjectsView.vue`**

- The `getURL` helper at **`line 34`** and the `<img>` tag at **`lines 193–198`** are correct as-is. Build output confirms both modules produce identical Vite-hashed URLs. The `loading="eager"` attribute is appropriate. No template or style changes are needed — the fix is entirely in the preloader's object lifecycle management.

### 5. No changes to **`src/composables/useUtilAnimations.js`**

- The `headerReveal` animation at **`line 60`** correctly sets `.project-card` to `opacity: 0` then animates to `1`. This entrance animation is by design. Once the image cache is warm (via the retained `Image` objects), the images will be decoded and painted on the same frame the cards begin fading in — eliminating the flash. No animation timing adjustments are needed.

### 6. No changes to **`src/App.vue`**

- The three-way conditional rendering (error / loading / component) at **`lines 19–24`** is correct. The component only mounts after `loadRouteAssets` resolves, which now guarantees images are both loaded and retained in memory.
