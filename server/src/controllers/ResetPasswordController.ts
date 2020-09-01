import { Request, Response } from 'express';

import { hash } from 'bcryptjs';
import db from '../database/connection';

export default class ResetPasswordController {
  async create(request: Request, response: Response) {
    const { email, token, password } = request.body;

    const userExists = await db('users')
      .where('email', '=', email)
      .select(['users.*']);

    if (userExists.length === 0) {
      return response.status(400).json({ error: 'User not exists' });
    }

    if (token !== userExists[0].passwordResetToken) {
      return response.status(400).json({ error: 'Token invalid' });
    }

    const now = new Date();

    if (now > userExists[0].passwordResetExpires) {
      return response
        .status(400)
        .json({ error: 'Token expired, generate a new one' });
    }

    const password_hash = await hash(password, 8);

    await db('users').where('email', '=', email).select(['users.*']).update({
      password_hash,
    });

    return response.status(200).send();
  }
}
