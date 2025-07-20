import { IContext } from "../context";


export const mockContext = {
    logger: {
        debug: (_context: IContext, tag: string, message: string) => console.debug({ tag, message }),
        info: (_context: IContext, tag: string, message: string) => console.info({ tag, message }),
        warn: (_context: IContext, tag: string, message: string) => console.warn({ tag, message }),
        error: (_context: IContext, tag: string, message: string) => console.error({ tag, message }),
        exception: (_context: IContext, tag: string, message: string) => console.error({ tag, message }),
    }
} as unknown as IContext
