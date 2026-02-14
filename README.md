# Web-Annotator-In-Page-Feedback-Tool

## Getting Started

Installed node modules on `annotator-ui` 

# Web Annotator -- Chrome Extension

## Overview

Web Annotator is a Chrome Extension that allows users to add sticky-note
comments directly on any live webpage.

------------------------------------------------------------------------
## How to Load the Extension in Chrome

1.  Your final extension structure should look like this:

extension/
│
├── manifest.json
├── content.js
└── ui/
    ├── index.html
    └── _next/

2.  Open Chrome Extensions Page
    -   chrome://extensions
3.  Enable Developer Mode:
    -   In the top-right corner
4.  Load the Extension:
    -   Click “Load unpacked”
    -   Select the extension folder (not the whole project — only the extension folder)
    -   Click Select Folder
5.  Test the Extension:
    -   Open any website (e.g., Wikipedia).
    -   Click the extension icon in the toolbar
    -   Click Add Comment
    -   Click or select text on the page
    -   A sticky note should appear
    -   Click View Annotations to open the side panel.

## How Annotations Are Attached to Elements

When the user clicks **"Add Comment"**:

1.  The extension enters "Add Mode".
2.  The user can:
    -   Select text, or
    -   Click directly on any element (link, etc.).
3.  A DOM Range is created using:
    -   window.getSelection() for selected text
    -   caretRangeFromPoint() for click-based positioning
4.  The extension stores:
    -   XPath of the parent element
    -   Character offset inside the element
    -   Comment text
5.  On page reload, the extension:
    -   Locates the element using XPath
    -   Traverses text nodes
    -   Recalculates the exact character position
    -   Recreates the sticky note in the same location

------------------------------------------------------------------------

## How Positioning Is Handled (Scroll / Resize)

Sticky notes are positioned using:

-   `range.getBoundingClientRect()`

Position is calculated as:

-   `rect.bottom + window.scrollY`
-   `rect.left + window.scrollX`

To keep notes aligned during scroll and resize:

-   A scroll event listener updates position
-   A `resize` event listener updates position

------------------------------------------------------------------------

## How Style Isolation Is Achieved

To prevent style conflicts with the webpage:

-   A **Shadow DOM** root is created.
-   All annotation UI (sticky notes and side panel) is rendered inside
    the Shadow DOM.
-   This prevents:
    -   Website CSS from affecting annotation UI
    -   Annotation styles from affecting the webpage

------------------------------------------------------------------------

## One Performance Consideration

On restore, the extension traverses text nodes inside the target element
to find the correct character offset.

------------------------------------------------------------------------

## What I Would Improve With More Time

-   Replace XPath with a more robust selector strategy (CSS selector +
    text context).
-   Add throttling to scroll listeners for better performance.
-   Add edit/delete controls directly on sticky notes.
-   Improve UI design for better usability.

------------------------------------------------------------------------

## Tech Stack

-   Next.js (Popup UI)
-   TypeScript
-   Chrome Extension (Manifest V3)
-   Content Scripts
-   LocalStorage for persistence
