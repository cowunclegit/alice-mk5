
*** Settings ***
Resource    /Users/cowuncle/ai/alice-mk5/src/robots/resources/web/core.resource
Resource    /Users/cowuncle/ai/alice-mk5/src/robots/resources/web/naver.resource
Variables    /Users/cowuncle/ai/alice-mk5/tmp_robot/session-2019e2eb/vars-T2-1.py

*** Test Cases ***
Step T2-1 Execution
    Connect To Existing Browser
    Click Naver News Tab
    Sleep    5s

