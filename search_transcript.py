import json

with open('C:\\Users\\ajtna\\.gemini\\antigravity\\brain\\7296a287-a9c8-4512-9e57-3c2e8b4c0bcc\\.system_generated\\logs\\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        if 'FaceVerificationScreen' in line:
            try:
                data = json.loads(line)
                if data.get('type') in ('VIEW_FILE', 'GREP_SEARCH', 'PLANNER_RESPONSE', 'USER_INPUT'):
                    print(f"[{data.get('created_at')}] {data.get('type')}")
            except Exception as e:
                pass
