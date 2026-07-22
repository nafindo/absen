import os

file_path = r'd:\absen\absen-admin\app\src\main\java\com\pinguincell\absen\admin\ui\AdminTaskScreen.kt'

content = """package com.pinguincell.absen.admin.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.pinguincell.absen.admin.ui.viewmodels.AdminTaskViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminTaskScreen(
    navController: NavController,
    viewModel: AdminTaskViewModel = viewModel()
) {
    val tasks by viewModel.tasks.collectAsState()
    val tokoList by viewModel.tokoList.collectAsState()
    val karyawanList by viewModel.karyawanList.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val message by viewModel.message.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var showAddDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.fetchTasks()
        viewModel.fetchMasterData()
    }

    LaunchedEffect(message) {
        message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Manajemen Tugas", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.primary)
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            if (!showAddDialog) {
                FloatingActionButton(onClick = { showAddDialog = true }) {
                    Icon(Icons.Default.Add, contentDescription = "Tambah Tugas")
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (showAddDialog) {
                var judul by remember { mutableStateOf("") }
                var deskripsi by remember { mutableStateOf("") }
                var kategori by remember { mutableStateOf("Rutin") }
                
                var prioritas by remember { mutableStateOf("Medium") }
                var deadline by remember { mutableStateOf("") }
                
                var showDatePicker by remember { mutableStateOf(false) }
                val datePickerState = rememberDatePickerState()

                // Toko Selection
                val selectedToko = remember { mutableStateListOf<String>() }
                var isAllToko by remember { mutableStateOf(true) }
                
                // Karyawan Selection
                val selectedKaryawan = remember { mutableStateListOf<String>() }
                var isAllKaryawan by remember { mutableStateOf(true) }
                
                // Urgensi Target
                var urgensiTarget by remember { mutableStateOf("Toko") } // "Toko" or "Karyawan"

                var expandedKategori by remember { mutableStateOf(false) }
                val kategoriOptions = listOf("Rutin", "Toko", "Individu", "Urgensi")
                
                var expandedPrioritas by remember { mutableStateOf(false) }
                val prioritasOptions = listOf("Low", "Medium", "High")

                Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {
                    Text("Buat Tugas Baru", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    OutlinedTextField(
                        value = judul,
                        onValueChange = { judul = it },
                        label = { Text("Judul Tugas") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = deskripsi,
                        onValueChange = { deskripsi = it },
                        label = { Text("Deskripsi") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // KATEGORI
                    ExposedDropdownMenuBox(
                        expanded = expandedKategori,
                        onExpandedChange = { expandedKategori = !expandedKategori }
                    ) {
                        OutlinedTextField(
                            value = kategori,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Kategori") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedKategori) },
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedKategori,
                            onDismissRequest = { expandedKategori = false }
                        ) {
                            kategoriOptions.forEach { selectionOption ->
                                DropdownMenuItem(
                                    text = { Text(selectionOption) },
                                    onClick = {
                                        kategori = selectionOption
                                        expandedKategori = false
                                        // Reset selections
                                        isAllToko = true
                                        isAllKaryawan = true
                                        selectedToko.clear()
                                        selectedKaryawan.clear()
                                    }
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // PRIORITAS
                    ExposedDropdownMenuBox(
                        expanded = expandedPrioritas,
                        onExpandedChange = { expandedPrioritas = !expandedPrioritas }
                    ) {
                        OutlinedTextField(
                            value = prioritas,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Prioritas") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedPrioritas) },
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = expandedPrioritas,
                            onDismissRequest = { expandedPrioritas = false }
                        ) {
                            prioritasOptions.forEach { opt ->
                                DropdownMenuItem(text = { Text(opt) }, onClick = { prioritas = opt; expandedPrioritas = false })
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // DEADLINE (Except Rutin)
                    if (kategori != "Rutin") {
                        OutlinedTextField(
                            value = deadline,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Deadline") },
                            trailingIcon = { 
                                IconButton(onClick = { showDatePicker = true }) {
                                    Icon(Icons.Default.DateRange, contentDescription = "Pilih Tanggal")
                                }
                            },
                            modifier = Modifier.fillMaxWidth().clickable { showDatePicker = true }
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    // TOKO AND KARYAWAN SELECTION LOGIC
                    if (kategori == "Urgensi") {
                        Text("Target Urgensi:", fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = urgensiTarget == "Toko", onClick = { urgensiTarget = "Toko" })
                            Text("Toko")
                            Spacer(modifier = Modifier.width(16.dp))
                            RadioButton(selected = urgensiTarget == "Karyawan", onClick = { urgensiTarget = "Karyawan" })
                            Text("Karyawan")
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    val showTokoSelection = kategori == "Toko" || (kategori == "Urgensi" && urgensiTarget == "Toko")
                    val showKaryawanSelection = kategori == "Individu" || (kategori == "Urgensi" && urgensiTarget == "Karyawan")

                    if (showTokoSelection) {
                        Text("Pilih Toko:", fontWeight = FontWeight.Bold)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = isAllToko, onCheckedChange = { 
                                isAllToko = it
                                if(it) selectedToko.clear()
                            })
                            Text("Semua Toko")
                        }
                        if (!isAllToko) {
                            tokoList.forEach { toko ->
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(
                                        checked = selectedToko.contains(toko.ID_Toko),
                                        onCheckedChange = { checked ->
                                            if (checked) selectedToko.add(toko.ID_Toko)
                                            else selectedToko.remove(toko.ID_Toko)
                                        }
                                    )
                                    Text(toko.Nama_Toko)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    if (showKaryawanSelection) {
                        Text("Pilih Karyawan:", fontWeight = FontWeight.Bold)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = isAllKaryawan, onCheckedChange = { 
                                isAllKaryawan = it
                                if(it) selectedKaryawan.clear()
                            })
                            Text("Semua Karyawan")
                        }
                        if (!isAllKaryawan) {
                            karyawanList.forEach { kar ->
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(
                                        checked = selectedKaryawan.contains(kar.ID_Karyawan),
                                        onCheckedChange = { checked ->
                                            if (checked) selectedKaryawan.add(kar.ID_Karyawan)
                                            else selectedKaryawan.remove(kar.ID_Karyawan)
                                        }
                                    )
                                    Text(kar.Nama)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        TextButton(onClick = { showAddDialog = false }) {
                            Text("Batal")
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(onClick = {
                            if (judul.isNotBlank()) {
                                var finalIdToko = "ALL"
                                var finalDitugaskanKe = "ALL"

                                if (kategori == "Toko" || (kategori == "Urgensi" && urgensiTarget == "Toko")) {
                                    finalIdToko = if (isAllToko || selectedToko.isEmpty()) "ALL" else selectedToko.joinToString(",")
                                }
                                if (kategori == "Individu" || (kategori == "Urgensi" && urgensiTarget == "Karyawan")) {
                                    finalDitugaskanKe = if (isAllKaryawan || selectedKaryawan.isEmpty()) "ALL" else selectedKaryawan.joinToString(",")
                                }

                                viewModel.createTask(
                                    judul = judul, 
                                    deskripsi = deskripsi, 
                                    kategori = kategori, 
                                    idToko = finalIdToko, 
                                    ditugaskanKe = finalDitugaskanKe,
                                    deadline = if (kategori == "Rutin") "" else deadline,
                                    prioritas = prioritas
                                )
                                showAddDialog = false
                            }
                        }) {
                            Text("Simpan")
                        }
                    }
                }

                if (showDatePicker) {
                    DatePickerDialog(
                        onDismissRequest = { showDatePicker = false },
                        confirmButton = {
                            TextButton(onClick = {
                                datePickerState.selectedDateMillis?.let {
                                    deadline = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(it))
                                }
                                showDatePicker = false
                            }) { Text("Pilih") }
                        },
                        dismissButton = {
                            TextButton(onClick = { showDatePicker = false }) { Text("Batal") }
                        }
                    ) {
                        DatePicker(state = datePickerState)
                    }
                }
            } else {
                if (isLoading && tasks.isEmpty()) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                } else if (tasks.isEmpty()) {
                    Text("Belum ada tugas", modifier = Modifier.align(Alignment.Center))
                } else {
                    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        items(tasks) { task ->
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(task.judul ?: "Tanpa Judul", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                            Spacer(Modifier.width(8.dp))
                                            Badge(containerColor = if (task.prioritas == "High") Color.Red else if (task.prioritas == "Medium") Color(0xFFFFA500) else Color.Gray) {
                                                Text(task.prioritas ?: "Medium", color = Color.White)
                                            }
                                        }
                                        Text("Kategori: ", style = MaterialTheme.typography.bodySmall)
                                        Text("Deskripsi: ", style = MaterialTheme.typography.bodySmall)
                                        if (!task.deadline.isNullOrBlank()) {
                                            Text("Deadline: ", style = MaterialTheme.typography.bodySmall, color = Color.Red)
                                        }
                                        Text("Status: ", style = MaterialTheme.typography.bodySmall)
                                        Text("Toko:  | Karyawan: ", style = MaterialTheme.typography.bodySmall)
                                    }
                                    IconButton(onClick = { viewModel.deleteTask(task.id) }) {
                                        Icon(Icons.Default.Delete, contentDescription = "Hapus", tint = Color.Red)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("File updated successfully")
