*** Settings ***
Resource    ./core.resource

*** Keywords ***
Search Google
    [Arguments]    ${text}
    Open Visible Browser    https://www.google.com
    # Playwright/Browser library uses CSS selectors. [name="q"] is correct.
    Type Into Element    [name="q"]    ${text}
    Press Enter    [name="q"]

Extract Google News Results
    [Arguments]    ${filename}=google_result.json
    [Documentation]    Extracts titles and links from Google search results.
    # Google result titles are almost always in h3 tags. 
    # Waiting for any h3 inside a container that looks like a search result.
    ${selector}=    Set Variable    h3
    
    Wait For Element    ${selector}
    
    # Target anchors that have an h3 child. 
    # CSS: a:has(h3) is supported in Playwright/Browser library.
    ${data}=    Scrape List Data    css=a:has(h3)    ${filename}
    RETURN    ${data}
