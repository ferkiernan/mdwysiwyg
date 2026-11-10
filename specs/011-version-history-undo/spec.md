# Feature Specification: Version History with Undo / Redo

**Feature Branch**: `011-version-history-undo`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "La idea es que se puedan deshacer o rehacer los cambios que uno va haciendo en el documento en la medida que lo edita. Luego de haber hecho cualquier cambio, y una 'inactividad' de 3 segs, se deberia guardar una nueva versión. Se habilita un icono nuevo, al final de todo (solo modo default) y que se pueda habilitar o deshabilitar por config 'history-undo, true o false'. Ese icono deberia ser como el adjunto (a clock with a counter-clockwise arrow). Habilitar una barra debajo, que tenga 4 botones '<- UNDO' y 'REDO ->' y luego 'Confirm' o 'Back to default'. Ademas deberia aparecer una barra a la izquierda, con un historial de versiones, y en la medida que apretamos undo y redo, ver a que horario pertenece el cambio."

**Correction (2026-11-09)**: "corrijo: el historial de versiones debe estar luego del boton html, no a la derecha con el boton de descarga. la barra lateral con el listado de 'horarios' de edicion, prefiero que este puesta a la derecha, no a la izquierda. El boton 'Back to default' deberia decir 'Cancel (back to last version)'. El listado de 'versiones' con horarios, al hacerle click a alguno, deberia poder posicionarse en esa version (y claro, cambiar al contenido correspondiente)."

## Clarifications

### Session 2026-11-09

- Q: Default value of the "history-undo" setting → A: Off by default (opt-in; host sets true to enable)
- Q: Keyboard shortcuts in history mode? → A: Ctrl/Cmd+Z = Undo, Ctrl/Cmd+Shift+Z / Ctrl+Y = Redo (version steps) only while history mode is open
- Correction: the history icon goes right after the HTML button (not at the far right next to Export); the version list is on the right side; the button formerly called "Back to default" is now "Cancel (back to last version)"; clicking a list entry jumps to that version.
- Q: When confirming an older version, what happens to newer versions? → A: They are kept; the confirmed content is appended as the newest version (history is never rewritten)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Versions are saved automatically while editing (Priority: P1)

While the user edits a document in the control, the control silently keeps a list of versions. After any change, once the user stops editing for 3 seconds, the content at that moment is saved as a new version with the time it was saved. Continuous typing never creates a version per keystroke: a version is created only after a pause. The very first version is the content the control had when it started recording.

**Why this priority**: Nothing else in the feature is useful without a reliable list of versions to move through.

**Independent Test**: Enable history, type a word, wait 3 seconds, type another word, wait 3 seconds → three versions exist (initial, after the first pause, after the second pause), each with its time; typing continuously for 10 seconds without a 3-second pause adds only one version after the final pause.

**Acceptance Scenarios**:

1. **Given** history is enabled and the control has just started, **When** nothing has been edited, **Then** exactly one version exists (the initial content).
2. **Given** history is enabled, **When** the user makes a change and then stays inactive for 3 seconds, **Then** a new version with the current content and the current time is saved.
3. **Given** the user keeps making changes with pauses shorter than 3 seconds, **When** they finally stop for 3 seconds, **Then** only one new version is saved (the final state), not one per change.
4. **Given** the content after a pause is identical to the latest version, **When** the pause ends, **Then** no new version is saved.
5. **Given** history is disabled, **When** the user edits, **Then** no versions are recorded and no history control appears.

---

### User Story 2 - Open history mode from a new icon (Priority: P1)

A new icon (a clock with a counter-clockwise arrow, like the attached image) appears in the toolbar right after the "insert HTML" button (not next to the right-aligned Export control), only in default mode and only when history is enabled by the host's setting "history-undo". Clicking it opens "history mode": a bar appears below the toolbar and a version list appears on the right side. Clicking the icon again, or using "Cancel (back to last version)", leaves history mode.

**Why this priority**: It is the entry point to the whole experience and where the host's setting takes effect.

**Independent Test**: With "history-undo" true in default mode, the icon sits right after the "insert HTML" button and before the Export control; clicking it shows the bar below and the version list on the right. With "history-undo" false (or compare mode, or read-only mode) the icon is absent.

**Acceptance Scenarios**:

