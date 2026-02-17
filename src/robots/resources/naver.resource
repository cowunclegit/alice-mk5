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
    # Selector based on role, class and text content
    ${selector}=    Set Variable    a.tab[role="tab"]:has-text("뉴스")
    Wait For Element    ${selector}
    Click Element       ${selector}
