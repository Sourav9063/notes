---
name: create-action
description: Create or extend typed Controller-Service-Repository features using the host project's conventions. Use for CRUD, actions, API controllers, services, repositories, and database or external-service integrations.
---

# Create Action

Request: `$ARGUMENTS`

Build the smallest complete flow:

`client -> controller -> service -> repository -> data source`

Inspect the nearest complete feature before editing. Follow its directories, naming, exports, validation, errors, authorization, persistence, caching, and tests. Local conventions override examples below.

## Boundaries

- Controller: transport input/output, authentication, authorization, response formatting, and cache invalidation.
- Service: validation, business rules, orchestration, and data/domain mapping.
- Repository: database or external-service access and data-source-specific shapes.
- Types: shared domain models, persistence/API DTOs, schemas, inputs, filters, and action state.

Controllers must not contain business logic or data-source calls. Services must not depend on transport or cache APIs. Repositories must not enforce transport permissions or business policy.

Do not collapse mutation layers. A trivial read may skip a service only when it needs no validation, mapping, or business rule and the project already permits that pattern.

## Types

- Put shared types in the project's type/schema location, not controller, service, or repository files.
- Keep data-source DTOs faithful to their contract; map them to domain models in the service.
- Accept untrusted boundary input as `unknown` when supported, then narrow with the project's validator.
- Services never import types from controllers.

## Repository

Database-backed:

- Use the project's database client, transaction helper, and error normalizer.
- Parameterize queries and whitelist dynamic identifiers such as sort fields.
- Use one transaction for atomic multi-query writes.
- Return persistence rows/models; map to domain models in the service unless local convention differs.

External-service-backed:

- Use the project's shared HTTP client and route/config helpers; avoid one-off clients and hard-coded hosts.
- Build paths and query strings with safe URL utilities.
- Type request and response DTOs. Translate domain input to wire payloads and unwrap protocol envelopes here.
- Reuse shared behavior for authentication, serialization, errors, logging, retries, and caching.
- Catch errors only when adapting data-source-specific details; preserve the original error metadata/cause.

## Service

- Validate untrusted input and external responses with project-standard schemas.
- Enforce business rules and return project-standard expected errors.
- Map persistence/API DTOs to domain models.
- Coordinate repository calls; keep atomic writes inside a transaction boundary.
- Do not import controller, HTTP response, permission, or cache modules.
- Do not blanket-catch errors already normalized by lower layers.

## Controller

- Use the project's controller/action wrapper and minimum required permission level.
- Parse transport-only details, pass validated or unknown input to the service according to local convention, and return the service result.
- Keep response/status formatting and action-state adaptation here.
- Invalidate the narrowest relevant cache only after a successful mutation.
- HTTP routes call services directly; never call another controller or server action.

## Finish

State unresolved schema, contract, permission, transaction, and cache assumptions. Reuse an existing layer when it already owns the workflow. Run the project's narrow formatter, lint, type, and test checks; report changed files and results.
