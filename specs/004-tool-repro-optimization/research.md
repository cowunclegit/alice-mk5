# Research: High-Reproducibility Tool Execution

## Decision: Data Lineage Tracking
- **Decision**: Implement a `LineageTracker` utility that wraps `dataStore` updates. Each entry will be stored as an object: `{ value: any, taskId: string, type: 'input' | 'output' }`.
- **Rationale**: To automate templatization (FR-012), the system must know which values in a Robot script correspond to inputs from previous tasks or user intents. Tracking the "task lineage" allows the post-processor to replace literal values with `{{task_id.key}}` placeholders.
- **Alternatives considered**: LLM-based parsing of scripts (rejected due to hallucination risk and token cost).

## Decision: Environment Metadata Capture
- **Decision**: Capture OS using `process.platform`, Node version using `process.version`, and Screen Resolution using Robot Framework's `Get Window Size` keyword during the final step of the exploration phase.
- **Rationale**: Automation is highly environment-dependent. Validating these ensures that "Fixed Plan" replay (FR-015) isn't attempted in a mismatched environment that would lead to non-reproducible failures.
- **Alternatives considered**: Only capturing OS (rejected; resolution is critical for coordinate-based app automation).

## Decision: Tool Catalog & Manifest Structure
- **Decision**: Centralized `catalog.json` for indexing and per-tool `manifest.json` for detailed variable/path mapping.
- **Rationale**: Balancing speed (index for discovery) and data integrity (detailed manifests for validation).
- **Alternatives considered**: Scanning all tool directories on every request (rejected; slow as the number of tools grows).

## Decision: Replay Control Flow
- **Decision**: Use a dedicated `reproGraph` (a subset of `managerGraph`) that contains only `START -> Fixed_Step_Executor -> END`.
- **Rationale**: Ensures deterministic performance (SC-001) by removing all branching and reasoning overhead from the replay cycle.
- **Alternatives considered**: Adding conditional logic to the existing graph (rejected; adds complexity and overhead).
