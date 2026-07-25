import zlib
import struct

def fix_png(file_path):
    with open(file_path, 'rb') as f:
        data = f.read()
    
    # Locate the start of 'PNG' and the following standard sequence
    # Current broken header: 89 50 4e 47 0a 1a 0a
    # Targeted sequence: 50 4e 47 (PNG)
    png_idx = data.find(b'PNG')
    if png_idx == -1:
        print("PNG string not found")
        return

    # Skip to the IHDR chunk which starts after the signature
    # Finding IHDR (49 48 44 52)
    ihdr_idx = data.find(b'IHDR')
    if ihdr_idx == -1:
        print("IHDR not found")
        return

    # The length of IHDR should be 13, so 4 bytes before 'IHDR' should be 00 00 00 0d
    ihdr_start = ihdr_idx - 4
    
    # Reconstruct from IHDR onwards
    ihdr_onwards = data[ihdr_start:]
    
    # New signature
    new_data = b'\x89PNG\r\n\x1a\n' + ihdr_onwards
    
    # Now fix CRCs in the reconstructed data
    out = new_data[:8]
    pos = 8
    while pos < len(new_data):
        if pos + 8 > len(new_data): break
        length = struct.unpack('>I', new_data[pos:pos+4])[0]
        chunk_type = new_data[pos+4:pos+8]
        chunk_data = new_data[pos+8:pos+8+length]
        new_crc = struct.pack('>I', zlib.crc32(chunk_type + chunk_data))
        out += new_data[pos:pos+8] + chunk_data + new_crc
        pos += length + 12
        if chunk_type == b'IEND': break

    with open(file_path, 'wb') as f:
        f.write(out)
    print("Fixed.")

fix_png('public/Mizan_Bill_3D_Logo.png')