1. **Given** default mode and "history-undo" true, **When** the toolbar renders, **Then** the history icon is placed immediately after the "insert HTML" button (Export stays alone at the right end), with an accessible name.
2. **Given** "history-undo" is false or not set, **When** the toolbar renders, **Then** no history icon is shown and no versions are recorded.
3. **Given** compare mode or read-only mode, **When** the toolbar renders, **Then** the history icon is not shown.
4. **Given** the icon is visible, **When** the user clicks it, **Then** history mode opens: a bar with "Undo", "Redo", "Confirm" and "Cancel (back to last version)" appears below the toolbar and a version list appears on the right.
5. **Given** history mode is open, **When** the user clicks the icon again, **Then** history mode closes without applying anything (same as "Cancel (back to last version)").
6. **Given** the user made a change less than 3 seconds ago, **When** they open history mode, **Then** that pending change is saved as a version first so it is not lost.
7. **Given** the host changes the "history-undo" setting while the control is mounted, **When** it turns false, **Then** the icon disappears, history mode closes without applying anything and recording stops; **When** it turns true, **Then** the icon appears and recording starts from the current content.

---

### User Story 3 - Undo and redo through versions with their times (Priority: P1)

In history mode, "Undo" moves to the previous version and "Redo" moves to the next one. The document shows the content of the version being viewed, and the version list on the right highlights that version, showing the time it belongs to. "Undo" is disabled at the first version and "Redo" at the latest. While browsing, the document is read-only.

**Why this priority**: This is the core user value: stepping back and forth through the editing history and knowing when each change was made.

**Independent Test**: With four saved versions, open history mode, click Undo twice → the document shows version 2 and the list highlights it with its time; click Redo once → version 3.

**Acceptance Scenarios**:

1. **Given** history mode opens, **When** it first renders, **Then** the latest version is the one being viewed and is highlighted in the list, and "Redo" is disabled.
2. **Given** several versions, **When** the user clicks "Undo", **Then** the document shows the previous version's content and the list highlights that version with its time.
3. **Given** the user has undone at least once, **When** they click "Redo", **Then** the document shows the next version and the highlight moves accordingly.
4. **Given** the first version is being viewed, **When** the bar renders, **Then** "Undo" is disabled; at the latest version "Redo" is disabled.
5. **Given** history mode is open, **When** the user tries to type, paste or format in the document, **Then** nothing changes.
6. **Given** history mode is open, **When** the user moves between versions, **Then** the host's change notification is not called (nothing is applied yet).
7. **Given** each version in the list, **When** it is shown, **Then** it displays the local time it was saved (hours, minutes and seconds) and the current one is visually and programmatically identifiable.
8. **Given** history mode is open, **When** the user presses Ctrl/Cmd+Z or Ctrl/Cmd+Shift+Z (Ctrl+Y), **Then** it behaves like "Undo" / "Redo" respectively; outside history mode those shortcuts edit text as before.

---

### User Story 4 - Confirm a version or go back to the default state (Priority: P1)

From history mode the user can **Confirm** the version being viewed: it becomes the document content and history mode closes. Or they can choose **Cancel (back to last version)**: history mode closes and the document returns to exactly the content it had when history mode was opened (which is the latest saved version, since opening saves any pending change), discarding the browsing.

**Why this priority**: Without a way to commit or abandon the browsing, the history would be view-only.

**Independent Test**: Undo twice and click Confirm → the document keeps the older content, the host is notified of the change, history mode closes. Undo twice and click Cancel (back to last version) → the document shows the content it had before opening history mode and no change is notified.

**Acceptance Scenarios**:

1. **Given** the user is viewing an older version, **When** they click "Confirm", **Then** the document content becomes that version, the host's change notification receives its Markdown, history mode closes and editing is enabled again.
2. **Given** the user is viewing the latest version (no undo done), **When** they click "Confirm", **Then** history mode closes, the content is unchanged and no change notification is sent.
3. **Given** the user browsed to another version, **When** they click "Cancel (back to last version)", **Then** the document returns to the content it had when history mode opened, no change notification is sent and history mode closes.
4. **Given** the user confirmed an older version, **When** the control returns to editing, **Then** that confirmed content is recorded as the newest version so the history is not rewritten (versions after it are kept and it is added at the end), and the user can open history mode again and go forward or back.
5. **Given** the user confirms or goes back, **When** history mode closes, **Then** the bar below the toolbar and the version list disappear and focus returns to the document.

---

### User Story 5 - Browse and jump through the version list on the right (Priority: P1)

The right-hand side list shows all saved versions, newest at the top, each with its saved time, and keeps the version being viewed in sight (scrolls to it) as the user undoes and redoes. Clicking (or pressing Enter/Space on) an entry positions the history on that version and shows its content directly, without stepping with Undo/Redo.

