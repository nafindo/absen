> fun LoginScreen(onLoginSuccess: (User) -> Unit) {
      val context = LocalContext.current
      val coroutineScope = rememberCoroutineScope()
      
  fun AnimatedBackground() {
      val configuration = androidx.compose.ui.platform.LocalConfiguration.current
      val density = androidx.compose.ui.platform.LocalDensity.current
>     val screenWidth = with(density) { configuration.screenWidthDp.dp.toPx() }
>     val screenHeight = with(density) { configuration.screenHeightDp.dp.toPx() }
  
      val infiniteTransition = rememberInfiniteTransition()
>     val maxOffsetX = screenWidth * 0.15f
>     val maxOffsetY = screenHeight * 0.15f
  
      val offsetX by infiniteTransition.animateFloat(
          initialValue = maxOffsetX,
  fun SnowAnimation() {
      val configuration = androidx.compose.ui.platform.LocalConfiguration.current
      val density = androidx.compose.ui.platform.LocalDensity.current
>     val screenWidth = with(density) { configuration.screenWidthDp.dp.toPx() }
>     val screenHeight = with(density) { configuration.screenHeightDp.dp.toPx() }
  
      val snowflakes = remember {
          List(50) {
              Snowflake(
>                 x = kotlin.random.Random.nextFloat() * screenWidth,
>                 y = kotlin.random.Random.nextFloat() * screenHeight,
                  radius = kotlin.random.Random.nextFloat() * 5f + 2f,
                  speed = kotlin.random.Random.nextFloat() * 3f + 1f,
                  drift = (kotlin.random.Random.nextFloat() - 0.5f) * 2f
              snowflakes.forEach { flake ->
                  flake.y += flake.speed
                  flake.x += flake.drift
>                 if (flake.y > screenHeight) {
                      flake.y = -10f
>                     flake.x = kotlin.random.Random.nextFloat() * screenWidth
                  }
>                 if (flake.x > screenWidth + 10f) flake.x = -10f
>                 if (flake.x < -10f) flake.x = screenWidth + 10f
              }
          }
      }



