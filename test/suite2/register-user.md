# Spec: Register user

Target: http://automationexercise.com
Type: end-to-end registration flow

## Acceptance criteria
- The home page is visibly loaded.
- The signup page displays the "New User Signup!" heading.
- The account-information page displays "ENTER ACCOUNT INFORMATION".
- A successfully submitted registration displays "ACCOUNT CREATED!".
- After continuing, the session visibly displays "Logged in as username".
- No console errors or failed network calls occur during the scenario.

## Scenario
1. Launch the browser and navigate to the target URL.
2. Verify that the home page is visible successfully.
3. Click the "Signup / Login" button.
4. Verify that "New User Signup!" is visible.
5. Enter a name and a unique, disposable email address.
6. Click the "Signup" button.
7. Verify that "ENTER ACCOUNT INFORMATION" is visible.
8. Fill in Title, Name, Email, Password, and Date of birth.
9. Select "Sign up for our newsletter!".
10. Select "Receive special offers from our partners!".
11. Fill in First name, Last name, Company, Address, Address2, Country, State, City, Zipcode, and Mobile Number using disposable test data.
12. Click the "Create Account" button.
13. Verify that "ACCOUNT CREATED!" is visible.
14. Click the "Continue" button.
15. Verify that "Logged in as username" is visible.

## Notes
- This flow creates an external account. AgenTeX's safety policy will stop before that irreversible action; use it as a manual test specification unless the policy supports an approved disposable test environment.
- Capture a screenshot for the scenario and report console errors or failed requests as defects.
