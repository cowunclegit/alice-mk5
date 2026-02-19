# Appium Desktop Automation Best Practices

## Windows (WinAppDriver)
- **Developer Mode**: Must be enabled on the host machine.
- **Selector Priority**:
    1. `AccessibilityId` (Most stable)
    2. `Name`
    3. `XPath` (Slow, use as last resort)
- **Root Session**: To control multiple windows, start a session with `app: 'Root'` and then find the specific window element to create a child session.

## macOS (Appium Mac2 Driver)
- **Permissions**: Terminal/IDE and Appium process must have `Accessibility` permissions in System Settings.
- **Xcode**: Required for building and running the driver.
- **Selector Priority**:
    1. `accessibility id`
    2. `xpath`
- **Application Startup**: Use Bundle ID (e.g., `com.apple.calculator`) for reliable startup.

## Common Robot Framework Keywords (AppiumLibrary)
- `Open Application`: Initializes the session with capabilities.
- `Input Text`: Send keys to an element.
- `Click Element`: Click an element by locator.
- `Wait Until Element Is Visible`: Synchronize automation.
- `Get Source`: Capture XML UI structure.
