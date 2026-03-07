# CQRS Evaluation and Structure

## What is CQRS?

**Command Query Responsibility Segregation** separates:

- **Commands**: operations that change state (create, update, delete). They return minimal data (e.g. id, success) or the created/updated resource.
- **Queries**: operations that read data and do not change state. They return data only.

Benefits: clearer intent, easier scaling of read vs write paths, and simpler models per use case.

---

## Current State (Before CQRS)

| Endpoint | Method | Current role | CQRS role |
|----------|--------|--------------|------------|
| `/api/learning-items/batch` | POST | Batch create learning items (write) | **Command** |
| `/api/translate` | POST | q220_getDefinition: call LLM, return definition/translation (no DB write) | **Query** |
| `/api/capitalise` | POST | Transform text (no side effects) | **Query** |
| `/api/ping` | GET/POST | Read DB health | **Query** |

**Gaps:**

1. **No explicit CQRS split** – Routes call “services” or utils directly; no distinction between command and query handlers.
2. **Mixed concerns** – `services/learningItems.js` does both read (findOrCreateUser) and write (create) in one flow. Acceptable for a command, but the concept of “command” vs “query” is not reflected in the folder/naming.
3. **Single entry point** – All operations go through the same route → handler → service pattern without a clear command/query boundary.
4. **No read-side for learning items** – Only “create” exists; future “get learning items” would be a query and was not yet separated.

---

## Target CQRS Structure

```
llamaSvc/
├── commands/           # State-changing operations
│   └── c101_saveLearningItemsToMorocco.js
├── queries/            # Read-only / no state change
│   ├── health.js
│   ├── q220_getDefinition.js
│   └── capitalise.js
├── routes/             # HTTP layer: parse request → dispatch command/query → respond
├── services/           # Shared persistence / external APIs (used by commands & queries)
└── ...
```

- **Commands** and **queries** are the single place that express *what* the app does; **services** stay as the *how* (DB, LLM, etc.).
- Routes only parse input, call the right command or query, and map results/errors to HTTP.

---

## Mapping After Refactor

| Operation | Type | Handler | Notes |
|-----------|------|---------|--------|
| Batch create learning items | Command | `commands/c101_saveLearningItemsToMorocco.js` | Uses `services/learningItems.js` (findOrCreateUser, normalise). |
| Health check | Query | `queries/health.js` | Reads DB connectivity only. |
| Get definition (translate term) | Query | `queries/q220_getDefinition.js` | Uses translation service; no DB write. |
| Capitalise text | Query | `queries/capitalise.js` | Pure function; no side effects. |

---

## Optional Future Steps (Full CQRS)

- **Separate read models**: e.g. dedicated read service or views for “list learning items” / “get learning item” with DTOs different from the write model.
- **Event sourcing**: Store events (e.g. `LearningItemCreated`) and derive read models from them (only if you need audit trail or replay).
- **Separate read/write stores**: Different DBs or replicas for reads vs writes (when scaling justifies it).

For the current MVP, a single database with a clear **command vs query** split in the codebase is enough to “follow CQRS” and keep the door open for the above.
