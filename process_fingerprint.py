import os
from PIL import Image, ImageOps

def main():
    # Source image path (correct file is media__1779260381974.jpg)
    src_path = r"C:\Users\ajtna\.gemini\antigravity\brain\02962daf-7318-4d9a-bac9-cb9b4dbb8b26\media__1779260381974.jpg"
    dest_path = r"d:\absen\logo-sidikjari.png"

    if not os.path.exists(src_path):
        # Fallback to other similar files if needed
        alt_paths = [
            r"C:\Users\ajtna\.gemini\antigravity\brain\02962daf-7318-4d9a-bac9-cb9b4dbb8b26\media__1779261428856.png",
            r"C:\Users\ajtna\.gemini\antigravity\brain\02962daf-7318-4d9a-bac9-cb9b4dbb8b26\media__1779262201210.jpg"
        ]
        for p in alt_paths:
            if os.path.exists(p):
                src_path = p
                break

    print(f"Processing source: {src_path}")

    # Load image
    img = Image.open(src_path)
    width, height = img.size

    # Crop the image to remove shutterstock watermark text at the bottom
    # The watermark text is in the bottom ~12% of the image
    crop_box = (0, 0, width, int(height * 0.88))
    cropped_img = img.crop(crop_box)

    # Convert to grayscale
    gray_img = cropped_img.convert("L")

    # Invert grayscale (black becomes white, white becomes black)
    inverted_gray = ImageOps.invert(gray_img)

    # Create a new RGBA image
    rgba_img = Image.new("RGBA", cropped_img.size)

    # Load pixel data
    pixels = inverted_gray.load()
    rgba_pixels = rgba_img.load()

    # For each pixel, if it is black/dark in original (inverted value > 80),
    # make it white with high alpha. Otherwise, make it transparent.
    for y in range(rgba_img.size[1]):
        for x in range(rgba_img.size[0]):
            gray_val = pixels[x, y]  # 0 (originally white) to 255 (originally black)
            # Threshold to make a clean mask (originally black lines are high here)
            if gray_val > 40:
                # Interpolate alpha based on gray value to keep smooth edges
                alpha = int(gray_val * 1.5)
                if alpha > 255:
                    alpha = 255
                rgba_pixels[x, y] = (255, 255, 255, alpha)
            else:
                rgba_pixels[x, y] = (255, 255, 255, 0)

    # Crop tight boundary box to remove excess transparency around fingerprint
    bbox = rgba_img.getbbox()
    if bbox:
        rgba_img = rgba_img.crop(bbox)

    # Save to destination
    rgba_img.save(dest_path, "PNG")
    print(f"Success! Saved processed fingerprint to {dest_path}")

if __name__ == "__main__":
    main()
