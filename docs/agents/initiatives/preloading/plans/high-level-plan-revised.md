# High-Level Implementation Plan: Custom Preloading Architecture

## 1. Core State & Utility Updates
* **All Files to Modify:** **`src/stores/routeStore.js`**
* **Conceptual Logic:** 
    * Introduce new reactive state variables: **`isLoading`** (boolean, defaults to false), **`readyRoutes`** (a Set to track fully loaded routes), and **`routeReady`** (boolean, defaults to false, signals the view is safe to animate in).
    * Introduce an internal (non-exported) navigation ID counter (**`navId`**) used to guard against concurrent navigations, and an internal **`pendingAssets`** Map for request deduplication.
    * Remove the native **`loadingComponent`** property and **`defineAsyncComponent`** wrapper from the **`asyncView`** helper function. We will handle the loading component explicitly in the template moving forward.
    * Wrap the **`routes`** object in **`reactive()`** with all **`component`** values initialized to **`null`**. Components are assigned reactively only after **all** assets for that route have finished loading.
* **Data Flow & State:** The store now acts as the single source of truth for whether the application is currently fetching network assets and which routes are safe to navigate to instantly. The navigation ID ensures only the most recent navigation can mutate shared state.

## 2. The Universal Asset Loader Function
* **All Files to Modify:** **`src/stores/routeStore.js`**
* **Conceptual Logic:** 
    * Create a new asynchronous utility function (e.g., **`loadRouteAssets(routeName)`**) that fetches all requirements for a specific route with built-in deduplication.
    * This function must gather three distinct promises inside a **`Promise.all`**:
        1.  **JavaScript Chunk:** Call the corresponding import function from the **`routeLoaders`** object to fetch the Vue component module.
        2.  **Fonts:** If the route exists in **`routeAssets`** and has fonts, map over the font array and utilize the **`document.fonts.load()`** API.
        3.  **Images:** If the route has images, map over them, construct a **`new Image()`** object in memory, assign the source, and wrap the **`onload`** and **`onerror`** events in a Promise.
    * **Critical:** The component must NOT be assigned to the reactive **`routes`** object inside the **`Promise.all`**. Instead, the JS chunk promise returns the resolved module. After the **`Promise.all`** resolves, extract the component from the result array and **then** assign it to **`routes[routeName].component`**. This prevents premature rendering with missing fonts/images.
    * **Deduplication:** The function stores its own outer promise (not the inner **`Promise.all`**) in the **`pendingAssets`** Map. If a second caller requests the same route while it's in flight, it receives the same outer promise, guaranteeing that **`readyRoutes`** is updated and the component is assigned before any caller's **`await`** resumes.
* **Data Flow & State:** Once the outer promise resolves for a specific route, that route's name is in **`readyRoutes`**, its component is assigned, and **`pendingAssets`** is cleaned up.

## 3. Navigation Timing & Spinner Control
* **All Files to Modify:** **`src/stores/routeStore.js`**
* **Conceptual Logic:** 
    * Update the main **`changeRoute(to)`** function to intercept navigation before triggering the transition.
    * **Concurrency Guard:** Increment a navigation ID counter at the top of each call and capture it locally. Before every state mutation (spinner toggle, route swap, timer clear), check that the local ID still matches the current global ID. If it doesn't, bail out — a newer navigation has taken over.
    * Check if the destination route is already in the **`readyRoutes`** state. If it is, proceed with the transition instantly (after the exit animation).
    * If it is *not* ready, initialize the **`loadRouteAssets`** promise.
    * After the exit animation delay completes, evaluate whether assets have resolved. If not, start a **`setTimeout`** (100ms). If the timeout fires before the assets promise resolves, set **`isLoading`** to true (this will show the spinner).
    * Once the assets promise resolves, clear the timeout, set **`isLoading`** to false, and proceed with the route swap and active path updates. All of these mutations are gated behind the navigation ID check.
* **Data Flow & State:** The 100ms race ensures the user never sees a flash of the loading spinner if assets resolve quickly. The navigation ID ensures rapid clicks only produce a single, clean transition for the latest destination.

## 4. Background Preloading Queue
* **All Files to Modify:** **`src/stores/routeStore.js`**
* **Conceptual Logic:** 
    * Create a function to handle background loading based on the **`NEXT_ROUTE_ORDER`** mapping.
    * This function should check the current route, look up the array of next prioritized routes, and filter out any already in **`readyRoutes`**.
    * **Each individual route load** must be wrapped in its own **`requestIdleCallback`** (with a **`setTimeout`** fallback). This ensures every subsequent fetch also waits for an idle frame before starting, preventing background network/parsing work from competing with GSAP's rAF animation loop.
    * Trigger this background queue function after the initial application load completes successfully and whenever a new route transition completely finishes.
* **Dependencies/Impact:** This ensures that while the user is reading the current page, the subsequent pages are being silently cached in the background without causing jank. Wrapping each iteration individually (rather than the whole loop) guarantees true idle-time scheduling for every route.

## 5. Initial Load with Debounced Spinner & Error Recovery
* **All Files to Modify:** **`src/stores/routeStore.js`**
* **Conceptual Logic:**
    * On app startup, parse the initial **`activePath`** to determine the base route and begin loading its assets via **`loadRouteAssets`**.
    * Apply the **same 100ms spinner debounce** used during navigation: start a **`setTimeout`** that sets **`isLoading`** to true after 100ms. If the assets resolve before the timer fires, clear it so the spinner never appears (handles warm-cache reloads gracefully).
    * **Error Recovery:** If **`loadRouteAssets`** fails (JS chunk 404, network error, etc.), surface an error state (e.g., **`loadError`** ref) that the template can use to show a user-facing error message with a retry action, instead of leaving the user on an infinite spinner.
    * On success (route added to **`readyRoutes`**), set **`routeReady`** to true and begin background preloading. On failure, do **not** set **`routeReady`** to true.
* **Dependencies/Impact:** This closes the gap where the initial load had no spinner debounce (contradicting the original spec) and no failure recovery path.

## 6. Template Integration (App Shell)
* **All Files to Modify:** **`src/App.vue`**
* **Conceptual Logic:** 
    * Refactor the template layout to implement explicit conditional rendering for the dynamic component versus the loading/error components.
    * Use a **`v-if`** directive to render an error state when **`routeStore.loadError`** is truthy (with a retry button).
    * Use a **`v-else-if`** directive bound to **`routeStore.isLoading || !routeStore.currentRoute?.component`** to render the **`<RouteLoading>`** component.
    * Use a **`v-else`** directive on the existing **`<component :is="...">`** dynamic view component.
    * Import **`RouteLoading`** statically in **`App.vue`**'s script block (moved from the store).
* **Dependencies/Impact:** This removes the reliance on Vue's built-in async component wrapper, giving absolute control over when the dynamic component mounts and its GSAP enter animations begin. The three-way conditional (error / loading / view) ensures every state is visually accounted for.
