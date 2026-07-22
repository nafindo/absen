# PRD: AI FaceID Engine — Absensi Pro v3.0
## Teknologi Canggih untuk HP Sederhana (Entry-Level Android)

---

## 1. Ringkasan Eksekutif

| Aspek | Spesifikasi |
|-------|-------------|
| **Target Device** | Android entry-level (RAM 2-4GB, CPU quad-core, Android 10+) |
| **Total Model Size** | **< 8MB** (compressed) |
| **Inference Time** | **< 600ms total** (detection + liveness + embedding + matching) |
| **Anti-Spoofing** | 3-layer: Texture + Depth + Temporal |
| **Accuracy** | > 94% LFW (setelah quantization) |
| **Battery Impact** | < 3% per 8 jam shift |

---

## 2. Arsitektur AI Stack (Optimized for Low-End Devices)

### 2.1 Model Selection & Rationale

| Komponen | Model | Size | Inference | Alasan Pilihan |
|----------|-------|------|-----------|----------------|
| **Face Detection** | **YuNet** (OpenCV DNN) | 0.3MB | ~30ms | Ultra-lightweight, NMS built-in, 120x120 minimum face |
| **Face Embedding** | **MobileFaceNet** (modified) | 4.2MB | ~150ms | 128-dim embedding, designed khusus mobile, accuracy competitive dengan ArcFace |
| **Liveness Detection** | **Silent Face Anti-Spoofing** (MobileNetV3-small) | 2.8MB | ~80ms | Single image liveness, no user action needed |
| **Depth Estimation** | **MiDaS-small** (distilled) | 1.5MB | ~120ms | Monocular depth untuk deteksi foto datar |
| **TOTAL** | | **~8.8MB** | **~380ms** | |

> **Catatan:** MobileFaceNet dipilih karena secara spesifik di-desain untuk mobile dengan embedding 128-dim (vs 512-dim ArcFace) yang mengurangi memory footprint dan matching time secara drastis pada 1:N matching.

### 2.2 Pipeline Optimasi

```
Camera Frame (640x480) 
    ↓
[YuNet Face Detection] ──→ No face? → Retry (max 3x)
    ↓ 30ms
Face Crop (112x112) + Alignment (5-point landmark)
    ↓
Parallel Processing (multi-thread):
    ├── [MobileFaceNet] ──→ Embedding (128-dim) ──→ Cosine Similarity ──→ Match?
    │   150ms                                    10ms
    ├── [Silent Face Liveness] ──→ Live/Spoof Score
    │   80ms
    └── [MiDaS Depth] ──→ Depth Map ──→ Flat/3D Classification
        120ms
    ↓
Ensemble Decision (weighted voting)
    ↓
Result (< 600ms total)
```

---

## 3. Teknologi Anti-Spoofing (3-Layer Defense)

### Layer 1: Passive Liveness (Silent Face)
- **Teknologi:** CNN-based texture analysis
- **Input:** Single RGB frame
- **Output:** Spoof probability (0-1)
- **Cara Kerja:**
  - Deteksi artifact print: moiré pattern, screen door effect
  - Analisis skin texture: wajah asli punya micro-texture (pores, fine lines)
  - Foto/video punya texture yang terlalu smooth atau artifact compression
- **Threshold:** > 0.92 untuk pass
- **Keunggulan:** Tidak perlu aksi user (blink, turn head) → lebih cepat

### Layer 2: Depth Estimation (MiDaS)
- **Teknologi:** Monocular depth estimation (single camera)
- **Cara Kerja:**
  - Generate depth map dari single frame
  - Wajah asli: depth map menunjukkan struktur 3D (hidung menonjol, mata dalam)
  - Foto: depth map flat (hampir sama semua pixel)
  - Video di layar: depth map anomali (terlihat "double layer")
- **Threshold:** Depth variance > threshold
- **Fallback:** Jika kamera tidak support depth → weight texture analysis dinaikkan

### Layer 3: Temporal Analysis (Blink Detection)
- **Teknologi:** Eye landmark tracking (YuNet landmarks)
- **Cara Kerja:**
  - Track eye aspect ratio (EAR) across 10 frames (~300ms)
  - Wajah asli: EAR berubah (blink natural)
  - Foto/video: EAR static
- **Trigger:** Hanya jika Layer 1 & 2 borderline (score 0.85-0.92)
- **Keunggulan:** Tidak selalu aktif → hemat resource

### Ensemble Decision Logic

