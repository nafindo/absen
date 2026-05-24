import json
import os

transcript_path = r"C:\Users\ajtna\.gemini\antigravity\brain\02962daf-7318-4d9a-bac9-cb9b4dbb8b26\.system_generated\logs\transcript.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            d = json.loads(line)
            step = d.get("step_index")
            if step in [1602, 1606]:
                for tc in d.get("tool_calls", []):
                    args = tc.get("args", {})
                    target_file = args.get("TargetFile", "")
                    output_file = f"d:\\absen\\step_{step}_{os.path.basename(target_file)}.txt"
                    with open(output_file, "w", encoding="utf-8") as out:
                        out.write(json.dumps(args, indent=2))
                    print(f"Wrote {output_file}")
        except Exception as e:
            pass



