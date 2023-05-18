import * as express from "express";

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.headers.authorization === `Bearer ${process.env.BRIDGER_API_KEY}`) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
}

export { authenticate };
