# Sample Images

This directory contains sample images for the image attachment exercise (Exercise 1).

## Creating a test image

Since we can't include binary images in the repo easily, create a simple test image:

```bash
# Option 1: Use a screenshot
# Take a screenshot and save it as diagram.png

# Option 2: Create a simple image with ImageMagick (if installed)
convert -size 400x200 xc:white \
  -font Helvetica -pointsize 24 -fill black \
  -draw "text 50,80 'SDK Architecture'" \
  -draw "text 50,120 'Client → CLI → LLM'" \
  diagram.png

# Option 3: Download a sample image
curl -o diagram.png https://via.placeholder.com/400x200.png?text=SDK+Architecture
```

Place any `.png` or `.jpg` file in this directory and name it `diagram.png` for the exercise to work.
