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
    # 필수 인자인 selector는 위치 기반으로, 옵션인 force는 이름 기반으로 전달합니다.
    # 인자 사이는 확실하게 4개의 공백으로 구분합니다.
    Click With Options    ${selector}    force=True

Type Into Element
    [Arguments]    ${selector}    ${text}
    # Fill Text도 동일하게 필수 인자는 위치 기반으로 전달합니다.
    Fill Text    ${selector}    ${text}    force=True

Press Enter
    [Arguments]    ${selector}
    Focus    ${selector}
    Keyboard Key    press    Enter

Capture DOM Source
    [Arguments]    ${filename}=dom.html
    ${html}=    Get Property    body    innerHTML
    Create File    ${OUTPUT DIR}${/}${filename}    ${html}
    RETURN    ${html}

Extract Element Data
    [Arguments]    ${selector}    ${filename}=result.txt
    ${texts}=    Get Text    ${selector}
    Create File    ${OUTPUT DIR}${/}${filename}    ${texts}
    RETURN    ${texts}

Extract All Links
    [Arguments]    ${selector}    ${filename}=links.txt
    ${links}=    Get Attribute    ${selector}    href
    Create File    ${OUTPUT DIR}${/}${filename}    ${links}
    RETURN    ${links}