**Why this priority**: It makes the "which time does this change belong to" requirement easy to read at a glance and lets the user reach a distant version in one step instead of many Undo presses.

**Independent Test**: With many versions, undoing repeatedly keeps the highlighted entry visible inside the list; clicking the entry of the 3rd version shows that version's content and highlights it, and Undo/Redo continue from there.

**Acceptance Scenarios**:

1. **Given** many versions, **When** the user undoes or redoes, **Then** the highlighted entry stays visible in the list.
2. **Given** the list, **When** a new version is saved while history mode is closed, **Then** it appears in the list the next time history mode is opened.
3. **Given** the list is open, **When** the list is long, **Then** it scrolls independently from the document.
4. **Given** history mode is open, **When** the user clicks an entry (or activates it with the keyboard), **Then** that version becomes the viewed one: the document shows its content, the entry is highlighted, Undo/Redo availability updates, and the change notification is not called.
5. **Given** the user clicked an entry, **When** they press Undo or Redo, **Then** they move one version from that position.
6. **Given** the entry already being viewed, **When** the user clicks it, **Then** nothing changes.
7. **Given** the user clicked an older entry, **When** they press Confirm or Cancel (back to last version), **Then** Confirm keeps that version and Cancel restores the content from before history mode opened.

---

### Edge Cases

- No edits yet: the list has a single version; Undo and Redo are both disabled; Confirm and Cancel (back to last version) just close history mode.
- Very long editing sessions: the number of kept versions is bounded; when the limit is reached the oldest versions are dropped.
- The user edits, then immediately opens history mode: the pending change is flushed into a version first (see US2).
- The user edits the document and the content becomes equal to the latest version before the pause ends: no new version is saved.
- Switching between rendered and Markdown views does not create versions by itself; edits in either view count as changes.
- The host replaces the content through the imperative API (`setMarkdown`, `insertMarkdown`, `reset`): these count as changes and are versioned after the usual pause.
- The host calls `setMarkdown`, `insertMarkdown` or `reset` while history mode is open: history mode closes first without applying anything (the document returns to its pre-history content) and then the call is applied normally.
- Compare mode starts while history mode is open: history mode closes without applying anything; versions are not recorded while compare mode is active.
- Read-only mode (`onlyView`): no icon, no recording.
- The toolbar is hidden by the host while history mode is open: history mode closes without applying anything.
- The control is unmounted and mounted again: the history starts over (not persisted).
- Two versions saved within the same second: both are listed (time shows seconds; order is by creation).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The control MUST accept a host setting "history-undo" (true/false) that enables or disables the whole feature (recording, icon, history mode); the host can change it at any time.
- **FR-002**: When enabled, the control MUST record the content as a version after the user has made a change and then been inactive for 3 seconds; a burst of changes with pauses shorter than 3 seconds MUST produce a single version.
- **FR-003**: The first version MUST be the content the control had when recording started; a version identical to the latest one MUST NOT be created.
- **FR-004**: Each version MUST store its content and the time it was saved.
- **FR-005**: The number of stored versions MUST be bounded; when the limit is exceeded the oldest versions are discarded.
- **FR-006**: A history icon (a clock with a counter-clockwise arrow) MUST be placed in the toolbar immediately after the "insert HTML" button (the Export control stays separate at the right end), shown only in default mode with history enabled and not in read-only mode.
- **FR-007**: The history icon MUST have an accessible name, expose whether history mode is open, and be keyboard-operable.
- **FR-008**: Clicking the icon MUST open history mode (if closed) or close it without applying anything (if open); opening it MUST first save any pending change as a version.
- **FR-009**: In history mode a bar MUST appear directly below the toolbar with four buttons: "Undo" (with a left arrow), "Redo" (with a right arrow), "Confirm" and "Cancel (back to last version)".
- **FR-010**: In history mode a version list MUST appear on the right side, showing every version with its saved time and highlighting the version being viewed.
- **FR-011**: "Undo" MUST show the previous version and "Redo" the next one, updating the document and the highlighted entry; "Undo" MUST be disabled at the first version and "Redo" at the latest.
- **FR-012**: While history mode is open the document MUST be read-only, and moving between versions MUST NOT notify the host's change notification.
- **FR-013**: "Confirm" MUST make the viewed version the document content, notify the host with its Markdown (only if it differs from the content when history mode opened), close history mode and re-enable editing; the confirmed content MUST be recorded as the newest version when it differs from the latest one.
- **FR-014**: "Cancel (back to last version)" MUST restore the exact content the document had when history mode opened, send no change notification and close history mode.
- **FR-022**: Each entry of the version list MUST be operable with the pointer and the keyboard; activating it MUST make that version the viewed one (content, highlight and Undo/Redo limits updated) without notifying the host's change notification; activating the already-viewed entry MUST do nothing.
- **FR-015**: The version list MUST keep the viewed version visible as the user undoes and redoes, and MUST scroll independently from the document when long.
- **FR-016**: When the setting is not provided it MUST be treated as false (disabled by default). With history disabled, the control MUST behave exactly as it did before this feature: no icon, no recording, no extra bars (no regression for existing consumers).
- **FR-017**: History mode MUST close without applying anything when the host disables the setting, enables compare mode, enables read-only mode, or hides the toolbar.
- **FR-018**: History mode MUST work in both the rendered and the Markdown views (the version content is shown in the current view) and the view toggle MUST remain available.
- **FR-019**: The history bar, the version list and the icon MUST be keyboard-operable and labelled for assistive technology; the viewed version MUST be identifiable by something other than color, and the document MUST be announced as read-only while browsing.
- **FR-020**: The new setting, behavior, labels and limits MUST be documented (purpose, type, default, examples, edge cases).
- **FR-021**: While history mode is open, Ctrl/Cmd+Z MUST act as "Undo" and Ctrl/Cmd+Shift+Z or Ctrl+Y as "Redo" (version steps, same disabled limits as the buttons); outside history mode these shortcuts keep their normal text-editing behavior.

