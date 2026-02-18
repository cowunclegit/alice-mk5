*** Settings ***
Library    Browser    strict=False
Library    OperatingSystem
Library    Collections

*** Keywords ***
Open Visible Browser
    [Arguments]    ${url}    ${browser}=chromium
    # 봇 감지 우회를 위한 브라우저 인자 설정
    ${args}=    Create List    --disable-blink-features=AutomationControlled    --no-sandbox
    New Browser    browser=${browser}    headless=False    args=${args}
    
    # 실제 브라우저처럼 보이도록 컨텍스트 설정
    New Context    
    ...    viewport={'width': 1920, 'height': 1080} 
    ...    locale=ko-KR 
    ...    userAgent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36
    
    New Page       ${url}

Navigate To URL
    [Arguments]    ${url}
    Go To          ${url}

Wait For Element
    [Arguments]    ${selector}    ${timeout}=30s
    Wait For Elements State    ${selector}    visible    timeout=${timeout}

Click Element
    [Arguments]    ${selector}
    Click With Options    ${selector}    force=True

Type Into Element
    [Arguments]    ${selector}    ${text}
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

Scrape List Data
    [Arguments]    ${selector}    ${filename}=result.json
    [Documentation]    Extracts text and href from all elements and saves as JSON.
    Wait For Element    ${selector}
    ${elements}=    Get Elements    ${selector}
    ${results}=     Create List
    
    FOR    ${el}    IN    @{elements}
        ${text}=    Get Text    ${el}
        ${link}=    Evaluate JavaScript    ${el}    (el) => el.href || ""
        
        ${item}=    Create Dictionary    text=${text}    link=${link}
        Append To List    ${results}    ${item}
    END
    
    ${json_string}=    Evaluate    json.dumps($results, ensure_ascii=False, indent=2)    json
    
    Create File    ${OUTPUT DIR}${/}${filename}    ${json_string}
    RETURN    ${json_string}

Extract All Links
    [Arguments]    ${selector}    ${filename}=links.txt
    ${links}=    Get Attribute    ${selector}    href
    Create File    ${OUTPUT DIR}${/}${filename}    ${links}
    RETURN    ${links}
