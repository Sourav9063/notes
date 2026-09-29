# Vuex modular store with shared helpers

Notes on a Vue 2 + Vuex project layout: one root store, domain modules, and shared base state/getters/mutations/actions.

### Overview of State Management

1.  **Vuex Integration**: The core Vuex store is initialized in `src/state/store.js` and then imported and used in the main Vue application instance in `src/main.js`.
2.  **Modular Structure**: The Vuex store is divided into modules, with each module representing a specific domain or feature of the application (e.g., `action`, `auth`, `phase`). These modules are located in the `src/state/modules/` directory.
3.  **Helper Utilities**: A file named `src/state/helpers.js` provides common patterns for `state`, `getters`, `mutations`, and `actions` that are reused across different Vuex modules. This promotes consistency and reduces boilerplate.

### Detailed Explanation

#### 1. Vuex Store Initialization

*   The Vuex store is created and exported from `src/state/store.js`.
    ```javascript
    // src/state/store.js
    const store = new Vuex.Store({
      modules,
      strict: process.env.NODE_ENV !== 'production',
    });
    ```
*   This store is then integrated into the main Vue application in `src/main.js`.
    ```javascript
    // src/main.js
    new Vue({
      router,
      store, // Vuex store is provided here
      render: h => h(App),
    }).$mount('#app');
    ```

#### 2. Modular State Management

*   The `modules` object passed to the Vuex store in `src/state/store.js` is derived from importing all files in the `src/state/modules/` directory. Each file in this directory represents a separate Vuex module.
*   **Example Module (`src/state/modules/action.js`):**
    This module manages state related to "actions" within the application. It defines its own `state`, `getters`, `mutations`, and `actions`.
    ```javascript
    // src/state/modules/action.js
    export const state = {
      ...INITIAL_STATE, // Spreads initial state from helpers.js
    };
    export const getters = {
      ...BASE_GETTERS, // Spreads base getters from helpers.js
    };
    export const mutations = {
      ...BASE_MUTATIONS, // Spreads base mutations from helpers.js
      RESET_LIST(state) { // Module-specific mutation
        state.list = INITIAL_STATE.list;
        state.pagination.currentPage = INITIAL_STATE.pagination.currentPage;
        state.pagination.total = INITIAL_STATE.pagination.total;
      },
    };
    export const actions = {
      ...BASE_ACTIONS, // Spreads base actions from helpers.js
      async createPhaseAction({ commit }, payload = {}) { // Module-specific action
        // ... API request logic ...
      },
    };
    ```
*   Other modules like `src/state/modules/auth.js` and `src/state/modules/phase.js` follow a similar structure, managing their respective domains (authentication and phases).

#### 3. Helper Utilities for Reusability

*   The file `src/state/helpers.js` provides common, reusable state management patterns.
*   **`INITIAL_STATE`**: Defines a consistent initial state structure for modules.
    ```javascript
    // src/state/helpers.js
    export const INITIAL_STATE = {
      list: [],
      listAll: [],
      details: null,
      loading: { /* ... */ },
      loadingError: { /* ... */ },
      pagination: { /* ... */ },
      sorting: { /* ... */ },
      removing: false,
      saving: false,
      highlightedID: 0,
    };
    ```
*   **`BASE_GETTERS`**: Provides common getters for accessing data from the state.
    ```javascript
    // src/state/helpers.js
    export const BASE_GETTERS = {
      list: state => state.list,
      listAll: state => state.listAll,
      details: state => state.details,
    // ... and so on
    };
    ```
*   **`BASE_MUTATIONS`**: Defines standard mutations for updating state, such as handling loading states, fetching data success/failure, and saving resources.
    ```javascript
    // src/state/helpers.js
    export const BASE_MUTATIONS = {
      FETCH_RESOURCE_LIST(state) { /* ... */ },
      FETCH_RESOURCE_LIST_SUCCESS(state, payload) { /* ... */ },
    // ... and so on
    };
    ```
*   **`BASE_ACTIONS`**: Contains common actions that can be dispatched by components, such as updating pagination or sorting.
    ```javascript
    // src/state/helpers.js
    export const BASE_ACTIONS = {
      updatePagination({ commit }, payload) { /* ... */ },
      updateSorting({ commit }, payload) { /* ... */ },
      async highlight({ commit }, id) { /* ... */ },
    };
    ```

In summary, the project uses a well-structured Vuex implementation with modular separation of concerns and reusable helper functions to manage the application's state efficiently and consistently.
