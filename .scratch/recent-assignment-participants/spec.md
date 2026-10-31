# Recent assignment participants

Status: ready-for-agent

## Problem Statement

When assigning a Hermano to a weekly Parte or meeting framework assignment, the coordinator cannot immediately see who performed that same type of assignment recently. The existing picker shows eligible Hermanos and expandable individual history, which makes checking recent participation cumbersome and hides participants who are no longer eligible.

## Solution

Show a recent-participants section above the existing eligible list in every assignment picker. Include everyone who performed the same assignment category during the three calendar weeks before the selected Semana, including Ayudantes and Hermanos who are currently ineligible or inactive. Display participation dates and roles. Eligible participants remain selectable; other participants are informational only. Recent participation never introduces an eligibility restriction.

## User Stories

1. As a coordinator, I want recent participants above the eligible list, so that I can assess assignment rotation immediately.
2. As a coordinator, I want history relative to the Semana I am editing, so that planning past or future weeks produces meaningful results.
3. As a coordinator, I want exactly the three preceding calendar weeks, so that missing imported weeks do not silently extend the history window.
4. As a coordinator, I want participants matched by Tipo de asignación, so that changing titles or ordering does not hide equivalent participation.
5. As a coordinator, I want to see both Estudiantes and Ayudantes for the same type, so that I understand all recent involvement.
6. As a coordinator, I want to see Conductores and Lectores with their actual roles, so that participation in shared assignment types remains clear.
7. As a coordinator, I want the section for every Parte assignment, so that the feature is not limited to student assignments.
8. As a coordinator, I want the same information for president, prayers and auxiliary-room counselor, so that framework assignments also support rotation decisions.
9. As a coordinator, I want prayers grouped as one category, so that opening, intermediate and closing participation is visible together.
10. As a coordinator, I want participation dates and roles, so that I can distinguish what each Hermano actually did.
11. As a coordinator, I want repeated participation grouped under one Hermano, so that the section remains readable without losing events.
12. As a coordinator, I want historical participants who are now inactive or ineligible to remain visible, so that the section is complete.
13. As a coordinator, I want only currently eligible Hermanos to be selectable, so that historical visibility does not bypass assignment rules.
14. As a coordinator, I want recent eligible participants to remain selectable, so that the history informs rather than blocks my decision.
15. As a coordinator, I want the current search to apply to both sections, so that I can locate a Hermano consistently.
16. As a coordinator, I want an explicit empty state, so that I know when no matching participation was recorded.
17. As a coordinator, I want history loading failures to be visible, so that unavailable history is not mistaken for no participation.

## Implementation Decisions

- Extend assignment-picker data loading with a separate historical-participants result. The existing eligible-Hermanos history alone cannot supply participants excluded by current eligibility filters.
- Query historical identities and participation records independently of eligibility. Apply the existing eligibility result only to determine whether a displayed participant can be selected. Preserve the SQL eligibility engine and current validations, consistent with ADR-0001.
- Preserve recorded history for inactive Hermanos, consistent with the existing soft-delete design. No schema migration is anticipated; use existing Hermanos, Semanas, Partes, Asignaciones and framework-assignment records.
- Use the selected Semana's start date as the reference. Include participation where Semana start date is greater than or equal to reference minus 21 calendar days and strictly less than reference. Do not use today's date, the last three stored weeks, or the last three assignment records.
- For Partes, match Tipo de asignación across all roles and rooms. Do not match titles, position or duration. Include Estudiante, Ayudante, Conductor and Lector records where applicable and show their recorded roles.
- For framework assignments, match historical framework category and role explicitly: president, auxiliary-room counselor, or prayer. Do not compare raw selector type values to historical framework type values because their representations differ.
- Group opening, intermediate and closing prayers as one category, preserving their descriptions in participation details.
- Return enough data to identify each historical participant and display every matching event's date, role and assignment description. Group by stable Hermano identity, not display name.
- Show each Hermano once in the recent section, with events ordered newest first. Order participants by their most recent matching event, using display name and stable identity to break ties.
- Render recent participants above the remaining eligible list. Do not repeat a recent eligible Hermano in the lower list. This presentation does not remove anyone from the eligible selection set.
- Apply the existing name search to both sections. Make ineligible entries clearly informational and prevent selection through mouse and keyboard alike.
- Preserve existing selection behavior and individual-history access for eligible participants. An empty recent section must not interfere with ordinary assignment selection.
- Represent loading, empty and failed history states distinctly. Keep selection governed by existing eligibility behavior if the informational query fails; do not display failure as an empty history result.
- No new eligibility rules, dependencies or generic history infrastructure are required by this spec.

## Testing Decisions

- Verify externally observable behavior and query results, not internal component structure or SQL text.
- Test the historical query against SQLite in memory with representative assignment and framework fixtures. Existing Rust eligibility and Hermano command tests provide the database-fixture precedent; a live Tauri command harness is not currently available.
- Cover the inclusive 21-day boundary, exclusive selected-week boundary, past and future reference weeks, missing weeks, multiple events, distinct Hermanos with the same name, inactive participants and participants failing current eligibility.
- Cover matching by type despite changed titles, inclusion of Ayudantes and cross-role participation, matching across rooms, framework-role separation and grouped prayers.
- Use existing Vitest infrastructure for the small pure transformation that groups events and separates recent participants from the remaining eligible list. Follow the existing pure-function test style rather than adding a component-testing framework solely for this feature.
- Verify that recent participation never removes eligibility and that historical visibility never grants eligibility.
- Review the actual modal manually for every assignment family, search in both sections, selection of recent eligible participants, disabled informational entries, individual history, loading, empty and error states, and switching the selected Semana.
- The user approved these test boundaries and the two-ticket vertical breakdown. Pure-function and SQLite tests do not constitute automated browser or desktop coverage.

## Out of Scope

- Automatically rotating or recommending assignments, scoring candidates or preventing repeat participation.
- Changing existing eligibility rules or restoring inactive Hermanos.
- Searching for any participation regardless of assignment category.
- Extending the window to compensate for missing imports or reconstructing unrecorded history.
- Treating prayer positions as separate historical categories.
- Changes to imports, scheduling generation, printed S-140 views or database schema.
- Introducing browser/component test infrastructure or performing unrelated refactors.

## Further Notes

The implementation is split into two approved vertical tickets: Parte assignments first, then framework assignments reusing the first ticket's section and query path. Both include their own behavior verification. Historical completeness depends on locally recorded assignments; an empty result does not prove there was no real-world participation.
