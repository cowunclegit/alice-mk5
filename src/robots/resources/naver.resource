*** Settings ***
Resource    ./core.resource

*** Keywords ***
Search Naver
    [Arguments]    ${text}
    Open Visible Browser    https://www.naver.com
    Type Into Element    id:query    ${text}
    Press Enter    id:query

Click Naver News Tab
    [Documentation]    Clicks the "News" tab on the Naver search results page.
    # Selenium does not support :has-text, using XPath instead
    ${selector}=    Set Variable    xpath://a[@role='tab' and contains(., '뉴스')]
    Wait For Element    ${selector}
    Click Element       ${selector}

Extract Naver News Results
    [Arguments]    ${filename}=result.txt
    [Documentation]    Extracts ALL titles and links using the generic Scrape List Data keyword.
    ${selector}=    Set Variable    css:a.news_tit, a[data-heatmap-target=".tit"]
    # 공용 키워드 호출
    ${data}=    Scrape List Data    ${selector}    ${filename}
    RETURN    ${data}