### Key Entities

- **Version**: a saved snapshot of the document content with the time it was saved and its position in the history.
- **History**: the ordered list of versions recorded while the control is mounted; bounded in size.
- **History mode**: a temporary state in which the user browses versions (document read-only) and then confirms one or returns to the default state.
- **Viewed version**: the version whose content the document shows while in history mode.
- **History bar**: the second bar with Undo, Redo, Confirm and Cancel (back to last version).
- **Version list**: the right-hand panel with each version's saved time; entries can be activated to jump to that version.
- **history-undo setting**: the host's on/off switch for the whole feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of cases, after a change followed by 3 seconds of inactivity exactly one new version is saved, and a continuous editing burst with gaps under 3 seconds produces exactly one version.
- **SC-002**: A user can go back to any earlier version and confirm it in at most 3 interactions after opening history mode for a 5-step-old version (open icon, Undo ×N, Confirm), with each Undo/Redo reflected in the document within 200 ms for documents up to 5,000 words.
- **SC-003**: In 100% of attempts, the document cannot be modified while history mode is open.
- **SC-004**: "Cancel (back to last version)" restores the pre-history content exactly (byte-for-byte) in 100% of cases and sends no change notification.
- **SC-005**: "Confirm" notifies the host exactly once with the confirmed version's Markdown when it differs from the content at entry, and zero times otherwise.
- **SC-006**: With the setting false or omitted, there are 0 visible changes versus the control before this feature and all pre-existing tests keep passing.
- **SC-007**: A user can tell which time the viewed version belongs to without moving the pointer, in under 5 seconds, at any position in a list of 50 versions.
- **SC-008**: Memory use stays bounded: after 1,000 saved changes the history holds no more than the configured maximum number of versions.

## Assumptions

- The setting is off by default (opt-in, see Clarifications) so existing consumers see no change; the host turns it on with "history-undo" set to true. The exact property name follows the existing naming style and is decided at planning.
- The inactivity time of 3 seconds is fixed (not configurable) in this version.
- The history lives only in memory for the lifetime of the mounted control; it is not persisted and not exposed to the host.
- The maximum number of versions is a fixed internal limit (a few hundred); the exact number is decided at planning.
- Versions are whole-document snapshots of the Markdown content; they are compared as text to avoid duplicates.
- Button texts are used as the user wrote them ("Undo" with a left arrow, "Redo" with a right arrow, "Confirm", "Cancel (back to last version)"), even though the rest of the control's UI is in Spanish; the labels of the new icon and list are in Spanish for consistency with the control (accessible name "Historial de versiones").
- Times are shown in the user's local time with hours, minutes and seconds.
- The native undo/redo of the editor (keyboard shortcuts) keeps working as today and is independent from this version history.
- Naming versions, comparing versions and persisting history are out of scope; navigation is by Undo / Redo or by activating an entry of the list.
- The history icon follows the toolbar visibility setting (feature 009): when the host hides the bars, the icon, the history bar and the list are hidden too.
- Compare mode (feature 010) and history mode are mutually exclusive; recording happens only in default mode.
