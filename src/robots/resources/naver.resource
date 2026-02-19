*** Settings ***
Resource    ./core.resource

*** Keywords ***
Search Naver
    [Arguments]    ${text}
    Open Visible Browser    https://www.naver.com
    Type Into Element    \#query    ${text}
    Press Enter    \#query

Click Naver News Tab
    [Documentation]    Clicks the "News" tab on the Naver search results page.
    ${selector}=    Set Variable    xpath=//a[contains(@class, "tab") and contains(., "뉴스")]
    Wait For Element    ${selector}
    Click Element       ${selector}

Extract Naver News Results
    [Arguments]    ${filename}=result.txt
    [Documentation]    Extracts ALL titles and links using the generic Scrape List Data keyword.
    ${selector}=    Set Variable    a.news_tit, a[data-heatmap-target=".tit"]
    # 공용 키워드 호출
    ${data}=    Scrape List Data    ${selector}    ${filename}
    RETURN    ${data}
