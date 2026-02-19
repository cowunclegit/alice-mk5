*** Settings ***
Library    SeleniumLibrary
Library    OperatingSystem
Library    Collections

*** Keywords ***
Open Visible Browser
    [Arguments]    ${url}    ${browser}=chrome
    # 봇 감지 우회를 위한 브라우저 인자 설정 (Chrome 기준)
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${options}    add_argument    --disable-blink-features\=AutomationControlled
    Call Method    ${options}    add_argument    --no-sandbox
    Call Method    ${options}    add_argument    --user-agent\=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36
    
    Open Browser    ${url}    ${browser}    options=${options}

Navigate To URL
    [Arguments]    ${url}
    Go To          ${url}

Wait For Element
    [Arguments]    ${selector}    ${timeout}=30s
    Wait Until Element Is Visible    ${selector}    timeout=${timeout}

Click Element
    [Arguments]    ${selector}
    SeleniumLibrary.Click Element    ${selector}

Type Into Element
    [Arguments]    ${selector}    ${text}
    Input Text    ${selector}    ${text}

Press Enter
    [Arguments]    ${selector}
    Press Keys    ${selector}    ENTER

Capture DOM Source
    [Arguments]    ${filename}=dom.html
    ${html}=    Get Source
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
    ${elements}=    Get WebElements    ${selector}
    ${results}=     Create List
    
    FOR    ${el}    IN    @{elements}
        ${text}=    Get Text    ${el}
        ${link}=    Execute JavaScript    return arguments[0].href || ""    ARGUMENTS    ${el}
        
        ${item}=    Create Dictionary    text=${text}    link=${link}
        Append To List    ${results}    ${item}
    END
    
    ${json_string}=    Evaluate    json.dumps($results, ensure_ascii=False, indent=2)    json
    
    Create File    ${OUTPUT DIR}${/}${filename}    ${json_string}
    RETURN    ${json_string}

Extract All Links
    [Arguments]    ${selector}    ${filename}=links.txt
    ${links}=    Get Element Attribute    ${selector}    href
    Create File    ${OUTPUT DIR}${/}${filename}    ${links}
    RETURN    ${links}
