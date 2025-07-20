# `telenutrition-e2e`

End to end testing.

## How to use

### Install playwright headless browser shells

```bash
cd devenv
bin/telenutrition-app/e2e-setup
```

### Run e2e tests headless with limited logging

```bash
cd devenv
bin/telenutrition-app/e2e-up
```

### Run e2e test with chrome dev tools and debug mode enabled

```bash
cd devenv
bin/telenutrition-app/e2e-debug
```

#### Optionally, for debugging and detailed logging

```bash
cd devenv
export PWDEBUG=1  # Options = 0 or 1.  Enable chrome dev tools.
export HEADED=1  # Options = 0 or 1.  Enable headed browser.  Default headless.
export DEBUG=pw:api  # Enable Playwright debugger.
export TESTSUITE=Email  # Options include Email, SMS, Token.  Default: Email.
bin/telenutrition-app/e2e-debug
```