```kotlin
fun verifyLiveness(textureScore: Float, depthScore: Float, temporalScore: Float): Boolean {
    // Weighted ensemble
    val finalScore = when {
        // Normal case: all layers available
        depthScore > 0 -> textureScore * 0.5f + depthScore * 0.3f + temporalScore * 0.2f
        // Fallback: no depth (very old device)
        else -> textureScore * 0.7f + temporalScore * 0.3f
    }

    return finalScore > 0.90f
}
```

---

## 4. Optimasi untuk HP Sederhana

### 4.1 Model Quantization Strategy

| Teknik | Target | Impact |
|--------|--------|--------|
| **Post-Training INT8 Quantization** | All models | 4x size reduction, 2-3x speedup on CPU |
| **Float16 Quantization** | GPU delegate (jika ada) | 2x size reduction, GPU acceleration |
| **Weight Pruning (30%)** | MobileFaceNet | Additional 30% size reduction |
| **Knowledge Distillation** | Liveness model | Train small model dari large teacher |
| **Dynamic Batch Size** | Runtime | Batch=1 untuk real-time |

### 4.2 TensorFlow Lite Optimization Code

```python
# Conversion script untuk semua models
import tensorflow as tf

def convert_to_tflite(model_path, output_path, quantize='int8'):
    converter = tf.lite.TFLiteConverter.from_saved_model(model_path)

    if quantize == 'int8':
        # Full INT8 quantization - fastest on CPU (ARM NEON)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        converter.inference_input_type = tf.uint8
        converter.inference_output_type = tf.uint8

        # Representative dataset untuk calibration
        def representative_dataset():
            for _ in range(100):
                # Sample data representative
                yield [np.random.randint(0, 256, (1, 112, 112, 3), dtype=np.uint8)]

        converter.representative_dataset = representative_dataset

    elif quantize == 'float16':
        # FP16 untuk GPU delegate
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]

    tflite_model = converter.convert()

    with open(output_path, 'wb') as f:
        f.write(tflite_model)

    print(f"Converted: {output_path} ({len(tflite_model)/1024/1024:.2f} MB)")

# Convert semua models
convert_to_tflite('yuned_saved_model', 'yuned_int8.tflite', 'int8')
convert_to_tflite('mobilefacenet_saved_model', 'mobilefacenet_int8.tflite', 'int8')
convert_to_tflite('silentface_saved_model', 'silentface_int8.tflite', 'int8')
convert_to_tflite('midas_small_saved_model', 'midas_int8.tflite', 'int8')
```

### 4.3 Android Runtime Optimization

```kotlin
class OptimizedInterpreter(context: Context, modelPath: String) {

    private val interpreter: Interpreter

    init {
        val options = Interpreter.Options().apply {
            // Threading optimization untuk quad-core
            numThreads = 2  // Jangan pakai semua core, sisakan untuk UI

            // Delegate selection berdasarkan device capability
            when {
                // GPU delegate (Adreno/Mali) - untuk device dengan GPU
                GpuDelegate.isGpuDelegateAvailable() -> {
                    addDelegate(GpuDelegate())
                }
                // NNAPI delegate - untuk device dengan NPU/DSP (Snapdragon 665+)
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.P -> {
                    addDelegate(NnApiDelegate())
                }
                // CPU default - ARM NEON optimized (semua device)
                else -> {
                    useXNNPACK = true  // XNNPACK accelerator
                }
            }

            // Memory optimization
            useNNAPI = false  // Disable jika tidak compatible
            allowFp16PrecisionForFp32 = true
            allowBufferHandleOutput = true
        }

        interpreter = Interpreter(loadModelFile(context, modelPath), options)
    }

    // Memory-mapped model loading (lebih cepat, lebih sedikit RAM)
    private fun loadModelFile(context: Context, modelPath: String): MappedByteBuffer {
        val fileDescriptor = context.assets.openFd(modelPath)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        return fileChannel.map(
            FileChannel.MapMode.READ_ONLY,
            fileDescriptor.startOffset,
            fileDescriptor.declaredLength
        )
    }
}
```

### 4.4 Frame Processing Pipeline (Ultra-Efficient)

