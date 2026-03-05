### High-Level Implementation Plan: Custom Preloading Architecture

#### 1. Core State & Utility Updates
* **All Files to Modify:** **`src/stores/routeStore.js`**
* **Conceptual Logic:** 
    * Introduce new reactive state variables: **`isLoading`** (boolean, defaults to false) and **`readyRoutes`** (a Set or Array to track fully loaded routes).
    * Remove the native **`loadingComponent`** property from the **`asyncView`** helper function. We will handle the loading component explicitly in the template moving forward.
* **Data Flow & State:** The store now acts as the single source of truth for whether the application is currently fetching network assets and which routes are safe to navigate to instantly.

#### 2. The Universal Asset Loader Function
* **All Files to Modify:** **`src/stores/routeStore.js`**
* **Conceptual Logic:** 
    * Create a new asynchronous utility function (e.g., **`loadRouteAssets(routeName)`**) that handles fetching all requirements for a specific route.
    * This function must gather three distinct promises:
        1.  **JavaScript Chunk:** Call the corresponding import function from the **`routeLoaders`** object to fetch the Vue component.
        2.  **Fonts:** If the route exists in **`routeAssets`** and has fonts, map over the font array and utilize the **`document.fonts.load()`** API to ensure the specific font faces are ready.
        3.  **Images:** If the route has images, map over them, construct a **`new Image()`** object in memory, assign the source, and wrap the **`onload`** and **`onerror`** events in a Promise.
    * Use **`Promise.all()`** to wait for all three categories to resolve simultaneously.
* **Data Flow & State:** Once the **`Promise.all`** resolves for a specific route, add that route's name to the **`readyRoutes`** state to prevent redundant fetching in the future.

#### 3. Navigation Timing & Spinner Control
* **All Files to Modify:** **`src/stores/routeStore.js`**
* **Conceptual Logic:** 
    * Update the main **`changeRoute(to)`** function to intercept navigation before triggering the transition.
    * Check if the destination route is already in the **`readyRoutes`** state. If it is, proceed with the transition instantly.
    * If it is *not* ready, initialize the **`loadRouteAssets`** promise.
    * Simultaneously, start a **`setTimeout`** (e.g., 100ms). 
    * If the timeout fires *before* the assets promise resolves, set the **`isLoading`** state to true (this will show the spinner).
    * Once the assets promise finally resolves, clear the timeout (to prevent it from firing if the load was fast), set **`isLoading`** to false, and proceed with the standard transition and active path updates.
* **Data Flow & State:** The 100ms race condition ensures the user never sees a flash of the loading spinner if the assets are served quickly from the browser cache.

#### 4. Background Preloading Queue
* **All Files to Modify:** **`src/stores/routeStore.js`**
* **Conceptual Logic:** 
    * Create a function to handle background loading based on the **`NEXT_ROUTE_ORDER`** mapping.
    * This function should check the current route, look up the array of next prioritized routes, and sequentially call the **`loadRouteAssets`** function for any route not currently in **`readyRoutes`**.
    * Wrap the execution of these background calls inside a **`requestIdleCallback`** (with a **`setTimeout`** fallback) to ensure the browser's main thread remains free for GSAP animations and user interactions.
    * Trigger this background queue function after the initial application load and whenever a new route transition completely finishes.
* **Dependencies/Impact:** This ensures that while the user is reading the current page, the subsequent pages are being silently cached in the background without causing jank.

#### 5. Template Integration (App Shell)
* **All Files to Modify:** **`src/App.vue`**
* **Conceptual Logic:** 
    * Refactor the template layout to implement explicit conditional rendering for the dynamic component versus the loading component.
    * Use a **`v-if`** directive bound to the new **`routeStore.isLoading`** state to render the **`<RouteLoading>`** component.
    * Use a **`v-else`** directive on the existing **`<component :is="...">`** dynamic view component.
* **Dependencies/Impact:** This removes the reliance on Vue's built-in async component wrapper, giving you absolute control over exactly when the dynamic component mounts and its GSAP enter animations begin.
