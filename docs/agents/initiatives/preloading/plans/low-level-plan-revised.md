# Low-Level Implementation Plan: Custom Preloading Architecture

> **Source:** [high-level-plan.md](./high-level-plan.md)  
> **Primary File:** **`src/stores/routeStore.js`**  
> **Secondary File:** **`src/App.vue`**

---

## 1. **`src/stores/routeStore.js`** — Import Cleanup & Additions

- **Location:** **line 2**, the Vue import statement.
- **Action:** Remove **`defineAsyncComponent`** and add **`reactive`**.
- **Logic Requirements:**
    - The updated import should be: **`import { ref, reactive, markRaw, computed, watch } from 'vue';`**

---

## 2. **`src/stores/routeStore.js`** — Remove the **`RouteLoading`** Import

- **Location:** **line 5**, the static import of **`RouteLoading`**.
- **Action:** Delete the entire import line for **`RouteLoading`**. The loading component will now be rendered explicitly in **`App.vue`**'s template instead.
- **Dependencies:** This import will be added to **`src/App.vue`** instead (see Section 13).

---

## 3. **`src/stores/routeStore.js`** — Refactor the **`asyncView`** Helper

- **Location:** **lines 21–27**, the **`asyncView`** function.
- **Action:** Replace the current implementation with a strictly asynchronous dynamic import handler.
- **Logic Requirements:**
    - Change **`asyncView`** into an **`async`** arrow function that accepts **`base`** (a string key).
    - Inside, **`await routeLoaders[base]()`**.
    - Extract the **`.default`** property from the resolved module.
    - Return **`markRaw(resolvedModule.default)`**.
    - **Do NOT assign the result to `routes` inside this function.** It only fetches and returns the component.

---

## 4. **`src/stores/routeStore.js`** — Add New Reactive State & Internal Maps

- **Location:** Inside the **`defineStore`** callback, below the existing **`toPath`** ref.
- **Action:** Declare new state variables and internal tracking variables.
- **Logic Requirements:**
    - **`isLoading`** — a **`ref(false)`**. Toggles the spinner in the App shell.
    - **`readyRoutes`** — a **`ref(new Set())`**. Tracks route names that have already successfully loaded.
    - **`routeReady`** — a **`ref(false)`**. Signals that the new route is fully mounted and ready for enter animations (used by Footer).
    - **`loadError`** — a **`ref(null)`**. Holds an error message string when the initial load fails, or **`null`** when healthy.
    - **`pendingAssets`** — a **`new Map()`** (not a ref, not exported). Internally tracks outer promises for routes currently being fetched to prevent duplicate network calls.
    - **`navId`** — a **`let`** variable initialized to **`0`** (not a ref, not exported). Monotonically incrementing counter used to guard concurrent navigations.

---

## 5. **`src/stores/routeStore.js`** — Create the **`loadRouteAssets`** Function

- **Location:** Inside the **`defineStore`** callback. Place it after the declarations from Section 4.
- **Action:** Define a new **`function loadRouteAssets(routeName)`** (not async itself — it returns a promise explicitly) that fetches assets in parallel with request deduplication.
- **Logic Requirements:**
    1. **Cache Checks:**
        - If **`readyRoutes.value.has(routeName)`**, return **`Promise.resolve()`** immediately.
        - If **`pendingAssets.has(routeName)`**, return **`pendingAssets.get(routeName)`** (the existing outer promise).
    2. **Define the Inner Load Logic as an Async IIFE or Named Async Function:**
        - Construct a **`Promise.all`** containing three categories of promises:
            - **JS Chunk:** Call **`asyncView(routeName)`**. This returns a promise that resolves to the **`markRaw`**'d component. **Do NOT chain `.then()` to assign it here.** Let it be an element of the **`Promise.all`** result array.
            - **Fonts:** Map **`routeAssets[routeName]?.fonts ?? []`** to **`document.fonts.load(descriptor)`** calls.
            - **Images:** Map **`routeAssets[routeName]?.images ?? []`** to promises that resolve a **`new URL(`../assets/images/${filename}`, import.meta.url).href`**, instantiate **`new Image()`**, set **`src`**, and resolve on **`onload`** or **`onerror`**.
        - **After** the **`Promise.all`** resolves, extract the component from position **`[0]`** of the result array (since the JS chunk promise is the first element).
        - Assign it: **`routes[routeName].component = component;`**
        - Add **`routeName`** to **`readyRoutes.value`**.
    3. **Error Handling:**
        - Wrap the above in a **`try/catch/finally`**.
        - On **`catch`**, log the error. Do **not** add to **`readyRoutes`**. Do **not** assign the component. Re-throw the error so callers can detect failure.
        - In **`finally`**, execute **`pendingAssets.delete(routeName)`**.
    4. **Deduplication — Store the Outer Promise:**
        - Assign the promise returned by the async IIFE/function to a local variable (e.g., **`outerPromise`**).
        - Execute **`pendingAssets.set(routeName, outerPromise)`**.
        - Return **`outerPromise`**.
    - **Critical Ordering:** The **`pendingAssets.set()`** must happen synchronously before the first **`await`** inside the async function, so that any concurrent call to **`loadRouteAssets`** with the same route name hits the dedup check.

