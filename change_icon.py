import os
from PIL import Image

def resize_icon():
    source_path = "logo.png"
    if not os.path.exists(source_path):
        print("Error: logo.png not found in root directory!")
        return

    # Mipmap configurations
    # folder_name: (standard_size, foreground_size)
    configs = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432)
    }

    res_dir = "android/app/src/main/res"

    for folder, (std_sz, fg_sz) in configs.items():
        target_folder = os.path.join(res_dir, folder)
        if not os.path.exists(target_folder):
            os.makedirs(target_folder)
            print(f"Created directory: {target_folder}")

        # Open source image
        img = Image.open(source_path)

        # 1. Generate ic_launcher.png (standard icon)
        std_img = img.resize((std_sz, std_sz), Image.Resampling.LANCZOS)
        std_img.save(os.path.join(target_folder, "ic_launcher.png"), "PNG")

        # 2. Generate ic_launcher_round.png (round icon)
        # Note: We can just use the same image; Android handles rounding or we let it be
        std_img.save(os.path.join(target_folder, "ic_launcher_round.png"), "PNG")

        # 3. Generate ic_launcher_foreground.png (for adaptive icons)
        # For adaptive foreground, the logo should be centered and occupy ~65% of the total size to prevent cropping.
        fg_logo_sz = int(fg_sz * 0.65)
        logo_resized = img.resize((fg_logo_sz, fg_logo_sz), Image.Resampling.LANCZOS)

        # Create transparent background canvas
        fg_canvas = Image.new("RGBA", (fg_sz, fg_sz), (0, 0, 0, 0))
        # Center the logo on canvas
        offset = (fg_sz - fg_logo_sz) // 2
        fg_canvas.paste(logo_resized, (offset, offset), logo_resized if logo_resized.mode == "RGBA" else None)
        fg_canvas.save(os.path.join(target_folder, "ic_launcher_foreground.png"), "PNG")

        print(f"Generated icons for {folder} (Std: {std_sz}px, Fg: {fg_sz}px)")

    print("\nIcon update completed successfully!")

if __name__ == "__main__":
    resize_icon()
