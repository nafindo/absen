import json

transcript_path = r"C:\Users\ajtna\.gemini\antigravity\brain\02962daf-7318-4d9a-bac9-cb9b4dbb8b26\.system_generated\logs\transcript.jsonl"
output_path = r"d:\absen\style_css_changes.txt"

with open(transcript_path, "r", encoding="utf-8") as f, open(output_path, "w", encoding="utf-8") as out:
    for line in f:
        try:
            d = json.loads(line)
            step = d.get("step_index")
            for tc in d.get("tool_calls", []):
                args = tc.get("args", {})
                target_file = args.get("TargetFile", "")
                if "style.css" in target_file:
                    out.write(f"=== STEP {step} ({tc.get('name')}) ===\n")
                    out.write(f"TargetFile: {target_file}\n")
                    out.write(f"StartLine: {args.get('StartLine')}, EndLine: {args.get('EndLine')}\n")
                    out.write(f"Instruction: {args.get('Instruction')}\n")
                    out.write(f"ReplacementContent:\n{args.get('ReplacementContent')}\n")
                    out.write("\n" + "="*80 + "\n\n")
        except Exception as e:
            pass

print("Successfully written style.css changes.")
