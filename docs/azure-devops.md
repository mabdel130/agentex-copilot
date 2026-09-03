# Azure DevOps QA

The optional Azure DevOps skills support three QA workflows:

| Request | Skill |
|---|---|
| Estimate testing effort and create `[Testing]` tasks | `task-estimation` |
| Turn acceptance criteria into linked test cases | `test-design` |
| File confirmed execution defects as Azure DevOps bugs | `bug-report-azure` |

Azure access must be configured in the consumer project and its credentials kept in `.env`. The
planning and bug-filing workflows collect and validate inputs before showing one consolidated
approval gate. No board write occurs before that approval. CI mode refuses tracker writes.

Read the skill documentation before using a workflow:
[`task-estimation`](../skills/task-estimation/SKILL.md),
[`test-design`](../skills/test-design/SKILL.md), and
[`bug-report-azure`](../skills/bug-report-azure/SKILL.md).
