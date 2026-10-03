import { checkWorkbookArchive, parsePersonWorkbook } from '@/utils/personImport'

globalThis.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  try {
    await checkWorkbookArchive(event.data)
    globalThis.postMessage({ people: parsePersonWorkbook(event.data) })
  }
  catch (error) {
    globalThis.postMessage({ error: error instanceof Error && error.message === 'importLimit' ? 'importLimit' : 'importInvalid' })
  }
}
