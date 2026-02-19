*** Settings ***
Library    SeleniumLibrary
Library    OperatingSystem
Library    Collections

*** Keywords ***
Open Visible Browser
    [Arguments]    ${url}    ${browser}=chrome
    ${status}    ${val}=    Run Keyword And Ignore Error    Get Location
    
    IF    '${status}' == 'FAIL'
        # 브라우저가 열려있지 않음
        ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
        # Use Evaluate to avoid Robot Framework parsing '=' as keyword argument separator
        Evaluate    $options.add_argument("--disable-blink-features=AutomationControlled")
        Evaluate    $options.add_argument("--no-sandbox")
        Evaluate    $options.add_argument("--disable-gpu")
        
        Open Browser    ${url}    ${browser}    options=${options}
        Set Window Size    1280    720
    ELSE
        # 이미 열려있으면 URL 확인 후 이동
        IF    "${val}" != "${url}"
            Go To    ${url}
        END
    END

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
        ${link}=    Get Element Attribute    ${el}    href
        
        ${item}=    Create Dictionary    text=${text}    link=${link}
        Append To List    ${results}    ${item}
    END
    
    ${json_string}=    Evaluate    json.dumps($results, ensure_ascii=False, indent=2)    json
    
    Create File    ${OUTPUT DIR}${/}${filename}    ${json_string}
    RETURN    ${json_string}

Extract All Links
    [Arguments]    ${selector}    ${filename}=links.txt
    ${elements}=    Get WebElements    ${selector}
    ${links}=    Create List
    FOR    ${el}    IN    @{elements}
        ${href}=    Get Element Attribute    ${el}    href
        Append To List    ${links}    ${href}
    END
    ${content}=    Evaluate    "\\n".join($links)
    Create File    ${OUTPUT DIR}${/}${filename}    ${content}
    RETURN    ${content}
