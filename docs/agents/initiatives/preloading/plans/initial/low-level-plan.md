# Low-Level Implementation Plan: Custom Preloading Architecture

> **Source:** [high-level-plan.md](./high-level-plan.md)  
> **Primary File:** **`src/stores/routeStore.js`**  
> **Secondary File:** **`src/App.vue`**

---

## 1. **`src/stores/routeStore.js`** — Import Cleanup

- **Location:** **line 2**, the Vue import statement.
- **Action:** Remove **`defineAsyncComponent`** from the named imports. It will no longer be used once the **`asyncView`** helper is refactored.
- **Logic Requirements:**
    - The updated import should retain **`ref`**, **`markRaw`**, **`computed`**, **`watch`** only (drop **`defineAsyncComponent`**).

---

## 2. **`src/stores/routeStore.js`** — Remove the **`RouteLoading`** Import

- **Location:** **line 5**, the static import of **`RouteLoading`**.
- **Action:** Delete the entire import line for **`RouteLoading`** from **`@/components/RouteLoading.vue`**. The loading component will now be rendered explicitly in **`App.vue`**'s template instead of being wired through Vue's async component machinery.
- **Dependencies:** This import will be added to **`src/App.vue`** instead (see Section 10).

---

## 3. **`src/stores/routeStore.js`** — Refactor the **`asyncView`** Helper

- **Location:** **lines 21–27**, the **`asyncView`** function.
- **Action:** Replace the current implementation that wraps loaders in **`defineAsyncComponent`** with a simpler version that just calls the loader, awaits its default export, and wraps the resulting component in **`markRaw`**.
- **Logic Requirements:**
    - Change **`asyncView`** from a synchronous arrow function into an **`async`** arrow function that accepts a single parameter **`base`** (a string key).
    - Inside, call **`routeLoaders[base]()`** (the dynamic import) and **`await`** the result.
    - Extract the **`.default`** property from the resolved module (this is the actual Vue component).
    - Wrap the component in **`markRaw()`** to prevent Vue from making it deeply reactive.
    - Return the markRaw-wrapped component.
- **Result:** **`asyncView`** is now an async function that returns a resolved, raw-marked Vue component. It is **no longer called eagerly** at store-setup time — it will be called by **`loadRouteAssets`** instead (see Section 5).

---

## 4. **`src/stores/routeStore.js`** — Add New Reactive State

- **Location:** Inside the **`defineStore`** callback, immediately after **line 91** (below the existing **`toPath`** ref).
- **Action:** Declare two new reactive state variables.
- **Logic Requirements:**
    - **`isLoading`** — a **`ref`** initialized to **`false`**. This boolean will be set to **`true`** when assets are still loading and the debounce timer has elapsed, triggering the spinner in the App shell.
    - **`readyRoutes`** — a **`ref`** wrapping a **`new Set()`**. This Set tracks the names of routes whose assets (JS chunk, fonts, images) have already been fully loaded, preventing redundant fetching.
    - **`routeReady`** — a **`ref`** initialized to **`false`**. This boolean is set to **`true`** after assets resolve and the new route's component is about to mount. It is consumed by **`src/components/Footer.vue`** (**line 19**) which already watches **`routeStore.routeReady`** to trigger its fade-in animation. After the transition completes it should be set back to **`false`** once the leave animation of the _next_ transition begins.

---

## 5. **`src/stores/routeStore.js`** — Create the **`loadRouteAssets`** Function

