*** Settings ***
Library    Browser

*** Keywords ***
Open Visible Browser
    [Arguments]    ${url}    ${browser}=chromium
    New Browser    browser=${browser}    headless=False
    New Page       ${url}

Navigate To URL
    [Arguments]    ${url}
    Go To          ${url}

Wait For Element
    [Arguments]    ${selector}    ${timeout}=10s
    Wait For Elements State    ${selector}    visible    timeout=${timeout}

Interact With Element
    [Arguments]    ${action}    ${selector}    ${value}=${EMPTY}
    IF    '${action}' == 'click'
        Click    ${selector}
    ELSE IF    '${action}' == 'type'
        Fill Text    ${selector}    ${value}
    END

Capture DOM Source
    ${html}=    Get Property    body    innerHTML
    [Return]    ${html}

Extract Element Data
    [Arguments]    ${selector}
    ${text}=    Get Text    ${selector}
    [Return]    ${text}
