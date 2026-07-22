import os

file_path = r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\TugasScreen.kt'

content = """package com.pinguincell.absen

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.pinguincell.absen.api.TugasItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
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

    LaunchedEffect(Unit) {
        viewModel.loadTugas(idKaryawan, idToko)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Daftar Tugas", fontWeight = FontWeight.Bold, color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0D8ABC)
                )
            )
        },
        containerColor = Color(0xFFF8FAFC)
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues).fillMaxSize()) {
            
            // Filter Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("Semua", "Belum", "Selesai").forEach { filterOpt ->
                    FilterChip(
                        selected = currentFilter == filterOpt,
                        onClick = { viewModel.setFilter(filterOpt) },
                        label = { Text(if(filterOpt == "Belum") "Belum Selesai" else filterOpt) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFF0D8ABC),
                            selectedLabelColor = Color.White,
                            selectedTrailingIconColor = Color.White
                        )
                    )
                }
            }

            if (tugasState?.success == false) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(tugasState?.error ?: "Gagal memuat tugas", color = Color.Red)
                }
            } else {
                val listData = tugasState?.data ?: emptyList()
                val filteredList = when (currentFilter) {
                    "Belum" -> listData.filter { !(it.isSelesaiHariIni == true || it.isSelesaiPermanen == true) }
                    "Selesai" -> listData.filter { it.isSelesaiHariIni == true || it.isSelesaiPermanen == true }
                    else -> listData
                }.sortedBy {
                    when (it.prioritas?.uppercase()) {
                        "HIGH", "TINGGI" -> 1
                        "MEDIUM", "SEDANG" -> 2
                        "LOW", "RENDAH" -> 3
                        else -> 2 // default to medium if unknown
                    }
                }

                if (filteredList.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Tidak ada tugas untuk filter ini", color = Color.Gray)
                    }
                } else {
                    var selectedTugas by remember { mutableStateOf<TugasItem?>(null) }
                    var showDialog by remember { mutableStateOf(false) }

                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filteredList) { tugas ->
                            TugasCard(
                                tugas = tugas,
                                idKaryawan = idKaryawan,
                                onKerjakanClick = {
                                    viewModel.kerjakanTugas(tugas.id, idKaryawan, idToko) { success, msg ->
                                        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                    }
                                },
                                onSelesaiClick = {
                                    if (tugas.kategori == "Rutin") {
                                        viewModel.selesaikanTugas(tugas.id, idKaryawan, idToko) { success, msg ->
                                            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                        }
                                    } else {
                                        selectedTugas = tugas
                                        showDialog = true
                                    }
                                }
                            )
                        }
                    }

                    if (showDialog && selectedTugas != null) {
                        var catatan by remember { mutableStateOf("") }
                        var fotoUrl by remember { mutableStateOf("https://example.com/foto.jpg") } // Mock URL for now

                        AlertDialog(
                            onDismissRequest = { showDialog = false },
                            title = { Text("Selesaikan Tugas", fontWeight = FontWeight.Bold) },
                            text = {
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text("Judul: ", fontWeight = FontWeight.Medium)
                                    OutlinedTextField(
                                        value = catatan,
                                        onValueChange = { catatan = it },
                                        label = { Text("Catatan Penyelesaian (Opsional)") },
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                    // Todo: Add image picker, using dummy string for now
                                    Text("Sistem akan melampirkan foto secara otomatis (dummy).", fontSize = 11.sp, color = Color.Gray)
                                }
                            },
                            confirmButton = {
                                Button(
                                    onClick = {
                                        viewModel.submitTugasLog(
                                            idTugas = selectedTugas!!.id,
                                            idKaryawan = idKaryawan,
                                            idToko = idToko,
                                            fotoBukti = fotoUrl,
                                            catatan = catatan
                                        ) { success, msg ->
                                            val displayMsg = msg ?: if (success) "Berhasil" else "Gagal"
                                            Toast.makeText(context, displayMsg, Toast.LENGTH_SHORT).show()
                                            if (success) {
                                                showDialog = false
                                                viewModel.loadTugas(idKaryawan, idToko)
                                            }
                                        }
                                    }
                                ) {
                                    Text("Kirim Laporan")
                                }
                            },
                            dismissButton = {
                                TextButton(onClick = { showDialog = false }) {
                                    Text("Batal")
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TugasCard(tugas: TugasItem, idKaryawan: String, onKerjakanClick: () -> Unit, onSelesaiClick: () -> Unit) {
    val prioritasColor = when (tugas.prioritas?.uppercase()) {
        "HIGH", "TINGGI" -> Color(0xFFEF4444) // Red
        "MEDIUM", "SEDANG" -> Color(0xFFF97316) // Orange
        "LOW", "RENDAH" -> Color(0xFF10B981) // Green
        else -> Color(0xFF3B82F6) // Blue
    }
    
    val isSelesai = tugas.isSelesaiHariIni == true || tugas.isSelesaiPermanen == true
    val isDikerjakan = tugas.status == "Dikerjakan" && !isSelesai
    
    val statusText = if (isSelesai) "Selesai" else if (isDikerjakan) "Dikerjakan" else "Pending"
    val statusColor = if (isSelesai) Color(0xFF10B981) else if (isDikerjakan) Color(0xFF3B82F6) else Color(0xFFF59E0B)
    val statusBg = if (isSelesai) Color(0xFFD1FAE5) else if (isDikerjakan) Color(0xFFDBEAFE) else Color(0xFFFEF3C7)

    Card(
        modifier = Modifier.fillMaxWidth().shadow(4.dp, RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = tugas.judul ?: "Tugas",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = Color(0xFF1E293B),
                    modifier = Modifier.weight(1f)
                )
                
                // Category Badge
                val categoryColor = when (tugas.kategori) {
                    "Rutin" -> Color(0xFF10B981) // Green
                    "Toko" -> Color(0xFF3B82F6) // Blue
                    "Individu" -> Color(0xFF8B5CF6) // Purple
                    "Urgensi" -> Color(0xFFEF4444) // Red
                    else -> Color(0xFF64748B) // Gray
                }
                Box(modifier = Modifier.clip(RoundedCornerShape(4.dp)).background(categoryColor).padding(horizontal = 6.dp, vertical = 2.dp).padding(end = 4.dp)) {
                    Text(tugas.kategori ?: "Rutin", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.width(4.dp))

                // Priority Badge
                Box(modifier = Modifier.clip(RoundedCornerShape(4.dp)).background(prioritasColor).padding(horizontal = 6.dp, vertical = 2.dp)) {
                    Text(tugas.prioritas ?: "Medium", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = tugas.deskripsi ?: "",
                fontSize = 13.sp,
                color = Color(0xFF475569)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                // Deadline & Status
                Column {
                    if (!tugas.deadline.isNullOrBlank()) {
                        Text("Deadline: ", fontSize = 11.sp, color = Color(0xFF64748B), fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                    }
                    Box(modifier = Modifier.clip(RoundedCornerShape(100.dp)).background(statusBg).padding(horizontal = 8.dp, vertical = 2.dp)) {
                        Text(statusText, color = statusColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
                
                if (!isSelesai) {
                    if (statusText == "Pending") {
                        Button(
                            onClick = onKerjakanClick,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6)),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                            modifier = Modifier.height(36.dp)
                        ) {
                            Icon(Icons.Filled.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Kerjakan", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    } else if (statusText == "Dikerjakan") {
                        if (tugas.dikerjakanOleh == idKaryawan) {
                            Button(
                                onClick = onSelesaiClick,
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                modifier = Modifier.height(36.dp)
                            ) {
                                Icon(Icons.Filled.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Selesai", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            Text("Dikerjakan oleh ", fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
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
