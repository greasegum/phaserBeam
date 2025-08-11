#!/usr/bin/env python3
"""
Simple Markdown to HTML converter for the user manual
"""

import re

def markdown_to_html(md_content):
    """Convert markdown to HTML with basic formatting"""
    html = md_content
    
    # Convert headers
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)  
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^#### (.+)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    
    # Convert bold and italic
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
    
    # Convert inline code
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)
    
    # Convert links
    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)
    
    # Convert lists - simple approach
    lines = html.split('\n')
    in_list = False
    result_lines = []
    
    for line in lines:
        if line.strip().startswith('- '):
            if not in_list:
                result_lines.append('<ul>')
                in_list = True
            item_text = line.strip()[2:]  # Remove "- "
            result_lines.append(f'<li>{item_text}</li>')
        else:
            if in_list:
                result_lines.append('</ul>')
                in_list = False
            result_lines.append(line)
    
    if in_list:
        result_lines.append('</ul>')
    
    html = '\n'.join(result_lines)
    
    # Convert paragraphs
    paragraphs = html.split('\n\n')
    formatted_paragraphs = []
    
    for para in paragraphs:
        para = para.strip()
        if para:
            if not (para.startswith('<h') or para.startswith('<ul') or 
                   para.startswith('<li') or para.startswith('<code') or
                   para.startswith('<div') or para == '</ul>'):
                para = f'<p>{para}</p>'
        formatted_paragraphs.append(para)
    
    return '\n'.join(formatted_paragraphs)

def create_full_html(content):
    """Create complete HTML document with styling"""
    css = '''
    <style>
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .page-break { page-break-before: always; }
        }
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            color: #333;
            background: white;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-top: 40px;
            page-break-after: avoid;
        }
        
        h2 {
            color: #34495e;
            border-bottom: 2px solid #bdc3c7;
            padding-bottom: 8px;
            margin-top: 35px;
            page-break-after: avoid;
        }
        
        h3 {
            color: #34495e;
            margin-top: 30px;
            page-break-after: avoid;
        }
        
        h4 {
            color: #555;
            margin-top: 25px;
        }
        
        p {
            margin: 12px 0;
            text-align: justify;
        }
        
        code {
            background-color: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            border: 1px solid #e9ecef;
        }
        
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #3498db;
            overflow-x: auto;
            margin: 20px 0;
        }
        
        ul {
            margin: 15px 0;
            padding-left: 30px;
        }
        
        li {
            margin: 8px 0;
        }
        
        strong {
            color: #2c3e50;
            font-weight: bold;
        }
        
        em {
            font-style: italic;
            color: #555;
        }
        
        .header {
            text-align: center;
            margin-bottom: 50px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 30px;
        }
        
        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            border: none;
            font-size: 2.2em;
        }
        
        .header h2 {
            color: #34495e;
            margin-bottom: 20px;
            border: none;
            font-size: 1.4em;
            font-weight: normal;
        }
        
        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #bdc3c7;
            text-align: center;
            font-size: 0.9em;
            color: #666;
        }
        
        .toc {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            border: 1px solid #e9ecef;
        }
        
        .toc h2 {
            margin-top: 0;
            border: none;
            color: #2c3e50;
        }
        
        a {
            color: #3498db;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .section-break {
            margin: 50px 0;
            border-top: 1px solid #eee;
        }
    </style>
    '''
    
    html_template = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Structural Beam Inspection Application - User Manual</title>
    {css}
</head>
<body>
    <div class="header">
        <h1>Structural Beam Inspection Application</h1>
        <h2>Comprehensive User Manual &amp; Implementation Guide</h2>
        <p><em>Version 1.0 - August 11, 2025</em></p>
        <p><strong>Professional Engineering Documentation System</strong></p>
    </div>
    
    {content}
    
    <div class="section-break"></div>
    
    <div class="footer">
        <p><strong>© 2025 Terragon Labs</strong></p>
        <p>Structural Engineering Solutions - Advanced Inspection Technology</p>
        <p><em>This document serves as both user guide and technical reference</em></p>
    </div>
</body>
</html>'''
    
    return html_template

def main():
    # Read the markdown file
    with open('/root/repo/BEAM_INSPECTION_USER_MANUAL.md', 'r', encoding='utf-8') as f:
        markdown_content = f.read()
    
    # Convert to HTML
    html_content = markdown_to_html(markdown_content)
    
    # Create full HTML document
    full_html = create_full_html(html_content)
    
    # Write to file
    with open('/root/repo/BEAM_INSPECTION_USER_MANUAL.html', 'w', encoding='utf-8') as f:
        f.write(full_html)
    
    print("✓ HTML version created successfully: BEAM_INSPECTION_USER_MANUAL.html")
    
if __name__ == "__main__":
    main()