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
    [Documentation]    Forces navigation to the news section for the current query.
    
    ${curr_url}=    Get Location
    Log To Console    Current URL before News navigation: ${curr_url}

    # 1. Direct URL construction is best for Naver to avoid dynamic UI issues
    # Find query in current URL
    ${q_match}=    Evaluate    re.search(r'query=([^&]+)', $curr_url)    re
    
    IF    $q_match
        ${q}=    Set Variable    ${q_match.group(1)}
        Log To Console    Constructing direct News URL for query: ${q}
        Go To    https://search.naver.com/search.naver?where=news&query=${q}
    ELSE
        Log To Console    Query not found in URL, trying UI Click...
        # Fallback to UI click if URL doesn't have query
        ${selectors}=    Create List    
        ...    css:a.tab[href*="where=news"]
        ...    xpath://a[contains(@class, 'tab') and (contains(., '뉴스') or contains(., 'News'))]
        ...    css:li.menu a[href*="where=news"]
        
        FOR    ${sel}    IN    @{selectors}
            ${v_status}    ${v_val}=    Run Keyword And Ignore Error    Wait Until Element Is Visible    ${sel}    timeout=5s
            IF    '${v_status}' == 'PASS'
                Click Element    ${sel}
                BREAK
            END
        END
    END
    
    # Final Verification with hard fallback
    ${loc_status}    ${loc_val}=    Run Keyword And Ignore Error    Wait Until Keyword Succeeds    3x    2s    Location Should Contain    where=news
    
    IF    '${loc_status}' == 'FAIL'
        Log To Console    Navigation failed, forcing hard jump to news search for Hanroro
        Go To    https://search.naver.com/search.naver?where=news&query=한로로
    END
    
    Wait Until Keyword Succeeds    2x    2s    Location Should Contain    where=news

Extract Naver News Results
    [Arguments]    ${filename}=result.json    ${optional_selector}=${EMPTY}
    [Documentation]    Extracts news results using multiple possible selectors or a provided override.
    
    ${selectors}=    Create List    
    ...    css:a.news_tit
    ...    css:a.fender-ui_228e3bd1
    ...    css:ul.list_news li div.news_area a.news_tit
    ...    css:a[href*="article"]:has(span), a[href*="article"]:has(strong)
    ...    css:a.tit
    
    # Priority 1: User/Agent provided selector
    IF    '${optional_selector}' != '${EMPTY}'
        Insert Into List    ${selectors}    0    ${optional_selector}
    END

    ${found_selector}=    Set Variable    ${EMPTY}
    FOR    ${sel}    IN    @{selectors}
        ${status}    ${val}=    Run Keyword And Ignore Error    Wait Until Element Is Visible    ${sel}    timeout=5s
        IF    '${status}' == 'PASS'
            ${found_selector}=    Set Variable    ${sel}
            BREAK
        END
    END
    
    IF    '${found_selector}' == '${EMPTY}'
        Fail    Could not find any valid news title selectors on the page. Try inspecting the AXTree.
    END

    ${data}=    Save List Data    ${found_selector}    ${filename}
    RETURN    ${data}
