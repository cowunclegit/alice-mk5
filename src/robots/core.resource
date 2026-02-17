*** Settings ***
Library    Browser
Library    OperatingSystem

*** Keywords ***
Open Visible Browser
    [Arguments]    ${url}    ${browser}=chromium
    New Browser    browser=${browser}    headless=False
    New Page       ${url}

Navigate To URL
    [Arguments]    ${url}
    Go To          ${url}

Wait For Element
    [Arguments]    ${selector}    ${timeout}=30s
    Wait For Elements State    ${selector}    visible    timeout=${timeout}

Click Element
    [Arguments]    ${selector}
    Click    ${selector}

Type Into Element
    [Arguments]    ${selector}    ${text}
    Fill Text    ${selector}    ${text}

Capture DOM Source
    [Arguments]    ${output_path}=dom.html
    ${html}=    Get Property    body    innerHTML
    # Save to file because stdout capture is unreliable for large HTML
    Create File    ${output_path}    ${html}
    RETURN    ${html}

Extract Element Data
    [Arguments]    ${selector}    ${output_path}=result.txt
    ${text}=    Get Text    ${selector}
    Create File    ${output_path}    ${text}
    RETURN    ${text}
