# CV & Cover Letter Project Guidelines

* **Tailwind & Print Styles:** Always include print-specific utility classes (`@media print` or `print:*`) when modifying layout or preview components to ensure visual consistency between UI preview and generated PDFs.
* **Dual Document Support:** Ensure any layout or UI updates account for both **Resume (CV)** and **Cover Letter** document types and their respective schemas.
* **Text Formatting & Custom Tags:** Always process rich text strings through `processInHtml()` from `tagProcessorService.ts` before rendering (to support `<BOLD>`, `<ITALIC>`, `<UNDERLINE>`, `<HIGHLIGHT>`, and `<STRIKETHROUGH>`). Never inject raw HTML directly into component templates without tag sanitization/parsing.
* **Component Splitting & Data Abstraction:** Keep data structures isolated in structural files within `src/app/data/` (e.g., `PersonalData.ts`, `ProjectData.ts`, `CoverLetterData.ts`) and delegate pure rendering to UI components.
* **Internationalization (i18n):** Never hardcode text strings inside React components. Always retrieve strings dynamically using the translation dictionary keys (`TranslationsData.ts`).
* **Docker Workspace Context:** The project isolates the client interface inside `/frontend` and the PDF engine inside `/backend`. Ensure network endpoints, file paths, and Docker volume mounts remain aligned across services.
* **User Feedback & State:** Always handle API PDF export states asynchronously, providing real-time feedback notifications (success or failure) to the end user.
