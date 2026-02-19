*** Settings ***
Library    AppiumLibrary
Library    OperatingSystem
Library    Collections

*** Keywords ***
Open Application Session
    [Arguments]    ${remote_url}    ${platform_name}    ${app_identifier}    ${automation_name}    ${device_name}
    # Open Application will either start a new session or reconnect if configured correctly
    Open Application    ${remote_url}
    ...    platformName=${platform_name}
    ...    app=${app_identifier}
    ...    automationName=${automation_name}
    ...    deviceName=${device_name}
    ...    newCommandTimeout=3600
    
    # Wait for app to be ready and in foreground
    Sleep    5s

Type Into Application Element
    [Arguments]    ${locator}    ${text}
    Wait Until Element Is Visible    ${locator}    timeout=15s
    Input Text    ${locator}    ${text}

Click Application Element
    [Arguments]    ${locator}
    Wait Until Element Is Visible    ${locator}    timeout=15s
    Click Element    ${locator}

Capture App UI XML
    [Arguments]    ${filename}=app_source.xml
    ${xml}=    Get Source
    Create File    ${OUTPUT DIR}${/}${filename}    ${xml}
    RETURN    ${xml}

Quit Application Session
    Close Application
