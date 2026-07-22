import os
import re

folder = r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen'
screens = {
    'IzinScreen.kt': 'viewModel.fetchIzin()',
    'LemburScreen.kt': 'viewModel.getLemburHistory(idKaryawan)',
    'BeritaScreen.kt': 'viewModel.fetchBerita()',
    'TukarShiftScreen.kt': 'viewModel.getPendingTukarShift(idKaryawan); viewModel.getTukarShiftHistory(idKaryawan)'
}

for fname, refresh_call in screens.items():
    path = os.path.join(folder, fname)
    if not os.path.exists(path): continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'Refresh' in content and 'onClick = { viewModel' in content:
        continue

    if 'import androidx.compose.material.icons.filled.Refresh' not in content:
        content = content.replace('import androidx.compose.material.icons.filled.ArrowBack', 'import androidx.compose.material.icons.filled.ArrowBack\nimport androidx.compose.material.icons.filled.Refresh')

    icon_code_topappbar = """
                actions = {
                    IconButton(onClick = { """ + refresh_call + """ }) {
                        Icon(androidx.compose.material.icons.Icons.Filled.Refresh, contentDescription = "Refresh")
                    }
                },"""
                
    icon_code_box = """
                    IconButton(
                        onClick = { """ + refresh_call + """ },
                        modifier = Modifier
                            .size(36.dp)
                            .background(androidx.compose.ui.graphics.Color.White.copy(alpha = 0.2f), androidx.compose.foundation.shape.RoundedCornerShape(50))
                    ) {
                        Icon(androidx.compose.material.icons.Icons.Filled.Refresh, contentDescription = "Refresh", tint = androidx.compose.ui.graphics.Color.White, modifier = Modifier.size(20.dp))
                    }"""

    if 'TopAppBar(' in content and 'actions =' not in content:
        content = re.sub(r'(navigationIcon\s*=\s*\{[\s\S]*?\},)', r'\1' + icon_code_topappbar, content, count=1)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Patched {fname}')
    else:
        target = r'(Text\([^)]*fontWeight\s*=\s*FontWeight\.Medium[^)]*\)\s*\}\s*)(\}\s*\}\s*\},\s*floatingActionButton)'
        if re.search(target, content):
            content = re.sub(target, r'\1' + icon_code_box + r'\n                \2', content)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Patched {fname}')
