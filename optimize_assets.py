import os
from PIL import Image

def optimize_images():
    directories = ['frontend/public/products', 'frontend/public/banners']
    
    for directory in directories:
        if not os.path.exists(directory):
            continue
            
        print(f"Optimizing images in {directory}...")
        for filename in os.listdir(directory):
            if filename.lower().endswith('.png'):
                file_path = os.path.join(directory, filename)
                try:
                    with Image.open(file_path) as img:
                        # Convert to RGB if necessary (webp supports RGBA but usually we want clean compression)
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                        
                        new_filename = filename.rsplit('.', 1)[0] + '.webp'
                        new_path = os.path.join(directory, new_filename)
                        
                        # Save as webp with 80% quality
                        img.save(new_path, 'WEBP', quality=80)
                        
                        # Get sizes for logging
                        old_size = os.path.getsize(file_path) / 1024
                        new_size = os.path.getsize(new_path) / 1024
                        
                        print(f"  {filename}: {old_size:.1f}KB -> {new_filename}: {new_size:.1f}KB")
                        
                        # Remove original png
                        os.remove(file_path)
                except Exception as e:
                    print(f"  Error optimizing {filename}: {e}")

if __name__ == "__main__":
    optimize_images()
