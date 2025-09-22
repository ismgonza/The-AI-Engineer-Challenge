#!/usr/bin/env python3
"""
Quick fix script to convert Mario theme CSS to professional engineering theme
"""

import re

def fix_css():
    file_path = "frontend/app/globals.css"
    
    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Define all the CSS replacements needed
    replacements = [
        # Class names
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
        
        # Color variables
        ('var(--mario-red)', 'var(--tech-cyan)'),
        ('var(--mario-red-light)', 'var(--tech-cyan-light)'),
        ('var(--mario-red-dark)', 'var(--tech-blue-dark)'),
        ('var(--mario-blue)', 'var(--tech-blue)'),
        ('var(--mario-blue-light)', 'var(--tech-blue-light)'),
        ('var(--mario-yellow)', 'var(--tech-orange)'),
        ('var(--mario-yellow-light)', 'var(--tech-orange-light)'),
        ('var(--mario-green)', 'var(--tech-green)'),
        ('var(--mario-green-light)', 'var(--tech-green-light)'),
        ('var(--mario-brown)', 'var(--tech-gray)'),
        ('var(--mario-brown-light)', 'var(--tech-gray-light)'),
        
        # Animation names
        ('mario-jump', 'tech-pulse'),
        
        # Comments
        ('Enhanced Mario World styles', 'Professional Engineering Theme'),
        ('Mario', 'Tech'),
    ]
    
    # Apply all replacements
    for old, new in replacements:
        content = content.replace(old, new)
    
    # Update specific color values for professional theme
    # Replace the gradient background to be more professional
    content = content.replace(
        'background: linear-gradient(135deg, \n    #1e3a8a 0%, \n    #3b82f6 25%, \n    #60a5fa 50%, \n    #93c5fd 75%, \n    #dbeafe 100%);',
        'background: linear-gradient(135deg, \n    #0f172a 0%, \n    #1e293b 25%, \n    #334155 50%, \n    #475569 75%, \n    #64748b 100%);'
    )
    
    # Update the radial gradient colors
    content = content.replace(
        'radial-gradient(circle at 60% 80%, rgba(251, 191, 36, 0.1) 0%, transparent 30%)',
        'radial-gradient(circle at 60% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 30%)'
    )
    
    # Write back to file
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("✅ CSS fixed! Mario theme converted to professional engineering theme.")
    print("🎨 Updated colors: Tech blue, cyan, green, orange for professional look.")

if __name__ == "__main__":
    fix_css() 