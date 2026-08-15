/**
 * Minimal Pure-TypeScript ZIP Writer (Stored / Uncompressed method).
 * Fully compliant with PKWare ZIP spec for compatibility with Word, LibreOffice, python-docx, etc.
 */

/**
 * Computes the CRC32 checksum of a Uint8Array.
 */
export function crc32(data: Uint8Array): number {
  let table = (crc32 as unknown as { _table?: Uint32Array })._table;
  if (!table) {
    table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    (crc32 as unknown as { _table?: Uint32Array })._table = table;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Converts a JavaScript Date to MS-DOS 16-bit time and date values.
 */
function getDosDateTime(date: Date = new Date()): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;

  return { time: dosTime, date: dosDate };
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export class ZipWriter {
  private files: Array<{
    nameBytes: Uint8Array;
    data: Uint8Array;
    crc: number;
    dosTime: number;
    dosDate: number;
  }> = [];

  /**
   * Add a file entry to the ZIP archive.
   * @param filename Path inside zip archive (e.g. "word/document.xml")
   * @param content String or Uint8Array
   */
  addFile(filename: string, content: string | Uint8Array): void {
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(filename);
    const data = typeof content === 'string' ? encoder.encode(content) : content;
    const crc = crc32(data);
    const { time: dosTime, date: dosDate } = getDosDateTime();

    this.files.push({
      nameBytes,
      data,
      crc,
      dosTime,
      dosDate,
    });
  }

  /**
   * Assembles and returns the ZIP binary data as a Uint8Array.
   */
  build(): Uint8Array {
    const prepared: Array<{
      nameBytes: Uint8Array;
      data: Uint8Array;
      crc: number;
      dosTime: number;
      dosDate: number;
      localHeaderOffset: number;
      localHeaderSize: number;
    }> = [];

    let currentOffset = 0;

    // First pass: calculate offsets for local file headers
    for (const file of this.files) {
      const localHeaderSize = 30 + file.nameBytes.length + file.data.length;
      prepared.push({
        ...file,
        localHeaderOffset: currentOffset,
        localHeaderSize,
      });
      currentOffset += localHeaderSize;
    }

    const cdOffset = currentOffset;

    // Calculate Central Directory size
    let cdSize = 0;
    for (const file of prepared) {
      cdSize += 46 + file.nameBytes.length;
    }

    const totalSize = cdOffset + cdSize + 22; // 22 is EOCD header size
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const uint8 = new Uint8Array(buffer);

    let pos = 0;

    // 1. Write Local File Headers + File Data
    for (const file of prepared) {
      // Local File Header Signature: 0x04034b50
      view.setUint32(pos, 0x04034b50, true);
      view.setUint16(pos + 4, 10, true); // Version needed to extract (1.0)
      view.setUint16(pos + 6, 0, true);  // General purpose bit flag
      view.setUint16(pos + 8, 0, true);  // Compression method (0 = Stored)
      view.setUint16(pos + 10, file.dosTime, true);
      view.setUint16(pos + 12, file.dosDate, true);
      view.setUint32(pos + 14, file.crc, true);
      view.setUint32(pos + 18, file.data.length, true); // Compressed size
      view.setUint32(pos + 22, file.data.length, true); // Uncompressed size
      view.setUint16(pos + 26, file.nameBytes.length, true);
      view.setUint16(pos + 28, 0, true); // Extra field length

      pos += 30;

      // File name
      uint8.set(file.nameBytes, pos);
      pos += file.nameBytes.length;

      // File data
      uint8.set(file.data, pos);
      pos += file.data.length;
    }

    // 2. Write Central Directory Headers
    for (const file of prepared) {
      // Central Directory Header Signature: 0x02014b50
      view.setUint32(pos, 0x02014b50, true);
      view.setUint16(pos + 4, 20, true); // Version made by (2.0)
      view.setUint16(pos + 6, 10, true); // Version needed (1.0)
      view.setUint16(pos + 8, 0, true);  // General purpose bit flag
      view.setUint16(pos + 10, 0, true); // Compression method (0 = Stored)
      view.setUint16(pos + 12, file.dosTime, true);
      view.setUint16(pos + 14, file.dosDate, true);
      view.setUint32(pos + 16, file.crc, true);
      view.setUint32(pos + 20, file.data.length, true); // Compressed size
      view.setUint32(pos + 24, file.data.length, true); // Uncompressed size
      view.setUint16(pos + 28, file.nameBytes.length, true);
      view.setUint16(pos + 30, 0, true); // Extra field length
      view.setUint16(pos + 32, 0, true); // File comment length
      view.setUint16(pos + 34, 0, true); // Disk number start
      view.setUint16(pos + 36, 0, true); // Internal file attributes
      view.setUint32(pos + 38, 0, true); // External file attributes
      view.setUint32(pos + 42, file.localHeaderOffset, true); // Relative offset of local header

      pos += 46;

      // File name
      uint8.set(file.nameBytes, pos);
      pos += file.nameBytes.length;
    }

    // 3. Write End of Central Directory (EOCD) Record
    // EOCD Signature: 0x06054b50
    view.setUint32(pos, 0x06054b50, true);
    view.setUint16(pos + 4, 0, true); // Number of this disk
    view.setUint16(pos + 6, 0, true); // Disk where central directory starts
    view.setUint16(pos + 8, prepared.length, true);  // Number of CD records on this disk
    view.setUint16(pos + 10, prepared.length, true); // Total number of CD records
    view.setUint32(pos + 12, cdSize, true);  // Size of central directory
    view.setUint32(pos + 16, cdOffset, true); // Offset of start of central directory
    view.setUint16(pos + 20, 0, true); // Comment length

    return uint8;
  }
}
