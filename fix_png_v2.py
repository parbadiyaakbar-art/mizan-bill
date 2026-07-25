import zlib
import struct
import os

def fix_png_chunks(file_path):
    print(f"Fixing {file_path}...")
    with open(file_path, 'rb') as f:
        data = f.read()
    
    # Standard PNG Signature
    png_sig = b'\x89PNG\r\n\x1a\n'
    
    # Try to find where the actual PNG starts if it's offset
    start_idx = data.find(b'PNG\r\n\x1a\n')
    if start_idx == -1:
        print("Could not find PNG signature!")
        return
    
    # Extract the data starting from 'PNG' (4th byte of signature)
    # and prepend the proper first byte 0x89
    clean_data = b'\x89' + data[start_idx:]
    
    out = clean_data[:8]
    pos = 8
    
    while pos < len(clean_data):
        # Read length (4 bytes)
        if pos + 4 > len(clean_data): break
        length_bytes = clean_data[pos:pos+4]
        length = struct.unpack('>I', length_bytes)[0]
        
        # Read type (4 bytes)
        if pos + 8 > len(clean_data): break
        chunk_type = clean_data[pos+4:pos+8]
        
        # Read data
        if pos + 8 + length > len(clean_data): 
            print(f"Truncated chunk {chunk_type} at {pos}")
            break
        chunk_data = clean_data[pos+8:pos+8+length]
        
        # Recalculate CRC
        new_crc = struct.pack('>I', zlib.crc32(chunk_type + chunk_data))
        
        # Append to output: length + type + data + new_crc
        out += length_bytes + chunk_type + chunk_data + new_crc
        
        print(f"Fixed chunk: {chunk_type.decode('ascii', errors='ignore')} | Length: {length}")
        
        pos += length + 12
        if chunk_type == b'IEND': break
    
    with open(file_path, 'wb') as f:
        f.write(out)
    print("Done.")

fix_png_chunks('public/Mizan_Bill_3D_Logo.png')