---

## 6. **`src/stores/routeStore.js`** — Refactor the **`routes`** Object Initialization

- **Location:** **lines 66–87**, the **`routes`** constant.
- **Action:** Stop eager loading and wrap the object in **`reactive()`**.
- **Logic Requirements:**
    - Wrap the object definition: **`const routes = reactive({ ... })`**.
    - For every route (**`home`**, **`projects`**, **`resume`**, **`contact`**), initialize the **`component`** value to **`null`**.
    - Retain existing **`name`** and **`meta`** structures exactly as they are.

---

## 7. **`src/stores/routeStore.js`** — Create the Background Preloading Queue

- **Location:** Before **`changeRoute`**.
- **Action:** Define **`preloadNextRoutes(currentRouteName)`** to silently preload adjacent routes, with each individual load wrapped in its own idle callback.
- **Logic Requirements:**
    1. Look up the priority array from **`NEXT_ROUTE_ORDER[currentRouteName]`**. Return if undefined.
    2. Filter out routes already in **`readyRoutes.value`**.
    3. Define a helper **`waitForIdle()`** that returns a Promise which resolves inside a **`requestIdleCallback`** (with a **`setTimeout(..., 1)`** fallback for unsupported browsers).
    4. Iterate the filtered array sequentially (**`for...of`**):
        - **`await waitForIdle()`** — yields to the browser until an idle frame is available.
        - **`await loadRouteAssets(routeName).catch(() => {})`** — load the route, swallow errors so one failure doesn't halt the queue.
    5. This ensures every individual route fetch is scheduled only when the browser is idle, preventing background work from competing with GSAP animations.

---

## 8. **`src/stores/routeStore.js`** — Rewrite **`changeRoute`** with Navigation Guard & Asset-Aware Timing

- **Location:** **lines 131–142**, the **`changeRoute`** async function.
- **Action:** Rewrite the timing to include a concurrency guard, strictly preserve the exit animation, and debounce the spinner.
- **Logic Requirements:**
    1. **Concurrency Guard:** Increment **`navId`** by 1. Capture the new value in a local **`const currentNavId = ++navId;`**. Define a local helper: **`const isStale = () => currentNavId !== navId;`**
    2. Set **`isLeaving.value = true`**, **`toPath.value = to`**, and **`routeReady.value = false`**.
    3. Extract **`base`** via **`parsePath(to)`**.
    4. Start the asset loader: **`const loadPromise = loadRouteAssets(base);`** Track its status with a local **`let assetsResolved = false; loadPromise.then(() => { assetsResolved = true; }).catch(() => {});`**
    5. **`await`** the exit animation delay: **`await new Promise(res => setTimeout(res, leaveDuration));`**
    6. **Stale Check #1:** **`if (isStale()) return;`**
    7. **Spinner Evaluation:** If **`!assetsResolved`**, start a debounce timer (**`setTimeout`** for 100ms) that sets **`isLoading.value = true`** only if **`!isStale()`**. Store the timer ID.
    8. **`await loadPromise;`** (wrap in try/catch — on error, if **`!isStale()`**, set **`loadError.value`** to an error message, clear spinner state, and return early)
    9. **Stale Check #2:** **`if (isStale()) return;`**
    10. Clear the spinner timer (**`clearTimeout`**) and force **`isLoading.value = false`**.
    11. Execute route swap: call **`window.scrollTo`**, update **`activePath.value = to`**, set **`isLeaving.value = false`**, set **`routeReady.value = true`**, and update **`window.location.hash`**.
    12. Call **`preloadNextRoutes(base)`**.

---

## 9. **`src/stores/routeStore.js`** — Initial Route Load on App Startup (with Debounce & Error Recovery)

- **Location:** Near the end of the store setup (around **line 175**).
- **Action:** Trigger initial asset loading with a debounced spinner and error recovery.
- **Logic Requirements:**
    1. Parse **`activePath.value`** to get **`base`**.
    2. Start a debounce timer: **`const initialTimer = setTimeout(() => { isLoading.value = true; }, 100);`**
    3. Call **`loadRouteAssets(base)`** and **`await`** / **`.then().catch()`** it:
        - **On success:** Clear the timer (**`clearTimeout(initialTimer)`**). Set **`isLoading.value = false`**. Verify the route was added to **`readyRoutes.value`** before setting **`routeReady.value = true`**. Then call **`preloadNextRoutes(base)`**.
        - **On failure (catch):** Clear the timer (**`clearTimeout(initialTimer)`**). Set **`isLoading.value = false`**. Set **`loadError.value`** to a user-facing message (e.g., **`'Failed to load. Please refresh or try again.'`**). Do **not** set **`routeReady.value = true`**.
    4. This can be an immediately-invoked async function or a chained promise — the key requirement is that the debounce timer and error state are handled.

