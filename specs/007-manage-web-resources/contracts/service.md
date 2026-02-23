# Service Contracts: Web Resource Management Agent

## ManifestService

### `sync()`
- **Purpose**: Reconcile `manifests.json` with actual files in the resource directory.
- **Input**: None
- **Output**: Promise<void>

### `addMapping(path, aliases)`
- **Purpose**: Add or update an entry in the registry.
- **Input**: `path` (String), `aliases` (Array<String>)
- **Output**: Promise<void>

## GeneratorService

### `generateKeyword(intent, selector, args)`
- **Purpose**: Create a string representation of a Robot keyword.
- **Input**: `intent` (String), `selector` (String), `args` (Array<String>)
- **Output**: String (Robot code block)

### `updateResourceFile(domain, keywordName, content)`
- **Purpose**: Insert or replace a keyword in a `.resource` file.
- **Input**: `domain` (String), `keywordName` (String), `content` (String)
- **Output**: Promise<void>

## ResourceManagerAgent (LangGraph)

### `invoke(input)`
- **Input**: `{ intent: String, url: String }`
- **Output**: `{ status: String, resourcePath: String, verified: Boolean }`
