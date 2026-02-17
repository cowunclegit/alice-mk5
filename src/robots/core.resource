*** Settings ***
Library    Browser    strict=False
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
    Click    ${selector}    force=True

Type Into Element
    [Arguments]    ${selector}    ${text}
    Fill Text    ${selector}    ${text}    force=True

Press Enter
    [Arguments]    ${selector}
    # Press enter on the specific element
    Focus    ${selector}
    Keyboard Key    press    Enter

Capture DOM Source
    [Arguments]    ${filename}=dom.html
    ${html}=    Get Property    body    innerHTML
    Create File    ${OUTPUT DIR}${/}${filename}    ${html}
    RETURN    ${html}

Extract Element Data
    [Arguments]    ${selector}    ${filename}=result.txt
    # Get all texts if multiple elements exist
    ${texts}=    Get Text    ${selector}
    Create File    ${OUTPUT DIR}${/}${filename}    ${texts}
    RETURN    ${texts}

Extract All Links
    [Arguments]    ${selector}    ${filename}=links.txt
    ${links}=    Get Attribute    ${selector}    href
    Create File    ${OUTPUT DIR}${/}${filename}    ${links}
    RETURN    ${links}
