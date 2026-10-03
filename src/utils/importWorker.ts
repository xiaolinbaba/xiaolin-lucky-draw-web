import ImportWorker from '@/workers/personImport?worker&inline'

export function importPeople(buffer: ArrayBuffer) {
  return new Promise<any[]>((resolve, reject) => {
    const worker = new ImportWorker()
    const timer = setTimeout(() => {
      worker.terminate()
      reject(new Error('importTimeout'))
    }, 15000)
    function finish() {
      clearTimeout(timer)
      worker.terminate()
    }
    worker.onmessage = ({ data }) => {
      finish()
      if (data.error)
        reject(new Error(data.error))
      else resolve(data.people)
    }
    worker.onerror = () => {
      finish()
      reject(new Error('importInvalid'))
    }
    worker.postMessage(buffer, [buffer])
  })
}
