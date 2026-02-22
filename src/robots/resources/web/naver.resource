*** Settings ***
Resource    ./core.resource

*** Keywords ***
Search Naver
    [Arguments]    ${text}
    Open Visible Browser    https://www.naver.com
    Type Into Element    id:query    ${text}
    Press Enter    id:query

Click Naver News Tab
    [Arguments]    ${optional_selector}=${EMPTY}
    [Documentation]    Clicks the "News" tab on the Naver search results page.
    ${default_selector}=    Set Variable    xpath://a[@role='tab' and contains(., '뉴스')]
    ${final_selector}=    Set Variable IF    '${optional_selector}' != '${EMPTY}'    ${optional_selector}    ${default_selector}
    Wait For Element    ${final_selector}
    Click Element       ${final_selector}

Extract Naver News Results
    [Arguments]    ${filename}=result.json
    [Documentation]    Extracts ALL titles and links using the generic Scrape List Data keyword.
    ${selector}=    Set Variable    css:a.news_tit, a[data-heatmap-target=".tit"]
    # 공용 키워드 호출
    ${data}=    Save List Data    ${selector}    ${filename}
    RETURN    ${data}
