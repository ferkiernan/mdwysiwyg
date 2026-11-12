# Research: Auto-Hide Toolbar on Focus Loss

1. **Focus inside, including portals**: React synthetic `onFocus`/`onBlur` bubble along the React tree, so focus inside a
   `createPortal` panel (menus, dialogs, link popover) reaches the root's handlers. DOM `focusin` on the root would miss them.
2. **No flicker**: `blur` → `setTimeout(…, 0)` to mark outside; `focus` → clear the timer and mark inside. A move between two
   inner elements fires blur then focus in the same task, so the timer is cancelled (FR-006). Window switch: blur with no
   following focus → hides; returning fires focus again → shows.
3. **Hidden = unmounted**: reusing the `showToolbar` path (unmount) guarantees no invisible tab stops and no announcements
   (FR-007). `ToolbarSlot` only moves focus to the editor if the focus was *inside* the bar at unmount; with auto-hide the bar
   unmounts after the focus already left, so the page focus order is untouched (FR-008).
4. **Initial state**: layout effect checks `root.contains(document.activeElement)`.
5. **Scope**: only the main toolbar; compare/history bars keep `showToolbar` conditions (Assumption, FR-011).
6. **Alternatives**: `:focus-within` CSS (cannot see portals; `display:none` toggling would still need care for focus);
   pointer hover (rejected in spec).
