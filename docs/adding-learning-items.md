# Adding Terms to the Learning Items Table

This guide describes how to add term–definition pairs to the **Learning Items** table via the **batch** API. The backend uses **CanonicalEntry** so the same normalised term+definition+language is stored once and reused across users.

## Learning Items table

Learning items are user-scoped rows that store a term and its definition, with optional context and source. Each row is linked to a **CanonicalEntry** (global term–definition–language).

| Column             | Type     | Description |
|--------------------|----------|-------------|
| `id`               | UUID (PK)| Unique id. |
| `ownerUserId`      | UUID (FK)| Owner (references `Users`). |
| `collectionId`     | UUID (FK)| Collection this item belongs to (references `Collections`). Required. |
| `termText`         | string   | The term (e.g. phrase or word). |
| `definitionText`   | string   | The meaning or translation. |
| `sourceContext`    | string?  | Example sentence or context. |
| `sourceUrl`        | string?  | URL where the term was found. |
| `canonicalEntryId` | UUID (FK)| References `CanonicalEntries` (normalised term+definition+language). |
| `createdAt`        | datetime | When the row was created. |
| `updatedAt`        | datetime | When the row was last updated. |

---

## Endpoint

| Method | Path |
|--------|------|
| `POST` | `/api/learning-items/batch` |

Send a JSON body with `Content-Type: application/json`.

---

## Request body

### Top-level (required)

| Field          | Type   | Description |
|----------------|--------|-------------|
| `auth0Id`      | string | User identifier from Auth0 (e.g. `auth0\|123...`). |
| `email`        | string | User’s email (for display and user lookup). |
| `collectionId` | string | ID of the collection to add items to (e.g. from the collections list). |
| `learningItems`| array  | Array of term–definition objects (see below). |

### Each item in `learningItems`

| Field            | Type   | Required | Description |
|------------------|--------|----------|-------------|
| `termText`       | string | Yes      | The term the user is learning. |
| `definitionText` | string | Yes      | The meaning or translation. |
| `sourceContext`  | string | No       | Example sentence or context. |
| `sourceUrl`      | string | No       | URL where the term was found. |
| `language`       | string | No       | Language code for canonical lookup (default `"en"`). |

---

## Example request

```bash
curl -X POST http://localhost:5000/api/learning-items/batch \
  -H "Content-Type: application/json" \
  -d '{
    "auth0Id": "auth0|abc123",
    "email": "user@example.com",
    "collectionId": "uuid-of-collection",
    "learningItems": [
      { "termText": "tal vez", "definitionText": "maybe", "language": "es" },
      { "termText": "obtuvo", "definitionText": "obtained" }
    ]
  }'
```

Example JSON body (e.g. from a Chrome extension):

```json
{
  "auth0Id": "auth0|abc123",
  "email": "user@example.com",
  "collectionId": "uuid-of-collection",
  "learningItems": [
    { "termText": "Fundó junto", "definitionText": "Founded together" },
    { "termText": "obtuvo", "definitionText": "obtained", "sourceContext": "Obtuvo el primer premio." }
  ]
}
```

---

## Success response (201 Created)

The response is the array of created **LearningItem** objects (each with `id`, `ownerUserId`, `collectionId`, `termText`, `definitionText`, `sourceContext`, `sourceUrl`, `canonicalEntryId`, `createdAt`, `updatedAt`).

---

## Error responses (4xx / 5xx)

Errors return JSON with an `error` message:

| Status | Cause |
|--------|--------|
| `400`  | Missing or empty `auth0Id`, `email`, or `collectionId`; or `learningItems` empty or an item missing `termText`/`definitionText`. |
| `500`  | Server or database error. |

---

## Behaviour

- **User**: The user is created if they don’t exist (by `auth0Id`), or their `email` and `lastActiveAt` are updated if they do.
- **CanonicalEntry**: For each item, term and definition are normalised (trim, lower-case, collapse spaces). The backend looks up or creates a **CanonicalEntry** for that normalised pair and `language` (default `"en"`). If one already exists, it is reused.
- **LearningItem**: A new row is created for each item in the given **collection**, linked to the corresponding canonical entry. The request must include a valid `collectionId` (e.g. from GET `/api/collections`).
