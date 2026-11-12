# Research: Auto-Height

1. **Root sizing**: `style={{ width, minHeight: height, height: "auto" }}` when on. Rationale: the configured height is the
   floor (FR-006); `auto` lets the column flex container grow downward (FR-004). Alternative: measuring and setting a pixel
   height in JS — needless, CSS already sizes to content.
2. **Content areas**: `.autoHeight .content`, `.panesCompare`, `.historyLayoutOpen` → `flex: 1 0 auto` (fill the minimum, never
   shrink below content). Inner scroll disappears because the box is as tall as its content; `overflow-x` stays `auto` for wide
   tables/code (FR-016). Side-by-side compare: row height = taller pane (FR-009); up-and-down: column of both panes.
3. **Textareas**: textareas do not grow with their value. `MarkdownSourceView` gets `autoSize`: in a layout effect on value
   change set `height: auto` then `height = scrollHeight + "px"`; a `ResizeObserver` re-runs it on width changes (re-wrap,
   FR-014). Same for the original pane textarea. CSS `field-sizing: content` rejected (not supported in all target browsers).
4. **Version list**: `contain: size` so a long list does not make the control taller; it stretches to the row and scrolls.
5. **Floating panels**: portaled/absolute, outside the flow — no effect on height (FR-013).
6. **Resize handle**: `.resizable` not applied while on (FR-011).
