
*** Settings ***
Resource    /Users/cowuncle/ai/alice-mk5/src/robots/resources/web/core.resource
Variables    /Users/cowuncle/ai/alice-mk5/tmp_robot/session-2019e2eb/vars-T6-1.py

*** Test Cases ***
Step T6-1 Execution
    Connect To Existing Browser
    Navigate To URL    https://www.starnewskorea.com/music/2026/02/21/2026022108383860762
    Sleep    5s

