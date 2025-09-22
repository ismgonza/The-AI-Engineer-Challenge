#!/usr/bin/env python3
"""
Quick fix script to update frontend CSS class names from mario- to tech-
"""

def fix_frontend_css():
    file_path = "frontend/app/page.tsx"
    
    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Define all the CSS class replacements needed
    replacements = [
        # CSS classes
        ('mario-bg', 'tech-bg'),
        ('mario-container', 'tech-container'), 
        ('mario-border', 'tech-border'),
        ('mario-header', 'tech-header'),
        ('mario-text', 'tech-text'),
        ('mario-text-small', 'tech-text-small'),
        ('mario-button', 'tech-button'),
        ('mario-input', 'tech-input'),
        ('mario-message', 'tech-message'),
        ('mario-coin', 'tech-icon'),
        ('mario-star', 'tech-star'),
        ('mario-power-up', 'tech-power-up'),
    ]
    
    # Apply all replacements
    for old, new in replacements:
        content = content.replace(old, new)
    
    # Write back to file
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("✅ Frontend CSS classes updated! Mario classes converted to tech classes.")
    print("🎨 The interface now uses professional engineering theme.")

if __name__ == "__main__":
    fix_frontend_css() 