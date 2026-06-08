import os
import shutil
from PIL import Image

path = r"d:\My Projects\invitation\invitation\invitation\assets\objects\wall1_DefaultMaterial_BaseColor.png"
backup_path = r"d:\My Projects\invitation\invitation\invitation\assets\objects\wall1_DefaultMaterial_BaseColor_orig.png"

# Backup original if not already backed up
if not os.path.exists(backup_path):
    print(f"Creating backup of original texture to: {backup_path}")
    shutil.copy(path, backup_path)
else:
    print(f"Backup already exists at: {backup_path}")

img = Image.open(backup_path).convert("RGB")

# Tint factors for a rich dark brown:
# Red: 32%, Green: 24%, Blue: 17%
r_factor, g_factor, b_factor = 0.32, 0.24, 0.17

r, g, b = img.split()
r = r.point(lambda p: int(p * r_factor))
g = g.point(lambda p: int(p * g_factor))
b = b.point(lambda p: int(p * b_factor))

tinted = Image.merge("RGB", (r, g, b))
tinted.save(path, "PNG")
print("Successfully tinted base color texture to dark brown!")

