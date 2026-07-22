import re

def patch_admin_task_screen():
    with open('d:\\absen\\absen-admin\\app\\src\\main\\java\\com\\pinguincell\\absen\\admin\\ui\\AdminTaskScreen.kt', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Rename Log tab to Monitor
    content = content.replace('val tabTitles = listOf("Rutin", "Individu", "Toko", "Urgensi", "Log")', 'val tabTitles = listOf("Rutin", "Individu", "Toko", "Urgensi", "Monitor")')

    # 2. Modify filteredTasks
    filtered_tasks_old = r"""val filteredTasks = tasks\.filter \{ task ->
                        val isDone = task\.status == "Selesai"
                        when \(selectedTabIndex\) \{
                            0 -> task\.kategori == "Rutin" && !isDone
                            1 -> task\.kategori == "Individu" && !isDone
                            2 -> task\.kategori == "Toko" && !isDone
                            3 -> task\.kategori == "Urgensi" && !isDone
                            4 -> isDone
                            else -> false
                        \}
                    \}"""
    
    filtered_tasks_new = """if (selectedTabIndex == 4) {
                        Box(modifier = Modifier.weight(1f)) {
                            AdminLogTugasScreen()
                        }
                    } else {
                    val filteredTasks = tasks.filter { task ->
                        when (selectedTabIndex) {
                            0 -> task.kategori == "Rutin"
                            1 -> task.kategori == "Individu"
                            2 -> task.kategori == "Toko"
                            3 -> task.kategori == "Urgensi"
                            else -> false
                        }
                    }"""
    
    content = re.sub(filtered_tasks_old, filtered_tasks_new, content)

    # 3. We also need to close the `} else {` at the end of the LazyColumn block!
    # Let's find where the LazyColumn block ends.
    # It ends with:
    #                     }
    #                 }
    #             }
    #         }
    #     }
    # }
    
    # Actually, a better approach is to just insert the `if (selectedTabIndex == 4)` check and conditionally render the Box vs the LazyColumn part.
    pass

if __name__ == "__main__":
    patch_admin_task_screen()