```kotlin
class FaceIDPipeline(private val context: Context) {

    // Reuse buffers untuk menghindari GC pressure
    private val inputBuffer = ByteBuffer.allocateDirect(1 * 112 * 112 * 3)
        .order(ByteOrder.nativeOrder())

    private val faceDetector = YuNetDetector(context, inputSize = Size(320, 240))
    private val embedder = MobileFaceNet(context)
    private val liveness = SilentFaceLiveness(context)
    private val depthEstimator = MiDaSSmall(context)

    // Thread pool untuk parallel processing
    private val executor = Executors.newFixedThreadPool(2)

    suspend fun processFrame(cameraFrame: Bitmap): VerificationResult {

        // Step 1: Face Detection (downscale untuk kecepatan)
        val smallFrame = Bitmap.createScaledBitmap(cameraFrame, 320, 240, true)
        val face = faceDetector.detect(smallFrame) ?: return NoFaceDetected

        // Step 2: Crop & Align face (112x112 standard untuk MobileFaceNet)
        val alignedFace = alignFace(cameraFrame, face.landmarks)

        // Step 3: Parallel inference (embedding + liveness + depth)
        val embeddingDeferred = async { embedder.embed(alignedFace) }
        val livenessDeferred = async { liveness.check(alignedFace) }
        val depthDeferred = async { depthEstimator.estimate(alignedFace) }

        // Wait for all
        val embedding = embeddingDeferred.await()
        val livenessScore = livenessDeferred.await()
        val depthScore = depthDeferred.await()

        // Step 4: Anti-spoofing decision
        val isLive = ensembleLiveness(livenessScore, depthScore)
        if (!isLive) return SpoofingDetected

        // Step 5: Face matching (1:N)
        val matchResult = matchFace(embedding)

        return if (matchResult.similarity > threshold) {
            Success(matchResult.employeeId, matchResult.similarity)
        } else {
            NoMatch
        }
    }

    // Frame skipping untuk hemat CPU
    private var frameCounter = 0
    fun shouldProcessFrame(): Boolean {
        frameCounter++
        // Process 1 dari 3 frames (10 FPS effective dari 30 FPS camera)
        // Cukup untuk liveness, hemat 66% CPU
        return frameCounter % 3 == 0
    }
}
```

---

## 5. Face Matching Optimasi (1:N untuk Banyak Karyawan)

### 5.1 Problem
- Jika ada 500 karyawan, matching 1:N dengan cosine similarity linear = 500 x 128-dim dot products
- Pada CPU quad-core: ~50ms untuk 500 profiles → masih acceptable
- Tapi jika 2000+ karyawan: bisa 200ms+ → perlu optimasi

### 5.2 Solusi: Hierarchical Matching

```kotlin
class OptimizedFaceMatcher(private val storage: EmbeddingStorage) {

    // Pre-computed: Cluster embeddings menggunakan K-Means (offline)
    // 500 profiles → 10 clusters (centroids)
    private val clusters: Map<Int, List<FaceProfile>>
    private val centroids: Map<Int, FloatArray>

    fun match(input: FloatArray, threshold: Float = 0.65f): MatchResult {

        // Step 1: Find nearest cluster (10 comparisons)
        var bestCluster = -1
        var bestClusterSim = -1f

        centroids.forEach { (id, centroid) ->
            val sim = cosineSimilarity(input, centroid)
            if (sim > bestClusterSim) {
                bestClusterSim = sim
                bestCluster = id
            }
        }

        // Step 2: Only compare within best cluster (avg 50 profiles)
        val candidates = clusters[bestCluster] ?: emptyList()

        var bestMatch: FaceProfile? = null
        var bestSim = -1f

        candidates.forEach { profile ->
            val sim = cosineSimilarity(input, profile.embedding)
            if (sim > bestSim) {
                bestSim = sim
                bestMatch = profile
            }
        }

        return if (bestSim > threshold) {
            MatchResult.Success(bestMatch!!.employeeId, bestSim)
        } else {
            MatchResult.NoMatch(bestSim)
        }
    }

    // SIMD-optimized cosine similarity (ARM NEON)
    private fun cosineSimilarity(a: FloatArray, b: FloatArray): Float {
        // Implementation dengan ARM NEON intrinsics
        // 4x lebih cepat dari pure Kotlin
        return NativeCosineSimilarity.compute(a, b)
    }
}
```

### 5.3 Native C++ Acceleration (JNI)

