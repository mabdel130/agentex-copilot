# Spec: Verify product quantity in cart

Target: http://automationexercise.com
Type: product cart flow

## Acceptance criteria
- The home page is visibly loaded.
- The selected product's detail page opens successfully.
- The cart displays the selected product.
- The cart shows an exact quantity of 4 for the selected product.
- No console errors or failed network calls occur during the scenario.

## Scenario
1. Launch the browser and navigate to the target URL.
2. Verify that the home page is visible successfully.
3. Click "View Product" for any product on the home page.
4. Verify that the product-detail page is open.
5. Increase the product quantity to 4.
6. Click the "Add to cart" button.
7. Click the "View Cart" button.
8. Verify that the selected product is displayed on the cart page with an exact quantity of 4.

## Notes
- Keep all steps in the same browser session because the cart state is session-dependent.
- Capture a screenshot for the scenario and report console errors or failed requests as defects.
