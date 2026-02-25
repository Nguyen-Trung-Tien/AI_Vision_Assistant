import os
from collections import Counter

d = "dataset/labels/train"
files = [f for f in os.listdir(d) if f.endswith(".txt")]

c = Counter()
for f in files:
    for line in open(os.path.join(d, f)):
        if line.strip():
            c.update([int(line.split()[0])])

names = {
    0: "nguoi", 1: "o_to", 2: "xe_may", 3: "xe_khach_tai",
    4: "tien_200d", 5: "tien_500d", 6: "tien_1k", 7: "tien_2k",
    8: "tien_5k", 9: "tien_10k", 10: "tien_20k", 11: "tien_50k",
    12: "tien_100k", 13: "tien_200k", 14: "tien_500k",
}

t = sum(c.values())
result = []
result.append("CLASS_DIST:")
for k, v in sorted(c.items()):
    label = names.get(k, "UNKNOWN")
    pct = v / t * 100
    result.append(f"  {k} {label} = {v} boxes ({pct:.1f}%)")
result.append(f"TOTAL: {t} boxes in {len(files)} images")

invalid = [k for k in c if k not in names]
result.append(f"INVALID_IDS: {invalid if invalid else 'None'}")

# Check bbox
bad = 0
for f in files:
    for i, line in enumerate(open(os.path.join(d, f))):
        parts = line.strip().split()
        if len(parts) != 5:
            bad += 1
        else:
            vals = [float(x) for x in parts[1:]]
            if any(v < 0 or v > 1 for v in vals):
                bad += 1
result.append(f"BAD_BBOX: {bad}")

# Val set
vi = len(os.listdir("dataset/images/valid")) if os.path.exists("dataset/images/valid") else 0
result.append(f"VAL_IMAGES: {vi}")

with open("check_output.log", "w", encoding="utf-8") as f:
    f.write("\n".join(result))

print("Done. Check check_output.log")
