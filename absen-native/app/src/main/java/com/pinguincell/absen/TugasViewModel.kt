package com.pinguincell.absen

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pinguincell.absen.api.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class TugasViewModel : ViewModel() {
    private val _tugasState = MutableStateFlow<TugasResponse?>(null)
    val tugasState: StateFlow<TugasResponse?> = _tugasState

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _filter = MutableStateFlow("Tugas Baru")
    val filter: StateFlow<String> = _filter

    fun setFilter(newFilter: String) {
        _filter.value = newFilter
    }

    private var isLooping = false

    fun loadTugas(idKaryawan: String, idToko: String) {
        viewModelScope.launch {
            _isLoading.value = false
            val list = com.pinguincell.absen.api.CacheManager.getCache<List<TugasItem>>("tugas_list")
            val filteredList = list?.filter { 
                val kat = it.kategori?.trim()?.lowercase() ?: "rutin"
                val isTokoMatched = (it.idToko?.trim() == idToko.trim() || it.idToko?.trim()?.uppercase() == "ALL" || it.idToko?.trim() == "-")
                val isKaryawanMatched = (it.ditugaskanKe?.trim() == idKaryawan.trim() || it.ditugaskanKe?.trim()?.uppercase() == "ALL")

                when (kat) {
                    "rutin" -> true
                    "toko" -> isTokoMatched
                    "individu" -> isKaryawanMatched
                    "penempatan" -> isTokoMatched && isKaryawanMatched
                    else -> false
                }
            } ?: emptyList()
            
            _tugasState.value = TugasResponse(success = true, error = null, data = filteredList)
        }
    }

    private fun updateTugasCache(idTugas: String, newStatus: String, idKaryawan: String? = null) {
        val list = com.pinguincell.absen.api.CacheManager.getCache<List<TugasItem>>("tugas_list") ?: return
        val updatedList = list.map { 
            if (it.id == idTugas) {
                it.copy(
                    status = newStatus, 
                    dikerjakanOleh = idKaryawan ?: it.dikerjakanOleh,
                    isSelesaiHariIni = if (newStatus == "Selesai") true else it.isSelesaiHariIni
                )
            } else {
                it
            }
        }
        com.pinguincell.absen.api.CacheManager.saveCache("tugas_list", updatedList)
        
        // Force update the stateflow immediately so UI reflects without waiting for the next 2s tick
        val currentState = _tugasState.value
        if (currentState != null) {
            val updatedData = currentState.data?.map {
                if (it.id == idTugas) {
                    it.copy(
                        status = newStatus, 
                        dikerjakanOleh = idKaryawan ?: it.dikerjakanOleh,
                        isSelesaiHariIni = if (newStatus == "Selesai") true else it.isSelesaiHariIni
                    )
                } else {
                    it
                }
            }
            _tugasState.value = currentState.copy(data = updatedData)
        }
    }

    fun submitTugasLog(idTugas: String, idKaryawan: String, idToko: String, fotoBukti: String, catatan: String, lat: Double? = null, lng: Double? = null, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.instance.submitTugasLog(
                    SubmitTugasLogRequest(
                        idTugas = idTugas,
                        idKaryawan = idKaryawan,
                        idToko = idToko,
                        fotoBukti = fotoBukti,
                        catatan = catatan,
                        lat = lat,
                        lng = lng
                    )
                )
                if (response.success) {
                    updateTugasCache(idTugas, "Selesai")
                }
                onResult(response.success, response.message ?: response.error)
            } catch (e: Exception) {
                onResult(false, e.message)
            }
        }
    }

    fun selesaikanTugas(idTugas: String, idKaryawan: String, idToko: String, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            try {
                val req = UpdateTugasRequest(idTugas = idTugas, status = "Selesai", idKaryawan = idKaryawan)
                val res = RetrofitClient.instance.updateTugasStatus(req)
                if (res.success) {
                    updateTugasCache(idTugas, "Selesai")
                    onResult(true, res.message ?: "Tugas selesai")
                } else {
                    onResult(false, res.error ?: "Gagal menyelesaikan tugas")
                }
            } catch (e: Exception) {
                onResult(false, e.message ?: "Terjadi kesalahan")
            }
        }
    }

    private fun loadTugasDirect(idKaryawan: String, idToko: String) {
        val list = com.pinguincell.absen.api.CacheManager.getCache<List<TugasItem>>("tugas_list")
        val filteredList = list?.filter { 
            val kat = it.kategori?.trim()?.lowercase() ?: "rutin"
            val isTokoMatched = (it.idToko?.trim() == idToko.trim() || it.idToko?.trim()?.uppercase() == "ALL" || it.idToko?.trim() == "-")
            val isKaryawanMatched = (it.ditugaskanKe?.trim() == idKaryawan.trim() || it.ditugaskanKe?.trim()?.uppercase() == "ALL")

            when (kat) {
                "rutin" -> true
                "toko" -> isTokoMatched
                "individu" -> isKaryawanMatched
                "penempatan" -> isTokoMatched && isKaryawanMatched
                else -> false
            }
        } ?: emptyList()
        _tugasState.value = TugasResponse(success = true, error = null, data = filteredList)
    }

    fun forceRefreshTugas(idKaryawan: String, idToko: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val res = RetrofitClient.instance.getTugasList(TugasRequest(idKaryawan = idKaryawan, idToko = idToko))
                if (res.success && res.data != null) {
                    com.pinguincell.absen.api.CacheManager.saveCache("tugas_list", res.data)
                    loadTugasDirect(idKaryawan, idToko)
                }
            } catch (e: Exception) {
                // Silent catch
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun kerjakanTugas(idTugas: String, idKaryawan: String, idToko: String, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            try {
                val req = UpdateTugasRequest(idTugas = idTugas, status = "Dikerjakan", idKaryawan = idKaryawan)
                val res = RetrofitClient.instance.updateTugasStatus(req)
                if (res.success) {
                    updateTugasCache(idTugas, "Dikerjakan", idKaryawan)
                    onResult(true, res.message ?: "Tugas sedang dikerjakan")
                } else {
                    onResult(false, res.error ?: "Gagal memproses tugas")
                }
            } catch (e: Exception) {
                onResult(false, e.message ?: "Terjadi kesalahan")
            }
        }
    }
}
