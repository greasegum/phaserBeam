#!/usr/bin/env python3

# Read the file
with open('src/scenes/BeamElevationScene.ts', 'r') as f:
    lines = f.readlines()

# Find the line numbers
start_line = None
end_line = None

for i, line in enumerate(lines):
    if '// Set fill style' in line and 'this.lossGraphics.fillStyle(0xFFB3BA, 0.8)' in lines[i+1]:
        start_line = i
    if 'private drawMarchingSquaresContours(' in line:
        end_line = i - 1
        break

if start_line is not None and end_line is not None:
    print(f"Removing orphaned code from line {start_line + 1} to {end_line + 1}")
    # Remove the orphaned lines
    new_lines = lines[:start_line] + lines[end_line + 1:]
    
    # Write back
    with open('src/scenes/BeamElevationScene.ts', 'w') as f:
        f.writelines(new_lines)
    
    print("Fixed!")
else:
    print("Could not find the orphaned code section")