- **Location:** Inside the **`defineStore`** callback. Place it after the **`readyRoutes`** / **`isLoading`** / **`routeReady`** declarations (from Section 4) and before the **`changeRoute`** function.
- **Action:** Define a new **`async function loadRouteAssets(routeName)`** that fetches all assets for a given route in parallel.
- **Logic Requirements:**
    1. **Early exit:** If **`readyRoutes.value.has(routeName)`** is true, return immediately — assets are already cached.
    2. **Build an array of promises** to be passed to **`Promise.all`**:
        - **JS chunk promise:** Call **`asyncView(routeName)`** (which now returns a promise resolving to the markRaw-wrapped component). Store the resolved component so it can be assigned to the route's **`component`** property in the **`routes`** object.
        - **Font promises:** Look up **`routeAssets[routeName]`**. If it exists and has a **`fonts`** array, map over each font descriptor string and call **`document.fonts.load(descriptor)`** for each one. Each call returns a promise.
        - **Image promises:** If the route entry in **`routeAssets`** has an **`images`** array, map over each filename. For each filename, construct the resolved image URL by using **`new URL('../assets/images/' + filename, import.meta.url).href`** (matching the pattern already used in **`ProjectsView.vue`** at **line 35**). Then create a new **`Promise`** that instantiates **`new Image()`**, sets its **`src`** to the resolved URL, and resolves on the image's **`onload`** event. The promise should also resolve (not reject) on **`onerror`** — a failed background image should not block navigation.
    3. **Await** the **`Promise.all`** wrapping all of the above promises.
    4. **Post-resolution:** After the await succeeds, assign the resolved component to **`routes[routeName].component`**. This replaces the placeholder (which is initially **`null`** — see Section 6). Add **`routeName`** to **`readyRoutes.value`** using the Set's **`.add()`** method.
- **Error Handling:** Wrap the entire body in a try/catch. On error, log a warning to the console but do **not** throw — navigation should still proceed even if a font or image fails to load. The JS chunk promise is the critical one; if it fails the route simply cannot render, so it is acceptable to let that propagate naturally (Vue will show nothing for the dynamic component, which is the existing failure mode).

---

## 6. **`src/stores/routeStore.js`** — Refactor the **`routes`** Object Initialization

- **Location:** **lines 66–87**, the **`routes`** constant inside the store.
- **Action:** Stop calling **`asyncView()`** eagerly. Instead, initialize each route's **`component`** property to **`null`**.
- **Logic Requirements:**
    - For every route entry (**`home`**, **`projects`**, **`resume`**, **`contact`**), change the **`component`** value from **`asyncView('routeName')`** to **`null`**.
    - The **`name`**, **`meta`**, and icon references remain unchanged.
- **Rationale:** Components will be populated dynamically by **`loadRouteAssets`** when it resolves each route's chunk (see Section 5, step 4). The template in **`App.vue`** uses **`v-if`** guarding (see Section 10) so a **`null`** component will never be rendered.

---

## 7. **`src/stores/routeStore.js`** — Rewrite **`changeRoute`** with Asset-Aware Timing

- **Location:** **lines 131–142**, the **`changeRoute`** async function.
- **Action:** Rewrite the function body to integrate the asset loader, a debounced spinner, and the existing leave-animation delay.
- **Logic Requirements (step by step):**
    1. Set **`isLeaving.value`** to **`true`** and **`toPath.value`** to **`to`** (unchanged from current behavior — this triggers exit animations in views and footer).
    2. Set **`routeReady.value`** to **`false`** (the route is in transition, not ready).
    3. Parse the destination path using **`parsePath(to)`** to extract **`base`** (the route key string).
    4. **Start two concurrent tasks:**
        - **Task A (leave animation wait):** Create a promise that resolves after **`leaveDuration`** milliseconds (the existing 350 ms setTimeout pattern from **line 135**).
        - **Task B (asset loading):** Call **`loadRouteAssets(base)`** which returns a promise.
    5. **Also start a debounce timer for the spinner:** Call **`setTimeout`** with a delay of **100 ms**. Inside the callback, check whether the asset-loading promise has already settled (track this with a local boolean flag, e.g. **`assetsResolved`** initialized to **`false`**). If it has not settled, set **`isLoading.value`** to **`true`**. Store the timer ID so it can be cleared later.
    6. **Await** a **`Promise.all`** containing both Task A and Task B. This ensures both the exit animations have completed _and_ the assets have loaded before proceeding.
    7. **After the await resolves:**
        - Set the **`assetsResolved`** flag to **`true`**.
        - Clear the debounce timer using **`clearTimeout`** with the stored timer ID (prevents the spinner from activating if assets resolved quickly).
        - Set **`isLoading.value`** to **`false`** (hides the spinner if it was shown).
        - Call **`window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })`** (existing behavior).
        - Set **`activePath.value`** to **`to`** (triggers **`currentRoute`** recomputation and dynamic component swap).
        - Set **`isLeaving.value`** to **`false`** (existing behavior).
        - Set **`routeReady.value`** to **`true`** (signals the footer and any other consumer that the new route is fully mounted and ready for enter animations).
        - Set **`window.location.hash`** to **`to`** (existing behavior).
    8. **After transition completes, kick off background preloading:** Call the **`preloadNextRoutes`** function (defined in Section 8) passing **`base`** as the current route name.

