# Feature Specification: Self-Documented API, Complete Documentation and Clear CSS Customization

**Feature Branch**: `015-docs-api-theming`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Por las dudas aclaro que quiero que los atributos del control, esten autodocumentados en el código para quien lo implemente. ademas actualizar toda la documentación. También tiene que estár muy claro como implementar otros css para el control."

## Clarifications

### Session 2026-11-12

- Q: Where can the host declare customization values? → A: On the control's own class **and on any ancestor** (page root, a wrapper); the control's built-in defaults become fallbacks so the host's values always win, with the default appearance unchanged. A global theme is declared once, without repeating a class on every control
- Q: Scope of the customization points? → A: Document the existing ones **and add** customization points for the fixed visual values a realistic theme needs (code highlighting, quotes, menus and popovers, compare and history bars, version list), with defaults identical to today's appearance
- Q: Language of the customization guide and of the code descriptions? → A: Each document keeps its current language: code descriptions and the customization guide in Spanish (with the component guide), root overview and assistant guide in English; the root overview links to the guide
- Q: Where and how strictly are the documentation checks applied? → A: They only warn: the checks report each missing or inconsistent item clearly (what is missing, where) but never fail the tests or block publishing; the release review confirms that 0 warnings remain
- Q: How is "very clear how to apply CSS" validated? → A: Through verifiable criteria only: every recipe in the guide must work when copied unchanged (verified in the demo application and in tests, at the three declaration levels and both stylesheet load orders), plus SC-004/SC-008; no test with external developers is required and none is a release gate

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every setting explains itself where the developer writes code (Priority: P1)

A developer who embeds the control reads its settings straight from their editor: hovering a setting, autocompleting it or jumping to its definition shows what it does, which values it accepts, its default, whether it can change while the control is mounted, and how it interacts with other settings. They do not need to open a separate document to use a setting correctly. This covers all the control's settings, notifications, the methods exposed through a reference, and the exported types, including the settings added by the two features before this one (automatic height and automatic hiding of the toolbar).

**Why this priority**: This is the first explicit request: the control's attributes must be self-documented in the code for whoever implements it.

**Independent Test**: In an editor with a project that depends on the published package, open every setting of the control: each one shows a description with its default and its behavior notes, with no setting left undocumented.

**Acceptance Scenarios**:

1. **Given** a developer uses the control in their project, **When** they hover or autocomplete any setting, **Then** a description appears stating purpose, accepted values, default value and whether it can change at runtime.
2. **Given** a setting depends on or overrides another (for example `onlyView` vs. the toolbar settings, compare mode needing its companions, the height settings), **When** the developer reads its description, **Then** the relationship and which one wins are stated.
3. **Given** a callback or an exposed method, **When** the developer reads its description, **Then** it states when it is called / what it does, what it receives or returns and whether it notifies the host's change callback.
4. **Given** a minimal usage example is useful for a setting (a mode, a callback, the image resolver), **When** the developer reads its description, **Then** a short usage example is included.
5. **Given** the published package, **When** it is installed, **Then** the descriptions are present in what the developer's editor reads (not only in the repository's source).
6. **Given** a new setting is added to the control in the future, **When** it has no description or no stated default, **Then** the project's checks report a warning naming it, so it is visible before release.

---

### User Story 2 - All documentation is complete, current and consistent (Priority: P1)

Every place where the control is documented describes the control as it really is today: the overview, the detailed component guide, the guide for AI assistants, the change log, the demo application and the specifications. A developer or an assistant reading any of them finds the same list of settings, the same defaults and the same behavior.

**Why this priority**: This is the second explicit request ("update all the documentation"). Outdated or contradictory documentation is as harmful as none.

**Independent Test**: List the settings from the control's definition and check each document: every setting appears in every document that lists settings, with the right default and a correct description; no statement describes behavior that no longer exists.

**Acceptance Scenarios**:

1. **Given** the control's list of settings, **When** the overview, the component guide and the assistant guide are checked, **Then** each lists every setting with its correct default and none lists a setting that does not exist.
2. **Given** features were added in recent releases (toolbar visibility, compare mode, version history, scroll synchronization, automatic height, automatic hiding of the toolbar), **When** the documents are read, **Then** each feature is described in each document that covers features, including its limits and its interactions.
3. **Given** a statement in a document that was true in the past (for example a listed limit that no longer applies), **When** the documents are reviewed, **Then** it is corrected or removed.
4. **Given** the change log, **When** it is read, **Then** every user-visible change of the unreleased work is listed under its release with the right wording.
5. **Given** the demo application, **When** it is opened, **Then** it lets the developer try every setting of the control (a control for each) and shows how to apply a custom look.
6. **Given** one document is in English and another in Spanish today, **When** the documents are updated, **Then** each keeps its language and the terminology (names of settings, modes, bars) is the same across them.
7. **Given** the documents are changed, **When** the project's checks run, **Then** a check reports a warning for each setting missing from the documents (or listed but nonexistent), so drift is visible instead of silent.