---

## 10. **`src/stores/routeStore.js`** — Add a **`retryInitialLoad`** Function

- **Location:** After the initial load logic from Section 9.
- **Action:** Define a function that the template's retry button can call.
- **Logic Requirements:**
    - Reset **`loadError.value = null`**.
    - Re-run the same logic from Section 9 (parse base, debounce timer, call **`loadRouteAssets`**, handle success/failure).
    - This can be a named function that Section 9 also calls internally to avoid duplication.

---

## 11. **`src/stores/routeStore.js`** — Update the Return Statement

- **Location:** **line 179**, the store's return statement.
- **Action:** Export the new shell state and retry function.
- **Logic Requirements:**
    - Add **`isLoading`**, **`routeReady`**, **`loadError`**, and **`retryInitialLoad`** to the exported object.
    - **`readyRoutes`**, **`pendingAssets`**, and **`navId`** remain internal — they are not exported.

---

## 12. **`src/App.vue`** — Import the **`RouteLoading`** Component

- **Location:** **lines 1–12**, the **`<script setup>`** block.
- **Action:** Add static import for **`RouteLoading`**.
- **Logic Requirements:**
    - **`import RouteLoading from '@/components/RouteLoading.vue';`**

---

## 13. **`src/App.vue`** — Refactor the Template for Explicit Loading & Error Control

- **Location:** **line 18**, the dynamic component block.
- **Action:** Use a three-way conditional to handle error, loading, and ready states.
- **Logic Requirements:**
    - **Error Guard:** Add a block: **`<div v-if="routeStore.loadError" class="page load-error">`** containing a user-facing error message (sourced from **`routeStore.loadError`**) and a **`<button @click="routeStore.retryInitialLoad">`** retry action. Style this block to be centered and match the existing design.
    - **Spinner Guard:** **`<RouteLoading v-else-if="routeStore.isLoading || !routeStore.currentRoute?.component" class="page" />`**.
    - **Component Guard:** **`<component v-else :is="routeStore.currentRoute.component" :key="routeStore.activePath" class="page" />`**.
    - *Note: Safe navigation (`?.`) ensures no errors fire before `currentRoute` fully parses.*

---

## 14. **`src/components/Footer.vue`** — No Changes Required

- **Action:** Verify behavior organically; the existing **`routeStore.routeReady`** watcher will now properly fade the footer upon successful lifecycle swaps. The watcher only fires when **`routeReady`** transitions to **`true`**, which is now gated behind a successful load (Sections 8 and 9), so it will not trigger on error paths.

---

## Verification Checklist

After implementing all sections above, verify the following behaviors:

1. **Cold load (no cache):** The **`<RouteLoading>`** spinner should appear ~100ms after the shell renders while the initial route's JS chunk, fonts, and images load. Once resolved, the spinner disappears and the view mounts with enter animations. The footer text fades in shortly after. **Crucially:** text must render in the correct fonts and all images must be visible on the first paint of the view — no FOUT or missing images.
2. **Warm reload (cached assets):** If assets resolve within 100ms, the spinner should **never** appear. The view mounts directly.
3. **Failed initial load:** The error state should appear (not an infinite spinner). Clicking retry should re-attempt the load.
4. **Warm navigation to a preloaded route:** Clicking a nav link for a route that was background-preloaded should show no spinner. The exit animation plays for 350ms, then the new view mounts instantly.
5. **Warm navigation to a non-preloaded route (fast network):** If assets resolve within 100ms of the debounce timer starting (after the exit animation), the spinner should never appear.
6. **Slow network simulation:** Throttle the network in DevTools. Navigate to a non-preloaded route. After the 350ms leave animation + 100ms debounce, the spinner should appear, then disappear once assets resolve.
7. **Rapid navigation (spam clicks):** Click multiple nav links in quick succession. Only the **last** clicked route should load. No stale navigations should mutate state. No stuck spinners.
8. **Background preloading:** After the initial route loads, open the Network tab and observe that adjacent routes' chunks, fonts, and images begin loading during idle time without blocking the main thread.
9. **No GSAP jank:** Enter animations on each view should remain smooth. The per-route **`requestIdleCallback`** wrapper should prevent background preloading from competing with GSAP's rAF loop.
10. **Run the existing typecheck and build:** Execute the project's typecheck and build commands to ensure no regressions.
