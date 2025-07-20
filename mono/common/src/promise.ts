import { Result, err } from 'neverthrow'

type AsyncFunction<T,E> = () => Promise<Result<T,E>>

export type PromiseMapOptions = {
  concurrency: number,
}

export async function promiseMap<T,E>(fns: AsyncFunction<T,E>[], options: PromiseMapOptions = {concurrency: 100}): Promise<Result<T,E>[]> {
  const results: Result<T,E>[] = []
  const executing: Promise<Result<T,E> | void>[] = []

  for (const fn of fns) {
    const promise = Promise.resolve()
      .then(fn)
      .then(result => {
        results.push(result)

        const index = executing.indexOf(promise)

        if (index !== -1) {
          executing.splice(index, 1)
        }

        return result
      })

    executing.push(promise)

    if (executing.length >= options.concurrency) {
      await Promise.race(executing) // Wait for one to finish
    }
  }

  await Promise.all(executing) // Wait for the remaining ones to finish

  return results
}