---

### User Story 3 - It is very clear how to give the control another look with CSS (Priority: P1)

A developer who wants the control to match their product (dark theme, brand colors, a different font, a different toolbar) finds a dedicated, complete guide that tells them exactly what to write and where, with ready-to-copy examples. They can restyle the control with a few lines of ordinary CSS, in any order of loading their stylesheets, without hacks, and without guessing which names exist.

**Why this priority**: This is the third explicit request ("it must be very clear how to implement other CSS for the control"). Today the customization points exist but the instructions are spread out and incomplete.

**Independent Test**: Copy each recipe of the guide (dark theme, brand color, fonts, flat toolbar, background, light/dark switch) unchanged into a page with the control, declared on the class, on a wrapper and on the page root, with the stylesheets loaded in both orders: each produces the look the guide describes, with no extra steps.

**Acceptance Scenarios**:

1. **Given** the guide, **When** a developer looks for what can be customized, **Then** they find one complete list of all customization points (every themable value, its default, what it affects and where it shows), grouped by area (toolbar, content, tables and code, diagrams, comparison, history, scroll, general colors).
2. **Given** the guide, **When** a developer wants to restyle one control, all controls inside a section or all controls of the page, **Then** it shows where to declare the values for each case (on the class given to that control; on a wrapper element for the controls inside it; on the page root for every control) with a copy-paste example for each.
3. **Given** the developer's stylesheet is loaded before or after the control's stylesheet, **When** they declare the customization values with one ordinary selector (on the control's class or on any ancestor), **Then** they take effect in both cases without `!important` and without raising selector specificity.
4. **Given** values are declared both on an ancestor and on a control's own class, **When** the control is shown, **Then** the control's own class wins over the ancestor, which wins over the built-in defaults, and the guide states this order.
5. **Given** the guide, **When** a developer wants common looks, **Then** it includes ready recipes (covering the whole control, including code highlighting, quotes, menus, popovers, the compare and history bars and the version list): dark theme, brand color, different fonts, flat (non-gradient) toolbar, tinted content background, and a page-level light/dark switch.
6. **Given** a realistic dark theme is built using only the customization points, **When** every part of the control is shown (content, code, tables, quotes, toolbar, menus, popovers, dialogs, compare bar, history bar and version list), **Then** no part remains in light-theme colors.
7. **Given** the guide, **When** a developer wonders whether they can target the control's internal elements with their own selectors, **Then** it states plainly what is supported (the documented customization points and the class setting) and what is not (internal element names, which are not stable), and what to do when a need is not covered.
8. **Given** the guide, **When** a customization "does not work", **Then** a troubleshooting section lists the usual causes (class not applied to the right element, stylesheet of the control not imported, a value overridden by a more specific rule, invalid value) and how to check each in the browser's developer tools.
9. **Given** the demo application, **When** it is opened, **Then** a live theme panel shows the customization points being changed and the resulting CSS can be copied.
10. **Given** a customization point exists in the control, **When** it is not in the guide's list (or the guide lists one that does not exist), **Then** the project's checks report a warning naming it.

---

### User Story 4 - The documentation is where the developer looks (Priority: P2)

Developers and AI assistants reach the right information from the place they start: the package page, the repository overview, their editor and the assistant guide. Each entry point links to the others, and a short "getting started" path takes a new developer from installation to a working, restyled control.

**Why this priority**: Complete documentation is of little use if it cannot be found; this ties the previous stories together.

**Independent Test**: Starting from the package page only, a new developer reaches installation, the list of settings, the theming guide and the demo in at most two steps each.

**Acceptance Scenarios**:

1. **Given** the package page or the repository overview, **When** a developer looks for the settings or the theming guide, **Then** a direct link or a section leads there.
2. **Given** a setting's description in the editor, **When** the developer wants more, **Then** it names the section of the guide that expands it.
3. **Given** an AI assistant is given the assistant guide, **When** it is asked to restyle or configure the control, **Then** the guide contains enough, in one place, for it to do so correctly.
4. **Given** a new developer, **When** they follow the "getting started" path, **Then** they reach a working control with a custom look without reading source code.

---

### Edge Cases

- A setting that only matters in combination with others (compare mode needs its orientation and content settings): its description and the guide state the required companions and what happens when one is missing.
- A setting that must be given at mount time and cannot change later (the image resolver): stated explicitly.
- Settings that were renamed or removed in the past: the change log states it; the documents do not mention names that no longer exist.
- Documents describing behavior in two languages: the meaning is identical.
- Customization values left unset: the documented default applies; the guide states that unset values keep the default.
- A newly added customization point left unset: the control looks exactly as before (its default is today's value).
- A value declared on an ancestor that is itself invalid or empty: the control falls back to its built-in default for that value; the guide says so.
- A control nested inside another themed area (a wrapper inside the page root): the closest declaration wins, as in ordinary CSS inheritance.
- A control rendered inside an isolated subtree that does not inherit custom properties from the page (for example an embedded frame or a shadow root): the guide states that the values must be declared inside that subtree.
- A host uses a different CSS strategy (CSS-in-JS, utility classes, a design-system layer): the guide's mechanism (declaring values on a class) works with any of them; a short note shows the usage with the most common ones.
- Dark mode driven by the user's operating-system preference: the guide shows how to follow it.
- Print styles and high-contrast / forced-colors modes: the guide states what is and is not customized there.
- Values with a wrong type or unit: the guide states accepted value types per customization point.

## Requirements *(mandatory)*

### Functional Requirements

#### Self-documented API (code)

- **FR-001**: Every setting of the control MUST have a description visible in the developer's editor stating: purpose, accepted values (including the allowed options of enumerated values), default value, and whether it can change while the control is mounted.
- **FR-002**: A description MUST state the relationship with other settings when one exists (dependency, precedence, mutual exclusion), including the settings added by the automatic-height and the automatic-toolbar-hiding features.
- **FR-003**: Every callback MUST state when it is called, what it receives, and whether it is related to the host's change notification; every method exposed through a reference MUST state what it does, what it returns and whether it triggers the change notification.
- **FR-004**: Every exported type, option and result shape MUST have a description of its meaning and of each of its fields.
- **FR-005**: Settings whose use is not obvious (modes, callbacks, the image resolver, compare and history settings) MUST include a short usage example in their description.
- **FR-006**: The descriptions MUST be part of what is published with the package, so they are available in the developer's editor from an installed copy.
- **FR-007**: The project's automated checks MUST report a warning, naming the item, when a setting, callback, method or exported type lacks a description or (for settings) a stated default, so that an undocumented setting is visible before release. The warnings MUST NOT make the tests or the build fail and MUST NOT block publishing.
- **FR-008**: Setting descriptions MUST use the same names and terms as the documents (settings, modes, bars, panes) and be written in the same language as the rest of the code documentation.

#### Complete documentation

- **FR-009**: The overview, the component guide, the assistant guide, the change log and the demo application MUST each be reviewed and brought up to date with the control as it exists at the end of this work, including all features released or unreleased up to that point.
- **FR-010**: Each document that lists settings MUST list all of them with correct defaults and correct descriptions, and MUST NOT mention settings, behaviors or limits that no longer exist.
- **FR-011**: Each feature (toolbar visibility, compare mode, version history, scroll synchronization, automatic height, automatic toolbar hiding) MUST be described in every document that covers features, with its behavior, limits and interactions with other settings.
- **FR-012**: The change log MUST list every user-visible change of the work up to this release under the right release heading, including the new settings and the documentation / customization improvements of this feature.
- **FR-013**: The demo application MUST offer a control for every setting of the control and MUST show the effect of each, and MUST include the live theme panel described under customization.
- **FR-014**: The documents MUST keep their current language each, and MUST use consistent terminology for the same concept across all of them.
- **FR-015**: The project's automated checks MUST report a warning, naming the setting and the document, when a setting of the control is missing from a document that lists settings, or a document lists a setting that does not exist. These warnings are non-blocking, like those of FR-007.

#### Customization with CSS

- **FR-016**: The documentation MUST contain a dedicated customization guide with one complete list of every customization point (name, accepted value types, default, what it affects), grouped by area, including the general color values the control's own defaults are built on and the points added by FR-025.
- **FR-017**: The guide MUST explain, with a copy-paste example each, how to customize a single control (through the class setting), all controls inside a section (on a wrapper element) and every control on the page (on the page root, declared once), and how to follow the user's light/dark preference.
- **FR-018**: Customization values declared by the host with a single ordinary selector, **on the control's own class or on any ancestor** (a wrapper, the page root), MUST take effect regardless of whether the host's stylesheet is loaded before or after the control's stylesheet, without `!important` and without extra specificity. The control's built-in defaults MUST act only as fallbacks (they are restructured so that this holds), without changing the control's default appearance. When values are declared at several levels, the control's own class MUST win over an ancestor, which MUST win over the built-in defaults.
- **FR-019**: The guide MUST include ready recipes for at least: dark theme, brand color, different fonts, flat toolbar, tinted or image content background and a page-level light/dark switch, each verified to work.
- **FR-020**: The guide MUST state what is supported for customization (the listed customization points and the class setting) and what is not (the control's internal element names, which are not a stable interface), and what to do when a need is not covered.
- **FR-021**: The guide MUST include a troubleshooting section with the usual causes of a customization not applying and how to diagnose each with the browser's developer tools.
- **FR-022**: The guide MUST state the requirement to import the control's stylesheet, how the customization behaves with common CSS strategies (plain CSS files, CSS-in-JS, utility classes, a design-system layer) and what happens in print and forced-colors modes.
- **FR-023**: Every customization point MUST be listed in the guide and every listed point MUST exist; the project's automated checks MUST report a non-blocking warning otherwise (FR-015 applies to this guide as well).
- **FR-024**: The demo application's theme panel MUST let the developer change the customization points live, pick presets, and copy the resulting CSS.

#### Discoverability

- **FR-025**: Every fixed visual value that a realistic theme needs to change — the colors of text, backgrounds and borders of code highlighting, quotes, menus, popovers, dialogs, the compare bar, the history bar and the version list, and the accent color — MUST be a customization point (named in the same style as the existing ones), with a default identical to today's appearance. After this, a dark theme can be built using customization points only, with no part of the control left in light-theme colors. Points that no theme needs (spacing, geometry, structural layout) stay out of scope.
- **FR-026**: The package page and the repository overview MUST link directly to the settings reference, the customization guide and the demo; setting descriptions MUST name the guide section that expands them.
- **FR-027**: A short "getting started" path MUST take a new developer from installation to a working control with a custom look, using only the documentation.
- **FR-028**: This feature MUST NOT change the control's behavior or default appearance (the restructuring of FR-018 and the new points of FR-025 keep today's appearance by default), and MUST NOT remove or rename any existing setting or customization point.

### Key Entities

- **Setting**: a configurable attribute of the control (including callbacks and the methods exposed through a reference), with its description, accepted values, default, runtime-change behavior and relationships.
- **Customization point**: a documented value the host can override with CSS to change the control's look.
- **Customization guide**: the single document that lists all customization points, the recipes, the supported/unsupported boundary and the troubleshooting.
- **Documentation set**: the overview, the component guide, the assistant guide, the change log, the demo application and the specifications that describe the control.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the control's settings, callbacks, exposed methods and exported types have a description with, for settings, a stated default (0 undocumented items), reported by an automated check whose output has 0 warnings at release.
- **SC-002**: 100% of the settings appear, with the correct default, in every document that lists settings, and 0 listed settings are nonexistent, reported by an automated check whose output has 0 warnings at release.
- **SC-003**: 100% of the customization points appear in the guide and 0 listed points are nonexistent, reported by an automated check whose output has 0 warnings at release.
- **SC-004**: Customization values declared with a single ordinary selector take effect in 100% of tested cases — on the control's class, on a wrapper or on the page root, and whether the host stylesheet is loaded before or after the control's stylesheet — with 0 uses of `!important`.
- **SC-005**: A new developer reaches installation, the settings reference, the customization guide and the demo from the package page in at most 2 steps each.
- **SC-006**: With the work applied, 0 changes in the control's runtime behavior and 0 visible changes in its default appearance: all previously existing tests keep passing.
- **SC-007**: Every statement in the documentation set that describes behavior can be traced to the current behavior of the control (0 outdated statements found in the review of the documents listed in FR-009).
- **SC-008**: In a realistic dark theme built using only customization points, 0 visible parts of the control remain in light-theme colors, checked across the content, code, tables, quotes, toolbar, menus, popovers, dialogs, compare bar, history bar and version list.

## Assumptions

- This feature is cross-cutting: it applies to all settings, including the automatic-height (013) and automatic-toolbar-hiding (014) settings, which also carry their own documentation requirements; this feature completes and verifies the whole set and is meant to be delivered after them.
- The language of each existing document is kept (overview in English, component guide and code descriptions in Spanish, assistant guide in English); the customization guide follows the language of the component guide (Spanish), with the overview linking to it. No bilingual duplication is made (confirmed in Clarifications).
- The customization mechanism stays CSS custom properties (declared on the control's class or on any ancestor, see Clarifications); no new settings are added for styling, but new customization points are added for the fixed visual values a theme needs (FR-025): planning inventories the fixed values in the stylesheet and decides the final list and names (same `--mdw-*` style), keeping today's values as defaults. A pointer to additional customization needs that are not covered is provided through the project's issue tracker.
- The control's internal element names are intentionally not a public interface (they are generated and can change); making them stable is out of scope.
- The demo application already has a theme panel; this feature completes it (all customization points, copy of the resulting CSS) rather than building a new one.
- Automated checks run with the project's existing test and quality commands; no new tooling dependency is added. They only warn (non-blocking, see Clarifications), so the release review (the person publishing) confirms the check output has 0 warnings before publishing.
- Restructuring the control's defaults as fallbacks (FR-018) is a required, appearance-neutral code change; planning decides how and verifies it by testing both stylesheet load orders and all three declaration levels.
