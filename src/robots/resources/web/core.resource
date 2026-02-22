*** Settings ***
Library    SeleniumLibrary
Library    OperatingSystem
Library    Collections

*** Keywords ***
Open Visible Browser
    [Arguments]    ${url}    ${browser}=chrome
    # 1. Try attaching to existing browser if port is open
    ${status}    ${val}=    Run Keyword And Ignore Error    Connect To Existing Browser    ${browser}
    
    IF    '${status}' == 'PASS'
        Go To    ${url}
        RETURN
    END

    # 2. Start new browser if attachment failed
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${options}    add_argument    --disable-blink-features\=AutomationControlled
    Call Method    ${options}    add_argument    --no-sandbox
    Call Method    ${options}    add_argument    --user-agent\=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36
    Call Method    ${options}    add_argument    --remote-allow-origins\=*
    
    # 핵심: 브라우저가 종료되지 않도록 설정
    Call Method    ${options}    add_experimental_option    detach    ${True}
    Call Method    ${options}    add_argument    --remote-debugging-port\=${DEBUG_PORT}
    
    # Absolute path for profile
    ${root}=    Evaluate    os.path.abspath(os.path.join(r'${CURDIR}', '..', '..', '..'))    os
    ${user_data}=    Set Variable    ${root}${/}browser${/}profiles${/}${SESSION_ID}
    Call Method    ${options}    add_argument    --user-data-dir\=${user_data}
    
    Open Browser    ${url}    ${browser}    options=${options}
    Set Window Size    1280    1024

Connect To Existing Browser
    [Arguments]    ${browser}=chrome
    # Fast check if port is open (0 means success)
    ${res}=    Evaluate    __import__('socket').socket(__import__('socket').AF_INET, __import__('socket').SOCK_STREAM).connect_ex(('127.0.0.1', ${DEBUG_PORT}))
    
    IF    ${res} != 0
        Fail    Port ${DEBUG_PORT} is not responding (code: ${res}).
    END

    # Port is open, try attaching
    ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()    sys, selenium.webdriver
    Call Method    ${options}    add_experimental_option    debuggerAddress    127.0.0.1:${DEBUG_PORT}
    
    # Use actual Python None for URL to attach without navigation
    Open Browser    url=${None}    browser=${browser}    options=${options}

Navigate To URL
    [Arguments]    ${url}
    Go To          ${url}

Wait For Element
    [Arguments]    ${selector}    ${timeout}=30s
    Wait Until Element Is Visible    ${selector}    timeout=${timeout}
    Scroll Element Into View    ${selector}

Click Element
    [Arguments]    ${selector}
    Wait For Element    ${selector}
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
    ${path}=    Set Variable    ${OUTPUT DIR}${/}${filename}
    Create File    ${path}    ${html}
    Log To Console    SAVED_FILE_PATH: ${path}
    RETURN    ${path}

Extract Element Data
    [Arguments]    ${selector}    ${filename}=result.txt
    # Try standard way first with shorter timeout
    ${status}    ${val}=    Run Keyword And Ignore Error    Wait Until Element Is Visible    ${selector}    timeout=5s
    
    ${texts}=    Set Variable    ${EMPTY}
    IF    '${status}' == 'PASS'
        ${texts}=    Get Text    ${selector}
    ELSE
        # Fallback: Use JavaScript
        ${stripped_sel}=    Evaluate    $selector.replace('css:', '')
        ${texts}=    Execute JavaScript    return document.querySelector("${stripped_sel}").innerText || document.querySelector("${stripped_sel}").textContent
    END

    # Normalize whitespace for better readability
    ${clean_texts}=    Evaluate    " ".join($texts.split())    
    
    # Ensure safe filename
    ${safe_filename}=    Evaluate    "".join([c if c.isalnum() else "_" for c in $filename])
    ${path}=    Set Variable    ${OUTPUT DIR}${/}${safe_filename}
    
    Create File    ${path}    ${clean_texts}
    Log To Console    RESULT_VALUE: ${clean_texts}
    Log To Console    SAVED_FILE_PATH: ${path}
    RETURN    ${clean_texts}

Save List Data
    [Arguments]    ${selector}    ${filename}=result.json
    [Documentation]    Extracts text and href from all elements and saves as JSON. Returns the absolute file path.
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
    ${path}=    Set Variable    ${OUTPUT DIR}${/}${filename}
    
    Create File    ${path}    ${json_string}
    # Return path so it appears in log
    Log To Console    SAVED_FILE_PATH: ${path}
    RETURN    ${path}

Extract All Links
    [Arguments]    ${selector}    ${filename}=links.txt
    ${links}=    Get Element Attribute    ${selector}    href
    ${path}=    Set Variable    ${OUTPUT DIR}${/}${filename}
    Create File    ${path}    ${links}
    Log To Console    SAVED_FILE_PATH: ${path}
    RETURN    ${path}

Close Session Browser
    Close All Browsers
