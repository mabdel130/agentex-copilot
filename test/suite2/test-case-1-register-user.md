# Test Case 1 - Register User

**Target:** https://www.automationexercise.com/

**Source:** Automation Exercise published Test Case 1.

## Objective

Validate that a new user can register and receive an account-created confirmation. The
disposable account remains available for Test Case 4 in this suite.

## Preconditions

- A disposable email address and fictitious profile data are available.
- Account creation has been explicitly authorized for this target environment.
- The test run has been approved to perform the irreversible registration action.

## Scenarios

1. Open the home page and verify it is visible.
2. Open the Signup/Login page and verify the "New User Signup!" section is visible.
3. Enter a disposable name and email address, then submit the signup form.
4. Verify the account-information page is visible.
5. Complete the required account and address details using fictional disposable data.
6. Submit the account creation form and verify the account-created confirmation.
7. Continue to the application and verify the logged-in state.

## Stateful handoff

Do not delete the disposable account after registration. Preserve its approved credentials only
through the configured secret mechanism so `test-case-4-logout-user.md` can authenticate with
the same account. Account cleanup, if needed, is a separate explicitly approved action after the
suite finishes.

## Safety status

**Requires authorization before execution.** This test creates one account, which is an
authentication/account-creation flow. It may run only with a disposable test identity and
explicit authorization for the target environment. Do not use a real identity, email address,
or payment data.
