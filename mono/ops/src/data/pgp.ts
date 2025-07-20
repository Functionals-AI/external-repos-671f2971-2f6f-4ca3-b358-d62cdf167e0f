import { Duplex, PassThrough, Readable } from 'node:stream'
import { err, ok, Result } from 'neverthrow'
import * as openpgp from 'openpgp'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { IPGPConfig } from '../config'

const MTAG = [ 'ops', 'data', 'pgp' ]

export interface DecryptStreamConfig extends IPGPConfig {
  isArmored?: boolean
}

export async function decryptStream(context: IContext, inputStream: Readable, decryptConfig: DecryptStreamConfig, openpgpConfig?: openpgp.PartialConfig): Promise<Result<Readable, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'decryptStream' ]

  try {
    const {
      privateKey,
      passphrase,
    } = decryptConfig

    logger.debug(context, TAG, 'About to decrypt private key.')
  
    const decryptedPrivateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
      passphrase: passphrase,
    });

    logger.debug(context, TAG, 'Decrypted private key.')

    const message = await (decryptConfig.isArmored ? 
      openpgp.readMessage({ armoredMessage: inputStream }) :
      openpgp.readMessage({ binaryMessage: inputStream })
    )

    logger.debug(context, TAG, 'Read message.')
      
    const decrypted = await openpgp.decrypt({
      message,
      format: 'binary',
      decryptionKeys: decryptedPrivateKey,
      config: { 
        allowUnauthenticatedStream: true, 
        preferredCompressionAlgorithm: openpgp.enums.compression.zlib,
        ...(openpgpConfig && openpgpConfig)
      }
    });
    const decryptedData = decrypted.data as Readable

    logger.debug(context, TAG, 'Created decryptedData stream.')

    return ok(decryptedData)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Decrypt and return a duplex stream for piping.
 * 
 * NOTE: DO NOT use. For some reason passing a 'passthrough stream' to openpgp.readMessage causes
 * the NodeJS process to exist. However, this pattern would be desirable for piping at the higher level.
 * 
 * @param context 
 * @param pgpConfig 
 * @returns 
 */
export async function createDecryptStream(context: IContext, pgpConfig: IPGPConfig, openpgpConfig?: openpgp.PartialConfig): Promise<Result<Duplex, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'createDecryptStream' ]

  try {
    const {
      privateKey,
      passphrase,
    } = pgpConfig

    const decryptedPrivateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
      passphrase: passphrase,
    });

    const inputStream = new PassThrough()

    const message = await openpgp.readMessage({ binaryMessage: inputStream });

    const decrypted = await openpgp.decrypt({
      message,
      format: 'binary',
      decryptionKeys: decryptedPrivateKey,
      config: { 
        allowUnauthenticatedStream: true, 
        preferredCompressionAlgorithm: openpgp.enums.compression.zlib,
        ...(openpgpConfig && openpgpConfig)
      }
    });
    const decryptedData = decrypted.data as Readable

    logger.debug(context, TAG, 'Created decryptedData stream.')

    const decryptedStream = new Duplex({
      write(chunk, encoding, callback) {
        const writeResult = inputStream.write(chunk)

        if (!writeResult) {
          //
          // Stream not draining, subsequent writes could use lots of memory.
          //
          logger.warn(context, TAG, 'Decrypt input stream not draining...')
        }
        callback()
      },
      read(size: number) {
        const chunk = decryptedData.read(size)

        if (chunk !== null) {
          this.push(chunk)
        }
      }
    })

    decryptedData.on('end', () => {
      // EOF
      decryptedStream.push(null)
    })

    logger.debug(context, TAG, 'Created decrypted stsream.')

    return ok(decryptedStream)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  createDecryptStream,
  decryptStream,
}