---

## 8. **`src/stores/routeStore.js`** — Create the Background Preloading Queue

- **Location:** Inside the **`defineStore`** callback. Place it after the **`loadRouteAssets`** function and before **`changeRoute`**.
- **Action:** Define a function named **`preloadNextRoutes`** that silently preloads assets for upcoming routes in the background.
- **Logic Requirements:**
    1. Accept a single parameter **`currentRouteName`** (string).
    2. Look up **`NEXT_ROUTE_ORDER[currentRouteName]`** to get the prioritized array of route names to preload.
    3. If no entry exists (defensive check), return immediately.
    4. Filter the array to only include route names that are **not** already in **`readyRoutes.value`**.
    5. For each remaining route name, call **`loadRouteAssets(routeName)`** **sequentially** (using a for-of loop with **`await`**) so they do not compete for bandwidth. Sequential loading also respects the priority order defined in **`NEXT_ROUTE_ORDER`**.
    6. **Wrap the entire execution** inside a **`requestIdleCallback`** call. Use a fallback pattern: check if **`window.requestIdleCallback`** exists; if not, fall back to **`setTimeout`** with a delay of **1** ms. This ensures preloading yields to the browser's main thread, preventing jank during GSAP enter animations.
- **Error Handling:** Each **`loadRouteAssets`** call is already internally try/caught (Section 5), so no additional error handling is needed in the loop.

---

## 9. **`src/stores/routeStore.js`** — Initial Route Load on App Startup

