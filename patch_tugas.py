import os

path = r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\TugasScreen.kt'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import_str = """import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.animation.core.*
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.input.nestedscroll.nestedScroll
"""
if 'androidx.compose.material3.pulltorefresh.PullToRefreshContainer' not in content:
    content = content.replace('import androidx.compose.material3.*', 'import androidx.compose.material3.*\n' + import_str)

old_ui = """fun TugasScreen(
    idKaryawan: String,
    idToko: String,
    onNavigateBack: () -> Unit,
    viewModel: TugasViewModel = viewModel()
) {
    val context = LocalContext.current
    val tugasState by viewModel.tugasState.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val currentFilter by viewModel.filter.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadTugas(idKaryawan, idToko)
        viewModel.forceRefreshTugas(idKaryawan, idToko)
    }

    Scaffold("""

new_ui = """@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
fun TugasScreen(
    idKaryawan: String,
    idToko: String,
    onNavigateBack: () -> Unit,
    viewModel: TugasViewModel = viewModel()
) {
    val context = LocalContext.current
    val tugasState by viewModel.tugasState.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val currentFilter by viewModel.filter.collectAsState()

    val pullToRefreshState = rememberPullToRefreshState()
    if (pullToRefreshState.isRefreshing) {
        LaunchedEffect(true) {
            viewModel.forceRefreshTugas(idKaryawan, idToko)
        }
    }
    LaunchedEffect(isLoading) {
        if (!isLoading) {
            pullToRefreshState.endRefresh()
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "infinite")
    val angle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "refreshSpin"
    )

    LaunchedEffect(Unit) {
        viewModel.loadTugas(idKaryawan, idToko)
        viewModel.forceRefreshTugas(idKaryawan, idToko)
    }

    Scaffold("""

content = content.replace(old_ui, new_ui)

old_actions = """                actions = {
                    IconButton(onClick = { viewModel.forceRefreshTugas(idKaryawan, idToko) }) {
                        Icon(Icons.Filled.Refresh, contentDescription = "Refresh", tint = Color.White)
                    }
                },"""

new_actions = """                actions = {
                    IconButton(onClick = { viewModel.forceRefreshTugas(idKaryawan, idToko) }) {
                        Icon(
                            Icons.Filled.Refresh, 
                            contentDescription = "Refresh", 
                            tint = Color.White,
                            modifier = Modifier.rotate(if (isLoading) angle else 0f)
                        )
                    }
                },"""

content = content.replace(old_actions, new_actions)

old_container = """        containerColor = Color(0xFFF8FAFC)
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues).fillMaxSize()) {"""

new_container = """        containerColor = Color(0xFFF8FAFC)
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues).fillMaxSize().nestedScroll(pullToRefreshState.nestedScrollConnection)) {
            Column(modifier = Modifier.fillMaxSize()) {"""

content = content.replace(old_container, new_container)

old_end = """        }
    }
}

@Composable"""

new_end = """        }
            PullToRefreshContainer(
                state = pullToRefreshState,
                modifier = Modifier.align(androidx.compose.ui.Alignment.TopCenter)
            )
        }
    }
}

@Composable"""

content = content.replace(old_end, new_end)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated TugasScreen.kt')
