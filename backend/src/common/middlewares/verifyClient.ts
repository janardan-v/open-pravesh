import type { Request, Response, NextFunction } from "express";


const verifyClient = ( req: Request, res: Response, next: NextFunction ) => {
    const clientId = req.query.client_id

    
}