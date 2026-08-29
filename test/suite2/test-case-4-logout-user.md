# Test Case 4 - Logout User

**Target:** https://www.automationexercise.com/

**Source:** Automation Exercise published Test Case 4.

## Objective

Validate that an authenticated user can end their session and is returned to the login page.

## Preconditions

- The disposable account created by `test-case-1-register-user.md` is available. Run Test Case 1
  first; this is a stateful suite sequence.
- Explicit authorization has been granted to authenticate with that account on this target.
- The account's credentials are available only through approved secret handling and are never
  written into this specification, logs, or reports.

## Scenarios

1. Open the home page and verify it is visible.
2. Open the Signup/Login page.
3. Authenticate with the approved disposable test account.
4. Verify the logged-in state is visible.
5. Select Logout.
6. Verify the application returns to the Signup/Login page and the authenticated state is gone.

## Safety status

**BLOCKED - not executed.** This is an authentication flow. It may run only after the required
disposable account and explicit authorization have been supplied. Never create another account
as part of this test, use real credentials, or expose secret values.
