import json
import re

out_path = 'd:\\absen\\main_recovery_merged.kt'
lines_dict = {}

with open('C:\\Users\\ajtna\\.gemini\\antigravity\\brain\\7296a287-a9c8-4512-9e57-3c2e8b4c0bcc\\.system_generated\\logs\\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Only consider logs before June 6, where the destruction happened
            if data.get('created_at', '') < '2026-06-06T00:00:00Z':
                if data.get('type') == 'VIEW_FILE' and 'MainActivity.kt' in data.get('content', ''):
                    content = data.get('content', '')
                    for c_line in content.split('\n'):
                        match = re.match(r'^(\d+):\s(.*)', c_line)
                        if match:
                            line_num = int(match.group(1))
                            code = match.group(2)
                            # Update dictionary with the LATEST version before Jun 6
                            lines_dict[line_num] = code
        except Exception as e:
            pass

with open(out_path, 'w', encoding='utf-8') as f:
    for i in range(1, max(lines_dict.keys()) + 1 if lines_dict else 0):
        f.write(lines_dict.get(i, '') + '\n')

print(f'Reconstructed {len(lines_dict)} lines to {out_path}')
