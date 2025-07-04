# [Page Name] - Page Design Document

## 1. Overview

**Page Path**: `/path/to/page`  
**Parent Route**: `(group)/_layout.tsx`  

*Briefly describe the purpose of this page and its primary goal. What should the user be able to accomplish here?*

---

## 2. User Stories

- **As a [user type]**, I want to **[action]** so that **[benefit]**.
- **As a [user type]**, I need to **[see/do something]** to achieve **[goal]**.
- **As a [user type]**, I expect **[outcome]** when I interact with **[feature]**.

---

## 3. Component Breakdown

*Break down the page into a hierarchy of components. Reference existing components where possible.*

- **[Page Container] (`<View>`)**
    - **[Header Component]** (`<CustomHeader>`)
        - Props: `title`, `showBackButton`
    - **[Component A]** (`<ExistingComponent>`)
        - `prop1`: value
        - `prop2`: value
        - *Notes: This component will handle X.*
    - **[New Component B]**
        - **Responsibility**: *Describe what this new component will do.*
        - **Props**: `propA: type`, `propB: type`
        - **State**: `useState<Type>()` for...
    - **[Component C]** (`<FlatList>`)
        - **Data Source**: `useSomeHook()`
        - **Render Item**: `<ListItemComponent>`

---

## 4. UI/UX & Design Principles

*Reference principles from `.cursor/rules/ui-design.mdc`.*

- **Layout**: 
    - *Describe the layout (e.g., "Single column, scrollable view with a sticky header").*
    - *Use Tailwind v4 classes for spacing and layout (e.g., `p-4`, `gap-3`).*
- **Key Principles**:
    - **Von Restorff Effect**: *The primary CTA, "[Button Text]", will use `bg-purple-600` to stand out.*
    - **Fitts's Law**: *The main action buttons will have a minimum height of `56px` and be placed in the lower third of the screen.*
    - **Hick's Law**: *Limit primary choices to 2-3. Secondary actions are nested under a "More" menu.*
    - **Zeigarnik Effect**: *If this is part of a flow, show a progress bar at the top.*
- **Color Palette**:
    - Primary: `bg-purple-600`
    - Secondary: `bg-gray-100`
    - Text: `text-gray-900`, `text-gray-600`
- **Typography**:
    - Header: `text-2xl font-bold`
    - Body: `text-base font-medium`

---

## 5. State Management

*How will the state for this page be managed?*

- **Global State**: 
    - `UserContext`: *Access user's `avatar_url`.*
- **Local State (`useState`)**:
    - `isLoading: boolean`
    - `error: string | null`
    - `data: SomeType[]`
- **Hooks**:
    - `useSomeHook()` for data fetching.
    - `useNavigation()` for routing.

---

## 6. Data & API Dependencies

*List all API endpoints this page will interact with. Reference backend service and controller methods.*

- **`GET /api/feature/:id`**:
    - **Purpose**: Fetches initial data for the page.
    - **Backend Controller**: `featureController.getFeatureData`
    - **Response Shape**: `{ id: string, name: string, items: [] }`
- **`POST /api/feature/action`**:
    - **Purpose**: Performs the primary action on the page.
    - **Backend Controller**: `featureController.performAction`
    - **Request Body**: `{ itemId: string }`

---

## 7. Navigation & Routing

*Describe how the user gets to this page and where they can go from it.*

- **Entry Points**:
    - From the `Home` tab, tapping on a `FeedItem`.
    - Via a notification.
- **Exits / Onward Journeys**:
    - Tapping the back button returns to the previous screen.
    - Tapping on a list item navigates to `profile/[username]`.

---

## 8. Edge Cases & Error States

- **Loading State**: A skeleton loader should be displayed while data is being fetched.
- **Empty State**: If there is no data, display a message like "Nothing to see here." with a relevant icon.
- **Error State**: If an API call fails, show a toast notification and a "Retry" button.
- **Permissions**: *Does this page require any specific user permissions?* 