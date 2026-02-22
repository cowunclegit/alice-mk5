# Research: Robot Framework Resource Management

## Decision: Robot Framework Syntax Parsing
- **Decision**: Use a regex-based `RobotParser` utility instead of a full AST parser for the initial implementation.
- **Rationale**: Robot Framework syntax is line-oriented and predictable for keywords and settings. A custom regex parser is lighter and easier to implement in plain JavaScript than importing a heavy Python-based parser.
- **Alternatives considered**: Using `robot.parsing` via a Python bridge (rejected for complexity and latency).

## Decision: Dry-run Validation
- **Decision**: Use `robot --dryrun` on a temporary test suite that imports the modified resource.
- **Rationale**: This is the most reliable way to ensure the resource file is syntactically correct and all keywords are valid without actually executing side effects.
- **Alternatives considered**: LLM-based syntax check (rejected; unreliable for specific Robot Framework version nuances).

## Decision: Backup and Restore Mechanism
- **Decision**: Create a `.bak` file in a dedicated `src/robots/resources/backups/` directory before any write operation.
- **Rationale**: Provides a simple, file-system-based undo mechanism if validation fails or the user wants to revert changes.
- **Alternatives considered**: Git-based revert (rejected; complicates the agent's responsibility).

## Decision: Synonym Mapping via manifests.json
- **Decision**: Structure `manifests.json` as a map of `technical_keyword: [natural_language_synonyms]`.
- **Rationale**: Allows the `ResourceAgent` to suggest where to add a keyword or how to name it based on existing aliases, improving the semantic consistency of the library.
