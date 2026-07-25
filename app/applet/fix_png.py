import zlib
import struct

def fix_png(in_path, out_path):
    with open(in_path, 'rb') as f:
        data = f.read()
    
    out = data[:8]
    pos = 8
    try:
        while pos < len(data):
            length_bytes = data[pos:pos+4]
            if len(length_bytes) < 4: break
            length = struct.unpack('>I', length_bytes)[0]
            chunk_type = data[pos+4:pos+8]
            chunk_data = data[pos+8:pos+8+length]
            new_crc = struct.pack('>I', zlib.crc32(chunk_type + chunk_data))
            out += length_bytes + chunk_type + chunk_data + new_crc
            pos += length + 12
            if chunk_type == b'IEND': break
    except Exception as e:
        print(f"Error at {pos}: {e}")
    
    with open(out_path, 'wb') as f:
        f.write(out)

fix_png('public/Mizan_Bill_3D_Logo.png', 'public/Mizan_Bill_3D_Logo.png')