```cpp
// native-lib.cpp - ARM NEON optimized
#include <arm_neon.h>

extern "C" JNIEXPORT jfloat JNICALL
Java_com_absensipro_faceid_NativeMath_cosineSimilarity(
    JNIEnv* env, jobject thiz,
    jfloatArray a, jfloatArray b, jint len) {

    jfloat* ptrA = env->GetFloatArrayElements(a, nullptr);
    jfloat* ptrB = env->GetFloatArrayElements(b, nullptr);

    float32x4_t dot = vdupq_n_f32(0);
    float32x4_t normA = vdupq_n_f32(0);
    float32x4_t normB = vdupq_n_f32(0);

    int i = 0;
    for (; i <= len - 4; i += 4) {
        float32x4_t va = vld1q_f32(&ptrA[i]);
        float32x4_t vb = vld1q_f32(&ptrB[i]);

        dot = vmlaq_f32(dot, va, vb);
        normA = vmlaq_f32(normA, va, va);
        normB = vmlaq_f32(normB, vb, vb);
    }

    // Horizontal sum
    float dotSum = vaddvq_f32(dot);
    float normASum = vaddvq_f32(normA);
    float normBSum = vaddvq_f32(normB);

    // Handle remaining elements
    for (; i < len; i++) {
        dotSum += ptrA[i] * ptrB[i];
        normASum += ptrA[i] * ptrA[i];
        normBSum += ptrB[i] * ptrB[i];
    }

    env->ReleaseFloatArrayElements(a, ptrA, 0);
    env->ReleaseFloatArrayElements(b, ptrB, 0);

    return dotSum / (sqrtf(normASum) * sqrtf(normBSum));
}
```

---

## 6. Keamanan: Anti-Bobol

### 6.1 Defense Matrix

| Serangan | Teknologi Counter | Implementasi |
|----------|------------------|----------------|
| **Foto cetak** | Texture analysis + Depth | Layer 1 & 2 ensemble |
| **Foto di layar HP** | Screen reflection detection + Temporal flicker | Layer 1 (moiré) + Layer 3 (flicker) |
| **Video playback** | Frame consistency + Depth anomaly | Layer 2 (depth tidak konsisten) |
| **Masker 3D** | Skin texture micro-analysis | Layer 1 (texture tidak match skin) |
| **Deepfake** | Eye gaze consistency + Artifact | Layer 3 (gaze tracking) + custom CNN |
| **Wajah orang tidur** | Liveness + Blink challenge | Layer 3 (blink required) |
| **HP dicuri + wajah owner** | Device binding + Time restriction | IMEI binding + jam kerja only |

### 6.2 Device Binding (Anti HP Dicuri)

```kotlin
object DeviceBinding {

    fun getDeviceFingerprint(context: Context): String {
        val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)

        // Composite fingerprint
        return hashString(
            "${Build.BOARD}${Build.BRAND}${Build.DEVICE}${Build.HARDWARE}" +
            "${androidId}${telephonyManager.deviceId ?: ""}"
        )
    }

    fun verifyBinding(context: Context, storedFingerprint: String): Boolean {
        return getDeviceFingerprint(context) == storedFingerprint
    }

    private fun hashString(input: String): String {
        return MessageDigest.getInstance("SHA-256")
            .digest(input.toByteArray())
            .joinToString("") { "%02x".format(it) }
    }
}
```

---

## 7. Hardware Requirements & Fallback

### 7.1 Minimum Requirements

| Komponen | Minimum | Recommended |
|----------|---------|-------------|
| Android Version | 8.0 (API 26) | 10.0+ (API 29) |
| RAM | 2GB | 3GB+ |
| CPU | Quad-core 1.4GHz | Octa-core 2.0GHz |
| Camera | 2MP front | 5MP+ front |
| Storage | 50MB free | 100MB+ free |
| GPU | Optional | Adreno 506 / Mali-G52 |

### 7.2 Graceful Degradation

```kotlin
class CapabilityDetector(context: Context) {

    data class DeviceCapability(
        val canUseGPU: Boolean,
        val canUseNNAPI: Boolean,
        val canUseDepth: Boolean,
        val maxThreads: Int,
        val recommendedInputSize: Int
    )

    fun detect(): DeviceCapability {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)

        val totalRam = memoryInfo.totalMem / (1024 * 1024 * 1024) // GB
        val cpuCores = Runtime.getRuntime().availableProcessors()

        return when {
            // High-end (6GB+ RAM, 8 cores)
            totalRam >= 6 && cpuCores >= 8 -> DeviceCapability(
                canUseGPU = true,
                canUseNNAPI = true,
                canUseDepth = true,
                maxThreads = 4,
                recommendedInputSize = 112
            )
            // Mid-range (3-5GB RAM, 6-8 cores)
            totalRam >= 3 -> DeviceCapability(
                canUseGPU = true,
                canUseNNAPI = true,
                canUseDepth = true,
                maxThreads = 2,
                recommendedInputSize = 112
            )
            // Low-end (2GB RAM, 4 cores) - TARGET UTAMA
            else -> DeviceCapability(
                canUseGPU = false,
                canUseNNAPI = false,
                canUseDepth = false,  // Disable depth, rely on texture
                maxThreads = 2,
                recommendedInputSize = 96  // Smaller input = faster
            )
        }
    }
}
```

