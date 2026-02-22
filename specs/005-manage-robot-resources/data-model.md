# Data Model: Robot Framework Resource Management

## Entity: Resource Index
A memory-mapped representation of available automation resources.

| Field | Type | Description |
|-------|------|-------------|
| filePath | String | Absolute path to the .resource file |
| isCore | Boolean | True if the file is protected (e.g., `core.resource`) |
| keywords | Array<KeywordSummary> | List of keywords defined in this file |

### Type: KeywordSummary
| Field | Type | Description |
|-------|------|-------------|
| name | String | Technical keyword name |
| arguments| Array<String> | List of expected arguments |
| aliases | Array<String> | Synonyms from `manifests.json` |

## Entity: Synonym Manifest
The structure of `src/robots/resources/manifests.json`.

| Field | Type | Description |
|-------|------|-------------|
| mappings | Map<Key, List> | Map of technical keyword name to list of natural language aliases |

## Entity: Resource Edit Suggestion
The object presented to the user for approval.

| Field | Type | Description |
|-------|------|-------------|
| targetFile | String | The file to be modified |
| action | String | `add` \| `modify` \| `create` |
| diff | String | Standard diff output of the proposed change |
| reasoning | String | Why this change is being made |
