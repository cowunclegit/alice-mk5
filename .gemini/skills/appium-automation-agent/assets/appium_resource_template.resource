*** Settings ***
Library    AppiumLibrary
Library    OperatingSystem
Library    Collections

*** Keywords ***
Open Application Session
    [Arguments]    ${remote_url}    ${platform_name}    ${app_identifier}    ${automation_name}
    Open Application    ${remote_url}
    ...    platformName=${platform_name}
    ...    app=${app_identifier}
    ...    automationName=${automation_name}
    ...    newCommandTimeout=300

Type Into Application Element
    [Arguments]    ${locator}    ${text}
    Wait Until Element Is Visible    ${locator}
    Input Text    ${locator}    ${text}

Click Application Element
    [Arguments]    ${locator}
    Wait Until Element Is Visible    ${locator}
    Click Element    ${locator}

Capture App UI XML
    [Arguments]    ${filename}=app_source.xml
    ${xml}=    Get Source
    Create File    ${OUTPUT DIR}${/}${filename}    ${xml}
    RETURN    ${xml}
