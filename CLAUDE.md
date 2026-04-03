# tui-sandbox

## Debugging test failures

After each Cypress test, a snapshot of the terminal state is written to
`test-environment/testdirs/.terminal-snapshot.yaml`. It contains:

```yaml
testTitle: "the full test name"
testFile: "path/to/spec.cy.ts"
testState: passed # or "failed"
error: null # or the error message
timestamp: "..."
terminalContent: |
  the full terminal buffer as multiline text
```

This file is overwritten after every test, so it always reflects the most recent test that ran. Read it to see what was
on the terminal screen — this is especially useful when a test times out waiting for content that never appeared.

In headless mode (CI / `pnpm tui run`), failed tests also include the terminal content directly in the error message
output.