- **Location:** After the **`hashchange`** event listener (**lines 153–158**), near the end of the store setup function (around **line 175**).
- **Action:** Trigger the asset loading for the initial route when the store initializes, and kick off background preloading after it completes.
- **Logic Requirements:**
    1. Parse the initial **`activePath.value`** using **`parsePath`** to extract the **`base`** route name.
    2. Call **`loadRouteAssets(base)`** and chain a **`.then()`** that:
        - Sets **`routeReady.value`** to **`true`** (the initial route's assets are loaded, footer can fade in).
        - Calls **`preloadNextRoutes(base)`** to begin background preloading of adjacent routes.
    3. This should be a fire-and-forget call (no **`await`**) since the store setup function is synchronous. The initial route's component will be **`null`** until this resolves, and the **`v-if`** guard in the template (Section 10) will show the **`<RouteLoading>`** spinner until the component is available.

---

## 10. **`src/stores/routeStore.js`** — Update the Return Statement

- **Location:** **line 179**, the store's return statement.
- **Action:** Add the new reactive properties to the returned object.
- **Logic Requirements:**
    - Add **`isLoading`** and **`routeReady`** to the returned object alongside the existing properties.
    - **`readyRoutes`** does **not** need to be returned — it is purely internal state used by **`loadRouteAssets`** and **`preloadNextRoutes`**.
    - The updated return should expose: **`routes`**, **`activePath`**, **`currentRoute`**, **`toRoute`**, **`isLeaving`**, **`toPath`**, **`isLoading`**, **`routeReady`**.

---

## 11. **`src/App.vue`** — Import the **`RouteLoading`** Component

- **Location:** **lines 1–12**, the **`<script setup>`** block.
- **Action:** Add a static import for **`RouteLoading`**.
- **Logic Requirements:**
    - Add a new import line: import **`RouteLoading`** from **`@/components/RouteLoading.vue`**. Place it after the existing component imports (after the **`BgSVG`** import on **line 6**).

---

## 12. **`src/App.vue`** — Refactor the Template for Explicit Loading Control

- **Location:** **line 18**, the **`<component :is="...">`** tag.
- **Action:** Replace the single dynamic component tag with a **`v-if`** / **`v-else`** conditional rendering pair.
- **Logic Requirements:**
    - **Condition:** The loading spinner should render when the route's component is not yet available OR when **`routeStore.isLoading`** is **`true`**. The simplest expression is: show **`<RouteLoading>`** when **`routeStore.isLoading`** is true OR when **`routeStore.currentRoute.component`** is falsy (null).
    - **Loading branch:** Add a **`<RouteLoading>`** element with a **`v-if`** directive bound to the expression **`routeStore.isLoading || !routeStore.currentRoute.component`**. Apply **`class="page"`** to it so it occupies the same layout space and z-index as the dynamic view.
    - **Component branch:** Keep the existing **`<component :is="routeStore.currentRoute.component" :key="routeStore.activePath" class="page" />`** tag but add a **`v-else`** directive to it.
    - The order in the template should be: **`BgSVG`** → **`Navbar`** → **`RouteLoading`** (v-if) → **`component`** (v-else) → **`Footer`**.
- **Rationale:** This removes the reliance on Vue's built-in **`defineAsyncComponent`** loading fallback. The app shell now has full control over when the spinner shows and when the real component mounts, ensuring GSAP enter animations only fire after all assets (fonts, images, JS) are confirmed ready.

---

## 13. **`src/components/Footer.vue`** — No Changes Required

- **Location:** **lines 18–25**, the watcher on **`routeStore.routeReady`**.
- **Action:** No modifications needed. The existing watcher already references **`routeStore.routeReady`** which was previously **`undefined`** (a forward-reference / latent bug). Once **`routeReady`** is added to the store's returned state (Section 10), this watcher will begin functioning as intended — fading in the footer text with a 0.3 s delay whenever a route transition completes.
- **Verification:** After implementation, confirm the footer text (which starts at **`opacity: 0`** per **line 53** of this file) fades in on initial load and after every route change.

---

## Verification Checklist

After implementing all sections above, verify the following behaviors:

1. **Cold load (no cache):** The **`<RouteLoading>`** spinner should appear while the initial route's JS chunk, fonts, and images load. Once resolved, the spinner disappears and the view mounts with enter animations. The footer text fades in shortly after.
2. **Warm navigation to a preloaded route:** Clicking a nav link for a route that was background-preloaded should show no spinner. The exit animation plays for 350 ms, then the new view mounts instantly.
3. **Warm navigation to a non-preloaded route (fast network):** If assets resolve within 100 ms of the debounce timer starting, the spinner should never appear.
4. **Slow network simulation:** Throttle the network in DevTools. Navigate to a non-preloaded route. After the 350 ms leave animation + 100 ms debounce, the spinner should appear, then disappear once assets resolve.
5. **Background preloading:** After the initial route loads, open the Network tab and observe that adjacent routes' chunks, fonts, and images begin loading during idle time without blocking the main thread.
6. **No GSAP jank:** Enter animations on each view should remain smooth. The **`requestIdleCallback`** wrapper should prevent background preloading from competing with GSAP's rAF loop.
7. **Run the existing typecheck and build:** Execute the project's typecheck and build commands to ensure no regressions.
