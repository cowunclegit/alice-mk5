*** Settings ***
Library    SeleniumLibrary
Library    OperatingSystem

*** Keywords ***
Capture AXTREE
    [Arguments]    ${filename}=ax_tree.json
    [Documentation]    Captures a simplified accessibility tree from the current page using JS injection.
    ...               This filters for interactable elements and maps their roles and labels.
    
    ${js_code}=    Set Variable    () => {
    ...    const isInteractable = (el) => {
    ...        const role = el.getAttribute('role');
    ...        const interactableRoles = ['button', 'link', 'checkbox', 'menuitem', 'option', 'tab', 'textbox', 'searchbox', 'combobox', 'listbox'];
    ...        if (interactableRoles.includes(role)) return true;
    ...        const tag = el.tagName.toLowerCase();
    ...        const interactableTags = ['button', 'a', 'input', 'select', 'textarea'];
    ...        if (interactableTags.includes(tag)) return true;
    ...        const cursor = window.getComputedStyle(el).cursor;
    ...        if (cursor === 'pointer' && el.innerText?.trim()) return true;
    ...        return false;
    ...    };
    ...    const getLabel = (el) => {
    ...        return el.innerText?.trim() || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title') || '';
    ...    };
    ...    const getSelector = (el) => {
    ...        if (el.id) return "#" + el.id;
    ...        const testId = el.getAttribute('data-testid');
    ...        if (testId) return '[data-testid="' + testId + '"]';
    ...        const role = el.getAttribute('role');
    ...        const name = getLabel(el);
    ...        if (role && name) return "role=" + role + "[name=\"" + name + "\"]";
    ...        return null;
    ...    };
    ...    const getAXTree = (element) => {
    ...        const node = {
    ...            role: element.getAttribute('role') || element.tagName.toLowerCase(),
    ...            name: getLabel(element),
    ...            selector: getSelector(element),
    ...            children: []
    ...        };
    ...        for (const child of element.children) {
    ...            if (isInteractable(child)) {
    ...                node.children.push(getAXTree(child));
    ...            } else {
    ...                const subtree = getAXTree(child);
    ...                if (subtree.children.length > 0) {
    ...                    node.children = node.children.concat(subtree.children);
    ...                }
    ...            }
    ...        }
    ...        return node;
    ...    };
    ...    return getAXTree(document.body);
    ...    }
    
    # SeleniumLibrary Execute Javascript expects a return statement or a script
    ${ax_tree}=    Execute Javascript    return (${js_code})()
    
    ${json_string}=    Evaluate    json.dumps($ax_tree, ensure_ascii=False, indent=2)    json
    Create File    ${OUTPUT DIR}${/}${filename}    ${json_string}
    RETURN    ${ax_tree}
