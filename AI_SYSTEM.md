# AI and Retrieval System

Groq supplies inference only. LegalIt owns retrieval, ranking, access control, citation resolution, and abstention.

## Implemented request pipeline

1. Validate question, jurisdiction, and size.
2. Retrieve permitted public legal passages and authorized private case documents.
3. Rank by exact structured matches, FTS relevance, jurisdiction, document authority, type, and applicable freshness.
4. Deduplicate and cap evidence.
5. Construct a prompt that marks evidence as untrusted content.
6. Request structured JSON from Groq containing an answer and retrieved source IDs only.
7. Validate every ID against the exact retrieval set and resolve stored metadata.
8. Return answer, citations, excerpts, links, and uncertainty; abstain when evidence is inadequate.

## Failure behavior

Missing keys, timeouts, rate limits, malformed model output, invalid citations, and empty retrieval are explicit states. Keyword search remains available without Groq. The React assistant uses `/api/v1/research/ask`. Private case documents remain excluded until scoped selection receives additional authorization tests.

Environment variables include `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_TIMEOUT_SECONDS`, `MAX_AI_INPUT_CHARS`, `MAX_AI_OUTPUT_TOKENS`, and `RETRIEVAL_RESULT_COUNT`.

## Manual import format

Only import material whose retrieval, storage, and use have been reviewed. Unknown fields remain absent rather than invented.

```json
{
  "source": {
    "name": "Official source name",
    "base_url": "https://official.example/",
    "authority_level": 100,
    "terms_note": "Access and reuse review"
  },
  "documents": [
    {
      "external_id": "stable-source-id",
      "title": "Document title",
      "document_type": "legislation",
      "jurisdiction": "India",
      "authority": "Issuing authority",
      "act_identifier": "Act name",
      "section_identifier": "Section 1",
      "source_url": "https://official.example/document",
      "content": "Permitted source text"
    }
  ]
}
```
