import { IContext } from '../../context'
import { sheets_v4 } from 'googleapis'

import * as crypto from 'crypto'
import { ErrCode } from '../../error'
import { err, ok, Result } from 'neverthrow'
import * as _ from 'lodash'
import Logger from '../../logger'
import {DateTime} from 'luxon'

export interface SyncSheetOptions {
  spreadsheetId: string,
  headers: string[],
  rows: Record<string, string | number | BigInt | Date | boolean | null>[],
  batchSize?: number,
  writeMode?: SyncSheetWriteMode,
  newSheet?: boolean,
  newSheetTitle?: string,
}

export enum SyncSheetWriteMode {
  Prepend,
  Overwrite,
}

const MTAG = Logger.tag()

async function syncSheet(context: IContext, options: SyncSheetOptions): Promise<Result<number, ErrCode>> {
  const TAG = [...MTAG, 'syncSheet']
  const { logger, google: { sheets } } = context
  const { spreadsheetId, headers, rows, writeMode } = options
  let batchSize = options.batchSize || 1000

  try {
    let sheetId = 0

    // validate all rows contain required headers
    for (let row of rows) {
      for (let header of headers) {
        if (!(header in row)) {
          logger.error(context, TAG, `Missing the header: ${header} in row: ${row}`)
          return err(ErrCode.INVALID_DATA)
        }
      }
    }

    if (options.newSheet) {
      sheetId = crypto.randomInt(2147483647)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                sheetId,
                index: 0,
                title: options.newSheetTitle || DateTime.now().toFormat('MM/dd/yyyy'),
              }            
            }
          }]
        }
      })
    }

    if (rows.length) {
      // Add header row
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            updateCells: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              fields: 'userEnteredValue',
              rows: [{
                values: headers.map(key => {
                  return { userEnteredValue: { stringValue: key } }
                })
              }
              ]
            }
          }]
        }
      }, {})

      const batches = _.chunk(rows, batchSize)
      let line = 1

      for (let batch of batches) {
        const requests: ({ insertDimension: sheets_v4.Schema$InsertDimensionRequest } | { updateCells: sheets_v4.Schema$UpdateCellsRequest })[] = []

        for (let rows of batch) {
          if (writeMode === SyncSheetWriteMode.Prepend) {
            requests.push({
              insertDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: 1,
                  endIndex: 2,
                },
                inheritFromBefore: false
              }
            }, {
              updateCells: {
                range: {
                  sheetId,
                  startRowIndex: 1,
                  endRowIndex: 2,
                  startColumnIndex: 0,
                  endColumnIndex: headers.length,
                },
                fields: 'userEnteredValue',
                rows: [{
                  values: headers.map(header => {
                    const transformValue = rows[header] === null ? '' : String(rows[header])
                    return { userEnteredValue: { stringValue: transformValue } }
                  })
                }
                ]
              }
            })
          } else {
            requests.push({
              updateCells: {
                range: {
                  sheetId,
                  startRowIndex: line,
                  endRowIndex: line + 1,
                  startColumnIndex: 0,
                  endColumnIndex: headers.length,
                },
                fields: 'userEnteredValue',
                rows: [{
                  values: headers.map(header => {
                    const transformValue = rows[header] === null ? '' : String(rows[header])
                    return { userEnteredValue: { stringValue: transformValue } }
                  })
                }
                ]
              }
            })
          }

          line++
        }
        const resp = await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests,
          }
        }, {})

        console.log(resp)
      }
    }

    return ok(rows.length)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  syncSheet,
}