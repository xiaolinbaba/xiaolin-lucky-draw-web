export function readFileBinary(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      }
      else {
        reject(new TypeError('Unable to read file as an ArrayBuffer'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'))
    reader.onabort = () => reject(new DOMException('File reading was aborted', 'AbortError'))
    reader.readAsArrayBuffer(file)
  })
}

export function readFileData(file: File): Promise<{ dataUrl: string, fileName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve({ dataUrl: reader.result, fileName: file.name })
      }
      else {
        reject(new TypeError('Unable to read file as a data URL'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'))
    reader.onabort = () => reject(new DOMException('File reading was aborted', 'AbortError'))
    reader.readAsDataURL(file)
  })
}