---

## 8. Benchmark Target (HP Entry-Level)

**Device Reference:** Samsung Galaxy A01 (2GB RAM, Snapdragon 439, Quad-core 1.95GHz)

| Metrik | Target | Cara Ukur |
|--------|--------|-----------|
| Cold start (app launch → camera ready) | < 3 detik | Log timestamp |
| Face detection | < 50ms | Average 100 frames |
| Face embedding | < 200ms | Average 100 inference |
| Liveness check | < 100ms | Average 100 inference |
| Total absen (tap → result) | < 1.2 detik | End-to-end timer |
| Memory usage (peak) | < 180MB | Android Profiler |
| Battery (8 jam shift) | < 5% | BatteryManager API |
| Model load time | < 500ms | First inference delay |
| False Acceptance Rate (FAR) | < 0.1% | Test dengan 100 orang |
| False Rejection Rate (FRR) | < 2% | Test dengan 50 karyawan |
| Anti-spoofing success rate | > 99% | Test 5 jenis serangan |

---

## 9. Model Download & Integration

### 9.1 Pre-trained Models (Ready to Use)

| Model | Format | Size | Download |
|-------|--------|------|----------|
| YuNet Face Detection | ONNX → TFLite INT8 | 0.3MB | [YuNet](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet) |
| MobileFaceNet | PyTorch → TFLite INT8 | 4.2MB | [MobileFaceNet](https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface) |
| Silent Face Anti-Spoofing | PyTorch → TFLite INT8 | 2.8MB | [SilentFace](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing) |
| MiDaS-small | ONNX → TFLite INT8 | 1.5MB | [MiDaS](https://github.com/isl-org/MiDaS) |

### 9.2 Gradle Dependencies

```gradle
dependencies {
    // TensorFlow Lite
    implementation 'org.tensorflow:tensorflow-lite:2.16.1'
    implementation 'org.tensorflow:tensorflow-lite-gpu:2.16.1'
    implementation 'org.tensorflow:tensorflow-lite-support:0.4.4'

    // OpenCV (untuk YuNet)
    implementation 'org.opencv:opencv-android:4.9.0'

    // CameraX
    implementation 'androidx.camera:camera-core:1.3.1'
    implementation 'androidx.camera:camera-camera2:1.3.1'
    implementation 'androidx.camera:camera-lifecycle:1.3.1'
    implementation 'androidx.camera:camera-view:1.3.1'

    // Coroutines untuk async
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
```

---

## 10. Perbandingan Teknologi

| Aspek | Solusi Lama (v2.x) | Solusi Baru (v3.0 AI) | Improvement |
|-------|-------------------|----------------------|-------------|
| **Model** | Cloud API / Heavy CNN | Lightweight on-device | 10x lebih cepat |
| **Size** | > 50MB | **8.8MB** | **5.7x smaller** |
| **Inference** | 3-5 detik (network) | **< 600ms** (local) | **6-8x faster** |
| **Anti-foto** | Tidak ada | **3-layer** | Dari 0% ke 99%+ |
| **Anti-wajah lain** | Basic threshold | **MobileFaceNet + Clustering** | FAR < 0.1% |
| **Offline** | Tidak bisa | **Full offline** | 100% reliable |
| **HP sederhana** | Tidak support | **Optimized khusus** | Support 2GB RAM |
| **Battery** | Heavy (cloud polling) | **< 5% per 8 jam** | 5x lebih hemat |

---

## 11. Checklist Implementasi

- [ ] Download & convert semua model ke TFLite INT8
- [ ] Implementasi YuNet face detection dengan OpenCV DNN
- [ ] Implementasi MobileFaceNet embedding (128-dim)
- [ ] Implementasi Silent Face liveness detection
- [ ] Implementasi MiDaS depth estimation (optional, fallback)
- [ ] Implementasi ensemble anti-spoofing logic
- [ ] Implementasi optimized cosine similarity (JNI + NEON)
- [ ] Implementasi hierarchical face matching (clustering)
- [ ] Implementasi device binding + encryption
- [ ] Implementasi graceful degradation per device capability
- [ ] Benchmark pada Samsung A01 / Xiaomi Redmi Go
- [ ] Stress test: 1000x absen consecutive
- [ ] Anti-spoofing test: foto, video, masker, deepfake
- [ ] Battery test: 8 jam continuous usage

---

*PRD ini fokus 100% pada teknologi AI/ML engine yang di-tanamkan ke APK Absensi Pro yang sudah ada. Frontend dan backend integration points sudah dijelaskan dalam bagian Android Integration.*
