import * as zg from 'zapatos/generate'
import { Context } from '..'


async function main() {
  const context = await Context.create()
  const { config } = context
  const zapatosConfig: zg.Config = {
    db: config.common.store.reader,
    schemas: {
      foodcards: {
        include: '*',
        exclude: []
      },
      telenutrition: {
        include: '*',
        exclude: []
      },
      common: {
        include: '*',
        exclude: []
      },
      marketing: {
        include: '*',
        exclude: []
      },
      callcenter: {
        include: '*',
        exclude: []
      },
    },
    outExt: '.ts',
    outDir: './src',
  }

  await zg.generate(zapatosConfig)
}

main()