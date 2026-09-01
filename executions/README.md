# executions/

AgenTeX writes the artifacts for every QA run here. Do not create run folders manually: the
browser-testing workflow creates a fresh, timestamped folder for each run.

```text
executions/
└── execu_<YYYY-MM-DD_HH-MM-SS>/
    ├── report.md                       # consolidated run report
    ├── run-summary.json                # durable, machine-readable result
    ├── extent-report.html              # optional interactive dashboard
    ├── browser-sessions/
    │   └── <session>/                  # unique per run; never a shared default
    │       ├── logs/                   # console and network captures
    │       └── screenshots/            # scenario evidence
    └── bugs/
        ├── bug-list.md                 # consolidated defect list
        └── screenshots/                # copied defect evidence
```

Run artifacts are intentionally ignored by Git; only this README is tracked. They are
environment-specific evidence and can include disposable test data, session state, and URLs, so
they should not be committed.
