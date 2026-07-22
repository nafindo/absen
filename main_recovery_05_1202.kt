



                            fontSize = 8.sp,














































































































































































































































































































































































































































































































        }
        Spacer(modifier = Modifier.height(12.dp))
        // Row 2
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            MenuItem(Modifier.weight(1f), Icons.Filled.AccessTime, "Lembur", badgeLembur, Color(0xFFE65100), Color(0xFFFFF3E0)) { 
                com.pinguincell.absen.sync.AppLifecycleObserver.badgeLembur.value = 0
                navController.navigate("lembur") 
            }
            MenuItem(Modifier.weight(1f), Icons.Filled.Assessment, "Rekap", badgeRekap, Color(0xFF0D8ABC), Color(0xFFE3F2FD)) {
                com.pinguincell.absen.sync.AppLifecycleObserver.badgeRekap.value = 0
                navController.navigate("rekap")
            }
            MenuItem(Modifier.weight(1f), Icons.Filled.SyncAlt, "Tukar Shift", badgeTukarShift, Color(0xFFC2185B), Color(0xFFFCE4EC)) {
                com.pinguincell.absen.sync.AppLifecycleObserver.badgeTukarShift.value = 0
                navController.navigate("tukar_shift")
            }
            MenuItem(Modifier.weight(1f), Icons.Filled.AttachMoney, "Gaji", 0, Color(0xFF4A148C), Color(0xFFF3E5F5)) {
                navController.navigate("verify_gaji")
            }
        }
    }
}

@Composable
fun MenuItem(modifier: Modifier = Modifier, icon: ImageVector, label: String, badgeCount: Int, tint: Color, bgColor: Color, onClick: () -> Unit) {
    Card(
        modifier = modifier.clickable { o





























                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                label,
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp,
                color = tint,
                textAlign = TextAlign.Center,
                maxLines = 1,
                softWrap = false
            )
        }
    }
}

@Composable
fun FooterText() {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Absensi Pro v2.3", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF94A3B8))
        Text("by Nafindo Group", fontSize = 11.sp, fontWeight = FontWeight.Medium, color = Color(0xFFCBD5E1))
    }
}

@Composable
fun CustomBottomNav(user: User, jadwalState: JadwalHariIniResponse?, navController: NavController, unreadChatCount: Int = 0) {
    val context = LocalContext.current
    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = Alignment.BottomCenter
    ) {
        // Background and standard items
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(elevation = 16.dp, spotColor = Color.Black.copy(alpha = 0.05f))
                .background(Color.White)
                .navigationBarsPadding() // Membuat background menempel sampai bawah (nav bawaan hp)
                .padding(horizontal = 44.dp, vertical = 8.dp)
