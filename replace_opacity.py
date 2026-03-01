import glob
import re
import os

files = glob.glob(r'd:\LEARN\Vision Assistant\mobile_app\lib\screens\*.dart')
count = 0
for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = re.sub(r'\.withOpacity\((.*?)\)', r'.withValues(alpha: \1)', content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {os.path.basename(filepath)}")
        count += 1
print(f"Total updated: {count}")
