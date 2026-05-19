import os
import re

def compile_file(html_path, css_path, js_path, output_path):
    print(f"Compiling {html_path}...")
    if not os.path.exists(html_path):
        print(f"Error: {html_path} not found.")
        return False
        
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    # 1. Inline CSS
    if css_path and os.path.exists(css_path):
        with open(css_path, 'r', encoding='utf-8') as f:
            css_content = f.read()
        
        # Replace <link rel="stylesheet" href="..."> with <style>...</style>
        css_tag_pattern = r'<link\s+rel="stylesheet"\s+href="[^"]*style\.css"[^>]*>'
        html_content = re.sub(css_tag_pattern, lambda m: f'<style>\n{css_content}\n</style>', html_content, flags=re.IGNORECASE)
        # Also handle admin.css for admin.html
        css_admin_tag_pattern = r'<link\s+rel="stylesheet"\s+href="[^"]*admin\.css"[^>]*>'
        html_content = re.sub(css_admin_tag_pattern, lambda m: f'<style>\n{css_content}\n</style>', html_content, flags=re.IGNORECASE)

    # 2. Inline JS
    if js_path and os.path.exists(js_path):
        with open(js_path, 'r', encoding='utf-8') as f:
            js_content = f.read()
            
        # Replace <script src="...app.js"></script> or similar
        js_tag_pattern = r'<script\s+src="[^"]*app\.js"[^>]*>\s*</script>'
        html_content = re.sub(js_tag_pattern, lambda m: f'<script>\n{js_content}\n</script>', html_content, flags=re.IGNORECASE)
        # Also handle admin.js for admin.html
        js_admin_tag_pattern = r'<script\s+src="[^"]*admin\.js"[^>]*>\s*</script>'
        html_content = re.sub(js_admin_tag_pattern, lambda m: f'<script>\n{js_content}\n</script>', html_content, flags=re.IGNORECASE)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"Successfully compiled to {output_path} ({len(html_content)} bytes)")
    return True

compile_file('index.html', 'style.css', 'app.js', 'recom/index.html')
compile_file('admin.html', 'admin.css', 'admin.js', 'recom/admin.html')

# 3. Salin aset statis ke folder recom agar dikemas oleh Capacitor ke dalam APK
import shutil
print("Menyalin berkas aset gambar dan konfigurasi ke folder recom...")
for file in os.listdir('.'):
    if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.json', '.js', '.css', '.html')):
        # Jangan salin file skrip Python atau file kredensial rahasia
        if file in ['compile.py', 'extract.py', 'package.json', 'package-lock.json', 'capacitor.config.json', 'google-services.json']:
            continue
        if 'pinguinabsen-firebase-adminsdk' in file:
            continue
        if os.path.isfile(file):
            shutil.copy(file, os.path.join('recom', file))
            print(f"Berhasil menyalin: {file} ke recom/")

# 4. Otomatisasi Pembuatan Icon Aplikasi Android dari logo.png jika ada
logo_path = 'logo.png'
if os.path.exists(logo_path):
    print("\nMendeteksi logo.png. Mempersiapkan pembuatan icon Android...")
    try:
        try:
            from PIL import Image
        except ImportError:
            print("Pillow tidak terdeteksi. Mencoba menginstal Pillow secara otomatis...")
            os.system("pip install Pillow")
            from PIL import Image

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
            
            img = Image.open(logo_path)
            
            # Standard Icon
            std_img = img.resize((std_sz, std_sz), Image.Resampling.LANCZOS)
            std_img.save(os.path.join(target_folder, "ic_launcher.png"), "PNG")
            std_img.save(os.path.join(target_folder, "ic_launcher_round.png"), "PNG")

            # Adaptive Foreground Icon (Center logo at ~65% size)
            fg_logo_sz = int(fg_sz * 0.65)
            logo_resized = img.resize((fg_logo_sz, fg_logo_sz), Image.Resampling.LANCZOS)
            fg_canvas = Image.new("RGBA", (fg_sz, fg_sz), (0, 0, 0, 0))
            offset = (fg_sz - fg_logo_sz) // 2
            fg_canvas.paste(logo_resized, (offset, offset), logo_resized if logo_resized.mode == "RGBA" else None)
            fg_canvas.save(os.path.join(target_folder, "ic_launcher_foreground.png"), "PNG")
            
            print(f"Icon Android berhasil dibuat untuk folder: {folder}")
        print("🎉 Semua icon Android (ic_launcher) berhasil diperbarui menggunakan logo.png!")
    except Exception as e:
        print(f"⚠️ Gagal memperbarui icon secara otomatis: {e}")
        print("Silakan jalankan manual: pip install Pillow")
else:
    print("\nlogo.png tidak ditemukan di root directory. Skip pembuatan icon.")

