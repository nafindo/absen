import os

with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('NavHost(navController = navController, startDestination = "home")')
if start != -1:
    # Find the matching closing brace for NavHost
    # We can just count braces
    brace_count = 0
    in_navhost = False
    end = -1
    for i in range(start, len(content)):
        if content[i] == '{':
            brace_count += 1
            in_navhost = True
        elif content[i] == '}':
            brace_count -= 1
            if in_navhost and brace_count == 0:
                end = i
                break
    
    if end != -1:
        navhost_block = content[start:end+1]
        
        new_block = "androidx.compose.foundation.layout.Box(modifier = androidx.compose.ui.Modifier.fillMaxSize()) {\n" + \
                    navhost_block + \
                    "\n\nif (updateRequired) {\nAutoUpdateOverlay(updateUrl)\n}\n}"
                    
        content = content[:start] + new_block + content[end+1:]
        
        with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully wrapped NavHost and added AutoUpdateOverlay")
    else:
        print("Failed to find end of NavHost")
else:
    print("Failed to find NavHost")
