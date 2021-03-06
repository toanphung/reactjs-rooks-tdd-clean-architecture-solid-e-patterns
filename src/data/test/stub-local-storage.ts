import { SetStorage } from '@/data/protocols/cache/set-storage'

export const stubSetStorage = (): SetStorage => {
  class SetStorageStub implements SetStorage {
    async set (key: string, value: any): Promise<void> {
      return await Promise.resolve()
    }
  }
  return new SetStorageStub()
}
