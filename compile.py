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
