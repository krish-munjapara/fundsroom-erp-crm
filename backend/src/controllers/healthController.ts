import { Request, Response } from 'express';

export const healthCheck = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Fundsroom ERP CRM API is running',
  });
};
