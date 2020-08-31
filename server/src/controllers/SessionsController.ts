import { Request, Response } from 'express';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import authConfig from '../config/auth';

import db from '../database/connection';

export default class SessionsController {
  async create(request: Request, response: Response) {
    const { email, password } = request.body;

    const userExists = await db('users')
      .where('email', '=', email)
      .select(['users.*']);

    if (userExists.length === 0) {
      return response.status(400).json({ error: 'User not exists' });
    }

    const passwordMatched = await compare(
      password,
      userExists[0].password_hash,
    );

    if (!passwordMatched) {
      return response
        .status(401)
        .json({ error: 'Your email/password not match' });
    }

    delete userExists[0].password_hash;

    const { id } = userExists[0];

    const { secret, expiresIn } = authConfig.jwt;

    const token = sign({}, secret, {
      subject: String(id),
      expiresIn,
    });

    return response.json({
      user: userExists[0],
      token,
    });
  }
}
