# Research: Web Resource Management Agent

## Robot Framework Resource Modification

**Decision**: Use `fs/promises` for atomic writes and a state-aware string parser for updates.

**Rationale**: Since `.resource` files are plain text with specific indentation (4 spaces or tabs), a custom parser can accurately identify keyword headers and their blocks. Using a dedicated library might introduce unnecessary complexity given the constitutional mandate for simplicity.

**Alternatives considered**: 
- **Sed/Awk**: Rejected due to poor portability across OS (macOS vs Linux).
- **Robot Framework API (Python)**: Rejected to keep the core logic in JavaScript as per the Constitution.

---

## AXTree to Selector Mapping

**Decision**: Reuse and extend the existing `AnalysisService` in `src/services/analysis_service.js`.

**Rationale**: The project already has a working implementation for converting raw AXTree JSON into flattened candidates with technical selectors (`_buildSelector`). This ensures consistency between the Web Agent's "eyes" and the Manager Agent's "tool creation".

**Alternatives considered**: 
- **Cheerio-only**: Rejected because AXTree provides higher semantic stability than raw HTML structure.

---

## Manifest Integrity (Active Reconciliation)

**Decision**: Implement a "Startup Sync" pattern in the `ManifestService`.

**Rationale**: By scanning the `src/robots/resources/web/` directory on every agent instantiation, the system can automatically prune dead links and add untracked files. This provides the "Active Reconcile" behavior chosen during clarification.

**Alternatives considered**: 
- **Git Hooks**: Rejected as it assumes all modifications happen via Git, which may not be true for dynamic runtime updates.

---

## Best Practices: Robot Keyword Naming

**Decision**: Follow the "Action + Service + Target" pattern (e.g., `Search Naver News`).

**Rationale**: This matches the existing naming convention in `naver.resource` and provides clear context for LLMs when they browse the available tools.
