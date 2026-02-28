# Translate API

POST endpoint that translates a term from a source language to a target language using context. Powered by OpenAI (e.g. `gpt-4o-mini`).

## Endpoint

```
POST /api/translate
```

Base URL when running locally: `http://localhost:5000` (or the value of `PORT` in your environment).

## Request

**Content-Type:** `application/json`

| Parameter         | Type    | Required | Limits     | Description |
|-------------------|---------|----------|------------|-------------|
| `sourceLanguage`  | string  | Yes      | non-empty  | Language of the term (e.g. `"English"`, `"German"`). |
| `targetLanguage`  | string  | Yes      | non-empty  | Language to translate into. |
| `term`            | string  | Yes      | max 500 chars | The word or phrase to translate. |
| `context`         | string  | No       | max 2000 chars | Optional context to disambiguate meaning (e.g. "in a restaurant"). |
| `promptMode`      | integer | No       | —          | Default `0`. See [Prompt modes](#prompt-modes) below. |

### Example body

```json
{
  "sourceLanguage": "English",
  "targetLanguage": "French",
  "context": "in a restaurant",
  "term": "bill",
  "promptMode": 0
}
```

## Response

**Success (200)**  
JSON body:

```json
{
  "translation": "l'addition"
}
```

**Error responses**  
JSON body with an `error` message string:

| Status | Meaning |
|--------|--------|
| 400 | Validation error (missing/invalid fields or length limits exceeded). |
| 401 | Invalid or unauthorized API key (OpenAI). |
| 429 | Rate limit exceeded (OpenAI). |
| 502 | Provider error or empty translation. |
| 503 | Service not configured (missing `OPENAI_API_KEY` or `AI_API_KEY` in environment). |

## Prompt modes

`promptMode` is an integer that changes how the model is instructed to respond:

| Value | Effect |
|-------|--------|
| 0 (default) | Reply with only the translated term. |
| 1 | Output only the translated term; no explanation or extra punctuation. |
| 2 | Use a formal register in the translation. |
| 3 | Use an informal register in the translation. |

Any other integer is treated as mode `0`.

## How to call the endpoint

### cURL

```bash
curl -X POST http://localhost:5000/api/translate \
  -H "Content-Type: application/json" \
  -d "{\"sourceLanguage\":\"English\",\"targetLanguage\":\"French\",\"context\":\"in a restaurant\",\"term\":\"bill\",\"promptMode\":0}"
```

### PowerShell

```powershell
$body = @{
  sourceLanguage = "English"
  targetLanguage = "French"
  context        = "in a restaurant"
  term           = "bill"
  promptMode     = 0
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/translate" -Body $body -ContentType "application/json"
```

### JavaScript (fetch)

```javascript
const res = await fetch('http://localhost:5000/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceLanguage: 'English',
    targetLanguage: 'French',
    context: 'in a restaurant',
    term: 'bill',
    promptMode: 0,
  }),
});
const data = await res.json();
console.log(data.translation); // e.g. "l'addition"
```

## Prerequisites

1. **API key:** Set `OPENAI_API_KEY` or `AI_API_KEY` in your environment (e.g. in a `.env` file in the project root). The server must be restarted after changing env vars.
2. **Dependencies:** Run `npm install` in the project directory.
3. **Server:** Start the server with `npm run dev` or `npm start` so the base URL (e.g. `http://localhost:5000`) is available.
