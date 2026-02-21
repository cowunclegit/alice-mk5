# Data Model: High-Reproducibility Tool Execution

## Entity: Tool Manifest
Represents the metadata and structural requirements for a saved automation tool.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique slug for the tool (e.g., `naver-news-top3`) |
| title | String | Human-readable name |
| description| String | Purpose of the tool |
| platform | String | `web` \| `application` \| `cross-platform` |
| version | String | SemVer of the tool |
| variables | Array<Variable> | Definitions of inputs required for execution |
| environment | EnvMeta | Snapshot of OS/Resolution where tool was created |
| scripts | Array<Script> | Relative paths to .robot/.resource files |
| steps | Array<FixedStep> | The linear sequence of keywords to execute |

### Type: Variable
| Field | Type | Description |
|-------|------|-------------|
| name | String | Variable name used in scripts (e.g., `search_term`) |
| description| String | What the user should provide |
| required | Boolean | Whether execution fails without this value |
| default | Any | Optional default value |

### Type: EnvMeta
| Field | Type | Description |
|-------|------|-------------|
| os | String | `darwin` \| `win32` \| `linux` |
| resolution | String | e.g., `1920x1080` |
| browser_version | String | Version of Chrome/Firefox used |

## Entity: Clean History
A subset of the graph state used during the optimization phase.

| Field | Type | Description |
|-------|------|-------------|
| actions | Array<Action> | List of Robot keywords that were part of a successful path |
| data_lineage| Map<Key, Source> | Tracking which data came from where |

## Entity: Tool Catalog
The central index file `catalog.json`.

| Field | Type | Description |
|-------|------|-------------|
| tools | Array<ManifestSummary> | List of basic info for all registered tools |
| last_updated| ISO8601 | Timestamp of the last catalog sync |
