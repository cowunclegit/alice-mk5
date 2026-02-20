# Data Model: Multi-Agent Orchestration

## Entities

### ManagerState
- **Description**: The root state for the orchestration session.
- **Attributes**:
    - `input`: The original user prompt.
    - `tasks`: Array of decomposed `Task` objects.
    - `currentTaskIndex`: Pointer to the active task.
    - `data_store`: Map of accumulated JSON results from sub-agents.
    - `retry_counts`: Map of retry attempts per sub-agent.
    - `status`: Current phase (`planning`, `approving`, `executing`, `finalizing`).

### Task
- **Description**: An atomic task assigned to a specific sub-agent.
- **Attributes**:
    - `id`: Sequential ID (e.g., `T1`).
    - `platform`: `web` | `application` | `tool_execution`.
    - `intent`: Natural language goal for the sub-agent.
    - `status`: `pending` | `in_progress` | `completed` | `failed`.

### CompactionRule
- **Description**: Defined in `config.yaml` to trigger context management.
- **Attributes**:
    - `max_data_store_keys`: Integer threshold.
    - `compaction_strategy`: `summarize` (default).

## Validation Rules
- **Plan Integrity**: A plan must have at least one task.
- **Platform Compatibility**: Tasks must only use supported platform identifiers.
- **Vault Access**: Sub-agents must provide a valid `sessionId` when querying the Vault.

## State Transitions
1. **START** -> `planner` (Generate Task Plan)
2. `planner` -> `approver` (Wait for user confirmation)
3. `approver` -> `router` (Dispatch to Sub-Graph)
4. `router` -> `sub_agent_execution` (Web/App/Tool Graph)
5. `sub_agent_execution` -> `router` (Next task or success)
6. `sub_agent_execution` -> `auto_fix` (If failed)
7. `router` -> `summarizer` (Generate final response)
8. `summarizer` -> **END**
